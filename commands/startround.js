const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const supabase = require('../db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('startround')
        .setDescription('Start a new round of riddles')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
    async execute(interaction) {
        try {
            // Reset all scores to 0
            await supabase
                .from('users')
                .update({ score: 0 })
                .neq('discord_id', '');

            global.roundManager.startNewRound();
            
            await interaction.reply({
                embeds: [{
                    title: '🎮 New Round Started!',
                    description: 'A new round has begun!\nLeaderboard has been reset.',
                    color: 0x00ff00
                }]
            });
        } catch (error) {
            console.error('Start round error:', error);
            if (!interaction.replied) {
                await interaction.reply({
                    content: 'An error occurred while starting the round.',
                    ephemeral: true
                });
            }
        }
    }
};