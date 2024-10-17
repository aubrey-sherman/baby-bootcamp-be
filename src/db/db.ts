/* Database setup for Baby Bootcamp. */

import 'dotenv/config';
import { getDatabaseUri } from '../../config.ts';
import { drizzle } from 'drizzle-orm/connect';

const databaseUri = getDatabaseUri();  // Your database URI from the config

async function main() {
    const db = await drizzle("node-postgres", databaseUri!);
}
main();