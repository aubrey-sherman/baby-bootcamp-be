/** Routes for users. */

import jsonschema from "jsonschema";
import express from "express";
import { ensureLoggedIn, ensureMatchingUser } from "../middleware/auth.js";
import User from '../db/models/user.js';
import { BadRequestError } from "../expressError.js";
import { createToken } from "../helpers/tokens.js";
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const userNewSchema = JSON.parse(
  readFileSync(join(__dirname, '../jsonSchema/userNew.json'), 'utf8')
);

const router = express.Router();

/** POST / { user }  => { user, token }
 *
 * Adds a new user. This is not the registration endpoint --- instead, this is
 * only for admin users to add new users.
 *
 * This returns the newly created user and an authentication token for them:
 *  {user: { username, firstName, lastName, email, isAdmin }, token }

 * Authorization required: user must be logged in AND an admin
 **/

router.post("/", ensureLoggedIn, async function (req, res) {
  const validator = jsonschema.validate(
    req.body,
    userNewSchema,
    { required: true },
  );
  if (!validator.valid) {
    const errs = validator.errors.map(e => e.stack);
    throw new BadRequestError(errs);
  }

  const user = await User.register(req.body);
  const token = createToken(user);
  return res.status(201).json({ user, token });
});


/** GET /[username] => { user }
 *
 * Returns { username, firstName, lastName, email, babyName }
 *
 * Authorization required: same user as :username in request params.
 **/
router.get("/:username", ensureMatchingUser, async function (req, res, next) {
  try {
    const { username } = req.params;
    const user = await User.get(username);

    res.json({ user })
  } catch (err) {
    next(err);
  }
});


/** PATCH /[username] { user } => { user }
 *
 * Data can include:
 *   { firstName, lastName, password, email }
 *
 * Returns { username, firstName, lastName, email, isAdmin }
 *
 * Authorization required: login AND admin or matching user
 **/


/** DELETE /[username]  =>  { deleted: username }
 *
 * Authorization required: login AND admin or matching user
 **/


export default router;