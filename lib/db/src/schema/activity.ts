import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const activityLogTable = pgTable("activity_log", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // "register", "borrow", "return", "add_book", "login"
  description: text("description").notNull(),
  userName: text("user_name").notNull(),
  bookTitle: text("book_title"),
  campus: text("campus").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type ActivityLog = typeof activityLogTable.$inferSelect;
