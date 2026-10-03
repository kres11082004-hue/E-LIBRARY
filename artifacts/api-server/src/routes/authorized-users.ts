import { Router } from "express";
import { db, authorizedUsersTable } from "@workspace/db";
import { eq, ilike, and, isNull, asc } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

// GET /authorized-users — list all (admin only)
router.get("/authorized-users", requireAuth, async (req, res) => {
  if (req.user!.role !== "admin" && req.user!.role !== "librarian") {
    return res.status(403).json({ error: "Forbidden" });
  }

  const { search, role } = req.query;
  let query = db.select().from(authorizedUsersTable).$dynamic();

  const rows = await db.select().from(authorizedUsersTable).orderBy(asc(authorizedUsersTable.fullName));

  let filtered = rows;
  if (role && role !== "All") {
    filtered = filtered.filter(r => r.role === role);
  }
  if (search) {
    const s = (search as string).toLowerCase();
    filtered = filtered.filter(r =>
      r.fullName.toLowerCase().includes(s) || r.schoolId.toLowerCase().includes(s)
    );
  }

  return res.json(filtered);
});

// POST /authorized-users — add (admin only)
router.post("/authorized-users", requireAuth, async (req, res) => {
  if (req.user!.role !== "admin" && req.user!.role !== "librarian") {
    return res.status(403).json({ error: "Forbidden" });
  }

  let { fullName, schoolId, role, course } = req.body;
  if (!fullName || !schoolId || !role) {
    return res.status(400).json({ error: "Full name, school ID, and role are required" });
  }
  fullName = fullName.trim();
  schoolId = schoolId.trim();
  role = role.toLowerCase().trim();
  if (role !== "student" && role !== "instructor") {
    return res.status(400).json({ error: "Role must be 'student' or 'instructor'" });
  }

  // Check for duplicate schoolId
  const [existing] = await db.select().from(authorizedUsersTable).where(eq(authorizedUsersTable.schoolId, schoolId));
  if (existing) {
    return res.status(400).json({ error: "A record with this School/Employee ID already exists" });
  }

  const [record] = await db.insert(authorizedUsersTable).values({ fullName, schoolId, role, course: course || null }).returning();
  return res.status(201).json(record);
});

// PUT /authorized-users/:id — update (admin only)
router.put("/authorized-users/:id", requireAuth, async (req, res) => {
  if (req.user!.role !== "admin" && req.user!.role !== "librarian") {
    return res.status(403).json({ error: "Forbidden" });
  }

  const id = parseInt(req.params.id as string, 10);
  let { fullName, schoolId, role, course } = req.body;
  if (fullName) fullName = fullName.trim();
  if (schoolId) schoolId = schoolId.trim();
  if (role) role = role.toLowerCase().trim();

  const [updated] = await db
    .update(authorizedUsersTable)
    .set({
      ...(fullName && { fullName }),
      ...(schoolId && { schoolId }),
      ...(role && { role }),
      ...(course !== undefined && { course }),
    })
    .where(eq(authorizedUsersTable.id, id))
    .returning();

  if (!updated) return res.status(404).json({ error: "Record not found" });
  return res.json(updated);
});

// DELETE /authorized-users/:id — delete (admin only)
router.delete("/authorized-users/:id", requireAuth, async (req, res) => {
  if (req.user!.role !== "admin" && req.user!.role !== "librarian") {
    return res.status(403).json({ error: "Forbidden" });
  }

  const id = parseInt(req.params.id as string, 10);
  const [deleted] = await db.delete(authorizedUsersTable).where(eq(authorizedUsersTable.id, id)).returning();
  if (!deleted) return res.status(404).json({ error: "Record not found" });
  return res.json({ success: true });
});

// POST /authorized-users/import — bulk import (admin only)
router.post("/authorized-users/import", requireAuth, async (req, res) => {
  if (req.user!.role !== "admin" && req.user!.role !== "librarian") {
    return res.status(403).json({ error: "Forbidden" });
  }

  const records = req.body;
  if (!Array.isArray(records)) {
    return res.status(400).json({ error: "Expected an array of records" });
  }

  let importedCount = 0;
  let skippedCount = 0;

  for (const record of records) {
    let { fullName, schoolId, role, course } = record;
    if (!fullName || !schoolId || !role) {
      skippedCount++;
      continue;
    }
    fullName = fullName.trim();
    schoolId = schoolId.trim();
    role = role.toLowerCase().trim();

    // Check if schoolId exists
    const [existing] = await db.select().from(authorizedUsersTable).where(eq(authorizedUsersTable.schoolId, schoolId));
    if (existing) {
      // Instead of updating, we skip duplicates to avoid accidental overwrites of linked accounts
      skippedCount++;
      continue;
    }

    await db.insert(authorizedUsersTable).values({
      fullName,
      schoolId,
      role,
      course: course || null
    });
    importedCount++;
  }

  return res.json({ success: true, importedCount, skippedCount });
});

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function nameMatches(recordName: string, inputName: string): boolean {
  const normRecord = normalizeName(recordName);
  const normInput = normalizeName(inputName);

  if (normRecord === normInput) return true;

  // Split into token words
  const recordTokens = new Set(normRecord.split(" ").filter(t => t.length > 0));
  const inputTokens = normInput.split(" ").filter(t => t.length > 0);

  // Filter out single character initials for token matching check
  const significantInputTokens = inputTokens.filter(t => t.length > 1);
  if (significantInputTokens.length === 0) return false;

  const matchingTokens = significantInputTokens.filter(t => recordTokens.has(t));

  // Match if at least 2 significant tokens match, or all significant tokens match if only 1 exists
  if (matchingTokens.length >= Math.min(2, significantInputTokens.length)) {
    return true;
  }

  return false;
}

// POST /auth/verify-identity — public, used during registration
router.post("/auth/verify-identity", async (req, res) => {
  const { fullName, schoolId, role } = req.body;
  if (!fullName || !schoolId || !role) {
    return res.status(400).json({ error: "Full name, School/Employee ID, and role are required" });
  }

  const trimmedSchoolId = schoolId.trim();
  const trimmedRole = role.toLowerCase().trim();
  const trimmedFullName = fullName.trim();

  // Case-insensitive schoolId + role match
  const rows = await db
    .select()
    .from(authorizedUsersTable)
    .where(
      and(
        ilike(authorizedUsersTable.schoolId, trimmedSchoolId),
        ilike(authorizedUsersTable.role, trimmedRole)
      )
    );

  if (rows.length === 0) {
    return res.status(404).json({
      error: `School/Employee ID '${trimmedSchoolId}' is not found in the school records list for ${trimmedRole}s. Please check your ID or contact your librarian to be added.`
    });
  }

  const record = rows[0];

  // Flexible name comparison
  if (!nameMatches(record.fullName, trimmedFullName)) {
    return res.status(400).json({
      error: `The name '${trimmedFullName}' does not match the school record ('${record.fullName}') for ID '${trimmedSchoolId}'.`
    });
  }

  if (record.linkedUserId) {
    return res.status(400).json({ error: "An account has already been registered for this School/Employee ID." });
  }

  return res.json({ valid: true, authorizedUserId: record.id, fullName: record.fullName });
});

export default router;
