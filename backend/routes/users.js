const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const User = require('../models/User');
const Section = require('../models/Section');
const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-secret-change-me';
const JWT_EXPIRES_IN = '7d';

const MAX_ATTEMPTS = 3;
const LOCK_TIME_MS = 60 * 1000;

router.post('/register', async (req, res) => {
  try {
    const { name, birthdate, address, username, password, role, sectionCode } =
      req.body;

    if (!name || !birthdate || !address || !username || !password || !role) {
      return res.status(400).json({
        error:
          'name, birthdate, address, username, password, and role are required',
      });
    }

      if (!['teacher', 'student', 'personal'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    if (typeof username !== 'string' || username.trim().length < 3) {
      return res
        .status(400)
        .json({ error: 'Username must be at least 3 characters' });
    }

    if (typeof password !== 'string' || password.length < 6) {
      return res
        .status(400)
        .json({ error: 'Password must be at least 6 characters' });
    }

    let sectionId = null;
    if (role === 'student') {
      if (!sectionCode || !sectionCode.trim()) {
        return res
          .status(400)
          .json({ error: 'Section code is required for students' });
      }
      const section = await Section.findOne({
        code: sectionCode.trim().toUpperCase(),
      });
      if (!section) {
        return res.status(400).json({ error: 'Invalid section code' });
      }
      sectionId = section._id;
    }

    const existing = await User.findOne({
      username: username.trim().toLowerCase(),
    });
    if (existing) {
      return res.status(409).json({ error: 'Username is already taken' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      birthdate: new Date(birthdate),
      address,
      username: username.trim().toLowerCase(),
      password: passwordHash,
      role,
      section: sectionId,
    });

    const saved = await user.save();

    const token = jwt.sign({ userId: saved._id }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    return res.status(201).json({ token, user: saved });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to register user' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password || !username.trim() || !password.trim()) {
      return res
        .status(400)
        .json({ error: 'Username and password are required' });
    }

    const user = await User.findOne({
      username: username.trim().toLowerCase(),
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    if (user.lockUntil && user.lockUntil > new Date()) {
      const secondsLeft = Math.ceil((user.lockUntil - new Date()) / 1000);
      return res.status(423).json({
        error: `Account locked. Try again in ${secondsLeft} second(s).`,
        lockedForSeconds: secondsLeft,
      });
    }

    if (user.lockUntil && user.lockUntil <= new Date()) {
      user.failedLoginAttempts = 0;
      user.lockUntil = null;
    }

    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      user.failedLoginAttempts += 1;

      if (user.failedLoginAttempts >= MAX_ATTEMPTS) {
        user.lockUntil = new Date(Date.now() + LOCK_TIME_MS);
        user.failedLoginAttempts = 0;
        await user.save();
        return res.status(423).json({
          error: 'Too many failed attempts. Account locked for 1 minute.',
          lockedForSeconds: LOCK_TIME_MS / 1000,
        });
      }

      await user.save();
      return res.status(401).json({
        error: 'Invalid username or password',
        attemptsRemaining: MAX_ATTEMPTS - user.failedLoginAttempts,
      });
    }

    user.failedLoginAttempts = 0;
    user.lockUntil = null;
    await user.save();

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    return res.status(200).json({ token, user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to log in' });
  }
});

router.post('/logout', (req, res) => {
  return res.status(200).json({ message: 'Logged out' });
});

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