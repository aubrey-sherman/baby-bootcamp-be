import { eq } from 'drizzle-orm';
import { db } from "../db.ts";
import { BadRequestError, NotFoundError } from "../../expressError.ts";
import { feedingEntries } from "../schema/feedingEntries.ts";
import { tFeedingEntryParams } from "../../types.ts";

/** Related functions for feedingEntries. */

class FeedingEntry {

  static async create(
    { volumeInOunces, eliminating, feeding_time, username }: FeedingEntryParams) {

  }

  /**  */
  static async getAll(username: string) {

  }

  /**  */
  static async getOne(id: number) {

  }

  /**  */
  static async update(id: number) {

  }

  /** Deletes a feeding entry.
   *
   * Throws NotFoundError if entry for given id is not found.
   */
  static async delete(id: number): Promise<void> {

    const deleteResult = await db.delete(feedingEntries).where(eq(feedingEntries.id, id)).returning({deletedEntry: feedingEntries.id});
    const deletedEntry = deleteResult[0];

    if (!deletedEntry) throw new NotFoundError(`No entry: ${id}`);

    console.log('Entry deleted!')
  }
}