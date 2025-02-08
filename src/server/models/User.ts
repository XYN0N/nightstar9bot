import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  telegramId: { type: Number, required: true, unique: true },
  username: { type: String, required: true },
  firstName: String,
  lastName: String,
  photoUrl: String,
  stars: { type: Number, default: 100 },
  totalWins: { type: Number, default: 0 },
  totalLosses: { type: Number, default: 0 },
  totalEarnings: { type: Number, default: 0 },
  isPremium: { type: Boolean, default: false },
  lastActive: { type: Date, default: Date.now },
  lastClaim: { type: Date },
  referralCode: { type: String, unique: true, sparse: true },
  referredBy: { type: Number, ref: 'User' }
});

// Generate referral code on first save
UserSchema.pre('save', function(next) {
  if (!this.referralCode) {
    this.referralCode = `REF${this.telegramId}${Math.random().toString(36).substr(2, 6)}`.toUpperCase();
  }
  next();
});

// Add method to check if user can claim stars
UserSchema.methods.canClaimStars = function() {
  if (!this.lastClaim) return true;
  
  const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
  return this.lastClaim < threeHoursAgo;
};

export const User = mongoose.model('User', UserSchema);