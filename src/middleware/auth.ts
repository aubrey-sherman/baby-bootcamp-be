import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from "../expressError.js";
import { SECRET_KEY } from "../config.js";

/** Middleware: Authenticate user.
 *
 * If a token was provided, verify it, and, if valid, store the token payload
 * on res.locals (this will include the username).
 *
 * It's not an error if no token was provided or if the token is not valid.
 */
function authenticateJWT(
  req: Request,
  res: Response,
  next: NextFunction) {
  const authHeader = req.headers?.authorization;
  if (authHeader) {
    const token = authHeader.replace(/^[Bb]earer /, "").trim();

    try {
      res.locals.user = jwt.verify(token, SECRET_KEY);
    } catch (err) {
      /* ignore invalid tokens (but don't store user!) */
    }
  }
  return next();
}

/** Middleware to use when a user must be logged in.
 *
 * If no user is logged in, raises Unauthorized error.
 */
function ensureLoggedIn(
  req: Request,
  res: Response,
  next: NextFunction) {
  if (res.locals.user?.username) return next();
  throw new UnauthorizedError();
}

/** Middleware to use when user must provide a valid token and match the username
 * of the requested route.
*
 * If username is not matching, raises Unauthorized.
 *
 * Throws error to developers if there is no username in request params.
 */
function ensureMatchingUser(
  req: Request,
  res: Response,
  next: NextFunction) {

  const currentUser = res.locals.user;

  if (currentUser && (currentUser.username === req.params.username)) {
    return next();
  }

  throw new UnauthorizedError();
}

export {
  authenticateJWT,
  ensureLoggedIn,
  ensureMatchingUser
};