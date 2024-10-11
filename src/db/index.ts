import 'dotenv/config';
import { drizzle } from 'drizzle-orm/connect';
async function main() {
    const db = await drizzle("node-postgres", process.env.DATABASE_URL!);
}
main();

// Alternative code for a synchronous connection
// import 'dotenv/config';
// import { pgTable, serial, text, varchar } from "drizzle-orm/pg-core";
// import { drizzle } from "drizzle-orm/node-postgres";
// import { Pool } from "pg";

// async function main() {
//     const pool = new Pool({
//       connectionString: process.env.DATABASE_URL!,
//     });
//     const db = drizzle(pool);
// }

// main();