/* Database setup for Baby Bootcamp. */

import { Sequelize } from 'sequelize';
import { getDatabaseUri } from './config.js';

const databaseUri = getDatabaseUri();  // Your database URI from the config

// Create a Sequelize instance
const sequelize = new Sequelize(databaseUri, {
  dialect: 'postgres',  // Specify the SQL dialect
  logging: console.log,  // Enable logging of SQL queries for debugging; set to false to disable
  pool: {
    max: 10,  // Maximum number of connections in the pool
    min: 0,  // Minimum number of connections in the pool
    acquire: 30000,  // The maximum time, in milliseconds, that pool will try to get connection before throwing error
    idle: 10000,  // The maximum time, in milliseconds, that a connection can be idle before being released
  },
});

// Test the connection
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log(`Connected to ${databaseUri} successfully.`);
  } catch (err) {
    console.error('Unable to connect to the database:', err);
  }
}

testConnection();

export default sequelize;
