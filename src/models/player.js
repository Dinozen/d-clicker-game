const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  telegramId: { type: String, unique: true, required: true },
  tokens: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  energy: { type: Number, default: 3 },
  maxEnergy: { type: Number, default: 3 },
  clicksRemaining: { type: Number, default: 300 },
  lastEnergyRefillTime: { type: Date, default: Date.now },
  dailyStreak: { type: Number, default: 0 },
  lastLoginDate: { type: Date },
  completedTasks: [String],
  referralCount: { type: Number, default: 0 },
  autoBotActive: { type: Boolean, default: false },
  autoBotPurchased: { type: Boolean, default: false },
  autoBotTokens: { type: Number, default: 0 },
  lastAutoBotCheckTime: { type: Date },
  referredBy: { type: String },
});

module.exports = mongoose.model('Player', playerSchema);