const User = require('../models/User');

const badges = {
    NOVICE_SOLVER: 'Novice Solver',
    EXPERT_SOLVER: 'Expert Solver',
    MASTER_SOLVER: 'Master Solver',
    CATEGORY_SPECIALIST: 'Category Specialist',
    SPEED_DEMON: 'Speed Demon'
};

async function checkAndAwardBadges(user) {
    const newBadges = [];

    // Check for solving milestones
    if (user.riddlesSolved >= 10 && !user.badges.includes(badges.NOVICE_SOLVER)) {
        newBadges.push(badges.NOVICE_SOLVER);
    }
    if (user.riddlesSolved >= 50 && !user.badges.includes(badges.EXPERT_SOLVER)) {
        newBadges.push(badges.EXPERT_SOLVER);
    }
    if (user.riddlesSolved >= 100 && !user.badges.includes(badges.MASTER_SOLVER)) {
        newBadges.push(badges.MASTER_SOLVER);
    }

    // Check for category specialization
    const categoryThreshold = 25;
    for (const category in user.categoryPoints) {
        if (user.categoryPoints[category] >= categoryThreshold) {
            const specialistBadge = `${category.charAt(0).toUpperCase() + category.slice(1)} Specialist`;
            if (!user.badges.includes(specialistBadge)) {
                newBadges.push(specialistBadge);
            }
        }
    }

    if (newBadges.length > 0) {
        await User.findOneAndUpdate(
            { userId: user.userId },
            { $push: { badges: { $each: newBadges } } }
        );
        return newBadges;
    }

    return null;
}

module.exports = {
    badges,
    checkAndAwardBadges
};