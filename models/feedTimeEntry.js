import { DataTypes, Model } from 'sequelize';
import sequelize from '../db.js';
import User from './User.js';

class FeedTimeEntry extends Model {
  static initialize(sequelize) {
    FeedTimeEntry.init({
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        // Remove the direct reference to the User model here
      },
      eventTime: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      measurement: {
        type: DataTypes.FLOAT,  // Assuming ounces can have decimal points
        allowNull: false,
      },
      block: {
        type: DataTypes.ENUM('Block One', 'Block Two', 'Block Three'),
        allowNull: false,
      },
      timezone: {
        type: DataTypes.STRING,  // Store the user's timezone (e.g., 'America/New_York')
        allowNull: false,
      },
    }, {
      sequelize,
      modelName: 'TimeEntry',
      tableName: 'time_entries',
      timestamps: true,
    });
  }

  // CRUD methods...
}

FeedTimeEntry.initialize(sequelize);

export default FeedTimeEntry;