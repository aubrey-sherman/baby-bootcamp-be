import { eq, and, gte, lt, between } from 'drizzle-orm';
import { DateTime } from 'luxon';
import { db } from '../db';
import { feedingBlocks } from '../schema/feedingBlocks';
import { feedingEntries } from '../schema/feedingEntries';
import TimezoneHandler from '../../helpers/timezoneHandler';
import { BadRequestError, NotFoundError } from '../../expressError';

// Types
export type FeedingEntryType = typeof feedingEntries.$inferSelect;
export type NewFeedingEntryType = typeof feedingEntries.$inferInsert;

interface DatabaseError extends Error {
  code?: string;
}

export class FeedingEntry {

  private static tzHandler = new TimezoneHandler();

  /**
   * Gets entries for week range, creating them if they don't exist.
   * Returns existing entries if found, otherwise creates and returns new ones.
   */
  static async getOrCreateEntriesForWeek(
    blockId: string,
    weekStart: Date,
    weekEnd: Date,
    timezone: string
  ): Promise<typeof feedingEntries.$inferSelect[]> {
    // First check for existing entries
    const existingEntries = await db
      .select()
      .from(feedingEntries)
      .where(
        and(
          eq(feedingEntries.blockId, blockId),
          gte(feedingEntries.feedingTime, weekStart),
          lt(feedingEntries.feedingTime, weekEnd)
        )
      );

    // If entries exist, return them
    if (existingEntries.length > 0) {
      return existingEntries;
    }

    // If no entries exist, create them
    return await this.extendEntriesForward(
      blockId,
      weekStart,
      timezone
    );
  }

  /**
   * Creates initial feeding entries for a new block starting from today and going forward.
   * Creates entries for 3 months forward by default.
   */
  static async createInitialEntries(
    blockId: string,
    timezone: string,
    options?: {
      monthsForward?: number;
    }
  ) : Promise<typeof feedingEntries.$inferSelect[]> {

    const currentTime = new Date();

    // Calculate date range - start from today
    const startDate = DateTime.now()
      .setZone(timezone)
      .startOf('day')
      .toJSDate();

    const endDate = DateTime.now()
      .setZone(timezone)
      .plus({ months: options?.monthsForward || 3 })
      .endOf('day')
      .toJSDate();

    // Generate all dates in the range
    const dates: Date[] = [];
    let currentDate = startDate;
    while (currentDate <= endDate) {
      dates.push(new Date(currentDate));
      currentDate = DateTime.fromJSDate(currentDate)
        .plus({ days: 1 })
        .toJSDate();
    }

    // Use the static tzHandler
    const entries = dates.map(date => ({
      blockId,
      feedingTime: FeedingEntry.tzHandler.createFeedingTime(date, currentTime, timezone),
      completed: false
    }));

    try {
      const createdEntries = await db
        .insert(feedingEntries)
        .values(entries)
        .returning();

      return createdEntries;
    } catch (error) {
      console.error('Error creating initial entries:', error);
      throw new Error('Failed to create feeding entries');
    }
  }

  /**
   * Extends entries forward when user navigates to future dates without entries.
   * Creates entries for an additional month forward.
   */
  static async extendEntriesForward(
    blockId: string,
    fromDate: Date,
    timezone: string
  ): Promise<typeof feedingEntries.$inferSelect[]> {

    const currentTime = new Date();

    // Calculate new end date (1 month from the requested date)
    const endDate = DateTime.fromJSDate(fromDate)
      .setZone(timezone)
      .plus({ months: 1 })
      .endOf('day')
      .toJSDate();

    // Generate dates for the new range
    const dates: Date[] = [];
    let currentDate = fromDate;
    while (currentDate <= endDate) {
      dates.push(new Date(currentDate));
      currentDate = DateTime.fromJSDate(currentDate)
        .plus({ days: 1 })
        .toJSDate();
    }

    // Check for existing entries in this range to avoid duplicates
    const existingEntries = await db
      .select({
        feedingTime: feedingEntries.feedingTime
      })
      .from(feedingEntries)
      .where(
        and(
          eq(feedingEntries.blockId, blockId),
          between(
            feedingEntries.feedingTime,
            fromDate,
            endDate
          )
        )
      );

    const existingDates = new Set(
      existingEntries.map(entry =>
        DateTime.fromJSDate(entry.feedingTime)
          .setZone(timezone)
          .startOf('day')
          .toISO()
      )
    );

    // Filter out dates that already have entries
    const newDates = dates.filter(date =>
      !existingDates.has(
        DateTime.fromJSDate(date)
          .setZone(timezone)
          .startOf('day')
          .toISO()
      )
    );

    if (newDates.length === 0) {
      return [];
    }

    const entries = newDates.map(date => ({
      blockId,
      feedingTime: FeedingEntry.tzHandler.createFeedingTime(date, currentTime, timezone),
      completed: false
    }));

    const createdEntries = await db
      .insert(feedingEntries)
      .values(entries)
      .returning();

    return createdEntries;
  }

  /** Gets entries for a given week, optionally filtered by block. */
  static async getEntriesForWeek(
    username: string,
    weekStart: Date,
    weekEnd: Date,
    blockId?: string
  ): Promise<typeof feedingEntries.$inferSelect[]> {
    try {
      const whereConditions = [
        eq(feedingBlocks.username, username),
        gte(feedingEntries.feedingTime, weekStart),
        lt(feedingEntries.feedingTime, weekEnd)
      ];

      if (blockId) {
        whereConditions.push(eq(feedingEntries.blockId, blockId));
      }

      const entries = await db
        .select({
          id: feedingEntries.id,
          feedingTime: feedingEntries.feedingTime,
          volumeInOunces: feedingEntries.volumeInOunces,
          completed: feedingEntries.completed,
          blockId: feedingEntries.blockId
        })
        .from(feedingEntries)
        .innerJoin(
          feedingBlocks,
          eq(feedingEntries.blockId, feedingBlocks.id)
        )
        .where(and(...whereConditions))
        .orderBy(feedingEntries.feedingTime);

      return entries;
    } catch (error) {
      console.error('Error fetching week entries:', error);
      throw new Error('Failed to fetch feeding entries');
    }
  }

  // TODO: Update a feeding entry
  // Columns that can accept updates: time, volumeInOunces, completed

  // TODO: Delete a feeding entry
}