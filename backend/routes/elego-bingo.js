// backend/routes/elego-bingo.js
//
// EleGo BINGO rooms.
// - One live room per class. The room code IS the teacher's class (section) code.
// - Teacher opens the room for one of their own sections.
// - A student joins automatically, but only the room of THEIR OWN section.
//   A student whose class code doesn't match the teacher's can never get in.
// - Rooms live in memory, so they reset when the server restarts.

const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

const User = require('../models/User');
const Section = require('../models/Section');
const requireAuth = require('../middleware/auth');

const rooms = {}; // key = class (section) code

const ALL_ELEMENT_NUMBERS = Array.from({ length: 118 }, (_, i) => i + 1);

function publicState(room) {
  return {
    code: room.code,
    sectionName: room.sectionName,
    status: room.status,
    current: room.current,
    calledNumbers: room.calledOrder,
    remainingCount: ALL_ELEMENT_NUMBERS.length - room.calledOrder.length,
    studentCount: Object.keys(room.students).length,
    students: Object.values(room.students).map((s) => ({
      id: s.id,
      name: s.name,
    })),
    lastBingoBy: room.lastBingoBy || null,
    // Changes whenever a new game starts or the teacher resets,
    // so student phones know to deal a fresh card.
    roundId: `${room.createdAt}-${room.round}`,
    updatedAt: room.updatedAt,
  };
}

// Loads the teacher + the room they are controlling (body.code).
// Sends the error response itself and returns null if anything is wrong.
async function teacherRoom(req, res) {
  const user = await User.findById(req.userId);

  if (!user || user.role !== 'teacher') {
    res.status(403).json({ error: 'Only teachers can control the game.' });
    return null;
  }

  const code = String(req.body.code || '').trim().toUpperCase();
  const room = rooms[code];

  if (!room) {
    res.status(404).json({ error: 'Game room not found.' });
    return null;
  }

  if (room.teacherId !== String(user._id)) {
    res.status(403).json({ error: 'This is not your class game.' });
    return null;
  }

  return room;
}

