import { DataTypes, Model } from 'sequelize';
import sequelize from '../db.js';
import FeedTimeEntry from './feedTimeEntry.js';

class User extends Model {
  static initialize(sequelize) {
    User.init({
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
    }, {
      sequelize,
      modelName: 'User',
      tableName: 'users',
      timestamps: true,
    });
  }

  // Method to find a user by Auth0 ID
  static async findByAuth0Id(auth0Id) {
    try {
      const user = await User.findOne({ where: { auth0Id } });
      return user;
    } catch (error) {
      throw new Error('Error finding user: ' + error.message);
    }
  }

  // Method to create a new user
  static async createUser(data) {
    try {
      const user = await User.create(data);
      return user;
    } catch (error) {
      throw new Error('Error creating user: ' + error.message);
    }
  }

  // Method to update user information
  static async updateUser(id, data) {
    try {
      const user = await User.findByPk(id);
      if (!user) throw new Error('User not found');

      await user.update(data);
      return user;
    } catch (error) {
      throw new Error('Error updating user: ' + error.message);
    }
  }

  // Method to delete a user
  static async deleteUser(id) {
    try {
      const user = await User.findByPk(id);
      if (!user) throw new Error('User not found');

      await user.destroy();
      return 'User deleted successfully';
    } catch (error) {
      throw new Error('Error deleting user: ' + error.message);
    }
  }

  // Method to get a user's time entries
  static async getUserTimeEntries(userId) {
    try {
      const user = await User.findByPk(userId, {
        include: [{ model: FeedTimeEntry, as: 'feedTimeEntries' }],
      });
      if (!user) throw new Error('User not found');

      return user.timeEntries;
    } catch (error) {
      throw new Error('Error retrieving time entries: ' + error.message);
    }
  }
}

// Initialize the model
User.initialize(sequelize);

// Export the class for use in other modules
export default User;