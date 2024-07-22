<<<<<<< HEAD
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const TelegramBot = require('node-telegram-bot-api');
const { spawn } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

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
  referredBy: { type: String }
});

const Player = mongoose.model('Player', PlayerSchema);

// Telegram Bot
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { webHook: { port: PORT } });

// Set the webhook
bot.setWebHook(`${process.env.HEROKU_URL}/bot${process.env.TELEGRAM_BOT_TOKEN}`);

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
    const player = await Player.findOne({ telegramId: req.params.telegramId });
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
      { new: true, runValidators: true }
    );
    if (!player) return res.status(404).json({ message: 'Player not found' });
    res.json(player);
  } catch (error) {
    console.error('Error updating player:', error);
    res.status(500).json({ message: error.message });
  }
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: "API is working" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Start Python bot
function startPythonBot() {
  const pythonProcess = spawn('python', ['game.py']);

  pythonProcess.stdout.on('data', (data) => {
    console.log(`Python Bot: ${data}`);
  });

  pythonProcess.stderr.on('data', (data) => {
    console.error(`Python Bot Error: ${data}`);
  });

  pythonProcess.on('close', (code) => {
    console.log(`Python Bot process exited with code ${code}`);
    // Restart the Python bot if it crashes
    setTimeout(startPythonBot, 5000);
  });
}

// Start server and Python bot
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  startPythonBot();
});
=======
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const TelegramBot = require('node-telegram-bot-api');
const { spawn } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

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
  referredBy: { type: String }
});

const Player = mongoose.model('Player', PlayerSchema);

// Telegram Bot
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { webHook: { port: PORT } });

// Set the webhook
bot.setWebHook(`${process.env.HEROKU_URL}/bot${process.env.TELEGRAM_BOT_TOKEN}`);

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
    const player = await Player.findOne({ telegramId: req.params.telegramId });
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
      { new: true, runValidators: true }
    );
    if (!player) return res.status(404).json({ message: 'Player not found' });
    res.json(player);
  } catch (error) {
    console.error('Error updating player:', error);
    res.status(500).json({ message: error.message });
  }
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: "API is working" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Start Python bot
function startPythonBot() {
  const pythonProcess = spawn('python', ['game.py']);

  pythonProcess.stdout.on('data', (data) => {
    console.log(`Python Bot: ${data}`);
  });

  pythonProcess.stderr.on('data', (data) => {
    console.error(`Python Bot Error: ${data}`);
  });

  pythonProcess.on('close', (code) => {
    console.log(`Python Bot process exited with code ${code}`);
    // Restart the Python bot if it crashes
    setTimeout(startPythonBot, 5000);
  });
}

// Start server and Python bot
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  startPythonBot();
});
>>>>>>> 5159573db64709d3a8eb68dbf6c0fa8301e36a8a
