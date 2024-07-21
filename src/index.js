require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const TelegramBot = require('node-telegram-bot-api');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4
})
.then(() => console.log('MongoDB connected...'))
.catch(err => console.log('MongoDB connection error:', err));

const PlayerSchema = new mongoose.Schema({
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
  referredBy: { type: String }
});

const Player = mongoose.model('Player', PlayerSchema);

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

bot.onText(/\/start(.*)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const referrerId = match[1].trim();
  
  let player = await Player.findOne({ telegramId: chatId.toString() });
  
  if (!player) {
    player = new Player({ telegramId: chatId.toString() });
    if (referrerId) {
      player.referredBy = referrerId;
      const referrer = await Player.findOne({ telegramId: referrerId });
      if (referrer) {
        referrer.referralCount += 1;
        referrer.tokens += 3000; // Example reward
        await referrer.save();
        bot.sendMessage(referrerId, 'You got a new referral! 3000 tokens added to your account.');
      }
    }
    await player.save();
    bot.sendMessage(chatId, 'Welcome to DinoZen! Your account has been created.');
  } else {
    bot.sendMessage(chatId, 'Welcome back to DinoZen!');
  }
  
  bot.sendMessage(chatId, `Click here to play: https://dinozen.github.io/d-clicker-game/?id=${chatId}`);
});

app.get('/', (req, res) => {
  res.send('DinoZen Game Backend is running!');
});

app.get('/api/player/:telegramId', async (req, res) => {
  try {
    const player = await Player.findOne({ telegramId: req.params.telegramId });
    if (!player) return res.status(404).json({ message: 'Player not found' });
    res.json(player);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/update/:telegramId', async (req, res) => {
  try {
    const player = await Player.findOneAndUpdate(
      { telegramId: req.params.telegramId },
      req.body,
      { new: true }
    );
    if (!player) return res.status(404).json({ message: 'Player not found' });
    res.json(player);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));