// =====================================================
// TEACHER: open (or resume) the game for one of their classes
// POST /api/elego/create   body: { sectionId }
// =====================================================
router.post('/create', requireAuth, async (req, res) => {
  try {
    const teacher = await User.findById(req.userId);

    if (!teacher || teacher.role !== 'teacher') {
      return res.status(403).json({ error: 'Only teachers can start a game.' });
    }

    const { sectionId } = req.body;

    if (!sectionId || !mongoose.Types.ObjectId.isValid(sectionId)) {
      return res.status(400).json({ error: 'Choose a class first.' });
    }

    const section = await Section.findById(sectionId);

    if (!section || String(section.teacher) !== String(teacher._id)) {
      return res.status(403).json({ error: 'You can only start games for your own classes.' });
    }

    const existing = rooms[section.code];

    // Teacher left and came back: resume the same game.
    if (existing && existing.status !== 'ended') {
      return res.json(publicState(existing));
    }

    rooms[section.code] = {
      code: section.code,
      sectionId: String(section._id),
      sectionName: section.name,
      teacherId: String(teacher._id),
      status: 'waiting',
      current: null,
      calledOrder: [],
      calledSet: new Set(),
      students: {},
      lastBingoBy: null,
      round: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    return res.status(201).json(publicState(rooms[section.code]));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to open the game.' });
  }
});

// =====================================================
// STUDENT: auto-join the room of their own class
// POST /api/elego/join   (no body needed)
// Safe to call repeatedly: the student phone polls this.
// Returns { room: null } while the teacher hasn't opened a game yet.
// =====================================================
router.post('/join', requireAuth, async (req, res) => {
  try {
    const student = await User.findById(req.userId);

    if (!student || student.role !== 'student') {
      return res.status(403).json({ error: 'Only students in a class can join EleGO.' });
    }

    if (!student.section) {
      return res.status(400).json({ error: 'You are not in a class yet.' });
    }

    const section = await Section.findById(student.section);

    if (!section) {
      return res.status(404).json({ error: 'Your class was not found.' });
    }

    const room = rooms[section.code];

    if (!room) {
      return res.json({ room: null });
    }

    const id = String(student._id);

    if (room.status !== 'ended' && !room.students[id]) {
      room.students[id] = { id, name: student.name, joinedAt: Date.now() };
      room.updatedAt = Date.now();
    }

    return res.json({ studentId: id, room: publicState(room) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to join the game.' });
  }
});

// =====================================================
// GET ROOM STATE (teacher who owns it, or a student of that class)
// GET /api/elego/state/:code
// =====================================================
router.get('/state/:code', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const room = rooms[String(req.params.code || '').toUpperCase()];

    if (!user) {
      return res.status(401).json({ error: 'Not signed in.' });
    }

    if (!room) {
      return res.status(404).json({ error: 'Game room not found.' });
    }

    const isOwner = user.role === 'teacher' && room.teacherId === String(user._id);
    const isClassmate =
      user.role === 'student' && String(user.section) === room.sectionId;

    if (!isOwner && !isClassmate) {
      return res.status(403).json({ error: 'This game is not for your class.' });
    }

    return res.json(publicState(room));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to load the game.' });
  }
});

// =====================================================
// TEACHER CONTROLS
// =====================================================
router.post('/start', requireAuth, async (req, res) => {
  try {
    const room = await teacherRoom(req, res);
    if (!room) return;

    if (Object.keys(room.students).length === 0) {
      return res.status(400).json({
        error: 'At least one student must join before starting the game.',
      });
    }

    room.status = 'active';
    room.updatedAt = Date.now();

    return res.json(publicState(room));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to start the game.' });
  }
});

router.post('/spin', requireAuth, async (req, res) => {
  try {
    const room = await teacherRoom(req, res);
    if (!room) return;

    if (room.status !== 'active') {
      return res.status(400).json({ error: 'The game is not active.' });
    }

    const remaining = ALL_ELEMENT_NUMBERS.filter((n) => !room.calledSet.has(n));

    if (remaining.length === 0) {
      room.status = 'ended';
      room.updatedAt = Date.now();
      return res.json(publicState(room));
    }

    const picked = remaining[Math.floor(Math.random() * remaining.length)];

    room.calledSet.add(picked);
    room.calledOrder.push(picked);
    room.current = picked;
    room.updatedAt = Date.now();

    return res.json(publicState(room));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to spin.' });
  }
});

router.post('/reset', requireAuth, async (req, res) => {
  try {
    const room = await teacherRoom(req, res);
    if (!room) return;

    room.status = 'waiting';
    room.current = null;
    room.calledOrder = [];
    room.calledSet = new Set();
    room.lastBingoBy = null;
    room.round += 1; // students get a fresh card
    room.updatedAt = Date.now();

    return res.json(publicState(room));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to reset the game.' });
  }
});

router.post('/end', requireAuth, async (req, res) => {
  try {
    const room = await teacherRoom(req, res);
    if (!room) return;

    room.status = 'ended';
    room.updatedAt = Date.now();

    return res.json(publicState(room));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to end the game.' });
  }
});

// =====================================================
// STUDENT: announce BINGO (name comes from the account)
// POST /api/elego/bingo   body: { code }
// =====================================================
router.post('/bingo', requireAuth, async (req, res) => {
  try {
    const student = await User.findById(req.userId);
    const code = String(req.body.code || '').trim().toUpperCase();
    const room = rooms[code];

    if (!room) {
      return res.status(404).json({ error: 'Game room not found.' });
    }

    if (
      !student ||
      student.role !== 'student' ||
      String(student.section) !== room.sectionId
    ) {
      return res.status(403).json({ error: 'This game is not for your class.' });
    }

    room.lastBingoBy = student.name;
    room.updatedAt = Date.now();

    return res.json(publicState(room));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to announce BINGO.' });
  }
});

module.exports = router;