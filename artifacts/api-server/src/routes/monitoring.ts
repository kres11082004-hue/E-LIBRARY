import { Router } from "express";
import { db, usersTable, booksTable, borrowRecordsTable, activityLogTable } from "@workspace/db";
import { requireAuth, requireRole } from "../middlewares/auth.js";

const router = Router();

// GET /monitoring/stats
router.get("/monitoring/stats", requireAuth, requireRole("admin", "librarian"), async (req, res) => {
  const users = await db.select().from(usersTable);
  const books = await db.select().from(booksTable);
  const borrows = await db.select().from(borrowRecordsTable);

  const activeBorrows = borrows.filter(b => b.status === "borrowed" || b.status === "overdue").length;
  const overdueBooks = borrows.filter(b => b.status === "overdue").length;
  const campuses = new Set(users.map(u => u.campus)).size;

  return res.json({
    totalUsers: users.length,
    totalBooks: books.length,
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

  for (const borrow of borrows.filter(b => b.status === "borrowed" || b.status === "overdue")) {
    const user = users.find(u => u.id === borrow.userId);
    if (user && campusMap.has(user.campus)) {
      campusMap.get(user.campus)!.activeBorrows++;
    }
  }

  const result = Array.from(campusMap.entries()).map(([campus, stats]) => ({ campus, ...stats }));
  return res.json(result);
});

function getDepartmentForCourse(courseRaw?: string | null): string {
  if (!courseRaw) return "Department of Information System (BSIS)";
  const lower = courseRaw.trim().toLowerCase();
  if (lower === "bped" || lower.includes("physical education") || lower.includes("pe")) {
    return "Department of Physical Education (BPED)";
  }
  return "Department of Information System (BSIS)";
}

// GET /monitoring/by-department
router.get("/monitoring/by-department", requireAuth, requireRole("admin", "librarian"), async (req, res) => {
  const users = await db.select().from(usersTable);
  const borrows = await db.select().from(borrowRecordsTable);

  const deptMap = new Map<string, { department: string; students: number; instructors: number; totalUsers: number; activeBorrows: number }>();

  for (const user of users) {
    const dept = getDepartmentForCourse(user.course);
    if (!deptMap.has(dept)) {
      deptMap.set(dept, { department: dept, students: 0, instructors: 0, totalUsers: 0, activeBorrows: 0 });
    }
    const d = deptMap.get(dept)!;
    d.totalUsers++;
    if (user.role === "student") d.students++;
    if (user.role === "instructor") d.instructors++;
  }

  for (const borrow of borrows.filter(b => b.status === "borrowed" || b.status === "overdue")) {
    const user = users.find(u => u.id === borrow.userId);
    if (user) {
      const dept = getDepartmentForCourse(user.course);
      if (deptMap.has(dept)) {
        deptMap.get(dept)!.activeBorrows++;
      }
    }
  }

  return res.json(Array.from(deptMap.values()));
});

// GET /monitoring/by-course
router.get("/monitoring/by-course", requireAuth, requireRole("admin", "librarian"), async (req, res) => {
  const students = await db.select().from(usersTable);
  const borrows = await db.select().from(borrowRecordsTable);

  const courseMap = new Map<string, { course: string; department: string; year: string; section: string; campus: string; studentCount: number; activeBorrows: number }>();

  for (const s of students.filter(u => u.role === "student" && u.course)) {
    const key = `${s.course}|${s.year}|${s.section}|${s.campus}`;
    if (!courseMap.has(key)) {
      courseMap.set(key, {
        course: s.course || "",
        department: getDepartmentForCourse(s.course),
        year: s.year || "",
        section: s.section || "",
        campus: s.campus,
        studentCount: 0,
        activeBorrows: 0,
      });
    }
    courseMap.get(key)!.studentCount++;
  }

  for (const borrow of borrows.filter(b => b.status === "borrowed" || b.status === "overdue")) {
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
