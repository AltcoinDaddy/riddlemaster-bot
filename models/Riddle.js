const mongoose = require('mongoose');

const riddleSchema = new mongoose.Schema({
    question: {
        type: String,
        required: true
    },
    answer: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true,
        enum: ['general', 'math', 'wordplay', 'logic']
    },
    difficulty: {
        type: String,
        required: true,
        enum: ['easy', 'medium', 'hard']
    },
    hints: [{
        type: String
    }],
    addedBy: {
        type: String,
        required: true
    },
    approved: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    timesUsed: {
        type: Number,
        default: 0
    },
    timesSolved: {
        type: Number,
        default: 0
    }
});

module.exports = mongoose.model('Riddle', riddleSchema);