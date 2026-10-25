import { Router } from "express";
import { db, borrowRecordsTable, usersTable, booksTable } from "@workspace/db";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { eq } from "drizzle-orm";

const router = Router();

/**
 * GET /notifications/due-reminders
 * Returns all active borrow records that are overdue or due within 3 days.
 * Admin/librarian only.
 */
router.get("/notifications/due-reminders", requireAuth, requireRole("admin", "librarian"), async (req, res) => {
  const now = new Date();
  const soon = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days from now

  const records = await db.select().from(borrowRecordsTable);
  const active = records.filter(r => r.status === "borrowed" || r.status === "overdue");

  const reminders: {
    borrowId: number;
    userId: number;
    bookId: number;
    userName: string;
    userEmail: string;
    userPhone: string;
    bookTitle: string;
    dueDate: string;
    daysLeft: number;
    urgency: "overdue" | "due_today" | "due_soon";
  }[] = [];

  for (const record of active) {
    const dueDate = new Date(record.dueDate);
    const daysLeft = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // Only include if overdue or due within 3 days
    if (daysLeft > 3) continue;

    const [user] = await db.select({
      fullname: usersTable.fullname,
      email: usersTable.email,
      phone: usersTable.phone,
    }).from(usersTable).where(eq(usersTable.id, record.userId));

    const [book] = await db.select({
      title: booksTable.title,
    }).from(booksTable).where(eq(booksTable.id, record.bookId));

    if (!user || !book) continue;

    reminders.push({
      borrowId: record.id,
      userId: record.userId,
      bookId: record.bookId,
      userName: user.fullname,
      userEmail: user.email,
      userPhone: user.phone || "",
      bookTitle: book.title,
      dueDate: dueDate.toISOString(),
      daysLeft,
      urgency: daysLeft < 0 ? "overdue" : daysLeft === 0 ? "due_today" : "due_soon",
    });
  }

  // Sort: overdue first, then by daysLeft ascending
  reminders.sort((a, b) => a.daysLeft - b.daysLeft);

  return res.json({ total: reminders.length, reminders });
});

/**
 * POST /notifications/mark-reminded/:borrowId
 * Simple acknowledgement endpoint — logs that a reminder was sent.
 * In a production system this would trigger an actual email/SMS via provider.
 */
router.post("/notifications/mark-reminded/:borrowId", requireAuth, requireRole("admin", "librarian"), async (req, res) => {
  const borrowId = parseInt(req.params.borrowId as string);
  if (isNaN(borrowId)) return res.status(400).json({ error: "Invalid borrowId" });
  // In production: trigger email/SMS here via nodemailer / Twilio / etc.
  return res.json({ success: true, borrowId, message: "Reminder logged" });
});

export default router;
