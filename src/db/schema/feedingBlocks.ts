import {
  pgTable,
  uuid,
  varchar,
  integer,
  boolean,
  index,
  numeric,
  timestamp,
  doublePrecision
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users} from "./users.js"

/* Represents a feeding block associated with a user. */
export const feedingBlocks = pgTable('feeding_blocks', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  number: integer('number').notNull(),
  isEliminating: boolean('is_eliminating').notNull().default(false),
  username: varchar('username', { length: 255 })
    .references(() => users.username, {
      onDelete: "cascade",
      onUpdate: "cascade",
    })
    .notNull(),
  eliminationStartDate: timestamp('elimination_start_date', { mode: 'date' }),
  baselineVolume: doublePrecision('baseline_volume'),
  currentGroup: integer('current_group').default(0)
  },
  (table) => ({
    // Correctly reference the column object instead of a string
    indexUsername: index('idx_feeding_blocks_username').on(table.username),
  })
);