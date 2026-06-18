import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const authorizedUsersTable = pgTable("authorized_users", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  schoolId: text("school_id").notNull().unique(),
  role: text("role").notNull(), // "student" or "instructor"
  course: text("course"), // optional since instructors might not have one, or students might be undeclared
  linkedUserId: integer("linked_user_id").references(() => usersTable.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type AuthorizedUser = typeof authorizedUsersTable.$inferSelect;
