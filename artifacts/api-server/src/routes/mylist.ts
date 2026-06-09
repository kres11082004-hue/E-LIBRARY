import { Router } from "express";
import { db, myListTable, booksTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

// GET /my-list
router.get("/my-list", requireAuth, async (req, res) => {
  const userId = req.user!.id;
  const items = await db.select().from(myListTable).where(eq(myListTable.userId, userId));

  const result = await Promise.all(items.map(async (item) => {
    const [book] = await db.select().from(booksTable).where(eq(booksTable.id, item.bookId));
    return {
      id: item.id,
      userId: item.userId,
      bookId: item.bookId,
      addedAt: item.addedAt.toISOString(),
      book: book ? { ...book, createdAt: book.createdAt.toISOString() } : null,
    };
  }));

  return res.json(result.filter(r => r.book !== null));
});

// POST /my-list
router.post("/my-list", requireAuth, async (req, res) => {
  const userId = req.user!.id;
  const { bookId } = req.body;

  if (!bookId) return res.status(400).json({ error: "bookId required" });

  // Check if already in list
  const [existing] = await db.select().from(myListTable).where(
    and(eq(myListTable.userId, userId), eq(myListTable.bookId, bookId))
  );
  if (existing) return res.status(400).json({ error: "Already in list" });

  const [item] = await db.insert(myListTable).values({ userId, bookId }).returning();
  const [book] = await db.select().from(booksTable).where(eq(booksTable.id, bookId));

  return res.status(201).json({
    id: item.id,
    userId: item.userId,
    bookId: item.bookId,
    addedAt: item.addedAt.toISOString(),
    book: book ? { ...book, createdAt: book.createdAt.toISOString() } : null,
  });
});

// DELETE /my-list/:bookId
router.delete("/my-list/:bookId", requireAuth, async (req, res) => {
  const userId = req.user!.id;
  const bookId = parseInt(req.params.bookId);

  await db.delete(myListTable).where(
    and(eq(myListTable.userId, userId), eq(myListTable.bookId, bookId))
  );

  return res.status(204).send();
});

export default router;
