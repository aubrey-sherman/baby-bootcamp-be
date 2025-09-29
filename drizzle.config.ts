import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

function getDatabaseUri() {
  if (process.env.NODE_ENV === "test") {
    return "postgresql:///baby_bootcamp_test";
  }

  if (process.env.NODE_ENV === "production") {
    return process.env.PRODUCTION_DATABASE_URL || "postgresql:///baby_bootcamp";
  }

  return process.env.LOCAL_DATABASE_URL || "postgresql:///baby_bootcamp";
}

export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema',
  dialect: 'postgresql',
  dbCredentials: {
    url: getDatabaseUri(),
  },
  verbose: true,
  strict: true,
});