import { Router } from "express";
import { db, borrowRecordsTable, usersTable, booksTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { activityLogTable } from "@workspace/db";

const router = Router();

async function formatRecord(record: typeof borrowRecordsTable.$inferSelect) {
  const [user] = await db.select({
    id: usersTable.id, fullname: usersTable.fullname, email: usersTable.email,
    phone: usersTable.phone, address: usersTable.address, campus: usersTable.campus,
    role: usersTable.role, studentNumber: usersTable.studentNumber, course: usersTable.course,
    year: usersTable.year, section: usersTable.section, isApproved: usersTable.isApproved,
    createdAt: usersTable.createdAt,
  }).from(usersTable).where(eq(usersTable.id, record.userId));

  const [book] = await db.select().from(booksTable).where(eq(booksTable.id, record.bookId));

  return {
    id: record.id,
    userId: record.userId,
    bookId: record.bookId,
    borrowedAt: record.borrowedAt.toISOString(),
    returnedAt: record.returnedAt?.toISOString() || null,
    dueDate: record.dueDate.toISOString(),
    status: record.status,
    user: user ? { ...user, createdAt: user.createdAt.toISOString() } : null,
    book: book ? { ...book, createdAt: book.createdAt.toISOString() } : null,
  };
}

// GET /borrow-records
router.get("/borrow-records", requireAuth, async (req, res) => {
  const { userId, status } = req.query as Record<string, string>;

  let records = await db.select().from(borrowRecordsTable);

  // Non-admins can only see their own records
  if (!["admin", "librarian"].includes(req.user!.role)) {
    records = records.filter(r => r.userId === req.user!.id);
  } else {
    if (userId) records = records.filter(r => r.userId === parseInt(userId));
  }

  if (status) records = records.filter(r => r.status === status);

  const result = await Promise.all(records.map(formatRecord));
  return res.json(result);
});

// POST /borrow-records
router.post("/borrow-records", requireAuth, requireRole("admin", "librarian"), async (req, res) => {
  const { userId, bookId, dueDate } = req.body;
  if (!userId || !bookId || !dueDate) {
    return res.status(400).json({ error: "userId, bookId, dueDate required" });
  }

  // Decrement available copies
  const [book] = await db.select().from(booksTable).where(eq(booksTable.id, bookId));
  if (!book) return res.status(404).json({ error: "Book not found" });
  if (book.availableCopies <= 0) return res.status(400).json({ error: "No copies available" });

  await db.update(booksTable)
    .set({ availableCopies: book.availableCopies - 1 })
    .where(eq(booksTable.id, bookId));

  const [record] = await db.insert(borrowRecordsTable).values({
    userId,
    bookId,
    dueDate: new Date(dueDate),
    status: "borrowed",
  }).returning();

  // Log activity
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  await db.insert(activityLogTable).values({
    type: "borrow",
    description: `${user?.fullname || "User"} borrowed "${book.title}"`,
    userName: user?.fullname || "Unknown",
    bookTitle: book.title,
    campus: user?.campus || "",
  });

  return res.status(201).json(await formatRecord(record));
});

// PUT /borrow-records/:id
router.put("/borrow-records/:id", requireAuth, requireRole("admin", "librarian"), async (req, res) => {
  const id = parseInt(req.params["id"] as string);
  const { status, returnedAt } = req.body;

  const [existing] = await db.select().from(borrowRecordsTable).where(eq(borrowRecordsTable.id, id));
  if (!existing) return res.status(404).json({ error: "Record not found" });

  const updates: Record<string, unknown> = {};
  if (status) updates.status = status;
  if (returnedAt !== undefined) updates.returnedAt = returnedAt ? new Date(returnedAt) : null;

  // If returning, increment available copies
  if (status === "returned" && existing.status !== "returned") {
    const [book] = await db.select().from(booksTable).where(eq(booksTable.id, existing.bookId));
    if (book) {
      await db.update(booksTable)
        .set({ availableCopies: book.availableCopies + 1 })
        .where(eq(booksTable.id, existing.bookId));

      const [user] = await db.select().from(usersTable).where(eq(usersTable.id, existing.userId));
      await db.insert(activityLogTable).values({
        type: "return",
        description: `${user?.fullname || "User"} returned "${book.title}"`,
        userName: user?.fullname || "Unknown",
        bookTitle: book.title,
        campus: user?.campus || "",
      });
    }
  }

  const [updated] = await db.update(borrowRecordsTable).set(updates).where(eq(borrowRecordsTable.id, id)).returning();
  return res.json(await formatRecord(updated));
});

export default router;
