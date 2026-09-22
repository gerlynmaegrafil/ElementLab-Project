const express = require("express");

const router = express.Router();

// =====================================================
// ELEGO BINGO ROOM SYSTEM
// =====================================================

// In-memory rooms.
// Good for the classroom game while the server is running.
const rooms = {};

const ALL_ELEMENT_NUMBERS = Array.from(
  { length: 118 },
  (_, index) => index + 1
);

// -----------------------------------------------------
// Generate a simple 4-character game code
// -----------------------------------------------------

function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  let code;

  do {
    code = Array.from(
      { length: 4 },
      () => chars[Math.floor(Math.random() * chars.length)]
    ).join("");
  } while (rooms[code]);

  return code;
}

// -----------------------------------------------------
// Public room state
// -----------------------------------------------------

function publicState(room) {
  return {
    code: room.code,
    status: room.status,

    // Currently called element
    current: room.current,

    // All previously called elements
    calledNumbers: room.calledOrder,

    // Elements remaining
    remainingCount:
      ALL_ELEMENT_NUMBERS.length - room.calledOrder.length,

    // Number of students currently inside
    studentCount: Object.keys(room.students).length,

    // Students in the lobby
    students: Object.values(room.students).map((student) => ({
      id: student.id,
      name: student.name,
    })),

    // Winner
    lastBingoBy: room.lastBingoBy || null,

    updatedAt: room.updatedAt,
  };
}

// =====================================================
// CREATE ROOM
// POST /api/elego/create
// =====================================================

router.post("/create", (req, res) => {
  const code = generateCode();

  rooms[code] = {
    code,

    status: "waiting",

    current: null,

    calledOrder: [],

    calledSet: new Set(),

    students: {},

    lastBingoBy: null,

    createdAt: Date.now(),

    updatedAt: Date.now(),
  };

  return res.status(201).json(publicState(rooms[code]));
});

// =====================================================
// GET ROOM STATE
// GET /api/elego/state/:code
// =====================================================

router.get("/state/:code", (req, res) => {
  const code = req.params.code?.toUpperCase();

  const room = rooms[code];

  if (!room) {
    return res.status(404).json({
      error: "Game room not found.",
    });
  }

  return res.json(publicState(room));
});

// =====================================================
// STUDENT JOIN
// POST /api/elego/join
// body: { code, name }
// =====================================================

router.post("/join", (req, res) => {
  const code = (req.body.code || "").trim().toUpperCase();

  const name = (req.body.name || "").trim();

  if (!code) {
    return res.status(400).json({
      error: "Game code is required.",
    });
  }

  if (!name) {
    return res.status(400).json({
      error: "Student name is required.",
    });
  }

  const room = rooms[code];

  if (!room) {
    return res.status(404).json({
      error: "Game room not found.",
    });
  }

  if (room.status === "ended") {
    return res.status(400).json({
      error: "This game has already ended.",
    });
  }

  // Generate a unique student ID
  const studentId =
    `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  room.students[studentId] = {
    id: studentId,
    name,
    joinedAt: Date.now(),
  };

  room.updatedAt = Date.now();

  return res.status(201).json({
    studentId,
    room: publicState(room),
  });
});

// =====================================================
// START GAME
// POST /api/elego/start
// body: { code }
// =====================================================

router.post("/start", (req, res) => {
  const code = (req.body.code || "").trim().toUpperCase();

  const room = rooms[code];

  if (!room) {
    return res.status(404).json({
      error: "Game room not found.",
    });
  }

  if (Object.keys(room.students).length === 0) {
    return res.status(400).json({
      error: "At least one student must join before starting the game.",
    });
  }

  room.status = "active";

  room.updatedAt = Date.now();

  return res.json(publicState(room));
});

// =====================================================
// SPIN / CALL ELEMENT
// POST /api/elego/spin
// body: { code }
// =====================================================

router.post("/spin", (req, res) => {
  const code = (req.body.code || "").trim().toUpperCase();

  const room = rooms[code];

  if (!room) {
    return res.status(404).json({
      error: "Game room not found.",
    });
  }

  if (room.status !== "active") {
    return res.status(400).json({
      error: "The game is not active.",
    });
  }

  const remaining = ALL_ELEMENT_NUMBERS.filter(
    (number) => !room.calledSet.has(number)
  );

  if (remaining.length === 0) {
    room.status = "ended";

    room.updatedAt = Date.now();

    return res.json(publicState(room));
  }

  const randomIndex = Math.floor(
    Math.random() * remaining.length
  );

  const selectedNumber = remaining[randomIndex];

  room.calledSet.add(selectedNumber);

  room.calledOrder.push(selectedNumber);

  room.current = selectedNumber;

  room.updatedAt = Date.now();

  return res.json(publicState(room));
});

// =====================================================
// RESET GAME
// POST /api/elego/reset
// body: { code }
// =====================================================

router.post("/reset", (req, res) => {
  const code = (req.body.code || "").trim().toUpperCase();

  const room = rooms[code];

  if (!room) {
    return res.status(404).json({
      error: "Game room not found.",
    });
  }

  room.status = "waiting";

  room.current = null;

  room.calledOrder = [];

  room.calledSet = new Set();

  room.lastBingoBy = null;

  room.updatedAt = Date.now();

  return res.json(publicState(room));
});

// =====================================================
// END GAME
// POST /api/elego/end
// body: { code }
// =====================================================

router.post("/end", (req, res) => {
  const code = (req.body.code || "").trim().toUpperCase();

  const room = rooms[code];

  if (!room) {
    return res.status(404).json({
      error: "Game room not found.",
    });
  }

  room.status = "ended";

  room.updatedAt = Date.now();

  return res.json(publicState(room));
});

// =====================================================
// ANNOUNCE BINGO
// POST /api/elego/bingo
// body: { code, name }
// =====================================================

router.post("/bingo", (req, res) => {
  const code = (req.body.code || "").trim().toUpperCase();

  const name = (req.body.name || "").trim();

  const room = rooms[code];

  if (!room) {
    return res.status(404).json({
      error: "Game room not found.",
    });
  }

  if (!name) {
    return res.status(400).json({
      error: "Student name is required.",
    });
  }

  room.lastBingoBy = name;

  room.updatedAt = Date.now();

  return res.json(publicState(room));
});

// =====================================================
// DELETE ROOM
// Optional cleanup endpoint
// =====================================================

router.delete("/:code", (req, res) => {
  const code = req.params.code?.toUpperCase();

  if (!rooms[code]) {
    return res.status(404).json({
      error: "Game room not found.",
    });
  }

  delete rooms[code];

  return res.json({
    message: "Game room deleted.",
  });
});

module.exports = router;