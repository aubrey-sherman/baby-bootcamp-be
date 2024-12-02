import express from 'express';
import { DateTime } from 'luxon';
import { FeedingBlock } from '../db/models/feedingBlocks.js';
import { FeedingEntry } from '../db/models/feedingEntries.js';
import { ensureLoggedIn, authenticateJWT } from '../middleware/auth.js';
import TimezoneHandler from '../helpers/timezoneHandler.js';
import { BadRequestError } from '../expressError.js';

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
      isEliminating: req.body.isEliminating || false,
      username: res.locals.user.username,
      timezone: req.headers['X-User-Timezone'] as string || 'UTC'
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

/** GET /feeding-routes/blocks/entries
 *
 * Gets blocks with entries for specified week range
 *
 * Query params:
 *  - startDate: ISO date string
 *  - endDate: ISO date string
 *
 * Returns: { blocks: Array of blocks with their entries }
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

    const blocksWithEntries = await FeedingBlock.getOrCreateBlocksWithEntries(
      res.locals.user.username,
      startDate,
      endDate,
      timezone
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
    const timezone = req.headers['X-User-Timezone'] as string || 'UTC';
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

/** PATCH /blocks/:blockId - Update block's isEliminating status
 *
 * Authorization required: valid token
 *
 * Required fields: { isEliminating }
 *
 * Returns updated block with feedingEntries filtered to the current week
*/
router.patch('/blocks/:blockId', async (req, res, next) => {
  const { blockId } = req.params;
  const username = res.locals.user.username;

  if (!req.body.isEliminating) {
    throw new BadRequestError('Value required for update');
  }

  try {
    const updatedBlock = await FeedingBlock.updateIsEliminating(
      blockId,
      username,
      req.body.isEliminating
    );

    const timezone = req.headers['x-user-timezone'];
    if (!timezone || typeof timezone !== 'string') {
     throw new BadRequestError('Timezone header required');
    }

    const weekStart = DateTime.now()
      .setZone(timezone)
      .startOf('week')
    const weekEnd = DateTime.now()
      .setZone(timezone)
      .endOf('week')

    const weekEntries = await FeedingEntry.getEntriesForWeek(
      username,
      weekStart.toJSDate(),
      weekEnd.toJSDate(),
      blockId
    );

    return res.json({
      block: {
        ...updatedBlock,
        feedingEntries: weekEntries
      }
  });

  } catch (err) {
    next(err);
  }
});


/** PATCH /blocks/:blockId/feeding-time - Update time for all entries
 * in a block.
 *
 * Authorization required: valid token
 *
 * Required fields: { feedingTime }
 *
 * Returns block with entries as
 *  { block: [{ id, feedingTime, volumeInOunces, blockId }], ... }
*/
router.patch('/blocks/:blockId/feeding-time', async (req, res, next) => {
  const timezoneHandler = new TimezoneHandler();

  try {
    await FeedingBlock.getOne(req.params.blockId, res.locals.user.username);

    if (!req.body.feedingTime) {
      throw new BadRequestError('Time is required for update');
    }

    const timezone = req.headers['x-user-timezone'];
    if (!timezone || typeof timezone !== 'string') {
     throw new BadRequestError('Timezone header required');
    }

    const newTime = timezoneHandler.toUTC(req.body.feedingTime, timezone)

    const updatedBlock = await FeedingBlock.updateAllEntryTimes(
      req.params.blockId,
      newTime
    );

    // Filter to just this week's entries before sending response
    const weekStart = DateTime.now().setZone(timezone).startOf('week');
    const weekEnd = DateTime.now().setZone(timezone).endOf('week');

    const weekEntries = await FeedingEntry.getEntriesForWeek(
      res.locals.user.username,
      weekStart.toJSDate(),
      weekEnd.toJSDate(),
      req.params.blockId
    );

    return res.json({
      block: {
        ...updatedBlock,
        feedingEntries: weekEntries
      }
    });
    } catch (err) {
      return next(err);
    }
  });

  /** POST - Set start date for elimination logic */
  router.post('/blocks/:blockId/elimination', async (req, res, next) => {
    const timezoneHandler = new TimezoneHandler();

    try {
      const { startDate, baselineVolume } = req.body;
      const timezone = req.headers['x-user-timezone'];

      if (!timezone || typeof timezone !== 'string') {
        throw new BadRequestError('Timezone header required');
      }

      const utcStartDate = timezoneHandler.toUTC(startDate, timezone);
      const weekStart = DateTime.now().setZone(timezone).startOf('week');
      const weekEnd = DateTime.now().setZone(timezone).endOf('week');

      const updatedBlock = await FeedingBlock.setEliminationStart(
        req.params.blockId,
        res.locals.user.username,
        utcStartDate,
        baselineVolume,
        weekStart.toJSDate(),
        weekEnd.toJSDate()
      );

      return res.json({ block: updatedBlock });
    } catch (err) {
      next(err);
    }
   });

   /** Endpoint to handle two types of volume updates from the frontend:
    * 1. For a non-eliminating block, updates volume and cascades to subsequent entries.
    * 2. For eliminating blocks, volume becomes the new baseline for elimination logic.
   */
   router.patch('/entries/:entryId/volume', async (req, res, next) => {
    try {
      const timezone = req.headers['x-user-timezone'];
      if (!timezone || typeof timezone !== 'string') {
        throw new BadRequestError('Timezone header required');
      }

      const weekStart = DateTime.now()
        .setZone(timezone)
        .startOf('week');
      const weekEnd = DateTime.now()
        .setZone(timezone)
        .endOf('week');

      const updatedBlock = await FeedingEntry.updateEntryVolume(
        req.params.entryId,
        res.locals.user.username,
        req.body.volumeInOunces,
        weekStart.toJSDate(),
        weekEnd.toJSDate()
      );

      return res.json({ block: updatedBlock });
    } catch (err) {
      next(err);
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