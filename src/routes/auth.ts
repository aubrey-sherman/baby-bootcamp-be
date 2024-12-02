/** Routes for authentication. */

import jsonschema from "jsonschema";
import express from "express";

import User from '../db/models/user.js';
import { createToken } from "../helpers/tokens.js";
import userAuthSchema from '../jsonSchema/userAuth.json' assert { type: 'json' };
import userRegisterSchema from '../jsonSchema/userRegister.json' assert { type: 'json' };
import { BadRequestError } from "../expressError.js";

const router = express.Router();


/** POST /auth/token:  { username, password } => { token }
 *
 * Returns JWT token which can be used to authenticate further requests.
 *
 * Authorization required: none
 */
router.post("/token", async function (req, res, next) {
  const validator = jsonschema.validate(
    req.body,
    userAuthSchema,
    { required: true },
  );
  if (!validator.valid) {
    const errs = validator.errors.map(e => e.stack);
    throw new BadRequestError(errs);
  }

  const { username, password } = req.body;
  const user = await User.authenticate(username, password);
  const token = createToken(user);
  return res.json({ token });
});


/** POST /auth/register:   { user } => { token }
 *
 * User must include { username, password, firstName, lastName, email }
 *
 * Returns JWT token which can be used to authenticate further requests.
 *
 * Authorization required: none
 */
router.post("/register", async function (req, res, next) {
  console.log("Register endpoint hit");
  console.log("Request body:", req.body);

  const validator = jsonschema.validate(
    req.body,
    userRegisterSchema,
    { required: true },
  );
  if (!validator.valid) {
    console.log("Validation failed:", validator.errors);
    const errs = validator.errors.map(e => e.stack);
    throw new BadRequestError(errs);
  }

  const newUser = await User.register({ ...req.body, isAdmin: false });
  const token = createToken(newUser);
  return res.status(201).json({ token });
});


export default router;