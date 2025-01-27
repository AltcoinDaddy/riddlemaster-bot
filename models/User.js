const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true
    },
    points: {
        type: Number,
        default: 0
    },
    riddlesSolved: {
        type: Number,
        default: 0
    },
    badges: [{
        type: String
    }],
    categoryPoints: {
        general: { type: Number, default: 0 },
        math: { type: Number, default: 0 },
        wordplay: { type: Number, default: 0 },
        logic: { type: Number, default: 0 }
    },
    lastRiddleTime: {
        type: Date
    }
});

module.exports = mongoose.model('User', userSchema);