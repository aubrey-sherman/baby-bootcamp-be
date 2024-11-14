/** Routes for users. */

import jsonschema from "jsonschema";
import { Router, Request, Response } from "express";
import { db } from "../db/db.ts";
import { ensureLoggedIn, ensureMatchingUser } from "../middleware/auth.ts";
import { eq } from 'drizzle-orm';
import User from '../db/models/user.ts';
import { feedingBlocks } from "../db/schema/feedingBlocks.ts";
import { IUser, UserWithBlocks, FeedingBlock } from '../types.ts';
import { BadRequestError } from "../expressError.ts";
import { createToken } from "../helpers/tokens.ts";
import userNewSchema from '../jsonSchema/userNew.json';


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
 * feedingBlocks[] will be undefined if none have been created yet.
 *
 * Authorization required: same user as :username in request params.
 **/
// router
//   .get("/:username", ensureMatchingUser, async function (req, res) {
//     try {
//       const { username } = req.params;
//       console.log('Fetching user:', username);

//       const fetchedUser = await User.get(username);
//       console.log('Fetched base user:', fetchedUser);

//       const blocksResult = await db
//         .select()
//         .from(feedingBlocks)
//         .where(eq(feedingBlocks.username, username))
//         .execute();

//         const userWithBlocks: UserWithBlocks = {
//           username: fetchedUser.username,
//           firstName: fetchedUser.firstName,
//           lastName: fetchedUser.lastName,
//           email: fetchedUser.email,
//           babyName: fetchedUser.babyName,
//           feedingBlocks: blocksResult || []
//         };

//       res.json({ user: userWithBlocks });
//     } catch (err) {
//       console.error('Error in user route:', err);
//       next(err);
//     }
//   });

router.get("/:username", ensureMatchingUser, async function (req, res) {
  try {
    const { username } = req.params;
    console.log('1. Route accessed for username:', username);
    console.log('2. Token from request:', req.headers.authorization);

    const fetchedUser = await User.get(username);
    console.log('3. Fetched user from database:', fetchedUser);

    const blocksResult = await db
      .select()
      .from(feedingBlocks)
      .where(eq(feedingBlocks.username, username))
      .execute();
    console.log('4. Fetched blocks:', blocksResult);

    const userWithBlocks = {
      username: fetchedUser.username,
      firstName: fetchedUser.firstName,
      lastName: fetchedUser.lastName,
      email: fetchedUser.email,
      babyName: fetchedUser.babyName,
      feedingBlocks: blocksResult || []
    };
    console.log('5. Assembled userWithBlocks:', userWithBlocks);

    res.json({ user: userWithBlocks });  // Make sure we're sending {user: ...}
    console.log('6. Response sent');
  } catch (err) {
    console.error('Error in user route:', err);
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