/** Routes for a user's feeding data. */

import jsonschema from "jsonschema";
import { Router } from "express";
import { BadRequestError } from "../expressError.ts";
import { ensureLoggedIn } from "../middleware/auth.ts";

const router = Router();

/** TODO: GET  / =>
 *    { entries: [ { userId, eventTime, measurement, block, timezone }, ...]}
 *
 * Authorization required: user is logged in
*/

/** TODO: POST / { feedTimeEntry } => { newFeedTimeEntry }
 *
 * feedTimeEntry should be { FIXME!!! }
 * If `measurement` is undefined, it is saved as null in the database.
 *
 * Returns { userId, eventTime, measurement, block, timezone }
 *
 * Authorization required: authenticated user
*/

/** TODO: PATCH */

/** TODO: DELETE */

export default router;