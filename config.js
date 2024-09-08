/* Configuration for application: reads the env variables and exports db URI. */
import dotenv from 'dotenv';

dotenv.config();

export const getDatabaseUri = () => {
  const dbUser = process.env.DB_USER || 'postgres';
  const dbPassword = process.env.DB_PASSWORD ? encodeURIComponent(process.env.DB_PASSWORD) : 'postgres';
  const dbHost = process.env.DB_HOST || 'localhost';
  const dbPort = process.env.DB_PORT || 5432;
  const dbName = process.env.DB_NAME || 'mydatabase';

  return `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`;
};

export const PORT = process.env.PORT || 5000;