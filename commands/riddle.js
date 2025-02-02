const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('riddle')
        .setDescription('Post a riddle')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
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
            // Fixed permission check
            if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
                return await interaction.reply({
                    content: 'Only moderators can post riddles!',
                    flags: { ephemeral: true }
                });
            }

            if (!global.roundManager.isRoundActive) {
                return await interaction.reply({
                    content: 'No active round! Use /startround to begin.',
                    flags: { ephemeral: true }
                });
            }

            const question = interaction.options.getString('question');
            const answer = interaction.options.getString('answer');
            const timeLimit = 30000; // 30 seconds

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
                    title: `🧩 Riddle ${currentQuestion}/${global.roundManager.maxQuestions}`,
                    description: question,
                    color: 0x00ff00,
                    footer: {
                        text: isLastRiddle ? '🔥 Final riddle of this round!' : `${global.roundManager.maxQuestions - currentQuestion} riddles remaining`
                    }
                }]
            });

            // Only increment after successful riddle post
            global.roundManager.addQuestion();

        } catch (error) {
            console.error('Error:', error);
            await interaction.reply({
                content: 'Error executing command!',
                flags: { ephemeral: true }
            });
        }
    },
};