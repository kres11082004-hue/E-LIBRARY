import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { booksTable } from "./books";

export const borrowRecordsTable = pgTable("borrow_records", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  bookId: integer("book_id").notNull().references(() => booksTable.id, { onDelete: "cascade" }),
  borrowedAt: timestamp("borrowed_at").notNull().defaultNow(),
  returnedAt: timestamp("returned_at"),
  dueDate: timestamp("due_date").notNull(),
  status: text("status").notNull().default("borrowed"), // borrowed, returned, overdue
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type BorrowRecord = typeof borrowRecordsTable.$inferSelect;
