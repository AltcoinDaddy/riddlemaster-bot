const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const supabase = require('../db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('startround')
        .setDescription('Start a new round of riddles')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    async execute(interaction) {
        try {
            if (!interaction.member.permissions.has('MANAGE_GUILD')) {
                return await interaction.reply({ 
                    content: 'Only moderators can start rounds!',
                    ephemeral: true 
                });
            }

            // Delete all records from users table
            try {
                await supabase
                    .from('users')
                    .delete()
                    .neq('discord_id', '');
            } catch (dbError) {
                console.error('Database error:', dbError);
            }

            const roundNumber = global.roundManager.startNewRound();

            // Single reply at the end
            return await interaction.reply(`🎮 Round ${roundNumber} started! Leaderboard has been reset!`);

        } catch (error) {
            console.error('Error:', error);
            // Only reply if we haven't already
            if (!interaction.replied) {
                return await interaction.reply({ 
                    content: 'Error starting round!',
                    ephemeral: true 
                });
            }
        }
    }
};