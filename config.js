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

if (process.env.NODE_ENV !== "test") {
  console.log(`
${"Jobly Config:".green}
${"NODE_ENV:".yellow}           ${process.env.NODE_ENV}
${"SECRET_KEY:".yellow}         ${SECRET_KEY}
${"PORT:".yellow}               ${PORT}
${"BCRYPT_WORK_FACTOR:".yellow} ${BCRYPT_WORK_FACTOR}
${"Database:".yellow}           ${getDatabaseUri()}
---`);
}

// export const getDatabaseUri = () => {
//   const dbUser = process.env.DB_USER || 'postgres';
//   const dbPassword = process.env.DB_PASSWORD ? encodeURIComponent(process.env.DB_PASSWORD) : 'postgres';
//   const dbHost = process.env.DB_HOST || 'localhost';
//   const dbPort = process.env.DB_PORT || 5432;
//   const dbName = process.env.DB_NAME || 'mydatabase';

//   return `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`;
// };

export {
  SECRET_KEY,
  PORT,
  BCRYPT_WORK_FACTOR,
  getDatabaseUri
}