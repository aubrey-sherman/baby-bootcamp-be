import express from 'express';
import { DateTime } from 'luxon';
import { FeedingBlock } from '../db/models/feedingBlocks';
import { FeedingEntry } from '../db/models/feedingEntries';
import { ensureLoggedIn, authenticateJWT } from '../middleware/auth';
import TimezoneHandler from '../helpers/timezoneHandler';

const router = express.Router();

// Apply middlewares to all routes
router.use(authenticateJWT);
router.use(ensureLoggedIn);

/** POST /feeding-routes/blocks - Create a new feeding block with initial entries
 *
 * Authorization required: valid token
 * Required headers: X-User-Timezone
 *
 * Body: {
 *   isEliminating?: boolean
 * }
 *
 * Returns: {
 *   block: { id, number, isEliminating, username },
 *   entries: Array<{ id, feedingTime, volumeInOunces, completed, blockId }>
 * }
 */
router.post('/blocks', async (req, res, next) => {
  try {
    const result = await FeedingBlock.createWithEntries({
      number: req.body.number,
      isEliminating: req.body.isEliminating || false,
      username: res.locals.user.username,
      timezone: req.headers['x-user-timezone'] as string || 'UTC'
    });

    return res.status(201).json(result);
  } catch (err) {
    return next(err);
  }
});

/** POST /feeding-routes/blocks/:blockId/entries
 *
 * Explicitly creates a new batch of entries starting from a specified date.
 * Used when manually extending entries into the future beyond the current range.
 *
 * @param blockId - UUID of the feeding block
 * @body fromDate - ISO date string to start creating entries from
 * @header X-User-Timezone - User's timezone
 *
 * Returns: { entries: FeedingEntry[] }
 */
