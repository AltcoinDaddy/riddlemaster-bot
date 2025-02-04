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
                    const { data } = await supabase
                        .from('users')
                        .select('score')
                        .eq('discord_id', interaction.user.id)
                        .single();

                    const newScore = (data?.score || 0) + 1;

                    // Update score
                    await supabase
                        .from('users')
                        .upsert({
                            discord_id: interaction.user.id,
                            score: newScore
                        });

                    // Send success message
                    await interaction.reply({
                        embeds: [{
                            title: '🎉 Correct Answer!',
                            description: `${interaction.user} solved it!\nAnswer: ${activeRiddle.answer}\nPoints: ${newScore}`,
                            color: 0x00ff00
                        }]
                    });

                    // Handle round end if last riddle
                    if (activeRiddle.isLastRiddle) {
                        const { data: winners } = await supabase
                            .from('users')
                            .select('discord_id, score')
                            .gt('score', 0)
                            .order('score', { ascending: false })
                            .limit(3);

                        if (winners?.length > 0) {
                            let winnerText = '🏆 Winners 🏆\n\n';
                            const medals = ['🥇', '🥈', '🥉'];
                            
                            for (let i = 0; i < winners.length; i++) {
                                try {
                                    const member = await interaction.guild.members.fetch(winners[i].discord_id);
                                    winnerText += `${medals[i]} ${member.displayName}: ${winners[i].score} points\n`;
                                } catch (err) {
                                    console.error('Error fetching member:', err);
                                }
                            }

                            await interaction.channel.send({
                                embeds: [{
                                    title: '🎉 Round Complete!',
                                    description: winnerText,
                                    color: 0xffd700
                                }]
                            });
                        }

                        global.roundManager.isRoundActive = false;
                    }

                    global.activeRiddles.delete(interaction.channelId);

                } catch (error) {
                    console.error('Error:', error);
                    await interaction.reply({
                        content: 'Error updating score!',
                        ephemeral: true
                    });
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