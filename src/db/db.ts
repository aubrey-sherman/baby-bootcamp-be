/* Database setup for Baby Bootcamp. */

import 'dotenv/config';
import { getDatabaseUri } from '../../config.ts';
import { drizzle } from 'drizzle-orm/connect';

const databaseUri = getDatabaseUri();

const db = await drizzle("node-postgres", databaseUri!);

export { db };