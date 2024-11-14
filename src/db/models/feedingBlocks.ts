
import { eq, and, sql, gt } from 'drizzle-orm';
import { db } from '../db'
import { feedingBlocks } from '../schema/feedingBlocks';
import { BadRequestError, NotFoundError, UnauthorizedError } from '../../expressError';


// Types
type FeedingBlockType = typeof feedingBlocks.$inferSelect;
type NewFeedingBlockType = typeof feedingBlocks.$inferInsert;

interface DatabaseError extends Error {
  code?: string;
}

/** Related functions for feeding blocks. */
export class FeedingBlock {

  /** Gets all feeding blocks for a user. */
  static async getAllByUsername(username: string): Promise<FeedingBlock[]> {
    const blocks = await db
      .select()
      .from(feedingBlocks)
      .where(eq(feedingBlocks.username, username))
      .orderBy(feedingBlocks.number);

    return blocks;
  }

  /** Find a specific block by ID */
  static async get(id: string, username: string): Promise<FeedingBlock> {
    const [block] = await db
      .select()
      .from(feedingBlocks)
      .where(and(
        eq(feedingBlocks.id, id),
        eq(feedingBlocks.username, username)
      ));

    if (!block) {
      throw new NotFoundError(`No feeding block found with id: ${id}`);
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
          number: nextNumber,  // Add the number field
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
      console.error('Create block error:', error); // Add logging
      throw new BadRequestError('Failed to create feeding block');
    }
  }

  /** Updates a feeding block. */
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