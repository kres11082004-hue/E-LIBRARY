import { Router } from "express";
import { db, usersTable, authorizedUsersTable } from "@workspace/db";
import { eq, and, ilike } from "drizzle-orm";
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
  try {
    const { fullname, email, password, phone, address, campus, role, studentNumber, course, year, section, photoUrl, authorizedUserId } = req.body;

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

    // For students and instructors, verify against authorized users list
    if (role === "student" || role === "instructor") {
      let authRecord: typeof authorizedUsersTable.$inferSelect | undefined;
      if (authorizedUserId) {
        const [found] = await db.select().from(authorizedUsersTable).where(eq(authorizedUsersTable.id, authorizedUserId));
        authRecord = found;
      }
      
      // Fallback lookup if authorizedUserId wasn't supplied directly
      if (!authRecord && studentNumber) {
        const rows = await db
          .select()
          .from(authorizedUsersTable)
          .where(
            and(
              ilike(authorizedUsersTable.schoolId, studentNumber.trim()),
              ilike(authorizedUsersTable.role, role.toLowerCase().trim())
            )
          );
        if (rows.length > 0) {
          authRecord = rows[0];
        }
      }

      if (!authRecord) {
        return res.status(400).json({ error: "Identity verification is required. Please complete step 1 to verify your identity." });
      }
      if (authRecord.linkedUserId) {
        return res.status(400).json({ error: "An account has already been registered for this School/Employee ID." });
      }
      // Ensure we store the authorized user id for linking
      req.body.authorizedUserId = authRecord.id;
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

    // Link the authorized user record
    const targetAuthId = req.body.authorizedUserId;
    if ((role === "student" || role === "instructor") && targetAuthId) {
      await db.update(authorizedUsersTable).set({ linkedUserId: user.id }).where(eq(authorizedUsersTable.id, targetAuthId));
    }

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
  } catch (err: any) {
    console.error("Register error:", err);
    return res.status(500).json({ error: err?.message || "Internal server error during registration." });
  }
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
