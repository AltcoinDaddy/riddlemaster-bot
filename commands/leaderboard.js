const { SlashCommandBuilder } = require('discord.js');
const supabase = require('../db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('View current scores'),
    async execute(interaction) {
        try {
            const { data: scores, error } = await supabase
                .from('users')
                .select('discord_id, score')
                .gt('score', 0)
                .order('score', { ascending: false })
                .limit(10);

            if (error) {
                console.error('Database error:', error);
                return await interaction.reply({
                    content: 'Error fetching scores!',
                    ephemeral: true
                });
            }

            if (!scores || scores.length === 0) {
                return await interaction.reply({
                    content: 'No scores recorded yet!',
                    ephemeral: true
                });
            }

            let leaderboardText = '';
            const medals = ['🥇', '🥈', '🥉'];

            for (let i = 0; i < scores.length; i++) {
                try {
                    const member = await interaction.guild.members.fetch(scores[i].discord_id);
                    const prefix = i < 3 ? medals[i] : `${i + 1}.`;
                    leaderboardText += `${prefix} ${member.displayName}: ${scores[i].score} points\n`;
                } catch (err) {
                    console.error(`Could not fetch member ${scores[i].discord_id}:`, err);
                }
            }

            await interaction.reply({
                embeds: [{
                    title: '🏆 Current Scores',
                    description: leaderboardText || 'No scores to display',
                    color: 0xFFD700
                }]
            });

        } catch (error) {
            console.error('Error:', error);
            if (!interaction.replied) {
                await interaction.reply({
                    content: 'Error fetching leaderboard!',
                    ephemeral: true
                });
            }
        }
    }
};