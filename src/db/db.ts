/* Database setup for Baby Bootcamp. */

import 'dotenv/config';
import { drizzle } from 'drizzle-orm/connect';
import { getDatabaseUri } from '../../config.js';

const databaseUri = getDatabaseUri();

const db = await drizzle("node-postgres", databaseUri!);

export { db };