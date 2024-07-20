require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const TelegramBot = require('node-telegram-bot-api');
const Player = require('./models/player');
const apiRoutes = require('./routes/api');

const app = express();
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

app.use(express.json());
app.use('/api', apiRoutes);

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));