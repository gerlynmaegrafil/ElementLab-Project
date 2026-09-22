// backend/models/Activity.js

const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      enum: ['multiple-choice', 'true-false', 'short-answer'],
      default: 'multiple-choice',
    },

    choices: {
      type: [String],
      default: [],
    },

    correctAnswer: {
      type: String,
      required: true,
      trim: true,
    },

    points: {
      type: Number,
      default: 1,
      min: 1,
    },
  },
  { _id: true }
);

const ActivitySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
      default: '',
    },

    topic: {
      type: String,
      enum: [
        'atomic-structure',
        'element-information',
        'periodic-trends',
        'chemical-reactions',
        'concept-question',
      ],
      required: true,
    },

    section: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Section',
      required: true,
    },

    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    questions: {
      type: [QuestionSchema],
      default: [],
    },

    isPublished: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Activity', ActivitySchema);