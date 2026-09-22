const express = require('express');
const router = express.Router();
const Section = require('../models/Section');
const User = require('../models/User');
const requireAuth = require('../middleware/auth');

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

router.post('/', requireAuth, async (req, res) => {
  try {
    const teacher = await User.findById(req.userId);
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(403).json({ error: 'Only teachers can create sections' });
    }

    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Section name is required' });
    }

    let code;
    let exists = true;
    while (exists) {
      code = generateCode();
      exists = await Section.findOne({ code });
    }

    const section = await Section.create({
      name: name.trim(),
      code,
      teacher: teacher._id,
    });

    return res.status(201).json(section);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to create section' });
  }
});

router.get('/mine', requireAuth, async (req, res) => {
  try {
    const teacher = await User.findById(req.userId);
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(403).json({ error: 'Only teachers can view this' });
    }

    const sections = await Section.find({ teacher: teacher._id }).sort({
      createdAt: -1,
    });

    const withCounts = await Promise.all(
      sections.map(async (s) => {
        const studentCount = await User.countDocuments({ section: s._id });
        return { ...s.toObject(), studentCount };
      })
    );

    return res.json(withCounts);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch sections' });
  }
});

router.get('/:id/students', requireAuth, async (req, res) => {
  try {
    const teacher = await User.findById(req.userId);
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(403).json({ error: 'Only teachers can view this' });
    }

    const section = await Section.findById(req.params.id);
    if (!section || String(section.teacher) !== String(teacher._id)) {
      return res.status(404).json({ error: 'Section not found' });
    }

    const students = await User.find({
      section: section._id,
      role: 'student',
    }).select('-password');

    return res.json({ section, students });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch students' });
  }
});

router.get('/validate/:code', async (req, res) => {
  try {
    const code = req.params.code.trim().toUpperCase();
    const section = await Section.findOne({ code }).populate('teacher', 'name');

    if (!section) {
      return res.status(404).json({ error: 'Invalid section code' });
    }

    return res.json({
      id: section._id,
      name: section.name,
      teacherName: section.teacher.name,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to validate code' });
  }
});

module.exports = router;