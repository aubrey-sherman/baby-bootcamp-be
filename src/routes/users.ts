/** Routes for users. */

import jsonschema from "jsonschema";
import { Router, Request, Response } from "express";
import { db } from "../db/db.ts";
import { ensureLoggedIn, ensureMatchingUser } from "../middleware/auth.ts";
import { eq } from 'drizzle-orm';
import User from '../db/models/user.ts';
import { feedingBlocks } from "../db/schema/feedingBlocks.ts";
import { UserType, UserWithBlocks } from '../types.ts';


import { BadRequestError } from "../expressError.ts";
import { createToken } from "../helpers/tokens.ts";

import userAuthSchema from '../jsonSchema/userAuth.json';
import userNewSchema from '../jsonSchema/userNew.json';
import userRegisterSchema from '../jsonSchema/userRegister.json';

const router = Router();

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
 * Returns { username, firstName, lastName, email, babyName, feedingBlocks[]}
 *
 * Authorization required: same user as :username in request params.
 **/
router
  .get("/:username", ensureMatchingUser, async function (req, res) {
    const { username } = req.params;
    const fetchedUser = await User.get(username);

    const blocksResult = await db
      .select()
      .from(feedingBlocks)
      .where(eq(feedingBlocks.username, username))
      .execute();

    const blocks = blocksResult;

    const userWithBlocks: UserWithBlocks = {
      ...fetchedUser,
      feedingBlocks: blocks,
    };

    res.json(fetchedUser);
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