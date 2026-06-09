import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, requireRole } from "../middlewares/auth.js";

const router = Router();

// GET /users
router.get("/users", requireAuth, requireRole("admin", "librarian"), async (req, res) => {
  const { campus, role, course, year, section } = req.query as Record<string, string>;

  const users = await db.select({
    id: usersTable.id,
    fullname: usersTable.fullname,
    email: usersTable.email,
    phone: usersTable.phone,
    address: usersTable.address,
    campus: usersTable.campus,
    role: usersTable.role,
    studentNumber: usersTable.studentNumber,
    course: usersTable.course,
    year: usersTable.year,
    section: usersTable.section,
    isApproved: usersTable.isApproved,
    createdAt: usersTable.createdAt,
  }).from(usersTable);

  let filtered = users;
  if (campus) filtered = filtered.filter(u => u.campus === campus);
  if (role) filtered = filtered.filter(u => u.role === role);
  if (course) filtered = filtered.filter(u => u.course === course);
  if (year) filtered = filtered.filter(u => u.year === year);
  if (section) filtered = filtered.filter(u => u.section === section);

  return res.json(filtered.map(u => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
  })));
});

// GET /users/:id
router.get("/users/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  const [user] = await db.select({
    id: usersTable.id,
    fullname: usersTable.fullname,
    email: usersTable.email,
    phone: usersTable.phone,
    address: usersTable.address,
    campus: usersTable.campus,
    role: usersTable.role,
    studentNumber: usersTable.studentNumber,
    course: usersTable.course,
    year: usersTable.year,
    section: usersTable.section,
    isApproved: usersTable.isApproved,
    createdAt: usersTable.createdAt,
  }).from(usersTable).where(eq(usersTable.id, id));

  if (!user) return res.status(404).json({ error: "User not found" });
  return res.json({ ...user, createdAt: user.createdAt.toISOString() });
});

// PUT /users/:id
router.put("/users/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  const { fullname, phone, address, campus, isApproved, course, year, section } = req.body;

  // Only admins/librarians can update other users or approval status
  if (req.user!.id !== id && !["admin", "librarian"].includes(req.user!.role)) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const updates: Record<string, unknown> = {};
  if (fullname !== undefined) updates.fullname = fullname;
  if (phone !== undefined) updates.phone = phone;
  if (address !== undefined) updates.address = address;
  if (campus !== undefined) updates.campus = campus;
  if (course !== undefined) updates.course = course;
  if (year !== undefined) updates.year = year;
  if (section !== undefined) updates.section = section;
  if (isApproved !== undefined && ["admin", "librarian"].includes(req.user!.role)) {
    updates.isApproved = isApproved;
  }

  const [updated] = await db.update(usersTable).set(updates).where(eq(usersTable.id, id)).returning();
  if (!updated) return res.status(404).json({ error: "User not found" });

  const { passwordHash: _, ...safeUser } = updated;
  return res.json({ ...safeUser, createdAt: safeUser.createdAt.toISOString() });
});

// DELETE /users/:id
router.delete("/users/:id", requireAuth, requireRole("admin", "librarian"), async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(usersTable).where(eq(usersTable.id, id));
  return res.status(204).send();
});

export default router;
