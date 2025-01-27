const { SlashCommandBuilder } = require('discord.js');
const supabase = require('../db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('View the current round\'s leaderboard'),
    async execute(interaction) {
        try {
            const { data: users } = await supabase
                .from('users')
                .select('*')
                .order('current_round_points', { ascending: false });

            if (!users || users.length === 0) {
                return await interaction.reply('No scores recorded for this round yet!');
            }

            const leaderboardEmbed = {
                title: '🏆 Current Round Leaderboard',
                description: `Current Round: ${global.roundManager.currentRound || 1}`,
                fields: [],
                color: 0xffd700
            };

            const solvers = users.filter(u => u.current_round_solved > 0);
            if (solvers.length > 0) {
                let solversText = '';
                for (let i = 0; i < solvers.length; i++) {
                    const user = solvers[i];
                    try {
                        const member = await interaction.guild.members.fetch(user.discord_id);
                        solversText += `${i + 1}. ${member.displayName}: ${user.current_round_points} points (${user.current_round_solved} solved)\n`;
                    } catch (e) {
                        console.error(`Could not fetch member ${user.discord_id}`);
                    }
                }
                leaderboardEmbed.fields.push({
                    name: '🎯 Solved Riddles',
                    value: solversText || 'No riddles solved yet',
                    inline: false
                });
            }

            await interaction.reply({ embeds: [leaderboardEmbed] });
        } catch (error) {
            console.error('Error:', error);
            await interaction.reply('Error fetching leaderboard!');
        }
    }
};