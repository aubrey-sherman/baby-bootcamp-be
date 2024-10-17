import bcrypt from 'bcrypt';
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import { users } from '../schema/users.ts'

import { db } from "../db.ts";
import {
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
} from '../../expressError.ts';
import { RegisterParams } from '../../types.ts';
import { BCRYPT_WORK_FACTOR } from "../../../config";

/** Related functions for users. */

class User {

  /** Authenticate user with username and password.
   *
   * Returns { username, first_name, last_name, email }
   *
   * Throws UnauthorizedError if user not found or password is wrong.
   */
  static async authenticate(username: string, password: string): Promise<User> {

    const result = await db
      .select(
        users.username,
        users.password,
        users.first_name,
        users.last_name,
        users.email)
      .from(users)
      .where(eq(users.username, username))
      .limit(1)
      .execute();

      const user = result[0];

      if (user) {
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (isValidPassword === true) {
          delete user.password;
          return user;
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
    { username, password, firstName, lastName, email }: RegisterParams): Promise<User> {
    const duplicateCheck = await db
      .select(users.username)
      .from(users)
      .where(eq(users.username, username))
      .limit(1)
      .execute();

    if (duplicateCheck.rows.length > 0) {
      throw new BadRequestError(`Duplicate username: ${username}`);
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);

    const newUserResult = await db
      .insert(users)
      .values(
        {
          username,
          password: hashedPassword,
          first_name: firstName,
          last_name: lastName,
          email,
        })
        .returning(
          users.username,
          users.first_name,
          users.last_name,
          users.email
        )
        .execute();

    const newUser = newUserResult.rows[0];

    return newUser;
  }

  /** Given a username, return data about user.
   *
   * Returns { username, first_name, last_name, email, feedEntries }
   *   where feedEntry is { id, volume_in_oz, eliminating, feeding_time, username }
   *
   * Throws NotFoundError if user not found.
   **/
  static async getUser(username: string) {
    const userRes = await db
      .select(
        users.username,
        users.first_name,
        users.last_name,
        users.email,
      )
      .from(users)
      .where(eq(users.username, username));

    const user = userRes.rows[0];

    if (!user) throw new NotFoundError(`No user: ${username}`);

    return user;
  }
}

