const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const supabase = require('../db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('startround')
        .setDescription('Start a new round of riddles')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    async execute(interaction) {
        try {
            // Fix permission check - use single permission strings
            if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageGuild) && 
                !interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
                return await interaction.reply({
                    content: 'You need Manage Server or Administrator permissions to start rounds!',
                    ephemeral: true
                });
            }

            await supabase
                .from('users')
                .delete()
                .neq('discord_id', '');

            const roundNumber = global.roundManager.startNewRound();
            
            return await interaction.reply({
                embeds: [{
                    title: '🎮 New Round Started!',
                    description: `Round ${roundNumber} has begun!\nLeaderboard has been reset.`,
                    color: 0x00ff00
                }]
            });
        } catch (error) {
            console.error('Start round error:', error);
            return await interaction.reply({ 
                content: 'An error occurred while starting the round.',
                ephemeral: true 
            });
        }
    }
};