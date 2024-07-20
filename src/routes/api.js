const express = require('express');
const router = express.Router();
const Player = require('../models/player');

router.get('/player/:telegramId', async (req, res) => {
  try {
    const player = await Player.findOne({ telegramId: req.params.telegramId });
    if (!player) return res.status(404).json({ message: 'Player not found' });
    res.json(player);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/update/:telegramId', async (req, res) => {
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

module.exports = router;