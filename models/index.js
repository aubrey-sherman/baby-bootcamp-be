import sequelize from '../db.js';
import User from './user.js';
import FeedTimeEntry from './feedTimeEntry.js';

// Initialize models
User.initialize(sequelize);
FeedTimeEntry.initialize(sequelize);

// Define associations after models have been initialized
User.hasMany(FeedTimeEntry, { foreignKey: 'userId', as: 'feedTimeEntries' });
FeedTimeEntry.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Sync models with the database
// { alter: true } updates tables without dropping them
// { force: true } drops and recreates tables
sequelize.sync({ alter: true })
  .then(() => {
    console.log('Database & tables synced successfully.');
  })
  .catch(error => {
    console.error('Error syncing database:', error);
  });

// Export models and sequelize connection for use in other parts of the application
export { sequelize, User, FeedTimeEntry };