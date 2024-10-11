import { integer, pgTable, varchar } from "drizzle-orm/pg-core";

// TODO: Declare schema here for users and feeding entries

export const usersTable = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  age: integer().notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
});

