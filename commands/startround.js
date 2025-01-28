const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const supabase = require('../db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('startround')
        .setDescription('Start a new round of riddles')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    async execute(interaction) {
        if (!interaction.member.permissions.has('MANAGE_GUILD')) {
            return await interaction.reply({ 
                content: 'Only moderators can start rounds!',
                ephemeral: true 
            });
        }

        try {
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
            throw error;
        }
    }
};