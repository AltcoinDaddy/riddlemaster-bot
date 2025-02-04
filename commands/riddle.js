const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('riddle')
        .setDescription('Post a riddle')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addStringOption(option =>
            option.setName('question')
            .setDescription('The riddle question')
            .setRequired(true))
        .addStringOption(option =>
            option.setName('answer')
            .setDescription('The riddle answer')
            .setRequired(true)),
    async execute(interaction) {
        try {
            if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageMessages)) {
                return interaction.reply({
                    content: 'Only moderators can post riddles!',
                    ephemeral: true
                });
            }

            if (!global.roundManager.isRoundActive) {
                return interaction.reply({
                    content: 'No active round! Use /startround to begin.',
                    ephemeral: true
                });
            }

            const question = interaction.options.getString('question');
            const answer = interaction.options.getString('answer');

            const currentQuestion = global.roundManager.questionsInRound + 1;
            const isLastRiddle = currentQuestion >= global.roundManager.maxQuestions;

            global.activeRiddles = global.activeRiddles || new Map();
            global.activeRiddles.set(interaction.channelId, {
                answer: answer,
                attempts: new Set(),
                isLastRiddle: isLastRiddle,
                solved: false
            });

            await interaction.reply({
                embeds: [{
                    title: '🧩 Riddle',
                    description: question,
                    color: 0x00ff00,
                    footer: {
                        text: isLastRiddle ? '🔥 Final riddle!' : 'Keep going!'
                    }
                }]
            });

            global.roundManager.addQuestion();

        } catch (error) {
            console.error('Error:', error);
            if (!interaction.replied) {
                await interaction.reply({
                    content: 'Error posting riddle!',
                    ephemeral: true
                });
            }
        }
    }
};