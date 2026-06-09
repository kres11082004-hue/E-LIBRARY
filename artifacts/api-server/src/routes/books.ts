import { Router } from "express";
import { db, booksTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { activityLogTable } from "@workspace/db";

const router = Router();

function formatBook(book: typeof booksTable.$inferSelect) {
  return {
    ...book,
    createdAt: book.createdAt.toISOString(),
  };
}

// GET /books — list without content (faster)
router.get("/books", requireAuth, async (req, res) => {
  const { search, category, campus } = req.query as Record<string, string>;

  let books = await db.select().from(booksTable);

  if (search) {
    const q = search.toLowerCase();
    books = books.filter(b =>
      b.title.toLowerCase().includes(q) ||
      b.author.toLowerCase().includes(q) ||
      b.description.toLowerCase().includes(q)
    );
  }
  if (category) books = books.filter(b => b.category === category);
  if (campus) books = books.filter(b => b.campus === campus);

  return res.json(books.map(formatBook));
});

// POST /books
router.post("/books", requireAuth, requireRole("admin", "librarian"), async (req, res) => {
  const { title, author, description, content, category, campus, coverUrl, fileUrl, isbn, publishedYear, isAvailablePhysical, totalCopies } = req.body;

  if (!title || !author || !description || !category || !campus) {
    return res.status(400).json({ error: "Required fields missing" });
  }

  const copies = totalCopies || 0;
  const [book] = await db.insert(booksTable).values({
    title,
    author,
    description,
    content: content || null,
    category,
    campus,
    coverUrl: coverUrl || null,
    fileUrl: fileUrl || null,
    isbn: isbn || null,
    publishedYear: publishedYear || null,
    isAvailablePhysical: isAvailablePhysical || false,
    totalCopies: copies,
    availableCopies: copies,
  }).returning();

  await db.insert(activityLogTable).values({
    type: "add_book",
    description: `New book added: "${title}" by ${author}`,
    userName: req.user!.email,
    bookTitle: title,
    campus,
  });

  return res.status(201).json(formatBook(book));
});

// GET /books/:id — includes full content
router.get("/books/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  const [book] = await db.select().from(booksTable).where(eq(booksTable.id, id));
  if (!book) return res.status(404).json({ error: "Book not found" });
  return res.json(formatBook(book));
});

// PUT /books/:id
router.put("/books/:id", requireAuth, requireRole("admin", "librarian"), async (req, res) => {
  const id = parseInt(req.params.id);
  const updates: Record<string, unknown> = {};
  const fields = ["title", "author", "description", "content", "category", "campus", "coverUrl", "fileUrl", "isbn", "publishedYear", "isAvailablePhysical", "totalCopies"];

  for (const field of fields) {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  }

  const [updated] = await db.update(booksTable).set(updates).where(eq(booksTable.id, id)).returning();
  if (!updated) return res.status(404).json({ error: "Book not found" });
  return res.json(formatBook(updated));
});

// DELETE /books/:id
router.delete("/books/:id", requireAuth, requireRole("admin", "librarian"), async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(booksTable).where(eq(booksTable.id, id));
  return res.status(204).send();
});

export default router;
