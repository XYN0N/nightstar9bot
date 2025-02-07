const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  telegramId: { type: String, unique: true },
  username: String,
  name: String,
  profilePhoto: String,
  stars: { type: Number, default: 0 },
  totalWinnings: { type: Number, default: 0 },
  wins: { type: Number, default: 0 },
  losses: { type: Number, default: 0 },
  badges: { type: Number, default: 0 },
  isPremium: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date }
});

UserSchema.methods.updateBadges = function() {
  this.badges = Math.floor(this.totalWinnings / 100);
};

module.exports = mongoose.model('User', UserSchema);