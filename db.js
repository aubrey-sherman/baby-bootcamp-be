/* Database setup for Baby Bootcamp. */

import pg from 'pg';
import { error, log } from 'console';
import { getDatabaseUri } from './config.js';

const { Pool } = pg;
const databaseUri = getDatabaseUri();

// Create a pool of connections
const db = new Pool({
  connectionString: databaseUri,
  max: 10,  // Maximum number of connections in the pool
  idleTimeoutMillis: 30000,  // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000,  // Return an error after 2 seconds if a connection cannot be established
});

// Log successful connection
db.on('connect', () => {
  log(`Connected to ${databaseUri}`);
});

// Handle errors
db.on('error', (err) => {
  error('Unexpected error on idle client', err);
  process.exit(-1);
});

export default db;