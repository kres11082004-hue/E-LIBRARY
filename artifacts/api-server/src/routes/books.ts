import { Router } from "express";
import { db, booksTable, activityLogTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import { requireAuth, requireRole } from "../middlewares/auth.js";

const router = Router();

function formatBook(book: typeof booksTable.$inferSelect) {
  return {
    ...book,
    createdAt: book.createdAt.toISOString(),
  };
}

// Helper to derive department for books if not explicitly set
function resolveBookDepartment(book: { department?: string | null; category?: string; title?: string; description?: string }): string {
  if (book.department) return book.department;
  const str = `${book.category || ""} ${book.title || ""} ${book.description || ""}`.toLowerCase();
  if (str.includes("physical education") || str.includes("sports") || str.includes("bped")) {
    return "Department of Physical Education (BPED)";
  }
  return "Department of Information System (BSIS)";
}

// GET /books — list without content (faster)
router.get("/books", requireAuth, async (req, res) => {
  try {
    const { search, category, campus, department } = req.query as Record<string, string>;

    let books = await db.select().from(booksTable).orderBy(asc(booksTable.title));

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
    if (department) {
      const deptQuery = department.toLowerCase();
      books = books.filter(b => {
        const resolved = resolveBookDepartment(b).toLowerCase();
        if (deptQuery === "bsis" || deptQuery.includes("information system")) {
          return resolved.includes("information system") || resolved.includes("bsis");
        }
        if (deptQuery === "bped" || deptQuery.includes("physical education")) {
          return resolved.includes("physical education") || resolved.includes("bped");
        }
        return resolved.includes(deptQuery);
      });
    }

    return res.json(books.map(b => ({
      ...formatBook(b),
      department: resolveBookDepartment(b)
    })));
  } catch (err: any) {
    req.log.error({ err }, "Error fetching books list");
    return res.status(500).json({ error: "Failed to fetch books: " + err.message });
  }
});

// POST /books
router.post("/books", requireAuth, requireRole("admin", "librarian"), async (req, res) => {
  try {
    const { title, author, description, content, category, campus, department, coverUrl, fileUrl, isbn, publishedYear, isAvailablePhysical, totalCopies } = req.body;

    if (!title || !author || !description || !category || !campus) {
      return res.status(400).json({ error: "Required fields missing: title, author, description, category, and campus are required." });
    }

    const parsedCopies = typeof totalCopies === "number" ? totalCopies : (parseInt(totalCopies, 10) || 0);
    const parsedYear = publishedYear ? (typeof publishedYear === "number" ? publishedYear : (parseInt(publishedYear, 10) || null)) : null;

    const [book] = await db.insert(booksTable).values({
      title: title.trim(),
      author: author.trim(),
      description: description.trim(),
      content: content || null,
      category,
      campus,
      department: department || null,
      coverUrl: coverUrl || null,
      fileUrl: fileUrl || null,
      isbn: isbn ? isbn.trim() : null,
      publishedYear: parsedYear,
      isAvailablePhysical: Boolean(isAvailablePhysical),
      totalCopies: parsedCopies,
      availableCopies: parsedCopies,
    }).returning();

    try {
      await db.insert(activityLogTable).values({
        type: "add_book",
        description: `New book added: "${title}" by ${author}`,
        userName: req.user?.email || "Admin User",
        bookTitle: title,
        campus: campus || "Main Campus",
      });
    } catch (logErr) {
      req.log.warn({ logErr }, "Failed to write activity log");
    }

    return res.status(201).json({
      ...formatBook(book),
      department: resolveBookDepartment(book)
    });
  } catch (err: any) {
    req.log.error({ err }, "Error creating book");
    return res.status(400).json({ error: err.message || "Failed to create book" });
  }
});

// GET /books/:id — includes full content
router.get("/books/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params["id"] as string, 10);
    const [book] = await db.select().from(booksTable).where(eq(booksTable.id, id));
    if (!book) return res.status(404).json({ error: "Book not found" });
    return res.json({
      ...formatBook(book),
      department: resolveBookDepartment(book)
    });
  } catch (err: any) {
    return res.status(404).json({ error: "Book not found" });
  }
});

// PUT /books/:id
router.put("/books/:id", requireAuth, requireRole("admin", "librarian"), async (req, res) => {
  try {
    const id = parseInt(req.params["id"] as string, 10);
    const updates: Record<string, unknown> = {};
    const fields = ["title", "author", "description", "content", "category", "campus", "department", "coverUrl", "fileUrl", "isbn", "isAvailablePhysical"];

    for (const field of fields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (req.body.publishedYear !== undefined) {
      updates.publishedYear = req.body.publishedYear ? parseInt(req.body.publishedYear, 10) || null : null;
    }

    if (req.body.totalCopies !== undefined) {
      const tc = parseInt(req.body.totalCopies, 10) || 0;
      updates.totalCopies = tc;
      updates.availableCopies = tc;
    }

    const [updated] = await db.update(booksTable).set(updates).where(eq(booksTable.id, id)).returning();
    if (!updated) return res.status(404).json({ error: "Book not found" });
    return res.json({
      ...formatBook(updated),
      department: resolveBookDepartment(updated)
    });
  } catch (err: any) {
    req.log.error({ err }, "Error updating book");
    return res.status(400).json({ error: err.message || "Failed to update book" });
  }
});

// DELETE /books/:id
router.delete("/books/:id", requireAuth, requireRole("admin", "librarian"), async (req, res) => {
  try {
    const id = parseInt(req.params["id"] as string, 10);
    await db.delete(booksTable).where(eq(booksTable.id, id));
    return res.status(204).send();
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to delete book" });
  }
});

export default router;
