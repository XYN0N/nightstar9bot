import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  telegramId: { type: Number, required: true, unique: true },
  username: { type: String, required: true },
  photoUrl: { type: String },
  stars: { type: Number, default: 0 },
  totalWins: { type: Number, default: 0 },
  totalLosses: { type: Number, default: 0 },
  totalEarnings: { type: Number, default: 0 },
  badges: [String],
  firstName: { type: String },
  lastName: { type: String },
  languageCode: { type: String },
  lastActive: { type: Date, default: Date.now }
});

export const User = mongoose.model('User', UserSchema);