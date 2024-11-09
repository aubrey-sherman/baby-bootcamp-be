
import { eq, and } from 'drizzle-orm';
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

  // get
  /** Gets all feeding blocks for a user. */
  // Get all feeding blocks for a user
  static async getAllByUsername(username: string): Promise<FeedingBlock[]> {
    try {
      const blocks = await db
        .select()
        .from(feedingBlocks)
        .where(eq(feedingBlocks.username, username))
        .orderBy(feedingBlocks.number);

      return blocks;
    } catch (error) {
      throw new Error('Failed to fetch feeding blocks');
    }
  }

  // create
  static async create(data: NewFeedingBlockType): Promise<FeedingBlock> {
    try {
      const [newBlock] = await db
        .insert(feedingBlocks)
        .values(data)
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


  /** Deletes a feeding block. */
  static async delete(id: string, username: string): Promise<boolean> {
    try {
      const [deletedBlock] = await db
        .delete(feedingBlocks)
        .where(
          and(
            eq(feedingBlocks.id, id),
            eq(feedingBlocks.username, username)
          )
        )
        .returning();

      if (!deletedBlock) {
        throw new NotFoundError('Feeding block not found');
      }

      return true;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new BadRequestError('Failed to delete feeding block');
    }
  }
}