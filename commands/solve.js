const { SlashCommandBuilder } = require('discord.js');
const supabase = require('../db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('solve')
        .setDescription('Submit an answer')
        .addStringOption(option =>
            option.setName('answer')
            .setDescription('Your answer to the riddle')
            .setRequired(true)),
    async execute(interaction) {
        try {
            const activeRiddle = global.activeRiddles?.get(interaction.channelId);
            if (!activeRiddle) {
                return await interaction.reply({
                    content: 'No active riddle in this channel.',
                    ephemeral: true
                });
            }

            if (activeRiddle.solved) {
                return await interaction.reply({
                    content: 'This riddle has already been solved!',
                    ephemeral: true
                });
            }

            const userAnswer = interaction.options.getString('answer').toLowerCase().trim();

            if (activeRiddle.attempts.has(interaction.user.id)) {
                return await interaction.reply({
                    content: 'You already attempted this riddle!',
                    ephemeral: true
                });
            }

            activeRiddle.attempts.add(interaction.user.id);

            if (userAnswer === activeRiddle.answer.toLowerCase()) {
                activeRiddle.solved = true;

                try {
                    // Get current score
                    const { data: userData } = await supabase
                        .from('users')
                        .select('score')
                        .eq('discord_id', interaction.user.id)
                        .single();

                    const newScore = (userData?.score || 0) + 1;

                    // Update score in database
                    await supabase
                        .from('users')
                        .upsert({
                            discord_id: interaction.user.id,
                            score: newScore
                        }, {
                            onConflict: 'discord_id',
                            update: { score: newScore }
                        });

                    // Send success message
                    await interaction.reply({
                        embeds: [{
                            title: '🎉 Correct Answer!',
                            description: `${interaction.user} solved it!\nAnswer: ${activeRiddle.answer}`,
                            color: 0x00ff00
                        }]
                    });

                    // Handle round ending
                    if (activeRiddle.isLastRiddle) {
                        const { data: winners } = await supabase
                            .from('users')
                            .select('discord_id, score')
                            .gt('score', 0)
                            .order('score', { ascending: false })
                            .limit(3);

                        let winnersText = '🏆 Round Complete! 🏆\n\n';
                        
                        if (winners?.length > 0) {
                            const medals = ['🥇', '🥈', '🥉'];
                            for (const [index, winner] of winners.entries()) {
                                const member = await interaction.guild.members.fetch(winner.discord_id);
                                winnersText += `${medals[index]} ${member.displayName}: ${winner.score} points\n`;
                            }
                        }

                        await interaction.channel.send({
                            embeds: [{
                                title: '🎊 Round Results 🎊',
                                description: winnersText,
                                color: 0xffd700,
                                footer: {
                                    text: 'Use /startround to begin a new round!'
                                }
                            }]
                        });

                        global.roundManager.isRoundActive = false;
                    }

                    global.activeRiddles.delete(interaction.channelId);

                } catch (error) {
                    console.error('Error:', error);
                    if (!interaction.replied) {
                        await interaction.reply({
                            content: 'Error updating score!',
                            ephemeral: true
                        });
                    }
                }
            } else {
                await interaction.reply({
                    content: 'Incorrect answer!',
                    ephemeral: true
                });
            }
        } catch (error) {
            console.error('Error:', error);
            if (!interaction.replied) {
                await interaction.reply({
                    content: 'Error processing answer!',
                    ephemeral: true
                });
            }
        }
    }
};