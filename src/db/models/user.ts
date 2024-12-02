import bcrypt from 'bcrypt';
import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { users } from '../schema/users.js'

import { db } from "../db.js";
import {
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
} from '../../expressError.js';
import { IUser, RegisterParams } from '../../types.js';
import { BCRYPT_WORK_FACTOR } from "../../config.js";

/** Related functions for users. */

class User {

  /** Authenticate user with username and password.
   *
   * Returns { username, firstName, lastName, email, babyName, feedingBlocks[] }
   *
   * Throws UnauthorizedError if user not found or password is wrong.
   */
  static async authenticate(username: string, password: string): Promise<IUser> {

    const result = await db
      .select({
        username: users.username,
        password: users.password,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        babyName: users.babyName
  })
      .from(users)
      .where(eq(users.username, username))
      .limit(1)
      .execute();

      const user = result[0];

      if (user) {
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (isValidPassword === true) {
          return {
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            babyName: user.babyName
        };
        }
      }

      throw new UnauthorizedError('Invalid username or password');
  }

  /** Register user with data.
   *
   * Returns { username, firstName, lastName, email, isAdmin }
   *
   * Throws BadRequestError on duplicates.
   **/
  static async register(
    { username, password, firstName, lastName, email, babyName }: RegisterParams
  ): Promise<IUser> {

    const duplicateCheck = await db
      .select({ username: users.username })
      .from(users)
      .where(eq(users.username, username))
      .limit(1)
      .execute();

    if (duplicateCheck.length > 0) {
      throw new BadRequestError(`Duplicate username: ${username}`);
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);

    const newUserResult = await db
      .insert(users)
      .values(
        {
          username,
          password: hashedPassword,
          firstName,
          lastName,
          email,
          babyName
        })
        .returning({
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          babyName: users.babyName
        })
        .execute();

    const newUser = newUserResult[0];

    return newUser;
  }

  /** Given a username, return data about user.
   *
   * Returns { username, firstName, lastName, email, babyName }
   *
   * Throws NotFoundError if user not found.
   **/
  static async get(username: string): Promise<User> {
    const userResult = await db
      .select({
        username: users.username,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        babyName: users.babyName
    })
      .from(users)
      .where(eq(users.username, username));

    const user = userResult[0];

    if (!user) throw new NotFoundError(`No user: ${username}`);

    return user;
  }
}

export default User;

