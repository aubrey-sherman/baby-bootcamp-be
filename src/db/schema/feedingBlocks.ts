import {
  pgTable,
  uuid,
  varchar,
  integer,
  boolean,
  index
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users} from "./users"

/* Represents a feeding block associated with a user. */
export const feedingBlocks = pgTable('feeding_blocks', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  number: integer('number').notNull(),
  isEliminating: boolean('is_eliminating').notNull().default(false),
  username: varchar('username', { length: 255 })
    .references(() => users.username, {
      onDelete: "cascade", // If a user is deleted, delete their feeding blocks
      onUpdate: "cascade", // If a user's username is updated, cascade the update
    })
    .notNull(),
  },
  (table) => ({
    // Correctly reference the column object instead of a string
    indexUsername: index('idx_feeding_blocks_username').on(table.username),
  })
);