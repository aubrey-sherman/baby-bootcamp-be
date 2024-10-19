import { sql } from "drizzle-orm";
import { check, pgTable, varchar, text } from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    username: varchar( { length: 50 }).primaryKey(),
    password: text().notNull(),
    firstName: varchar('first_name', { length: 100 }).notNull(),
    lastName: varchar('last_name', { length: 100 }).notNull(),
    email: text().notNull().unique(),
    babyName: varchar('baby_name', { length: 100}).notNull()
  },
  (table) => ({
      checkConstraint: check("email", sql`position('@' IN email) > 1`),
    })
);

// TODO: Check line 13 for correct check constraint syntax