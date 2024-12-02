import { pgTable, uuid, doublePrecision, timestamp, index, boolean } from "drizzle-orm/pg-core";
import { sql } from 'drizzle-orm';
import { feedingBlocks } from "./feedingBlocks.js";

/** Represents a feeding entry associated with a block. */
export const feedingEntries = pgTable("feeding_entries", {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  feedingTime: timestamp('feeding_time', { withTimezone: true }).notNull(),
  volumeInOunces: doublePrecision('volume_in_ounces'),
  completed: boolean('completed').default(false).notNull(),
  blockId: uuid('block_id')
      .references(() => feedingBlocks.id, {
        onDelete: "cascade", // If a feeding block is deleted, delete its entries
        onUpdate: "cascade", // If a feeding block's ID is updated, cascade the update
      })
      .notNull(),
  },
  (table) => ({
    // Index on blockId for optimized queries
    indexBlockId: index('idx_feeding_entries_block_id').on(table.blockId),

    // Table-level check constraint to ensure volumeInOunces is positive
    checkVolumePositive: sql`volume_in_ounces > 0`,
  })
)