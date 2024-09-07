import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  auth0Id: { type: String, required: true, unique: true }, // Auth0 user ID (e.g., "auth0|1234567890")
  name: { type: String },
  email: { type: String, unique: true },
  // Add other fields as needed (e.g., preferences, settings)
});

export default mongoose.model('User', userSchema);