import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { requireAuth, generateToken, revokeToken, getUserByToken } from "../middlewares/auth.js";
import { activityLogTable } from "@workspace/db";

const router = Router();

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "elibrary_salt").digest("hex");
}

// POST /auth/login
router.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const hash = hashPassword(password);
  if (hash !== user.passwordHash) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = generateToken({ id: user.id, email: user.email, role: user.role, campus: user.campus });

  // Log activity
  await db.insert(activityLogTable).values({
    type: "login",
    description: `${user.fullname} logged in`,
    userName: user.fullname,
    campus: user.campus,
  });

  const { passwordHash: _, ...safeUser } = user;
  return res.json({ token, user: safeUser });
});

// POST /auth/register
router.post("/auth/register", async (req, res) => {
  const { fullname, email, password, phone, address, campus, role, studentNumber, course, year, section, photoUrl } = req.body;

  if (!fullname || !email || !password || !phone || !address || !campus || !role || !photoUrl) {
    return res.status(400).json({ error: "All required fields must be provided (including profile photo)" });
  }

  if ((role === "student" || role === "instructor") && !studentNumber) {
    return res.status(400).json({ error: "School ID Number is required" });
  }

  if (role === "student" && (!course || !year || !section)) {
    return res.status(400).json({ error: "Course, year, and section are required for students" });
  }

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (existing) {
    return res.status(400).json({ error: "Email already registered" });
  }

  const passwordHash = hashPassword(password);
  const isAdmin = role === "admin";
  const [user] = await db.insert(usersTable).values({
    fullname,
    email,
    passwordHash,
    phone,
    address,
    campus,
    role,
    photoUrl,
    studentNumber: studentNumber || null,
    course: course || null,
    year: year || null,
    section: section || null,
    isApproved: isAdmin, // admins auto-approved, others need approval
  }).returning();

  // Log activity
  await db.insert(activityLogTable).values({
    type: "register",
    description: `${fullname} registered as ${role}`,
    userName: fullname,
    campus: campus,
  });

  const token = generateToken({ id: user.id, email: user.email, role: user.role, campus: user.campus });
  const { passwordHash: _, ...safeUser } = user;
  return res.status(201).json({ token, user: safeUser });
});

// GET /auth/me
router.get("/auth/me", requireAuth, async (req, res) => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.id));
  if (!user) return res.status(401).json({ error: "User not found" });
  const { passwordHash: _, ...safeUser } = user;
  return res.json(safeUser);
});

// POST /auth/logout
router.post("/auth/logout", (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    revokeToken(authHeader.slice(7));
  }
  return res.json({ success: true });
});

export default router;
