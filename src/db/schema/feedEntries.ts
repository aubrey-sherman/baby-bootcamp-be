import { pgTable, boolean, serial, text, doublePrecision, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "../schema/users.ts";

export const feedTimeEntries = pgTable("feed_entries", {
  id: serial("id").primaryKey(),
  volume_in_oz: doublePrecision(),
  eliminating: boolean().notNull(),
  feeding_time: timestamp("feeding_time").defaultNow(),
  username: text("username").references(() => usersTable.username),
});