router.post('/blocks/:blockId/entries', async (req, res, next) => {
  try {
    const { blockId } = req.params;
    const { fromDate } = req.body;
    const timezone = req.headers['x-user-timezone'] as string || 'UTC';

    if (!fromDate) {
      return res.status(400).json({ error: 'fromDate is required' });
    }

    const block = await FeedingBlock.getOne(blockId, res.locals.user.username);
    if (!block) {
      return res.status(404).json({ error: 'Block not found' });
    }

    const entries = await FeedingEntry.extendEntriesForward(
      blockId,
      new Date(fromDate),
      timezone
    );

    return res.status(201).json({ entries });
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /feeding-routes/blocks/:blockId/entries
 *
 * Gets entries for a specific week. If entries don't exist for the requested week,
 * they are automatically created. This provides seamless calendar navigation without
 * requiring explicit entry creation.
 *
 * @param blockId - UUID of the feeding block
 * @query startDate - ISO date string for start of week
 * @header X-User-Timezone - User's timezone
 *
 * Returns: { entries: FeedingEntry[] }
 *
 * Usage examples:
 * - User views next week in calendar → GET request automatically creates if needed
 * - User views previous week → GET request returns existing entries
 */
router.get('/blocks/:blockId/entries', async (req, res, next) => {
  try {
    const { blockId } = req.params;
    const timezone = req.headers['x-user-timezone'] as string || 'UTC';

    const weekStart = new Date(req.query.startDate as string);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const block = await FeedingBlock.getOne(blockId, res.locals.user.username);
    if (!block) {
      return res.status(404).json({ error: 'Block not found' });
    }

    const entries = await FeedingEntry.getOrCreateEntriesForWeek(
      blockId,
      weekStart,
      weekEnd,
      timezone
    );

    return res.json({ entries });
  } catch (err) {
    return next(err);
  }
});

/** GET /blocks/:username - Get all feeding blocks for current user
 *
 * Authorization required: valid token
 *
 * Returns: { blocks: [{ id, number, isEliminating, username }, ...] }
*/
router.get('/blocks', async (req, res, next) => {
  try {
    const blocks = await FeedingBlock.getAllByUsername(res.locals.user.username);
    return res.json({ blocks });
  } catch (err) {
    return next(err);
  }
});

/**
 * Gets all blocks for a user with their entries for the specified date range.
 * Route: GET /feeding-routes/blocks/entries
 *
 * Query params:
 *  - startDate (optional): ISO date string, defaults to start of current week
 *  - endDate (optional): ISO date string, defaults to end of current week
 *
 * Required headers: X-User-Timezone
 *
 * Returns: Array of blocks with their associated entries
 */
router.get('/blocks/entries', async (req, res, next) => {
  try {
    const timezone = req.headers['x-user-timezone'] as string || 'UTC';
    const tzHandler = new TimezoneHandler();

    // Get date range from query params or default to current week
    const startDate = req.query.startDate
      ? new Date(req.query.startDate as string)
      : DateTime.now().setZone(timezone).startOf('week').toJSDate();

    const endDate = req.query.endDate
      ? new Date(req.query.endDate as string)
      : DateTime.now().setZone(timezone).endOf('week').toJSDate();

    const blocksWithEntries = await FeedingBlock.getBlocksWithEntries(
      res.locals.user.username,
      startDate,
      endDate
    );

    return res.json({ blocks: blocksWithEntries });
  } catch (err) {
    return next(err);
  }
});

/**
 * Gets entries for a specific block in the given date range.
 * Route: GET /feeding-routes/blocks/:blockId/entries
 *
 * Query params:
 *  - startDate (optional): ISO date string, defaults to start of current week
 *  - endDate (optional): ISO date string, defaults to end of current week
 *
 * Required headers: X-User-Timezone
 */
router.get('/blocks/:blockId/entries', async (req, res, next) => {
  try {
    const { blockId } = req.params;
    const timezone = req.headers['x-user-timezone'] as string || 'UTC';
    const tzHandler = new TimezoneHandler();

    // Get date range from query params or default to current week
    const startDate = req.query.startDate
      ? new Date(req.query.startDate as string)
      : DateTime.now().setZone(timezone).startOf('week').toJSDate();

    const endDate = req.query.endDate
      ? new Date(req.query.endDate as string)
      : DateTime.now().setZone(timezone).endOf('week').toJSDate();

    // Verify block exists and belongs to user
    const block = await FeedingBlock.getOne(blockId, res.locals.user.username);
    if (!block) {
      return res.status(404).json({ error: 'Block not found' });
    }

    // Get all entries for the week and filter for this block
    const allEntries = await FeedingEntry.getEntriesForWeek(
      res.locals.user.username,
      startDate,
      endDate
    );

    // Filter entries for this specific block
    const blockEntries = allEntries.filter(entry => entry.blockId === blockId);

    return res.json({
      block,
      entries: blockEntries
    });
  } catch (err) {
    return next(err);
  }
});


/** PATCH /feeding-blocks/:id - Update feeding block
 *
 * Authorization required: valid token
 *
 * Required fields: { isEliminating }
 *
 * Returns: { block: { id, number, isEliminating, username } }
*/
// router.patch('/blocks/:id', async (req, res, next) => {
//   try {
//     const block = await FeedingBlock.updateIsEliminating(
//       req.params.id,
//       res.locals.user.username,
//       req.body.isEliminating
//     );
//     return res.json({ block });
//   } catch (err) {
//     return next(err);
//   }
// });

/** DELETE /feeding-blocks/:id - Delete feeding block
 *
 * Authorization required: valid token
 *
 * Returns: { deleted: id }
*/
router.delete('/blocks/:id', async (req, res, next) => {
  try {
    const username = res.locals.user.username
    const deletedId = await FeedingBlock.delete(
      req.params.id,
      username
    );

    return res.json({ deleted: deletedId });
  } catch (err) {
    return next(err);
  }
});

// TODO: Implement static class method for updating
/** PATCH /feeding-blocks/:blockId/entries/:id - Update entry
 *
 * Authorization required: valid token
 *
 * Optional fields: { feedingTime, volumeInOunces }
 *
 * Returns: { entry: { id, feedingTime, volumeInOunces, blockId } }
*/
router.patch('/blocks/:blockId/entries/:id', async (req, res, next) => {
  try {
    // First verify the block belongs to the user
    await FeedingBlock.getOne(req.params.blockId, res.locals.user.username);

    const updateData: {
      feedingTime?: Date;
      volumeInOunces?: number | null;
    } = {};

    if (req.body.feedingTime) {
      updateData.feedingTime = new Date(req.body.feedingTime);
    }
    if (req.body.volumeInOunces !== undefined) {
      updateData.volumeInOunces = req.body.volumeInOunces;
    }

    const entry = await FeedingEntry.update(
      req.params.id,
      req.params.blockId,
      updateData
    );
    return res.json({ entry });
  } catch (err) {
    return next(err);
  }
});

// TODO:
/** DELETE /feeding-blocks/:blockId/entries/:id - Delete entry
 *
 * Authorization required: valid token
 *
 * Returns: { deleted: id }
*/
// router.delete('/blocks/:blockId/entries/:id', async (req, res, next) => {
//   try {
//     // First verify the block belongs to the user
//     await FeedingBlock.getById(req.params.blockId, res.locals.user.username);

//     await FeedingEntry.delete(req.params.id, req.params.blockId);
//     return res.json({ deleted: req.params.id });
//   } catch (err) {
//     return next(err);
//   }
// });

export default router;