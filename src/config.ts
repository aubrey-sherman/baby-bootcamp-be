/* Configuration for application: reads the env variables and exports db URI. */
import dotenv from 'dotenv';
import "colors";

dotenv.config();

const SECRET_KEY = process.env.SECRET_KEY || "secret-agent-dev";
const PORT = process.env.PORT || 3001;

// Use appropriate database based on NODE_ENV
function getDatabaseUri() {
  if (process.env.NODE_ENV === "test") {
    return "postgresql:///baby_bootcamp_test";
  }

  if (process.env.NODE_ENV === "production") {
    return process.env.PRODUCTION_DATABASE_URL || "postgresql:///baby_bootcamp";
  }

  return process.env.LOCAL_DATABASE_URL || "postgresql:///baby_bootcamp";
}

// Speed up bcrypt during tests, since the algorithm safety isn't being tested
const BCRYPT_WORK_FACTOR = process.env.NODE_ENV === "test" ? 1 : 12;

export {
  SECRET_KEY,
  PORT,
  BCRYPT_WORK_FACTOR,
  getDatabaseUri
}