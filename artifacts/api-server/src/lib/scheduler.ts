import cron, { type ScheduledTask } from "node-cron";
import { db, borrowRecordsTable, usersTable, booksTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { sendDueReminderEmail } from "./mailer.js";
import { sendDueReminderSms } from "./sms.js";
import { logger } from "./logger.js";

// ---------------------------------------------------------------------------
// Core reminder logic (also exported for on-demand API use)
// ---------------------------------------------------------------------------

export interface ReminderResult {
  borrowId: number;
  userName: string;
  userEmail: string;
  userPhone: string;
  bookTitle: string;
  dueDate: string;
  daysLeft: number;
  urgency: "overdue" | "due_today" | "due_soon";
  emailSent: boolean;
  smsSent: boolean;
}

/**
 * Scans all active borrow records and dispatches email + SMS reminders
 * for any book overdue or due within `withinDays` days (default: 3).
 */
export async function dispatchDueReminders(withinDays = 3): Promise<ReminderResult[]> {
  const now = new Date();
  const results: ReminderResult[] = [];

  const records = await db.select().from(borrowRecordsTable);
  const active = records.filter(
    (r) => r.status === "borrowed" || r.status === "overdue",
  );

  for (const record of active) {
    const dueDate = new Date(record.dueDate);
    const daysLeft = Math.ceil(
      (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysLeft > withinDays) continue;

    const [user] = await db
      .select({
        fullname: usersTable.fullname,
        email: usersTable.email,
        phone: usersTable.phone,
      })
      .from(usersTable)
      .where(eq(usersTable.id, record.userId));

    const [book] = await db
      .select({ title: booksTable.title })
      .from(booksTable)
      .where(eq(booksTable.id, record.bookId));

    if (!user || !book) continue;

    const urgency: ReminderResult["urgency"] =
      daysLeft < 0 ? "overdue" : daysLeft === 0 ? "due_today" : "due_soon";

    const payload = {
      userName: user.fullname,
      userEmail: user.email,
      userPhone: user.phone || "",
      bookTitle: book.title,
      dueDate: dueDate.toISOString(),
      daysLeft,
      urgency,
    };

    const [emailSent, smsSent] = await Promise.all([
      sendDueReminderEmail(payload),
      sendDueReminderSms(payload),
    ]);

    results.push({
      borrowId: record.id,
      ...payload,
      emailSent,
      smsSent,
    });
  }

  results.sort((a, b) => a.daysLeft - b.daysLeft);
  return results;
}

/**
 * Sends a single reminder (email + SMS) for a specific borrow record.
 * Used by the overdue checker and on-demand API.
 */
export async function sendSingleReminder(borrowId: number): Promise<ReminderResult | null> {
  const [record] = await db.select().from(borrowRecordsTable).where(eq(borrowRecordsTable.id, borrowId));
  if (!record) return null;

  const [user] = await db.select({
    fullname: usersTable.fullname,
    email: usersTable.email,
    phone: usersTable.phone,
  }).from(usersTable).where(eq(usersTable.id, record.userId));

  const [book] = await db.select({ title: booksTable.title })
    .from(booksTable).where(eq(booksTable.id, record.bookId));

  if (!user || !book) return null;

  const now = new Date();
  const dueDate = new Date(record.dueDate);
  const daysLeft = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const urgency: ReminderResult["urgency"] =
    daysLeft < 0 ? "overdue" : daysLeft === 0 ? "due_today" : "due_soon";

  const payload = {
    userName: user.fullname,
    userEmail: user.email,
    userPhone: user.phone || "",
    bookTitle: book.title,
    dueDate: dueDate.toISOString(),
    daysLeft,
    urgency,
  };

  const [emailSent, smsSent] = await Promise.all([
    sendDueReminderEmail(payload),
    sendDueReminderSms(payload),
  ]);

  logger.info(
    { borrowId, user: user.fullname, book: book.title, emailSent, smsSent },
    "Auto-reminder dispatched",
  );

  return { borrowId, ...payload, emailSent, smsSent };
}

// ---------------------------------------------------------------------------
// Overdue checker — marks borrowed records as overdue and auto-sends reminders
// ---------------------------------------------------------------------------

async function checkAndMarkOverdue(): Promise<void> {
  const now = new Date();
  const records = await db.select().from(borrowRecordsTable);
  const active = records.filter((r) => r.status === "borrowed");

  let markedCount = 0;
  for (const record of active) {
    const dueDate = new Date(record.dueDate);
    if (now > dueDate) {
      await db.update(borrowRecordsTable)
        .set({ status: "overdue" })
        .where(eq(borrowRecordsTable.id, record.id));
      markedCount++;

      try {
        await sendSingleReminder(record.id);
      } catch (err) {
        logger.error({ err, borrowId: record.id }, "Failed to auto-send overdue reminder");
      }
    }
  }

  if (markedCount > 0) {
    logger.info({ markedCount }, "Auto-marked borrow records as overdue and sent reminders");
  }
}

// ---------------------------------------------------------------------------
// Schedulers
// ---------------------------------------------------------------------------

let reminderTask: ScheduledTask | null = null;
let overdueTask: ScheduledTask | null = null;

/**
 * Starts the automatic reminder schedulers:
 *  1. Due-date reminders  - every hour  (email+SMS for books due soon / overdue)
 *  2. Overdue checker     - every 30 min (marks overdue, auto-sends reminders)
 *
 * Override with env vars:
 *   REMINDER_CRON  (default "0 * * * *"  - every hour)
 *   OVERDUE_CRON   (default "*\/30 * * * *" - every 30 min)
 */
export function startReminderScheduler(): void {
  // 1. Hourly due-date reminder dispatch
  const reminderCron = process.env.REMINDER_CRON || "0 * * * *";

  if (!cron.validate(reminderCron)) {
    logger.error({ cronExpr: reminderCron }, "Invalid REMINDER_CRON — scheduler not started.");
    return;
  }

  reminderTask = cron.schedule(reminderCron, async () => {
    logger.info("Running scheduled due-date reminder job...");
    try {
      const results = await dispatchDueReminders();
      const sent = results.filter((r) => r.emailSent || r.smsSent).length;
      logger.info({ total: results.length, sent }, "Scheduled reminder job finished");
    } catch (err) {
      logger.error({ err }, "Scheduled reminder job failed");
    }
  });

  logger.info({ cronExpr: reminderCron }, "Due-date reminder scheduler started (auto email+SMS every hour)");

  // 2. Overdue checker — every 30 minutes
  const overdueCron = process.env.OVERDUE_CRON || "*/30 * * * *";

  if (cron.validate(overdueCron)) {
    overdueTask = cron.schedule(overdueCron, async () => {
      logger.info("Running overdue checker...");
      try {
        await checkAndMarkOverdue();
      } catch (err) {
        logger.error({ err }, "Overdue checker failed");
      }
    });
    logger.info({ cronExpr: overdueCron }, "Overdue checker scheduler started (every 30 min)");
  }

  // Run an initial overdue check 10 seconds after startup
  setTimeout(async () => {
    logger.info("Running initial overdue check on startup...");
    try { await checkAndMarkOverdue(); } catch (err) { logger.error({ err }, "Initial overdue check failed"); }
  }, 10_000);
}

export function stopReminderScheduler(): void {
  reminderTask?.stop();
  reminderTask = null;
  overdueTask?.stop();
  overdueTask = null;
}
