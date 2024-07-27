process.env.NTBA_FIX_319 = 1;
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const TelegramBot = require('node-telegram-bot-api');
const path = require('path');
const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
const corsOptions = {
  origin: 'https://dinozen.github.io',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};
app.use(cors(corsOptions));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

const mongoOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindAndModify: false,
  poolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4,
  keepAlive: true,
  keepAliveInitialDelay: 300000
};

const connectWithRetry = () => {
  mongoose.connect(process.env.MONGODB_URI, mongoOptions)
    .then(() => console.log('MongoDB connected successfully'))
    .catch(err => {
      console.error('MongoDB connection error:', err);
      console.log('Retrying connection in 5 seconds...');
      setTimeout(connectWithRetry, 5000);
    });
};

connectWithRetry();

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected. Attempting to reconnect...');
  connectWithRetry();
});

// Player Schema
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
  referredBy: { type: String },
  lastGiftTime: { type: Number, default: 0 }
});

PlayerSchema.index({ telegramId: 1 });
PlayerSchema.index({ tokens: 1 });
PlayerSchema.index({ level: 1 });

const Player = mongoose.model('Player', PlayerSchema);

// Helper functions
function calculateReferralReward(referralCount) {
  if (referralCount >= 1000) return 10000000;
  if (referralCount >= 500) return 3000000;
  if (referralCount >= 100) return 600000;
  if (referralCount >= 50) return 300000;
  if (referralCount >= 20) return 75000;
  if (referralCount >= 10) return 30000;
  if (referralCount >= 5) return 15000;
  return 3000;
}

function calculateEnergy(player) {
  const now = Date.now();
  const timePassed = (now - player.lastEnergyRefillTime.getTime()) / (5 * 60 * 1000); // 5 dakikada bir enerji
  const energyToAdd = Math.floor(timePassed);
  player.energy = Math.min(player.energy + energyToAdd, player.maxEnergy);
  player.lastEnergyRefillTime = new Date(now - (timePassed % 1) * 5 * 60 * 1000);
  return player;
}

function calculateDailyReward(streak) {
  const rewardTable = [
    1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000,
    11500, 13000, 14500, 16000, 17500, 19000, 20500, 22000, 23500, 25000,
    27000, 29000, 31000, 33000, 35000, 37000, 39000, 41000, 43000, 45000
  ];
  return rewardTable[Math.min(streak - 1, rewardTable.length - 1)];
}

function checkAutoBot(player) {
  const now = Date.now();
  const timeSinceLastCheck = (now - player.lastAutoBotCheckTime.getTime()) / 1000; // saniye cinsinden
  const maxEarningTime = 12 * 60 * 60; // 12 saat saniye cinsinden
  
  if (player.autoBotActive && player.autoBotPurchased && timeSinceLastCheck > 0) {
    const earningTime = Math.min(timeSinceLastCheck, maxEarningTime);
    const tokensPerSecond = player.level * 0.1;
    const newTokens = Math.floor(earningTime * tokensPerSecond);
    
    player.autoBotTokens += newTokens;
    player.lastAutoBotCheckTime = new Date(now);
  }
  
  return player;
}

// Telegram Bot
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { webHook: true });

bot.setWebHook(`${process.env.HEROKU_URL}/bot${process.env.TELEGRAM_BOT_TOKEN}`)
  .then(() => console.log('Webhook set successfully'))
  .catch((error) => console.error('Failed to set webhook:', error));

app.post(`/bot${process.env.TELEGRAM_BOT_TOKEN}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

bot.onText(/\/start(.*)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const referrerId = match[1].trim();
  
  try {
    let player = await Player.findOne({ telegramId: chatId.toString() });
    
    if (!player) {
      player = new Player({ telegramId: chatId.toString() });
      if (referrerId) {
        player.referredBy = referrerId;
        const referrer = await Player.findOne({ telegramId: referrerId });
        if (referrer) {
          referrer.referralCount += 1;
          const reward = calculateReferralReward(referrer.referralCount);
          referrer.tokens += reward;
          await referrer.save();
          bot.sendMessage(referrerId, `You got a new referral! ${reward} tokens added to your account! 🦖💰`);
        }
      }
      await player.save();
      bot.sendMessage(chatId, 'Welcome to DinoZen! Your account has been created.');
    } else {
      bot.sendMessage(chatId, 'Welcome back to DinoZen! Get ready to dive into the dino-tastic world of Dino Farm!');
    }
    
    const keyboard = {
      inline_keyboard: [[
        {
          text: "🚀 Launch Game 🚀",
          web_app: {url: `https://dinozen.github.io/d-clicker-game/?id=${chatId}`}
        }
      ]]
    };

    bot.sendMessage(chatId, "Click the button below to start farming your $DINOZ fortune! 🦖💰", {
      reply_markup: keyboard
    });
  } catch (error) {
    console.error('Error in Telegram bot handler:', error);
    bot.sendMessage(chatId, 'Sorry, an error occurred. Please try again later.');
  }
});

