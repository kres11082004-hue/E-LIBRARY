import { Router } from "express";
import { db, downloadsTable, booksTable, usersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth, requireRole } from "../middlewares/auth.js";

const router = Router();

// GET /downloads (own downloads)
router.get("/downloads", requireAuth, async (req, res) => {
  const userId = req.user!.id;
  
  const results = await db
    .select({
      id: downloadsTable.id,
      userId: downloadsTable.userId,
      bookId: downloadsTable.bookId,
      downloadedAt: downloadsTable.downloadedAt,
      book: booksTable,
    })
    .from(downloadsTable)
    .innerJoin(booksTable, eq(booksTable.id, downloadsTable.bookId))
    .where(eq(downloadsTable.userId, userId))
    .orderBy(desc(downloadsTable.downloadedAt));

  return res.json(results);
});

// GET /downloads/all (admin/librarian view)
router.get("/downloads/all", requireAuth, requireRole("admin", "librarian"), async (req, res) => {
  const results = await db
    .select({
      id: downloadsTable.id,
      userId: downloadsTable.userId,
      bookId: downloadsTable.bookId,
      downloadedAt: downloadsTable.downloadedAt,
      book: booksTable,
      user: usersTable,
    })
    .from(downloadsTable)
    .innerJoin(booksTable, eq(booksTable.id, downloadsTable.bookId))
    .innerJoin(usersTable, eq(usersTable.id, downloadsTable.userId))
    .orderBy(desc(downloadsTable.downloadedAt));

  return res.json(results);
});

// POST /downloads (record a download)
router.post("/downloads", requireAuth, async (req, res) => {
  const userId = req.user!.id;
  const { bookId } = req.body;

  if (!bookId) return res.status(400).json({ error: "bookId required" });

  const [item] = await db
    .insert(downloadsTable)
    .values({ userId, bookId })
    .returning();

  return res.status(201).json(item);
});

export default router;
