/**
 * sms.ts — Twilio SMS notification helpers
 *
 * Requires env vars (see .env.example):
 *   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER
 *
 * If any required var is missing the helpers silently return false,
 * so a missing config never breaks a transaction.
 */
import { logger } from "./logger.js";

async function getClient() {
  const sid  = process.env.TWILIO_ACCOUNT_SID;
  const auth = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !auth) return null;
  // Dynamic import avoids crash when twilio package is missing at startup
  try {
    const twilio = (await import("twilio")).default;
    return twilio(sid, auth);
  } catch {
    return null;
  }
}

async function send(to: string, body: string): Promise<boolean> {
  if (!to) return false;
  const from = process.env.TWILIO_FROM_NUMBER;
  if (!from) {
    logger.warn("TWILIO_FROM_NUMBER not set — SMS skipped");
    return false;
  }
  const client = await getClient();
  if (!client) {
    logger.warn("Twilio not configured — SMS skipped");
    return false;
  }
  // Normalise phone: ensure it starts with +
  const phone = to.startsWith("+") ? to : `+63${to.replace(/^0/, "")}`;
  try {
    await client.messages.create({ from, to: phone, body });
    logger.info({ to: phone }, "SMS sent");
    return true;
  } catch (err) {
    logger.error({ err, to: phone }, "SMS send failed");
    return false;
  }
}

// ── Public SMS helpers ────────────────────────────────────────────────────────

export interface BorrowSmsPayload {
  userName: string;
  userPhone: string;
  bookTitle: string;
  dueDate: string;
}

export async function sendBorrowSms(p: BorrowSmsPayload): Promise<boolean> {
  const due = new Date(p.dueDate).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
  const firstName = p.userName.split(",")[1]?.trim() || p.userName;
  return send(p.userPhone, `[ZDSPGC E-Library] Hi ${firstName}! You borrowed "${p.bookTitle}". Please return by ${due}. Thank you!`);
}

export interface ReturnSmsPayload {
  userName: string;
  userPhone: string;
  bookTitle: string;
}

export async function sendReturnSms(p: ReturnSmsPayload): Promise<boolean> {
  const firstName = p.userName.split(",")[1]?.trim() || p.userName;
  return send(p.userPhone, `[ZDSPGC E-Library] Hi ${firstName}! We've received your returned copy of "${p.bookTitle}". Thank you!`);
}

export interface ReservationSmsPayload {
  userName: string;
  userPhone: string;
  bookTitle: string;
  status: string;
}

export async function sendReservationSms(p: ReservationSmsPayload): Promise<boolean> {
  const firstName = p.userName.split(",")[1]?.trim() || p.userName;
  const messages: Record<string, string> = {
    pending:   `[ZDSPGC E-Library] Hi ${firstName}! Your reservation for "${p.bookTitle}" has been received and is pending.`,
    ready:     `[ZDSPGC E-Library] Hi ${firstName}! Good news — "${p.bookTitle}" is READY for pickup at the library. Please collect within 2 days.`,
    fulfilled: `[ZDSPGC E-Library] Hi ${firstName}! Your reservation for "${p.bookTitle}" has been fulfilled. Enjoy!`,
    cancelled: `[ZDSPGC E-Library] Hi ${firstName}! Your reservation for "${p.bookTitle}" has been cancelled.`,
    returned:  `[ZDSPGC E-Library] Hi ${firstName}! Thank you for returning "${p.bookTitle}".`,
  };
  const msg = messages[p.status] ?? `[ZDSPGC E-Library] Hi ${firstName}! Your reservation for "${p.bookTitle}" status is now: ${p.status}.`;
  return send(p.userPhone, msg);
}

export interface DueReminderSmsPayload {
  userName: string;
  userPhone: string;
  bookTitle: string;
  dueDate: string;
  daysLeft: number;
  urgency: "overdue" | "due_today" | "due_soon";
}

export async function sendDueReminderSms(p: DueReminderSmsPayload): Promise<boolean> {
  const firstName = p.userName.split(",")[1]?.trim() || p.userName;
  const due = new Date(p.dueDate).toLocaleDateString("en-PH", { month: "short", day: "numeric" });
  let msg: string;
  if (p.urgency === "overdue") {
    msg = `[ZDSPGC E-Library] ⚠️ Hi ${firstName}! "${p.bookTitle}" is OVERDUE by ${Math.abs(p.daysLeft)} day(s). Please return immediately!`;
  } else if (p.urgency === "due_today") {
    msg = `[ZDSPGC E-Library] ⏰ Hi ${firstName}! "${p.bookTitle}" is due TODAY. Please return it to the library.`;
  } else {
    msg = `[ZDSPGC E-Library] 📅 Hi ${firstName}! Reminder: "${p.bookTitle}" is due on ${due} (${p.daysLeft} day(s) left).`;
  }
  return send(p.userPhone, msg);
}