// API Routes
app.post('/api/claimDailyReward', async (req, res) => {
  const { telegramId } = req.body;
  if (!telegramId) {
      return res.status(400).json({ success: false, message: 'Invalid input' });
  }
  try {
      let player = await Player.findOne({ telegramId });
      if (!player) {
          return res.status(404).json({ success: false, message: 'Player not found' });
      }
      
      player = calculateEnergy(player);
      
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);
      if (!player.lastLoginDate || new Date(player.lastLoginDate) < currentDate) {
          const newStreak = player.lastLoginDate && 
                            (currentDate - new Date(player.lastLoginDate)) <= 86400000 * 2 
                            ? player.dailyStreak + 1 : 1;
          const reward = calculateDailyReward(newStreak);
          player.tokens += reward;
          player.dailyStreak = newStreak;
          player.lastLoginDate = currentDate;
          await player.save();
          res.json({ success: true, message: 'Daily reward claimed successfully', reward, newStreak });
      } else {
          res.status(400).json({ success: false, message: 'Daily reward already claimed' });
      }
  } catch (error) {
      console.error('Error claiming daily reward:', error);
      res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
});

app.post('/api/claimRandomGift', async (req, res) => {
  const { telegramId } = req.body;
  if (!telegramId) {
    return res.status(400).json({ success: false, message: 'Invalid input' });
  }
  try {
    const player = await Player.findOne({ telegramId });
    if (!player) {
      return res.status(404).json({ success: false, message: 'Player not found' });
    }
    if (Date.now() - player.lastGiftTime < 3 * 60 * 60 * 1000) { // 3 saatlik cooldown
      return res.status(400).json({ success: false, message: 'Gift is on cooldown. Please wait.' });
    }
    player.tokens += 100; // Random gift ödülü
    player.lastGiftTime = Date.now();
    await player.save();
    res.json({ success: true, message: 'Random gift claimed successfully' });
  } catch (error) {
    console.error('Error claiming random gift:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
});

app.get('/api/player/:telegramId', async (req, res) => {
  console.log(`Fetching player data for telegramId: ${req.params.telegramId}`);
  try {
    let player = await Player.findOne({ telegramId: req.params.telegramId });
    if (!player) return res.status(404).json({ success: false, message: 'Player not found' });
    
    player = calculateEnergy(player);
    player = checkAutoBot(player);
    
    await player.save();
    res.json(player);
  } catch (error) {
    console.error('Error fetching player:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
});

app.post('/api/update/:telegramId', async (req, res) => {
  console.log(`Updating player data for telegramId: ${req.params.telegramId}`);
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      throw new Error('Request body is empty');
    }
    let player = await Player.findOne({ telegramId: req.params.telegramId });
    if (!player) {
      return res.status(404).json({ success: false, message: 'Player not found' });
    }
    
    player = calculateEnergy(player);
    player = checkAutoBot(player);
    
    const updates = req.body;
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined && player[key] !== undefined) {
        player[key] = value;
      }
    }
    
    await player.save();
    res.json({ success: true, player });
  } catch (error) {
    console.error('Error updating player:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
});

app.get('/admin', async (req, res) => {
  console.log('Admin route hit');
  try {
    console.log('Counting players...');
    const playerCount = await Player.countDocuments();
    console.log(`Player count: ${playerCount}`);
    
    console.log('Fetching recent players...');
    const players = await Player.find().sort({ _id: -1 }).limit(10);
    console.log(`Fetched ${players.length} players`);
    
    console.log('Rendering admin view...');
    res.render('admin', { playerCount, players });
    console.log('Admin view rendered successfully');
  } catch (error) {
    console.error('Error in admin route:', error);
    res.status(500).json({ success: false, error: error.message, stack: error.stack });
  }
});

app.get('/ping', (req, res) => {
  res.status(200).send('OK');
});

app.get('/api/test', (req, res) => {
  res.json({ success: true, message: "API is working" });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'An unexpected error occurred', error: err.message });
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully.');
  server.close(() => {
    console.log('Server closed. Exiting process.');
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed.');
      process.exit(0);
    });
  });
});