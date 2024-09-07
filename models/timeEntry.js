import mongoose from 'mongoose';

const timeEntrySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to User model
  date: { type: String, required: true },  // Example: "2024-09-07"
  block: { type: String, required: true }, // Example: "Block One"
  time: { type: String, required: true }   // Example: "11:00 PM"
});

export default mongoose.model('TimeEntry', timeEntrySchema);