import { eq, and } from 'drizzle-orm';
import { db } from '../db';
import { feedingEntries } from '../schema/feedingEntries';
import { BadRequestError, NotFoundError } from '../../expressError';

// Types
export type FeedingEntryType = typeof feedingEntries.$inferSelect;
export type NewFeedingEntryType = typeof feedingEntries.$inferInsert;

interface DatabaseError extends Error {
  code?: string;
}

export class FeedingEntry {
  // Create a new feeding entry
  static async create(data: NewFeedingEntryType): Promise<FeedingEntryType> {
    try {
      const [newEntry] = await db
        .insert(feedingEntries)
        .values(data)
        .returning();

      return newEntry;
    } catch (error) {
      const dbError = error as DatabaseError;
      if (dbError.code === '23503') { // Foreign key violation
        throw new NotFoundError('Feeding block not found');
      }
      if (dbError.code === '23514') { // Check constraint violation
        throw new BadRequestError('Volume must be greater than 0');
      }
      throw new BadRequestError('Failed to create feeding entry');
    }
  }

  // Get all feeding entries for a specific block
  static async getAllByBlockId(blockId: string): Promise<FeedingEntryType[]> {
    try {
      const entries = await db
        .select()
        .from(feedingEntries)
        .where(eq(feedingEntries.blockId, blockId))
        .orderBy(feedingEntries.feedingTime);

      return entries;
    } catch (error) {
      throw new BadRequestError('Failed to fetch feeding entries');
    }
  }

  // Get a specific feeding entry by ID and blockId
  static async getById(id: string, blockId: string): Promise<FeedingEntryType> {
    try {
      const [entry] = await db
        .select()
        .from(feedingEntries)
        .where(
          and(
            eq(feedingEntries.id, id),
            eq(feedingEntries.blockId, blockId)
          )
        );

      if (!entry) {
        throw new NotFoundError('Feeding entry not found');
      }

      return entry;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new BadRequestError('Failed to fetch feeding entry');
    }
  }

  // Update a feeding entry
  static async update(
    id: string,
    blockId: string,
    data: {
      feedingTime?: Date;
      volumeInOunces?: number;
    }
  ): Promise<FeedingEntryType> {
    try {
      const [updatedEntry] = await db
        .update(feedingEntries)
        .set(data)
        .where(
          and(
            eq(feedingEntries.id, id),
            eq(feedingEntries.blockId, blockId)
          )
        )
        .returning();

      if (!updatedEntry) {
        throw new NotFoundError('Feeding entry not found');
      }

      return updatedEntry;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      if ((error as DatabaseError).code === '23514') { // Check constraint violation
        throw new BadRequestError('Volume must be greater than 0');
      }
      throw new BadRequestError('Failed to update feeding entry');
    }
  }

  // Delete a feeding entry
  static async delete(id: string, blockId: string): Promise<boolean> {
    try {
      const [deletedEntry] = await db
        .delete(feedingEntries)
        .where(
          and(
            eq(feedingEntries.id, id),
            eq(feedingEntries.blockId, blockId)
          )
        )
        .returning();

      if (!deletedEntry) {
        throw new NotFoundError('Feeding entry not found');
      }

      return true;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new BadRequestError('Failed to delete feeding entry');
    }
  }
}