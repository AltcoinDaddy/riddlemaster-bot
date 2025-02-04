class RoundManager {
    constructor() {
        this.currentRound = 0;
        this.questionsInRound = 0;
        this.maxQuestions = 5;
        this.isRoundActive = false;
        this.scores = new Map();
    }

    startNewRound() {
        this.currentRound++;
        this.questionsInRound = 0;
        this.isRoundActive = true;
        this.scores.clear();
        return this.currentRound;
    }

    addQuestion() {
        this.questionsInRound++;
        return this.questionsInRound >= this.maxQuestions;
    }

    addScore(userId) {
        const currentScore = this.scores.get(userId) || 0;
        this.scores.set(userId, currentScore + 1);
        return this.scores.get(userId);
    }

    getScores() {
        return Array.from(this.scores.entries()).map(([userId, score]) => ({
            userId,
            score
        })).sort((a, b) => b.score - a.score);
    }
}

module.exports = RoundManager;