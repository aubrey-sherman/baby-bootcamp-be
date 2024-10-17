/** Routes for users. */

import jsonschema from "jsonschema";
import { Router } from "express";

import {
  ensureLoggedIn,
  ensureMatchingUserorAdmin
} from "../middleware/auth.ts";

import { BadRequestError } from "../expressError.ts";
// import { User } from "../models/index.ts";
import { createToken } from "../helpers/tokens.ts";

// import userNewSchema from "../schemas/userNew.json" with { type: "json" };
// import userUpdateSchema from "../schemas/userUpdate.json" with { type: "json" };

const router = Router();

/** POST / { user }  => { user, token }
 *
 * Adds a new user. This is not the registration endpoint --- instead, this is
 * only for admin users to add new users. The new user being added can be an
 * admin.
 *
 * This returns the newly created user and an authentication token for them:
 *  {user: { username, firstName, lastName, email, isAdmin }, token }
 *
 * Authorization required: user must be logged in AND an admin
 **/

router.post("/", ensureLoggedIn, ensureMatchingUserorAdmin, async function (req, res) {
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


/** GET / => { users: [ {username, firstName, lastName, email }, ... ] }
 *
 * Returns list of all users.
 *
 * Authorization required: login AND admin
 **/

router.get("/", ensureLoggedIn, ensureMatchingUserorAdmin, async function (req, res) {
  const users = await User.findAll();
  return res.json({ users });
});


/** GET /[username] => { user }
 *
 * Returns { username, firstName, lastName, email, isAdmin }
 *
 * Authorization required: login AND admin or matching user
 **/

router
  .get("/:username", ensureLoggedIn, ensureMatchingUserorAdmin, async function (req, res) {
    const user = await User.get(req.params.username);
    return res.json({ user });
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

router
  .patch(
    "/:username",
    ensureMatchingUserorAdmin,
    async function (req, res) {
      const validator = jsonschema.validate(
        req.body,
        userUpdateSchema,
        { required: true },
      );
      if (!validator.valid) {
        const errs = validator.errors.map(e => e.stack);
        throw new BadRequestError(errs);
      }

      const user = await User.update(req.params.username, req.body);
      return res.json({ user });
    });


/** DELETE /[username]  =>  { deleted: username }
 *
 * Authorization required: login AND admin or matching user
 **/

router
  .delete(
    "/:username",
    ensureMatchingUserorAdmin,
    async function (req, res) {
      await User.remove(req.params.username);
      return res.json({ deleted: req.params.username });
    });


export default router;