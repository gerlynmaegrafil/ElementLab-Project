// backend/routes/elego.js

const express = require('express');
const router = express.Router();

const Activity = require('../models/Activity');
const Submission = require('../models/Submission');
const User = require('../models/User');
const Section = require('../models/Section');

const requireAuth = require('../middleware/auth');

// =====================================================
// TEACHER: CREATE ACTIVITY
// =====================================================

router.post('/activities', requireAuth, async (req, res) => {
  try {
    const teacher = await User.findById(req.userId);

    if (!teacher || teacher.role !== 'teacher') {
      return res.status(403).json({
        error: 'Only teachers can create activities',
      });
    }

    const {
      title,
      description,
      topic,
      section,
      questions,
      isPublished,
    } = req.body;

    if (!title || !topic || !section) {
      return res.status(400).json({
        error: 'Title, topic, and section are required',
      });
    }

    const sectionData = await Section.findById(section);

    if (!sectionData) {
      return res.status(404).json({
        error: 'Section not found',
      });
    }

    // Make sure the teacher owns the section
    if (String(sectionData.teacher) !== String(teacher._id)) {
      return res.status(403).json({
        error: 'You can only create activities for your own sections',
      });
    }

    const activity = await Activity.create({
      title: title.trim(),
      description: description || '',
      topic,
      section: sectionData._id,
      teacher: teacher._id,
      questions: questions || [],
      isPublished: Boolean(isPublished),
    });

    return res.status(201).json(activity);
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: 'Failed to create activity',
    });
  }
});

// =====================================================
// TEACHER: GET MY ACTIVITIES
// =====================================================

router.get('/activities/mine', requireAuth, async (req, res) => {
  try {
    const teacher = await User.findById(req.userId);

    if (!teacher || teacher.role !== 'teacher') {
      return res.status(403).json({
        error: 'Only teachers can view activities',
      });
    }

    const activities = await Activity.find({
      teacher: teacher._id,
    })
      .populate('section', 'name code')
      .sort({ createdAt: -1 });

    return res.json(activities);
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: 'Failed to fetch activities',
    });
  }
});

// =====================================================
// TEACHER: GET ONE ACTIVITY
// =====================================================

router.get('/activities/:id', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    const activity = await Activity.findById(req.params.id)
      .populate('section', 'name code')
      .populate('teacher', 'name');

    if (!activity) {
      return res.status(404).json({
        error: 'Activity not found',
      });
    }

    // Teacher can view their own activity
    if (user.role === 'teacher') {
      if (String(activity.teacher._id) !== String(user._id)) {
        return res.status(403).json({
          error: 'You do not have access to this activity',
        });
      }

      return res.json(activity);
    }

    // Student can only view published activities
    if (user.role === 'student') {
      if (!activity.isPublished) {
        return res.status(403).json({
          error: 'This activity is not published',
        });
      }

      if (!user.section || String(user.section) !== String(activity.section._id)) {
        return res.status(403).json({
          error: 'This activity is not assigned to your section',
        });
      }

      // Do not expose correct answers to students
      const studentActivity = activity.toObject();

      studentActivity.questions = studentActivity.questions.map((question) => {
        const q = { ...question };
        delete q.correctAnswer;
        return q;
      });

      return res.json(studentActivity);
    }

    return res.status(403).json({
      error: 'You do not have access to this activity',
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: 'Failed to fetch activity',
    });
  }
});

// =====================================================
// TEACHER: PUBLISH / UNPUBLISH ACTIVITY
// =====================================================

router.patch(
  '/activities/:id/publish',
  requireAuth,
  async (req, res) => {
    try {
      const teacher = await User.findById(req.userId);

      if (!teacher || teacher.role !== 'teacher') {
        return res.status(403).json({
          error: 'Only teachers can publish activities',
        });
      }

      const activity = await Activity.findOne({
        _id: req.params.id,
        teacher: teacher._id,
      });

      if (!activity) {
        return res.status(404).json({
          error: 'Activity not found',
        });
      }

      activity.isPublished = Boolean(req.body.isPublished);

      await activity.save();

      return res.json(activity);
    } catch (err) {
      console.error(err);

      return res.status(500).json({
        error: 'Failed to update activity status',
      });
    }
  }
);

// =====================================================
// TEACHER: DELETE ACTIVITY
// =====================================================

router.delete('/activities/:id', requireAuth, async (req, res) => {
  try {
    const teacher = await User.findById(req.userId);

    if (!teacher || teacher.role !== 'teacher') {
      return res.status(403).json({
        error: 'Only teachers can delete activities',
      });
    }

    const activity = await Activity.findOneAndDelete({
      _id: req.params.id,
      teacher: teacher._id,
    });

    if (!activity) {
      return res.status(404).json({
        error: 'Activity not found',
      });
    }

    // Remove submissions related to the deleted activity
    await Submission.deleteMany({
      activity: activity._id,
    });

    return res.json({
      message: 'Activity deleted successfully',
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: 'Failed to delete activity',
    });
  }
});

// =====================================================
// STUDENT: GET MY ACTIVITIES
// =====================================================

router.get('/student/activities', requireAuth, async (req, res) => {
  try {
    const student = await User.findById(req.userId);

    if (!student || student.role !== 'student') {
      return res.status(403).json({
        error: 'Only students can access student activities',
      });
    }

    if (!student.section) {
      return res.status(400).json({
        error: 'Student is not assigned to a section',
      });
    }

    const activities = await Activity.find({
      section: student.section,
      isPublished: true,
    })
      .select('-questions.correctAnswer')
      .populate('section', 'name code')
      .populate('teacher', 'name')
      .sort({ createdAt: -1 });

    return res.json(activities);
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: 'Failed to fetch student activities',
    });
  }
});

