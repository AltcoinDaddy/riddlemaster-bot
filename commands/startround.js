const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const supabase = require('../db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('startround')
        .setDescription('Start a new round of riddles')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    async execute(interaction) {
        try {
            // Delete all records from users table
            const { error: deleteError } = await supabase
                .from('users')
                .delete()
                .neq('discord_id', '');

            if (deleteError) {
                console.error('Error deleting users:', deleteError);
                return await interaction.reply('Error resetting leaderboard!');
            }

            const roundNumber = global.roundManager.startNewRound();
            return await interaction.reply(`Round ${roundNumber} started! Leaderboard has been reset!`);
        } catch (error) {
            console.error('Error:', error);
            return await interaction.reply('Error starting round!');
        }
    }
};