import { pgTable, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { booksTable } from "./books";

export const downloadsTable = pgTable("downloads", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  bookId: integer("book_id").notNull().references(() => booksTable.id, { onDelete: "cascade" }),
  downloadedAt: timestamp("downloaded_at").notNull().defaultNow(),
});

export type Download = typeof downloadsTable.$inferSelect;
