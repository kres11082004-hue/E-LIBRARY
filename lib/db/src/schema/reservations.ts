import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";
import { usersTable } from "./users.js";
import { booksTable } from "./books.js";

export const reservationsTable = pgTable("reservations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  bookId: integer("book_id").notNull().references(() => booksTable.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("pending"), // pending | ready | fulfilled | cancelled
  notes: text("notes"),
  visitDate: text("visit_date"),   // e.g. "2026-11-05" — date student plans to visit
  visitTime: text("visit_time"),   // e.g. "09:00" — time slot student plans to visit
  reservedAt: timestamp("reserved_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Reservation = typeof reservationsTable.$inferSelect;
