/** Routes for a user's feeding data. */

import jsonschema from "jsonschema";
import { Router } from "express";
import { BadRequestError } from "../expressError.js";
import { ensureLoggedIn, ensureMatchingUserorAdmin } from "../middleware/auth.js";
import { FeedTimeEntry } from '../models/index.js';

import compFilterSchema from "../schemas/compFilter.json" with { type: "json" };
import compNewSchema from "../schemas/compNew.json" with { type: "json" };
import compUpdateSchema from "../schemas/compUpdate.json" with { type: "json" };

const router = Router.Router();

// FIXME: Remove try/catch format in routes and pattern match to Exp J example

/** GET  / =>
 *    { entries: [ { userId, eventTime, measurement, block, timezone }, ...]}
 *
 * Authorization required: user is logged in
*/
router.get('/', ensureLoggedIn, ensureMatchingUserorAdmin, async (req, res) => {
  try {
  const user = req.user;
  if (!user) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const q = req.query;
  const entries = await FeedTimeEntry.findAll({
    where: { userId: user.id },
    attributes: ['userId', 'eventTime', 'measurement', 'block', 'timezone'],
    order: [['block', 'ASC']]
  });

  return res.json({ entries });
} catch (error) {
  console.log('Error fetching FeedTime Entries', error);
  return res.status(500).json({ error: 'Internal server error' });
  }
});

/** POST / { feedTimeEntry } => { newFeedTimeEntry }
 *
 * feedTimeEntry should be { eventTime, measurement, block, timezone }
 * If `measurement` is undefined, it is saved as null in the database.
 *
 * Returns { userId, eventTime, measurement, block, timezone }
 *
 * Authorization required: authenticated user
*/
router.post('/', ensureLoggedIn, ensureMatchingUserorAdmin, async (req, res) => {

  // TODO: add form validation checks with JSON schema

  try {
    const user = req.user;
    const { eventTime, measurement, block, timezone } = req.body;

    if (!eventTime || !block || !timezone) {
      return res.status(400).json(
        { error: 'eventTime, block, and timezone are required' }
      );
    }

    const newFeedTimeEntry = await FeedTimeEntry.create({
      userId: user.id,
      eventTime,
      measurement: measurement !== undefined ? measurement : null,
      block,
      timezone,
    });

    return res.status(201).json(newFeedTimeEntry);
  } catch (error) {
    console.error('Error creating FeedTimeEntry:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


/** PATCH
 *
 * Authentication required: authenticated user
*/
router.patch('/:entryId', ensureLoggedIn, ensureMatchingUserorAdmin, async (req, res) => {

  // TODO: add form validation checks with JSON schema

  try {
    const user = req.user;
    const { id } = req.params;

    const feedTimeEntry = await FeedTimeEntry.findOne({ where: { id, userId: user.id } });

    if (!feedTimeEntry) {
      return res.status(404).json({ error: 'Entry not found or does not belong to this user.' });
    }

    const { eventTime, measurement, block, timezone } = req.body;
    if (eventTime !== undefined) feedTimeEntry.eventTime = eventTime;
    if (measurement !== undefined) feedTimeEntry.measurement = measurement;
    if (block !== undefined) feedTimeEntry.block = block;
    if (timezone !== undefined) feedTimeEntry.timezone = timezone;

    await feedTimeEntry.save();

    return res.status(200).json(feedTimeEntry);
  } catch (error) {
    console.error('Error updating FeedTimeEntry:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/** TODO: DELETE */

export default router;