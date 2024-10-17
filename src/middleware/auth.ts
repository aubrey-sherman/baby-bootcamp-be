import jwt from "jsonwebtoken";
import { SECRET_KEY } from "../../config.js";
import { UnauthorizedError } from "../../expressError.js";

/** Middleware: Authenticate user.
 *
 * If a token was provided, verify it, and, if valid, store the token payload
 * on res.locals (this will include the username and isAdmin field.)
 *
 * It's not an error if no token was provided or if the token is not valid.
 */
function authenticateJWT(req, res, next) {
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
 * If no one is logged in, raises Unauthorized error.
 */
function ensureLoggedIn(req, res, next) {
  if (res.locals.user?.username) return next();
  throw new UnauthorizedError();
}

/** Middleware to use when they must be an admin.
 *
 *  Checks that user is both logged in and an admin.
 *
 *  If not, raises Unauthorized.
 */
function ensureIsAdmin(req, res, next) {
  if (res.locals.user?.username && res.locals.user?.isAdmin === true) {
    return next();
  }
  throw new UnauthorizedError();
}

/** Middleware to use to check for a logged-in admin or matching user.
 *
 *  Throws error to developers if there is no username in req. params.
 *
 * If username is not matching or not admin, raises Unauthorized.
 */
function ensureMatchingUserorAdmin(req, res, next) {

  const currUser = res.locals.user;
  const isAdmin = currUser?.isAdmin;

  if (currUser && (
    currUser.username === req.params.username || isAdmin === true)) {
    return next();
  }

  throw new UnauthorizedError();
}

export {
  authenticateJWT,
  ensureLoggedIn,
  ensureIsAdmin,
  ensureMatchingUserorAdmin
};