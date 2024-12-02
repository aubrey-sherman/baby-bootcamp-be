
import { eq, and, sql, gt, gte, lt, inArray } from 'drizzle-orm';
import { DateTime } from 'luxon';
import { db } from '../db.js'
import { feedingBlocks } from '../schema/feedingBlocks.js';
import { feedingEntries } from '../schema/feedingEntries.js';
import { FeedingEntry } from './feedingEntries.js';
import BlockElimination from '../../helpers/blockElimination.js';
import { BadRequestError, NotFoundError } from '../../expressError.js';


// Types
type FeedingBlockType = typeof feedingBlocks.$inferSelect;
type FeedingEntryType = typeof feedingEntries.$inferSelect;
type NewFeedingBlockType = typeof feedingBlocks.$inferInsert;

// FIXME: This repeats code and there should only be one sort of truth for a
// block type and an entry type. Refactor so this extends existing types.
interface BlockWithEntries {
  id: string;
  number: number;
  isEliminating: boolean;
  username: string;
  feedingEntries: Array<{
    id: string;
    feedingTime: Date;
    volumeInOunces: number | null;
    completed: boolean;
    blockId: string;
  }>;
}

interface DatabaseError extends Error {
  code?: string;
}

/** Related functions for feeding blocks. */
export class FeedingBlock {

  /** Gets a block from its id. */
  static async getBlock(blockId: string): Promise<FeedingBlockType> {
    const [block] = await db
      .select()
      .from(feedingBlocks)
      .where(eq(feedingBlocks.id, blockId));

    if (!block) {
      throw new NotFoundError(`Block not found: ${blockId}`);
    }

    return block;
  }

  /** Creates a feeding block. */
  static async create({
    username,
    isEliminating = false
  }: {
    username: string;
    isEliminating?: boolean;
  }): Promise<FeedingBlock> {
    try {
      // First get the max number for this user
      const maxResult = await db
        .select({ maxNum: sql<number>`MAX(number)` })
        .from(feedingBlocks)
        .where(eq(feedingBlocks.username, username));

      const nextNumber = (maxResult[0]?.maxNum || 0) + 1;

      // Create the new block with an automatically assigned number
      const [newBlock] = await db
        .insert(feedingBlocks)
        .values({
          username,
          number: nextNumber,
          isEliminating
        } satisfies NewFeedingBlockType)
        .returning();

      return newBlock;
    } catch (error) {
      const dbError = error as DatabaseError;
      if (dbError.code === '23503') { // Foreign key violation
        throw new NotFoundError('User not found');
      }
      if (dbError.code === '23505') { // Unique constraint violation
        throw new BadRequestError('Feeding block already exists');
      }
      throw new BadRequestError('Failed to create feeding block');
    }
  }

  /** Creates a new block with initial feeding entries. */
  static async createWithEntries(data: {
    isEliminating: boolean,
    username: string,
    timezone: string
  }): Promise<{
    block: typeof feedingBlocks.$inferSelect,
    entries: typeof feedingEntries.$inferSelect[]
  }> {
    return await db.transaction(async (tx) => {

      const [currentHighest] = await tx
      .select({
        maxNumber: sql<number>`COALESCE(MAX(${feedingBlocks.number}), 0)`
      })
      .from(feedingBlocks)
      .where(eq(feedingBlocks.username, data.username));

      const nextNumber = currentHighest.maxNumber + 1;

      const [block] = await tx
        .insert(feedingBlocks)
        .values({
          number: nextNumber,
          isEliminating: data.isEliminating,
          username: data.username,
          eliminationStartDate: null,
          baselineVolume: null,
          currentGroup: 0
        })
        .returning();

      // Get just this week's entries for the response
      const weekStart = DateTime.now()
        .setZone(data.timezone)
        .startOf('week');
      const weekEnd = DateTime.now()
        .setZone(data.timezone)
        .endOf('week');

      const allEntries = await FeedingEntry.createInitialEntries(
        block.id,
        data.timezone,
        tx
      );

      const thisWeeksEntries = allEntries.filter(entry => {
        const entryDate = DateTime.fromJSDate(entry.feedingTime)
          .setZone(data.timezone);

        return entryDate >= weekStart && entryDate <= weekEnd;
      });

      return { block, entries: thisWeeksEntries };
    });
  }

