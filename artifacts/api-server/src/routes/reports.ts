import { Router } from "express";
import { db, borrowRecordsTable, usersTable, booksTable } from "@workspace/db";
import { eq, and, desc, sql, ilike, or, between, gte, lte } from "drizzle-orm";
import { requireAuth, requireRole } from "../middlewares/auth.js";

const router = Router();

// GET /reports/borrowing
router.get("/borrowing", requireAuth, requireRole("admin", "librarian"), async (req, res) => {
  try {
    const { role, startDate, endDate, search, status } = req.query as Record<string, string>;

    const conditions = [];

    if (role) {
      conditions.push(eq(usersTable.role, role));
    }

    if (startDate && endDate) {
      conditions.push(
        and(
          gte(borrowRecordsTable.borrowedAt, new Date(startDate)),
          lte(borrowRecordsTable.borrowedAt, new Date(endDate))
        )
      );
    } else if (startDate) {
      conditions.push(gte(borrowRecordsTable.borrowedAt, new Date(startDate)));
    } else if (endDate) {
      conditions.push(lte(borrowRecordsTable.borrowedAt, new Date(endDate)));
    }

    if (status) {
      conditions.push(eq(borrowRecordsTable.status, status));
    }

    if (search) {
      const searchPattern = `%${search}%`;
      conditions.push(
        or(
          ilike(usersTable.fullname, searchPattern),
          ilike(usersTable.studentNumber, searchPattern),
          ilike(booksTable.title, searchPattern),
          ilike(booksTable.isbn, searchPattern)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const results = await db.select({
      userId: usersTable.id,
      fullname: usersTable.fullname,
      studentNumber: usersTable.studentNumber,
      role: usersTable.role,
      course: usersTable.course,
      totalBorrowed: sql<number>`cast(count(${borrowRecordsTable.id}) as int)`,
      history: sql<any>`json_agg(json_build_object(
        'id', ${borrowRecordsTable.id},
        'title', ${booksTable.title},
        'isbn', ${booksTable.isbn},
        'borrowedAt', ${borrowRecordsTable.borrowedAt},
        'dueDate', ${borrowRecordsTable.dueDate},
        'returnedAt', ${borrowRecordsTable.returnedAt},
        'status', ${borrowRecordsTable.status}
      ))`
    })
    .from(borrowRecordsTable)
    .innerJoin(usersTable, eq(usersTable.id, borrowRecordsTable.userId))
    .innerJoin(booksTable, eq(booksTable.id, borrowRecordsTable.bookId))
    .where(whereClause)
    .groupBy(usersTable.id, usersTable.fullname, usersTable.studentNumber, usersTable.role, usersTable.course);

    return res.json(results);
  } catch (error) {
    console.error("Error generating borrowing report:", error);
    return res.status(500).json({ error: "Failed to generate borrowing report" });
  }
});

export default router;
