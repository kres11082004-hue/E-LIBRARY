import { Router } from "express";
import { db, usersTable, booksTable, borrowRecordsTable, activityLogTable } from "@workspace/db";
import { requireAuth, requireRole } from "../middlewares/auth.js";

const router = Router();

// GET /monitoring/stats
router.get("/monitoring/stats", requireAuth, requireRole("admin", "librarian"), async (req, res) => {
  const users = await db.select().from(usersTable);
  const books = await db.select().from(booksTable);
  const borrows = await db.select().from(borrowRecordsTable);

  const activeBorrows = borrows.filter(b => b.status === "borrowed").length;
  const overdueBooks = borrows.filter(b => b.status === "overdue").length;
  const campuses = new Set(users.map(u => u.campus)).size;
  const digitalBooks = books.filter(b => b.content || b.fileUrl).length;
  const physicalBooks = books.filter(b => b.isAvailablePhysical).length;

  return res.json({
    totalUsers: users.length,
    totalBooks: books.length,
    digitalBooks,
    physicalBooks,
    activeBorrows,
    totalStudents: users.filter(u => u.role === "student").length,
    totalInstructors: users.filter(u => u.role === "instructor").length,
    overdueBooks,
    totalCampuses: campuses,
  });
});

// GET /monitoring/by-campus
router.get("/monitoring/by-campus", requireAuth, requireRole("admin", "librarian"), async (req, res) => {
  const users = await db.select().from(usersTable);
  const borrows = await db.select().from(borrowRecordsTable);

  const campusMap = new Map<string, { students: number; instructors: number; totalUsers: number; activeBorrows: number }>();

  for (const user of users) {
    if (!campusMap.has(user.campus)) {
      campusMap.set(user.campus, { students: 0, instructors: 0, totalUsers: 0, activeBorrows: 0 });
    }
    const c = campusMap.get(user.campus)!;
    c.totalUsers++;
    if (user.role === "student") c.students++;
    if (user.role === "instructor") c.instructors++;
  }

  for (const borrow of borrows.filter(b => b.status === "borrowed")) {
    const user = users.find(u => u.id === borrow.userId);
    if (user && campusMap.has(user.campus)) {
      campusMap.get(user.campus)!.activeBorrows++;
    }
  }

  const result = Array.from(campusMap.entries()).map(([campus, stats]) => ({ campus, ...stats }));
  return res.json(result);
});

// GET /monitoring/by-course
router.get("/monitoring/by-course", requireAuth, requireRole("admin", "librarian"), async (req, res) => {
  const students = await db.select().from(usersTable);
  const borrows = await db.select().from(borrowRecordsTable);

  const courseMap = new Map<string, { course: string; year: string; section: string; campus: string; studentCount: number; activeBorrows: number }>();

  for (const s of students.filter(u => u.role === "student" && u.course)) {
    const key = `${s.course}|${s.year}|${s.section}|${s.campus}`;
    if (!courseMap.has(key)) {
      courseMap.set(key, {
        course: s.course || "",
        year: s.year || "",
        section: s.section || "",
        campus: s.campus,
        studentCount: 0,
        activeBorrows: 0,
      });
    }
    courseMap.get(key)!.studentCount++;
  }

  for (const borrow of borrows.filter(b => b.status === "borrowed")) {
    const user = students.find(u => u.id === borrow.userId);
    if (user?.course) {
      const key = `${user.course}|${user.year}|${user.section}|${user.campus}`;
      if (courseMap.has(key)) {
        courseMap.get(key)!.activeBorrows++;
      }
    }
  }

  return res.json(Array.from(courseMap.values()));
});

// GET /monitoring/recent-activity
router.get("/monitoring/recent-activity", requireAuth, requireRole("admin", "librarian"), async (req, res) => {
  const activities = await db.select().from(activityLogTable);
  const sorted = activities
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 50);

  return res.json(sorted.map(a => ({
    id: a.id,
    type: a.type,
    description: a.description,
    userName: a.userName,
    bookTitle: a.bookTitle || null,
    campus: a.campus,
    createdAt: a.createdAt.toISOString(),
  })));
});

export default router;
