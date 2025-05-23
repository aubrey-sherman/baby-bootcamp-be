/* Configuration for application: reads the env variables and exports db URI. */
import dotenv from 'dotenv';
import "colors";

dotenv.config();

const SECRET_KEY = process.env.SECRET_KEY || "secret-agent-dev";
const PORT = process.env.PORT || 3001;

// Use dev database, testing database, or via env var, production database
function getDatabaseUri() {
  return (process.env.NODE_ENV === "test")
    ? "postgresql:///baby_bootcamp_test"
    : process.env.DATABASE_URL || "postgresql:///baby_bootcamp";
}
// Speed up bcrypt during tests, since the algorithm safety isn't being tested
const BCRYPT_WORK_FACTOR = process.env.NODE_ENV === "test" ? 1 : 12;

export {
  SECRET_KEY,
  PORT,
  BCRYPT_WORK_FACTOR,
  getDatabaseUri
}