  /**
   * Gets all feeding blocks for a user.
   * These do not include associated entries.
   */
  static async getAllByUsername(username: string): Promise<FeedingBlock[]> {
    const blocks = await db
      .select()
      .from(feedingBlocks)
      .where(eq(feedingBlocks.username, username))
      .orderBy(feedingBlocks.number);

    return blocks;
  }

  /** Get a feeding block by ID and username.
   * Returns null if a block doesn't exist or belongs to a different user.
   * // FIXME: change return to BadRequest or UnAuthorized Error for above
  */
  static async getOne(id: string, username: string): Promise<FeedingBlock | null> {
    const block = await db
      .select()
      .from(feedingBlocks)
      .where(
        and (
          eq(feedingBlocks.id, id),
          eq(feedingBlocks.username, username)
        )
      )
      .limit(1);

    return block[0] || null;
  }

   /** Gets all blocks for a user with their current entries.
   * If there are no entries, the array for entries will be empty.
   */
  static async getOrCreateBlocksWithEntries(
    username: string,
    startDate: Date,
    endDate: Date,
    timezone: string
  ): Promise<BlockWithEntries[]> {
    const blocks = await db
      .select({
        id: feedingBlocks.id,
        number: feedingBlocks.number,
        isEliminating: feedingBlocks.isEliminating,
        username: feedingBlocks.username
      })
      .from(feedingBlocks)
      .where(eq(feedingBlocks.username, username))
      .orderBy(feedingBlocks.number);

    if (!blocks.length) return [];

    const blocksWithEntries = await Promise.all(
      blocks.map(async (block) => {
        const entries = await FeedingEntry.getOrCreateEntriesForWeek(
          block.id,
          startDate,
          endDate,
          timezone
        );

        return {
          ...block,
          feedingEntries: entries
        }
      })
    )

    return blocksWithEntries;
  }

  /** Gets blocks a user with entries within a specified week. */
  static async getBlocksForWeek(
    username: string,
    weekStart: Date,
    weekEnd: Date
  ): Promise<FeedingBlock[]> {
    // Get blocks that have any entries within the week range
    const blocks = await db
      .select({
        id: feedingBlocks.id,
        number: feedingBlocks.number,
        username: feedingBlocks.username,
        isEliminating: feedingBlocks.isEliminating
      })
      .from(feedingBlocks)
      .innerJoin(
        feedingEntries,
        eq(feedingBlocks.id, feedingEntries.blockId)
      )
      .where(
        and(
          eq(feedingBlocks.username, username),
          gte(feedingEntries.feedingTime, weekStart),
          lt(feedingEntries.feedingTime, weekEnd)
        )
      )
      .groupBy(feedingBlocks.id) // Group to get unique blocks
      .orderBy(feedingBlocks.number);

    return blocks;
  }

  /** Updates feeding time for all entries in a block.
   *
   * Returns a block with updated entries.
   * Throws NotFoundError if block is not found.
   */
  static async updateAllEntryTimes(
    blockId: string,
    newTime: Date
  ): Promise<FeedingBlockType & { feedingEntries: FeedingEntryType[] }> {
    return await db.transaction(async (tx) => {
      // Get block first to check elimination status
      const [block] = await tx
        .select()
        .from(feedingBlocks)
        .where(eq(feedingBlocks.id, blockId));

      if (!block) {
        throw new NotFoundError(`Block not found: ${blockId}`);
      }

      const selectedDate = DateTime.fromJSDate(newTime);
      const entries = await tx
        .select()
        .from(feedingEntries)
        .where(
          and(
            eq(feedingEntries.blockId, blockId),
            gte(
              feedingEntries.feedingTime,
              selectedDate.startOf('day').toJSDate()
            )
          )
        );

      const newHour = selectedDate.hour;
      const newMinute = selectedDate.minute;
      const newSecond = selectedDate.second;
      const newMillisecond = selectedDate.millisecond;

      // Update entries
      for (const entry of entries) {
        const entryDate = DateTime.fromJSDate(entry.feedingTime);
        const updatedDateTime = entryDate.set({
          hour: newHour,
          minute: newMinute,
          second: newSecond,
          millisecond: newMillisecond
        });

        let updatedVolume = entry.volumeInOunces;
        if (block.isEliminating) {
          updatedVolume = await BlockElimination.calculateVolumeForTimeChange(
            entry,
            block,
            updatedDateTime.toJSDate()
          );
        }

        await tx
          .update(feedingEntries)
          .set({
            feedingTime: updatedDateTime.toJSDate(),
            volumeInOunces: updatedVolume
          })
          .where(eq(feedingEntries.id, entry.id));
      }

      // Get this week's entries
      const weekStart = selectedDate.startOf('week').toJSDate();
      const weekEnd = selectedDate.endOf('week').toJSDate();

      const thisWeeksEntries = await tx
        .select()
        .from(feedingEntries)
        .where(
          and(
            eq(feedingEntries.blockId, blockId),
            gte(feedingEntries.feedingTime, weekStart),
            lt(feedingEntries.feedingTime, weekEnd)
          )
        );

      return {
        ...block,
        feedingEntries: thisWeeksEntries
      };
    });
  }

