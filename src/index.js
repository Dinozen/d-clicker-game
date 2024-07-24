// index.js
process.env.NTBA_FIX_319 = 1;
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const TelegramBot = require('node-telegram-bot-api');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views')); // Ana dizindeki 'views' klasörünü kullan

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
  poolSize: 300,  // Başlangıç havuz boyutu
  maxPoolSize: 500,  // Maksimum 500 eşzamanlı bağlantı
  serverSelectionTimeoutMS: 30000,  // 30 saniye
  socketTimeoutMS: 45000,  // 45 saniye
  connectTimeoutMS: 30000,  // 30 saniye
  keepAlive: true,
  keepAliveInitialDelay: 300000  // 5 dakika
};

mongoose.connect(process.env.MONGODB_URI, mongoOptions)
.then(() => console.log('MongoDB connected successfully'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
  mongoose.connect(process.env.MONGODB_URI, mongoOptions);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected. Attempting to reconnect...');
  mongoose.connect(process.env.MONGODB_URI, mongoOptions);
});

setInterval(function() {
  mongoose.connection.db.admin().ping(function(err, result) {
    if (err) {
      console.log('MongoDB connection error:', err);
      mongoose.connect(process.env.MONGODB_URI, mongoOptions);
    } else {
      console.log('MongoDB connection is alive');
    }
  });
}, 300000); // Her 5 dakikada bir kontrol et

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

// İndeksler ekleniyor
PlayerSchema.index({ telegramId: 1 });
PlayerSchema.index({ tokens: 1 });
PlayerSchema.index({ level: 1 });

const Player = mongoose.model('Player', PlayerSchema);

// Referral reward function
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

// Telegram Bot
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { webHook: true });

// Set the webhook
bot.setWebHook(`${process.env.HEROKU_URL}/bot${process.env.TELEGRAM_BOT_TOKEN}`)
  .then(() => {
    console.log('Webhook set successfully');
  })
  .catch((error) => {
    console.error('Failed to set webhook:', error);
  });

// Webhook route
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

// Routes
app.get('/', (req, res) => {
  res.send('DinoZen Game Backend is running!');
});

app.get('/api/player/:telegramId', async (req, res) => {
  console.log(`Fetching player data for telegramId: ${req.params.telegramId}`);
  try {
    const player = await Player.findOne({ telegramId: req.params.telegramId }, 'tokens level energy maxEnergy clicksRemaining lastEnergyRefillTime dailyStreak lastLoginDate completedTasks referralCount autoBotActive autoBotPurchased autoBotTokens lastAutoBotCheckTime lastGiftTime');
    if (!player) return res.status(404).json({ message: 'Player not found' });
    res.json(player);
  } catch (error) {
    console.error('Error fetching player:', error);
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/update/:telegramId', async (req, res) => {
  console.log(`Updating player data for telegramId: ${req.params.telegramId}`, req.body);
  try {
    const player = await Player.findOneAndUpdate(
      { telegramId: req.params.telegramId },
      req.body,
      { new: true, runValidators: true, upsert: true, lean: true }
    );
    res.json(player);
  } catch (error) {
    console.error('Error updating player:', error);
    res.status(500).json({ message: error.message });
  }
});

// Admin route
app.get('/admin', async (req, res) => {
  console.log('Admin route hit');
  try {
    console.log('Counting players...');
    const playerCount = await Player.countDocuments();
    console.log(`Player count: ${playerCount}`);
    
    console.log('Fetching recent players...');
    const players = await Player.find().sort({ _id: -1 }).limit(10).lean();
    console.log(`Fetched ${players.length} players`);
    
    console.log('Rendering admin view...');
    res.render('admin', { playerCount, players });
    console.log('Admin view rendered successfully');
  } catch (error) {
    console.error('Error in admin route:', error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

// Ping route to keep the app awake
app.get('/ping', (req, res) => {
  res.status(200).send('OK');
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: "API is working" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).send('An unexpected error occurred');
});

// Error handling for uncaught exceptions and unhandled rejections
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Burada hata bilgilerini bir loglama servisine gönderebilirsiniz
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Burada hata bilgilerini bir loglama servisine gönderebilirsiniz
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
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
