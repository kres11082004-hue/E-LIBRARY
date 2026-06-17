import { Router } from "express";
import { db, reservationsTable, booksTable, usersTable, borrowRecordsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, requireRole } from "../middlewares/auth.js";

const router = Router();

function fmt(r: any) {
  return {
    ...r,
    reservedAt: r.reservedAt instanceof Date ? r.reservedAt.toISOString() : r.reservedAt,
    updatedAt: r.updatedAt instanceof Date ? r.updatedAt.toISOString() : r.updatedAt,
  };
}

// GET /reservations — admin sees all, user sees own
router.get("/reservations", requireAuth, async (req, res) => {
  const isManager = req.user!.role === "admin" || req.user!.role === "librarian";

  const rows = await db
    .select({
      id: reservationsTable.id,
      userId: reservationsTable.userId,
      bookId: reservationsTable.bookId,
      status: reservationsTable.status,
      notes: reservationsTable.notes,
      reservedAt: reservationsTable.reservedAt,
      updatedAt: reservationsTable.updatedAt,
      userName: usersTable.fullname,
      userEmail: usersTable.email,
      bookTitle: booksTable.title,
      bookAuthor: booksTable.author,
      bookCoverUrl: booksTable.coverUrl,
      bookCampus: booksTable.campus,
    })
    .from(reservationsTable)
    .innerJoin(usersTable, eq(usersTable.id, reservationsTable.userId))
    .innerJoin(booksTable, eq(booksTable.id, reservationsTable.bookId))
    .orderBy(reservationsTable.reservedAt);

  const filtered = isManager ? rows : rows.filter(r => r.userId === req.user!.id);
  return res.json(filtered.map(fmt));
});

// POST /reservations — user reserves a physical copy
router.post("/reservations", requireAuth, async (req, res) => {
  const { bookId, notes } = req.body;
  if (!bookId) return res.status(400).json({ error: "bookId is required" });

  // Check book has physical copies
  const [book] = await db.select().from(booksTable).where(eq(booksTable.id, bookId));
  if (!book) return res.status(404).json({ error: "Book not found" });
  if (!book.isAvailablePhysical) {
    return res.status(400).json({ error: "This book has no physical copies" });
  }

  // Prevent duplicate active reservation
  const existing = await db
    .select()
    .from(reservationsTable)
    .where(
      and(
        eq(reservationsTable.userId, req.user!.id),
        eq(reservationsTable.bookId, bookId),
      )
    );
  const active = existing.filter(r => r.status === "pending" || r.status === "ready");
  if (active.length > 0) {
    return res.status(400).json({ error: "You already have an active reservation for this book" });
  }

  const [reservation] = await db.insert(reservationsTable).values({
    userId: req.user!.id,
    bookId,
    notes: notes || null,
    status: "pending",
  }).returning();

  // Fetch full row with joins
  const [full] = await db
    .select({
      id: reservationsTable.id,
      userId: reservationsTable.userId,
      bookId: reservationsTable.bookId,
      status: reservationsTable.status,
      notes: reservationsTable.notes,
      reservedAt: reservationsTable.reservedAt,
      updatedAt: reservationsTable.updatedAt,
      userName: usersTable.fullname,
      userEmail: usersTable.email,
      bookTitle: booksTable.title,
      bookAuthor: booksTable.author,
      bookCoverUrl: booksTable.coverUrl,
      bookCampus: booksTable.campus,
    })
    .from(reservationsTable)
    .innerJoin(usersTable, eq(usersTable.id, reservationsTable.userId))
    .innerJoin(booksTable, eq(booksTable.id, reservationsTable.bookId))
    .where(eq(reservationsTable.id, reservation.id));

  return res.status(201).json(fmt(full));
});

// PUT /reservations/:id — admin updates status
router.put("/reservations/:id", requireAuth, requireRole("admin", "librarian"), async (req, res) => {
  const id = parseInt(req.params["id"] as string);
  const { status, notes } = req.body;
  const validStatuses = ["pending", "ready", "fulfilled", "cancelled", "returned"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${validStatuses.join(", ")}` });
  }

  const [existingReservation] = await db.select().from(reservationsTable).where(eq(reservationsTable.id, id));
  if (!existingReservation) return res.status(404).json({ error: "Reservation not found" });

  const oldStatus = existingReservation.status;

  // Handle book inventory changes based on status transition
  const [book] = await db.select().from(booksTable).where(eq(booksTable.id, existingReservation.bookId));
  if (book) {
    if (oldStatus !== "fulfilled" && status === "fulfilled") {
      // Book is checked out, decrement copies
      await db.update(booksTable)
        .set({ availableCopies: Math.max(0, book.availableCopies - 1) })
        .where(eq(booksTable.id, book.id));
    } else if (oldStatus === "fulfilled" && (status === "returned" || status === "cancelled")) {
      // Book is brought back, increment copies (bounded by totalCopies)
      await db.update(booksTable)
        .set({ availableCopies: Math.min(book.totalCopies, book.availableCopies + 1) })
        .where(eq(booksTable.id, book.id));
    }
  }

  // If status is returned, also mark the active borrow record as returned
  if (status === "returned") {
    await db.update(borrowRecordsTable)
      .set({ status: "returned", returnedAt: new Date() })
      .where(
        and(
          eq(borrowRecordsTable.userId, existingReservation.userId),
          eq(borrowRecordsTable.bookId, existingReservation.bookId),
          eq(borrowRecordsTable.status, "borrowed")
        )
      );
  }

  const [updated] = await db
    .update(reservationsTable)
    .set({ status, notes: notes ?? undefined, updatedAt: new Date() })
    .where(eq(reservationsTable.id, id))
    .returning();

  return res.json(fmt(updated));
});

// DELETE /reservations/:id — user cancels own, admin cancels any
router.delete("/reservations/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params["id"] as string);
  const isManager = req.user!.role === "admin" || req.user!.role === "librarian";

  const [existing] = await db.select().from(reservationsTable).where(eq(reservationsTable.id, id));
  if (!existing) return res.status(404).json({ error: "Reservation not found" });
  if (!isManager && existing.userId !== req.user!.id) {
    return res.status(403).json({ error: "Forbidden" });
  }

  await db.delete(reservationsTable).where(eq(reservationsTable.id, id));
  return res.status(204).send();
});

export default router;
