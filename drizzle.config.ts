import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';
import { getDatabaseUri } from './src/config.ts';

export default defineConfig({
  out: './drizzle',
  schema: './dist/db/schema',
  dialect: 'postgresql',
  dbCredentials: {
    url: getDatabaseUri(),
  },
  verbose: true,
  strict: true,
});