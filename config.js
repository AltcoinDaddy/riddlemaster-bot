require('dotenv').config();

module.exports = {
    token: process.env.DISCORD_TOKEN,
    clientId: process.env.CLIENT_ID,
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseKey: process.env.SUPABASE_ANON_KEY,
    defaultPrefix: '!',
    cooldownPeriod: 30, // seconds
    pointsPerSolve: {
        easy: 1,
        medium: 2,
        hard: 3
    },
    hintCost: 1
};