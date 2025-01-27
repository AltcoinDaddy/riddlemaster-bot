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
               return await interaction.reply('No active riddle in this channel.');
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
               // Update points in database
               const { data: existingUser, error: selectError } = await supabase
                   .from('users')
                   .select('current_round_points, current_round_solved')
                   .eq('discord_id', interaction.user.id)
                   .single();

               if (selectError && selectError.code !== 'PGRST116') {
                   console.error('Error checking user:', selectError);
                   return await interaction.reply('Error updating points!');
               }

               if (existingUser) {
                   const { error: updateError } = await supabase
                       .from('users')
                       .update({
                           current_round_points: (existingUser.current_round_points || 0) + 1,
                           current_round_solved: (existingUser.current_round_solved || 0) + 1
                       })
                       .eq('discord_id', interaction.user.id);

                   if (updateError) {
                       console.error('Error updating user:', updateError);
                       return await interaction.reply('Error updating points!');
                   }
               } else {
                   const { error: insertError } = await supabase
                       .from('users')
                       .insert({
                           discord_id: interaction.user.id,
                           current_round_points: 1,
                           current_round_solved: 1
                       });

                   if (insertError) {
                       console.error('Error creating user:', insertError);
                       return await interaction.reply('Error saving points!');
                   }
               }

               await interaction.reply({
                   embeds: [{
                       title: '🎉 Correct!',
                       description: `${interaction.user.username} solved it!\nAnswer: "${activeRiddle.answer}"\n+1 point this round!`,
                       color: 0x00ff00
                   }]
               });

               if (activeRiddle.isLastRiddle) {
                   // Get final scores and sort them
                   const { data: finalScores } = await supabase
                       .from('users')
                       .select('*')
                       .order('current_round_points', { ascending: false })
                       .limit(3);  // Get top 3

                   let winnersText = '🏆 Round Winners 🏆\n\n';
                   
                   if (finalScores && finalScores.length > 0) {
                       // First Place
                       const firstPlace = await interaction.guild.members.fetch(finalScores[0].discord_id);
                       winnersText += `🥇 First Place: ${firstPlace.displayName} (${finalScores[0].current_round_points} points)\n`;
                       
                       // Second Place
                       if (finalScores.length > 1) {
                           const secondPlace = await interaction.guild.members.fetch(finalScores[1].discord_id);
                           winnersText += `🥈 Second Place: ${secondPlace.displayName} (${finalScores[1].current_round_points} points)\n`;
                       }
                       
                       // Third Place
                       if (finalScores.length > 2) {
                           const thirdPlace = await interaction.guild.members.fetch(finalScores[2].discord_id);
                           winnersText += `🥉 Third Place: ${thirdPlace.displayName} (${finalScores[2].current_round_points} points)\n`;
                       }
                   }

                   await interaction.channel.send({
                       embeds: [{
                           title: '🏁 Round Complete!',
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
           } else {
               await interaction.reply({
                   content: 'Incorrect answer!',
                   ephemeral: true
               });
           }
       } catch (error) {
           console.error('Error:', error);
           return await interaction.reply('Error processing answer!');
       }
   }
};