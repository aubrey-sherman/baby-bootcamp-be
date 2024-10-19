import { pgTable, boolean, serial, text, doublePrecision, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users.ts";

export const feedingEntries = pgTable("feeding_entries", {
  id: serial("id").primaryKey(),
  volumeInOunces: doublePrecision('volume_in_ounces'),
  eliminating: boolean().notNull(),
  feedingTime: timestamp("feeding_time").defaultNow(),
  username: text("username").references(() => users.username),
});