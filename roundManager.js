class RoundManager {
    constructor() {
        this.currentRound = 0;
        this.questionsInRound = 0;
        this.maxQuestions = 5;
        this.isRoundActive = false;
    }

    startNewRound() {
        this.currentRound++;
        this.questionsInRound = 0;
        this.isRoundActive = true;
        return this.currentRound;
    }

    addQuestion() {
        this.questionsInRound++;
        if (this.questionsInRound >= this.maxQuestions) {
            this.isRoundActive = false;
            return true;
        }
        return false;
    }
}

module.exports = RoundManager;