// =====================================================
// STUDENT: SUBMIT ACTIVITY
// =====================================================

router.post(
  '/activities/:id/submit',
  requireAuth,
  async (req, res) => {
    try {
      const student = await User.findById(req.userId);

      if (!student || student.role !== 'student') {
        return res.status(403).json({
          error: 'Only students can submit activities',
        });
      }

      if (!student.section) {
        return res.status(400).json({
          error: 'Student is not assigned to a section',
        });
      }

      const activity = await Activity.findById(req.params.id);

      if (!activity) {
        return res.status(404).json({
          error: 'Activity not found',
        });
      }

      if (!activity.isPublished) {
        return res.status(403).json({
          error: 'This activity is not published',
        });
      }

      if (
        String(activity.section) !== String(student.section)
      ) {
        return res.status(403).json({
          error: 'This activity is not assigned to your section',
        });
      }

      const existingSubmission = await Submission.findOne({
        activity: activity._id,
        student: student._id,
      });

      if (existingSubmission) {
        return res.status(409).json({
          error: 'You have already submitted this activity',
          submission: existingSubmission,
        });
      }

      const submittedAnswers = Array.isArray(req.body.answers)
        ? req.body.answers
        : [];

      let score = 0;
      let totalPoints = 0;

      const evaluatedAnswers = activity.questions.map((question) => {
        const submitted = submittedAnswers.find(
          (item) =>
            String(item.questionId) === String(question._id)
        );

        const studentAnswer = submitted
          ? String(submitted.answer || '').trim()
          : '';

        const correctAnswer = String(
          question.correctAnswer || ''
        ).trim();

        const isCorrect =
          studentAnswer.toLowerCase() ===
          correctAnswer.toLowerCase();

        const pointsEarned = isCorrect
          ? question.points
          : 0;

        totalPoints += question.points;

        if (isCorrect) {
          score += question.points;
        }

        return {
          questionId: question._id,
          answer: studentAnswer,
          isCorrect,
          pointsEarned,
        };
      });

      const submission = await Submission.create({
        activity: activity._id,
        student: student._id,
        section: student.section,
        answers: evaluatedAnswers,
        score,
        totalPoints,
        submittedAt: new Date(),
      });

      return res.status(201).json({
        message: 'Activity submitted successfully',
        score,
        totalPoints,
        percentage:
          totalPoints > 0
            ? Math.round((score / totalPoints) * 100)
            : 0,
        submission,
      });
    } catch (err) {
      console.error(err);

      return res.status(500).json({
        error: 'Failed to submit activity',
      });
    }
  }
);

// =====================================================
// STUDENT: GET MY SUBMISSION
// =====================================================

router.get(
  '/activities/:id/submission',
  requireAuth,
  async (req, res) => {
    try {
      const student = await User.findById(req.userId);

      if (!student || student.role !== 'student') {
        return res.status(403).json({
          error: 'Only students can view submissions',
        });
      }

      const submission = await Submission.findOne({
        activity: req.params.id,
        student: student._id,
      }).populate('activity', 'title topic');

      if (!submission) {
        return res.status(404).json({
          error: 'No submission found',
        });
      }

      return res.json(submission);
    } catch (err) {
      console.error(err);

      return res.status(500).json({
        error: 'Failed to fetch submission',
      });
    }
  }
);

// =====================================================
// TEACHER: VIEW STUDENT RESULTS
// =====================================================

router.get(
  '/activities/:id/results',
  requireAuth,
  async (req, res) => {
    try {
      const teacher = await User.findById(req.userId);

      if (!teacher || teacher.role !== 'teacher') {
        return res.status(403).json({
          error: 'Only teachers can view results',
        });
      }

      const activity = await Activity.findOne({
        _id: req.params.id,
        teacher: teacher._id,
      });

      if (!activity) {
        return res.status(404).json({
          error: 'Activity not found',
        });
      }

      const submissions = await Submission.find({
        activity: activity._id,
      })
        .populate('student', 'name username')
        .sort({ score: -1, submittedAt: 1 });

      return res.json({
        activity: {
          id: activity._id,
          title: activity.title,
          topic: activity.topic,
          totalQuestions: activity.questions.length,
        },
        submissions,
      });
    } catch (err) {
      console.error(err);

      return res.status(500).json({
        error: 'Failed to fetch results',
      });
    }
  }
);

// =====================================================
// TEACHER: VIEW SECTION ACTIVITIES
// =====================================================

router.get(
  '/sections/:sectionId/activities',
  requireAuth,
  async (req, res) => {
    try {
      const teacher = await User.findById(req.userId);

      if (!teacher || teacher.role !== 'teacher') {
        return res.status(403).json({
          error: 'Only teachers can view section activities',
        });
      }

      const section = await Section.findOne({
        _id: req.params.sectionId,
        teacher: teacher._id,
      });

      if (!section) {
        return res.status(404).json({
          error: 'Section not found',
        });
      }

      const activities = await Activity.find({
        section: section._id,
        teacher: teacher._id,
      }).sort({ createdAt: -1 });

      return res.json(activities);
    } catch (err) {
      console.error(err);

      return res.status(500).json({
        error: 'Failed to fetch section activities',
      });
    }
  }
);

module.exports = router;