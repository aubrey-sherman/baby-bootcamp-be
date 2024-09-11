import { DataTypes, Model } from 'sequelize';
import sequelize from '../db.js';

/** Related functions for feed time entries. */

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
      },
      eventTime: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      measurement: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      block: {
        type: DataTypes.ENUM('Block One', 'Block Two', 'Block Three'),
        allowNull: false,
      },
      timezone: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    }, {
      sequelize,
      modelName: 'FeedTimeEntry',
      tableName: 'feed_time_entries',
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['userId', 'eventTime', 'block'],
        }
      ],
    });
  }

  // TODO: Add CRUD methods here (move out of routes!)
}

FeedTimeEntry.initialize(sequelize);

export default FeedTimeEntry;