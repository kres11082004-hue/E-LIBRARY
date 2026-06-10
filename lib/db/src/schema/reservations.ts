import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { booksTable } from "./books";

export const reservationsTable = pgTable("reservations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  bookId: integer("book_id").notNull().references(() => booksTable.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("pending"), // pending | ready | fulfilled | cancelled
  notes: text("notes"),
  reservedAt: timestamp("reserved_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Reservation = typeof reservationsTable.$inferSelect;
