/* Reads the env variables and exports db URI. */
import dotenv from 'dotenv';
import "colors";

dotenv.config();

const SECRET_KEY = process.env.SECRET_KEY || "secret-agent-dev";
const PORT = process.env.PORT || 3001;

function getDatabaseUri() {
  return (process.env.NODE_ENV === "test")
    ? "postgresql:///babybootcamp_test"
    : process.env.DATABASE_URL || "postgresql:///babybootcamp";
}

const BCRYPT_WORK_FACTOR = process.env.NODE_ENV === "test" ? 1 : 12;

export {
  SECRET_KEY,
  PORT,
  BCRYPT_WORK_FACTOR,
  getDatabaseUri
}