  /** Sets the start date to handle decrementing feeding amount.
   *
   * Returns updated block with entries filtered for current week.
  */
  static async setEliminationStart(
    blockId: string,
    username: string,
    startDate: Date,
    baselineVolume: number,
    weekStart: Date,
    weekEnd: Date
  ): Promise<FeedingBlock> {
    const [updatedBlock] = await db
      .update(feedingBlocks)
      .set({
        eliminationStartDate: startDate,
        baselineVolume: baselineVolume,
        currentGroup: 0
      })
      .where(
        and(
          eq(feedingBlocks.id, blockId),
          eq(feedingBlocks.username, username)
        )
      )
      .returning();

    if (!updatedBlock) throw new NotFoundError();

    const entries = await FeedingEntry.getEntriesForWeek(
      username,
      weekStart,
      weekEnd,
      blockId
    );

    return {
      ...updatedBlock,
      feedingEntries: entries
    };
  }

  /** Updates a feeding block's eliminating status. */
  static async updateIsEliminating(
    id: string,
    username: string,
    isEliminating: boolean
  ): Promise<FeedingBlock> {
    try {
      const [updatedBlock] = await db
        .update(feedingBlocks)
        .set({ isEliminating })
        .where(
          and(
            eq(feedingBlocks.id, id),
            eq(feedingBlocks.username, username)
          )
        )
        .returning();

      if (!updatedBlock) {
        throw new NotFoundError('Feeding block not found');
      }

      return updatedBlock;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new BadRequestError('Failed to update feeding block');
    }
  }

  /** Updates baseline for decrementing feeding volume when eliminating. */
  static async updateBaseline(
    blockId: string,
    newBaseline: number,
    currentGroup: number
  ): Promise<void> {
    await db
      .update(feedingBlocks)
      .set({
        baselineVolume: newBaseline,
        currentGroup: currentGroup
      })
      .where(eq(feedingBlocks.id, blockId));
  }

  /** Deletes a feeding block and decrements the numbers of all blocks that had higher numbers. */
  // TODO: rename function to deleteAndReorderBlocks for clarity
  static async delete(blockId: string, username: string): Promise<string> {

    return await db.transaction(async (tx) => {

      const blockToDelete = await tx
            .select({
              id: feedingBlocks.id,
              number: feedingBlocks.number,
              username: feedingBlocks.username
            })
            .from(feedingBlocks)
            .where(
              and(
                eq(feedingBlocks.id, blockId),
                eq(feedingBlocks.username, username)
            )
          )
          .execute();

      if (!blockToDelete) {
        throw new NotFoundError(`No feeding block found with id: ${blockId}`);
      }

      const deletedBlock = blockToDelete[0];
      const deletedBlockNumber = deletedBlock.number;

      // Step 2: Delete the block
      await tx
        .delete(feedingBlocks)
        .where(
          and(
            eq(feedingBlocks.username, username),
            eq(feedingBlocks.id, blockId)
        )
      );

      // Step 3: Decrement the number of all blocks that had a higher number
      await tx
        .update(feedingBlocks)
        .set({
          number: sql`${feedingBlocks.number} - 1`
        })
        .where(
          and(
            eq(feedingBlocks.username, username),
            gt(feedingBlocks.number, deletedBlockNumber)
        )
      );

      return deletedBlock.id;
    });
  }
}