// backend/elego.js

const express = require('express');
const router = express.Router();

// Simple in-memory game store. Good enough for a classroom-sized game;
// state resets if the server restarts (no DB needed for gameplay).
const rooms = {};

// 1..118, matches the element "number" field in ElementLab/data/elements.json
const ALL_ELEMENT_NUMBERS = Array.from({ length: 118 }, (_, i) => i + 1);

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I confusion
  let code;
  do {
    code = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  } while (rooms[code]);
  return code;
}

function publicState(room) {
  return {
    code: room.code,
    status: room.status, // 'waiting' | 'active' | 'ended'
    current: room.current, // last called element number, or null
    calledNumbers: room.calledOrder,
    remainingCount: ALL_ELEMENT_NUMBERS.length - room.calledOrder.length,
    updatedAt: room.updatedAt,
  };
}

// POST /api/elego/create  -> teacher creates a new room
router.post('/create', (req, res) => {
  const code = generateCode();
  rooms[code] = {
    code,
    status: 'waiting',
    calledOrder: [],
    calledSet: new Set(),
    current: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  return res.status(201).json(publicState(rooms[code]));
});

// GET /api/elego/state/:code -> poll current game state (teacher + students)
router.get('/state/:code', (req, res) => {
  const room = rooms[req.params.code?.toUpperCase()];
  if (!room) return res.status(404).json({ error: 'Room not found' });
  return res.json(publicState(room));
});

// POST /api/elego/start { code } -> teacher marks the room active (students can now play)
router.post('/start', (req, res) => {
  const room = rooms[(req.body.code || '').toUpperCase()];
  if (!room) return res.status(404).json({ error: 'Room not found' });
  room.status = 'active';
  room.updatedAt = Date.now();
  return res.json(publicState(room));
});

// POST /api/elego/spin { code } -> teacher draws the next random, unique element
router.post('/spin', (req, res) => {
  const room = rooms[(req.body.code || '').toUpperCase()];
  if (!room) return res.status(404).json({ error: 'Room not found' });

  const remaining = ALL_ELEMENT_NUMBERS.filter((n) => !room.calledSet.has(n));
  if (remaining.length === 0) {
    room.status = 'ended';
    room.updatedAt = Date.now();
    return res.json(publicState(room));
  }

  const pick = remaining[Math.floor(Math.random() * remaining.length)];
  room.calledSet.add(pick);
  room.calledOrder.push(pick);
  room.current = pick;
  room.status = 'active';
  room.updatedAt = Date.now();

  return res.json(publicState(room));
});

// POST /api/elego/reset { code } -> clear called elements, keep the same room code
router.post('/reset', (req, res) => {
  const room = rooms[(req.body.code || '').toUpperCase()];
  if (!room) return res.status(404).json({ error: 'Room not found' });
  room.status = 'waiting';
  room.calledOrder = [];
  room.calledSet = new Set();
  room.current = null;
  room.updatedAt = Date.now();
  return res.json(publicState(room));
});

// POST /api/elego/end { code } -> teacher ends the game
router.post('/end', (req, res) => {
  const room = rooms[(req.body.code || '').toUpperCase()];
  if (!room) return res.status(404).json({ error: 'Room not found' });
  room.status = 'ended';
  room.updatedAt = Date.now();
  return res.json(publicState(room));
});

// POST /api/elego/bingo { code, name } -> a student announces BINGO (broadcast via state)
router.post('/bingo', (req, res) => {
  const room = rooms[(req.body.code || '').toUpperCase()];
  if (!room) return res.status(404).json({ error: 'Room not found' });
  room.lastBingoBy = req.body.name || 'A student';
  room.updatedAt = Date.now();
  return res.json({ ok: true, ...publicState(room), lastBingoBy: room.lastBingoBy });
});

module.exports = router;