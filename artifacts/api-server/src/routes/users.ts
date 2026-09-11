import { Router } from "express";
import { db, usersTable, authorizedUsersTable, borrowRecordsTable, reservationsTable, myListTable, downloadsTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
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
    photoUrl: usersTable.photoUrl,
    isApproved: usersTable.isApproved,
    createdAt: usersTable.createdAt,
  }).from(usersTable).orderBy(asc(usersTable.fullname));

  let filtered = users;
  if (campus) filtered = filtered.filter(u => u.campus === campus);
  // When filtering by "admin", include both admin and librarian roles
  if (role) {
    if (role === "admin") {
      filtered = filtered.filter(u => u.role === "admin" || u.role === "librarian");
    } else {
      filtered = filtered.filter(u => u.role === role);
    }
  }
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
  const id = parseInt(req.params["id"] as string);
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
    photoUrl: usersTable.photoUrl,
    isApproved: usersTable.isApproved,
    createdAt: usersTable.createdAt,
  }).from(usersTable).where(eq(usersTable.id, id));

  if (!user) return res.status(404).json({ error: "User not found" });
  return res.json({ ...user, createdAt: user.createdAt.toISOString() });
});

// PUT /users/:id
router.put("/users/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params["id"] as string);
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
  const id = parseInt(req.params["id"] as string);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid user ID" });

  try {
    // Manually remove all dependent records to avoid FK constraint violations
    // (cascade may not be applied on the actual DB if migrations weren't re-run)
    await db.delete(borrowRecordsTable).where(eq(borrowRecordsTable.userId, id));
    await db.delete(reservationsTable).where(eq(reservationsTable.userId, id));
    await db.delete(myListTable).where(eq(myListTable.userId, id));
    await db.delete(downloadsTable).where(eq(downloadsTable.userId, id));
    await db.update(authorizedUsersTable)
      .set({ linkedUserId: null })
      .where(eq(authorizedUsersTable.linkedUserId, id));

    await db.delete(usersTable).where(eq(usersTable.id, id));
    return res.status(204).send();
  } catch (err: any) {
    console.error("[DELETE /users/:id] error:", err?.message ?? err);
    return res.status(500).json({ error: "Failed to delete user", detail: err?.message });
  }
});


export default router;
