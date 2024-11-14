import express from 'express';
import { FeedingBlock } from '../db/models/feedingBlocks';
import { FeedingEntry } from '../db/models/feedingEntries';
import { ensureLoggedIn, authenticateJWT } from '../middleware/auth';

const router = express.Router();

// Apply middlewares to all routes
router.use(authenticateJWT);
router.use(ensureLoggedIn);

/** Routes for feeding blocks */

/** POST /feeding-routes/blocks - Create a new feeding block
 *
 * Authorization required: valid token
 *
 * Optional fields: { isEliminating }
 *
 * Returns: { block: { id, position, isEliminating, username } }
 *
 * Note: Position is automatically assigned by the backend
 */
router.post('/blocks', async (req, res, next) => {
  try {
    const block = await FeedingBlock.create({
      number: req.body.number,
      isEliminating: req.body.isEliminating || false,
      username: res.locals.user.username
    });
    return res.status(201).json({ block });
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

/** GET /feeding-blocks/:id - Get specific feeding block
 *
 * Authorization required: valid token
 *
 * Returns: { block: { id, number, isEliminating, username } }
*/
// router.get('/blocks/:id', async (req, res, next) => {
//   try {
//     const block = await FeedingBlock.getById(req.params.id, res.locals.user.username);
//     return res.json({ block });
//   } catch (err) {
//     return next(err);
//   }
// });

/** PATCH /feeding-blocks/:id - Update feeding block
 *
 * Authorization required: valid token
 *
 * Required fields: { isEliminating }
 *
 * Returns: { block: { id, number, isEliminating, username } }
*/
router.patch('/blocks/:id', async (req, res, next) => {
  try {
    const block = await FeedingBlock.updateIsEliminating(
      req.params.id,
      res.locals.user.username,
      req.body.isEliminating
    );
    return res.json({ block });
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

/** Routes for feeding entries */

/** POST /feeding-blocks/:blockId/entries - Create a new feeding entry
 *
 * Authorization required: valid token
 *
 * Required fields: { feedingTime }
 * Optional fields: { volumeInOunces }
 *
 * Returns: { entry: { id, feedingTime, volumeInOunces, blockId } }
*/
router.post('/blocks/:blockId/entries', async (req, res, next) => {
  try {
    // First verify the block belongs to the user
    await FeedingBlock.getById(req.params.blockId, res.locals.user.username);

    const entry = await FeedingEntry.create({
      feedingTime: new Date(req.body.feedingTime),
      volumeInOunces: req.body.volumeInOunces || null,
      blockId: req.params.blockId
    });
    return res.status(201).json({ entry });
  } catch (err) {
    return next(err);
  }
});

/** GET /feeding-blocks/:blockId/entries - Get all entries for a block
 *
 * Authorization required: valid token
 *
 * Returns: { entries: [{ id, feedingTime, volumeInOunces, blockId }, ...] }
*/
router.get('/blocks/:blockId/entries', async (req, res, next) => {
  try {
    // First verify the block belongs to the user
    await FeedingBlock.getById(req.params.blockId, res.locals.user.username);

    const entries = await FeedingEntry.getAllByBlockId(req.params.blockId);
    return res.json({ entries });
  } catch (err) {
    return next(err);
  }
});

/** GET /feeding-blocks/:blockId/entries/:id - Get specific entry
 *
 * Authorization required: valid token
 *
 * Returns: { entry: { id, feedingTime, volumeInOunces, blockId } }
*/
router.get('/blocks/:blockId/entries/:id', async (req, res, next) => {
  try {
    // First verify the block belongs to the user
    await FeedingBlock.getById(req.params.blockId, res.locals.user.username);

    const entry = await FeedingEntry.getById(req.params.id, req.params.blockId);
    return res.json({ entry });
  } catch (err) {
    return next(err);
  }
});

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
    await FeedingBlock.getById(req.params.blockId, res.locals.user.username);

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

/** DELETE /feeding-blocks/:blockId/entries/:id - Delete entry
 *
 * Authorization required: valid token
 *
 * Returns: { deleted: id }
*/
router.delete('/blocks/:blockId/entries/:id', async (req, res, next) => {
  try {
    // First verify the block belongs to the user
    await FeedingBlock.getById(req.params.blockId, res.locals.user.username);

    await FeedingEntry.delete(req.params.id, req.params.blockId);
    return res.json({ deleted: req.params.id });
  } catch (err) {
    return next(err);
  }
});

export default router;