const express = require('express');
const router = express.Router();
const User = require('../models/User');

// POST /api/users/register
router.post('/register', async (req, res) => {
  try {
    const { name, birthdate, address } = req.body;

    if (!name || !birthdate || !address) {
      return res.status(400).json({ error: 'name, birthdate, and address are required' });
    }

    const user = new User({
      name,
      birthdate: new Date(birthdate),
      address,
    });

    const saved = await user.save();
    return res.status(201).json(saved);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to register user' });
  }
});

// GET /api/users - list all (handy for testing)
router.get('/', async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    return res.json(users);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
});

module.exports = router;