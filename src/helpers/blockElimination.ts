import { FeedingBlock } from '../db/models/feedingBlocks.js';
import {feedingBlocks } from '../db/schema/feedingBlocks.js';
import { feedingEntries } from '../db/schema/feedingEntries.js';

interface EliminationRules {
  startDate: Date;
  baselineVolume: number;
  currentGroup: number;
  decrement: number;
}

type FeedingBlockType = typeof feedingBlocks.$inferSelect;
type FeedingEntryType = typeof feedingEntries.$inferSelect;

/** Handles logic and ruleset for a block elimination. */
class BlockElimination {
  // TODO: Check benefits of global constants vs. private static
  static DECREMENT = 0.5;
  static GROUP_DAYS = 3;

  /*TODO: Add documentation*/
  static getDaysBetween(start: Date, end: Date): number {
    const startDate = new Date(start);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(end);
    endDate.setHours(0, 0, 0, 0);

    return Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  /* TODO: Write code for function */
  static async calculateVolumeForTimeChange(entry: FeedingEntryType, block: FeedingBlockType, newTime: Date): Promise<number> {
    if (!block.eliminationStartDate || !block.baselineVolume) {
      return entry.volumeInOunces ?? 0;
    }

    const daysSinceStart = this.getDaysBetween(block.eliminationStartDate, newTime);
    if (daysSinceStart < 0) return entry.volumeInOunces ?? 0;

    const groupNumber = Math.floor(daysSinceStart / this.GROUP_DAYS);
    const expectedVolume = Math.max(
      0,
      block.baselineVolume - (groupNumber * this.DECREMENT)
    );

    // If it's the first group (includes start date), use baseline volume
    if (groupNumber === 0) {
      return block.baselineVolume;
    }

    // For subsequent groups, only use entry's volume if it's lower than expected
    const volume = entry.volumeInOunces ?? 0;
    if (volume < expectedVolume) {
      await FeedingBlock.updateBaseline(block.id, volume, groupNumber);
      return volume;
    }

    return expectedVolume;
  }
}

export default BlockElimination;