const { SlashCommandBuilder } = require('discord.js');
const supabase = require('../db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('View current scores'),
    async execute(interaction) {
        try {
            // Get top scores
            const { data: users, error } = await supabase
                .from('users')
                .select('discord_id, score')
                .gt('score', 0)
                .order('score', { ascending: false })
                .limit(10);

            if (error) throw error;

            if (!users || users.length === 0) {
                return await interaction.reply({
                    content: 'No scores recorded yet!',
                    ephemeral: true
                });
            }

            let leaderboardText = '';
            for (let i = 0; i < users.length; i++) {
                try {
                    const member = await interaction.guild.members.fetch(users[i].discord_id);
                    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
                    leaderboardText += `${medal} ${member.displayName}: ${users[i].score} points\n`;
                } catch (err) {
                    console.error(`Could not fetch member ${users[i].discord_id}:`, err);
                }
            }

            await interaction.reply({
                embeds: [{
                    title: '🏆 Current Scores',
                    description: leaderboardText || 'Error displaying scores',
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