/* Database setup for Baby Bootcamp. */

import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;
import { getDatabaseUri } from '../config.js';

const databaseUri = getDatabaseUri();

const pool = new Pool({
  connectionString: databaseUri,
});

const db = drizzle(pool);

export { db };