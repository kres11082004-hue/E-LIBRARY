/**
 * mailer.ts — Nodemailer email notification helpers
 *
 * Requires env vars (see .env.example):
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
 *
 * If any required var is missing the helpers silently return false,
 * so a missing config never breaks a transaction.
 */
import nodemailer from "nodemailer";
import { logger } from "./logger.js";

// ── transporter (lazy-init so missing env vars don't crash startup) ──────────

function createTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user, pass },
  });
}

const FROM = () => process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@elibrary.com";

async function send(to: string, subject: string, html: string): Promise<boolean> {
  if (!to) return false;
  const transporter = createTransporter();
  if (!transporter) {
    logger.warn("SMTP not configured — email skipped");
    return false;
  }
  try {
    await transporter.sendMail({ from: FROM(), to, subject, html });
    logger.info({ to, subject }, "Email sent");
    return true;
  } catch (err) {
    logger.error({ err, to, subject }, "Email send failed");
    return false;
  }
}

// ── shared HTML wrapper ───────────────────────────────────────────────────────

function wrap(body: string) {
  return `<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#333">
  <div style="background:linear-gradient(135deg,#1e3a5f,#2d6a4f);padding:24px;border-radius:12px 12px 0 0;text-align:center">
    <h2 style="color:#fff;margin:0;font-size:22px">📚 ZDSPGC E-Library</h2>
  </div>
  <div style="background:#f9fafb;padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
    ${body}
  </div>
  <p style="text-align:center;font-size:11px;color:#9ca3af;margin-top:16px">
    This is an automated message. Please do not reply.
  </p>
</body>
</html>`;
}

// ── Public notification helpers ───────────────────────────────────────────────

export interface BorrowEmailPayload {
  userName: string;
  userEmail: string;
  bookTitle: string;
  dueDate: string;
}

/** Sent when a book is successfully borrowed. */
export async function sendBorrowEmail(p: BorrowEmailPayload): Promise<boolean> {
  const due = new Date(p.dueDate).toLocaleDateString("en-PH", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
  return send(
    p.userEmail,
    `📖 Book Borrowed: "${p.bookTitle}"`,
    wrap(`
      <p>Hi <strong>${p.userName}</strong>,</p>
      <p>You have successfully borrowed a book from the ZDSPGC E-Library.</p>
      <div style="background:#fff;border:1px solid #d1fae5;border-radius:8px;padding:16px;margin:16px 0">
        <p style="margin:4px 0"><strong>📖 Book:</strong> ${p.bookTitle}</p>
        <p style="margin:4px 0"><strong>📅 Due Date:</strong> ${due}</p>
      </div>
      <p>Please return the book on or before the due date to avoid overdue notices.</p>
    `),
  );
}

export interface ReturnEmailPayload {
  userName: string;
  userEmail: string;
  bookTitle: string;
}

/** Sent when a book is returned. */
export async function sendReturnEmail(p: ReturnEmailPayload): Promise<boolean> {
  return send(
    p.userEmail,
    `✅ Book Returned: "${p.bookTitle}"`,
    wrap(`
      <p>Hi <strong>${p.userName}</strong>,</p>
      <p>We have received your returned book. Thank you!</p>
      <div style="background:#fff;border:1px solid #d1fae5;border-radius:8px;padding:16px;margin:16px 0">
        <p style="margin:4px 0"><strong>📖 Book:</strong> ${p.bookTitle}</p>
        <p style="margin:4px 0"><strong>📅 Returned:</strong> ${new Date().toLocaleDateString("en-PH", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
      </div>
      <p>Thank you for using the ZDSPGC E-Library!</p>
    `),
  );
}

export interface ReservationEmailPayload {
  userName: string;
  userEmail: string;
  bookTitle: string;
  status: string;
}

/** Sent when a reservation is created or its status changes. */
export async function sendReservationEmail(p: ReservationEmailPayload): Promise<boolean> {
  const statusLabels: Record<string, { emoji: string; subject: string; msg: string }> = {
    pending:   { emoji: "⏳", subject: "Reservation Received",  msg: "Your reservation is pending. We will notify you when the book is ready." },
    ready:     { emoji: "🎉", subject: "Book Ready for Pickup!", msg: "Great news! Your reserved book is now <strong>ready for pickup</strong> at the library. Please collect it within 2 days." },
    fulfilled: { emoji: "📘", subject: "Reservation Fulfilled",  msg: "Your reservation has been fulfilled. Enjoy your book!" },
    cancelled: { emoji: "❌", subject: "Reservation Cancelled",  msg: "Your reservation has been cancelled." },
    returned:  { emoji: "✅", subject: "Reserved Book Returned", msg: "Thank you for returning the reserved book!" },
  };

  const info = statusLabels[p.status] ?? { emoji: "📋", subject: `Reservation ${p.status}`, msg: `Your reservation status is now: ${p.status}.` };

  return send(
    p.userEmail,
    `${info.emoji} ${info.subject}: "${p.bookTitle}"`,
    wrap(`
      <p>Hi <strong>${p.userName}</strong>,</p>
      <p>${info.msg}</p>
      <div style="background:#fff;border:1px solid #e0e7ff;border-radius:8px;padding:16px;margin:16px 0">
        <p style="margin:4px 0"><strong>📖 Book:</strong> ${p.bookTitle}</p>
        <p style="margin:4px 0"><strong>📋 Status:</strong> ${p.status.charAt(0).toUpperCase() + p.status.slice(1)}</p>
      </div>
    `),
  );
}

export interface DueReminderEmailPayload {
  userName: string;
  userEmail: string;
  userPhone: string;
  bookTitle: string;
  dueDate: string;
  daysLeft: number;
  urgency: "overdue" | "due_today" | "due_soon";
}

/** Sent for overdue / upcoming due-date reminders. */
export async function sendDueReminderEmail(p: DueReminderEmailPayload): Promise<boolean> {
  const due = new Date(p.dueDate).toLocaleDateString("en-PH", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
  const isOverdue = p.urgency === "overdue";
  const borderColor = isOverdue ? "#fca5a5" : p.urgency === "due_today" ? "#fdba74" : "#fde68a";
  const urgencyLabel = isOverdue
    ? `⚠️ OVERDUE by ${Math.abs(p.daysLeft)} day(s)!`
    : p.urgency === "due_today"
    ? "⏰ Due TODAY!"
    : `📅 Due in ${p.daysLeft} day(s)`;

  return send(
    p.userEmail,
    isOverdue ? `⚠️ Overdue Book: "${p.bookTitle}"` : `📅 Return Reminder: "${p.bookTitle}"`,
    wrap(`
      <p>Hi <strong>${p.userName}</strong>,</p>
      <p>${isOverdue ? "Your borrowed book is <strong>overdue</strong>. Please return it immediately to avoid penalties." : "This is a friendly reminder about your borrowed book."}</p>
      <div style="background:#fff;border:2px solid ${borderColor};border-radius:8px;padding:16px;margin:16px 0">
        <p style="margin:4px 0"><strong>📖 Book:</strong> ${p.bookTitle}</p>
        <p style="margin:4px 0"><strong>📅 Due Date:</strong> ${due}</p>
        <p style="margin:4px 0"><strong>Status:</strong> ${urgencyLabel}</p>
      </div>
      <p>Please return the book to the library as soon as possible.</p>
    `),
  );
}
