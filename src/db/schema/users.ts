import { sql } from "drizzle-orm";
import { check, pgTable, varchar, text } from "drizzle-orm/pg-core";

export const usersTable = pgTable(
  "users",
  {
    username: varchar("username", { length: 50 }).primaryKey(),
    password: text().notNull(),
    first_name: varchar({ length: 100 }).notNull(),
    last_name: varchar({ length: 100 }).notNull(),
    email: text("email").notNull().unique(),
  },
  (table) => ({
      checkConstraint: check("email", sql`position('@' IN email) > 1`),
    })
);