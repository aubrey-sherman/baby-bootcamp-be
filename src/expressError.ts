/** ExpressError extends normal JS error so we can
 *  add a status when we make an instance of it.
 *
 *  The error-handling middleware will return this.
 */

class ExpressError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    // These two lines are needed for proper inheritance
    Object.setPrototypeOf(this, ExpressError.prototype);
    (this as any).status = status;
  }
}

/** 404 NOT FOUND error. */

class NotFoundError extends ExpressError {
  constructor(message = "Not Found") {
    super(message, 404);
  }
}

/** 401 UNAUTHORIZED error. */

class UnauthorizedError extends ExpressError {
  constructor(message = "Unauthorized") {
    super(message, 401);
  }
}

/** 400 BAD REQUEST error.
 * Handles both single strings and arrays of strings.
 */

// class BadRequestError extends ExpressError {
//   constructor(message = "Bad Request") {
//     super(message, 400);
//   }
// }
class BadRequestError extends ExpressError {
  constructor(message: string | string[]) {
    const finalMessage = Array.isArray(message)
      ? message.join(", ")
      : message;

    super(finalMessage, 400);

    // Maintain proper prototype chain
    Object.setPrototypeOf(this, BadRequestError.prototype);
  }
}

/** 403 FORBIDDEN error. */

class ForbiddenError extends ExpressError {
  constructor(message = "Forbidden") {
    super(message, 403);
  }
}


export {
  ExpressError,
  NotFoundError,
  UnauthorizedError,
  BadRequestError,
  ForbiddenError,
};