const { Client, GatewayIntentBits, Collection } = require('discord.js');
const RoundManager = require('./roundManager');
const fs = require('fs');
const path = require('path');
const { token } = require('./config');
const supabase = require('./db');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildModeration
    ]
});

// Initialize global managers
global.roundManager = new RoundManager();
global.activeRiddles = new Map();
client.commands = new Collection();

// Load commands
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    client.commands.set(command.data.name, command);
}

// Handle slash commands
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(`Command error:`, error);
    }
});

// Handle message-based riddle solving
client.on('messageCreate', async message => {
    if (message.author.bot) return;

    const activeRiddle = global.activeRiddles?.get(message.channelId);
    if (!activeRiddle || activeRiddle.solved) return;

    // For debugging
    console.log('Message:', message.content);
    console.log('Answer:', activeRiddle.answer);

    if (message.content.toLowerCase().trim() === activeRiddle.answer.toLowerCase().trim()) {
        activeRiddle.solved = true;
        
        try {
            // Get current score
            const { data: userData } = await supabase
                .from('users')
                .select('score')
                .eq('discord_id', message.author.id)
                .single();

            const newScore = (userData?.score || 0) + 1;

            // Update score
            await supabase
                .from('users')
                .upsert({
                    discord_id: message.author.id,
                    score: newScore
                });

            // Send success message
            await message.channel.send({
                embeds: [{
                    title: '🎉 Correct Answer!',
                    description: `${message.author} solved it!\nAnswer: ${activeRiddle.answer}\nPoints: ${newScore}`,
                    color: 0x00ff00
                }]
            });

            if (activeRiddle.isLastRiddle) {
                const { data: winners } = await supabase
                    .from('users')
                    .select('discord_id, score')
                    .gt('score', 0)
                    .order('score', { ascending: false })
                    .limit(3);

                if (winners?.length > 0) {
                    let winnersText = '🏆 Round Complete! 🏆\n\n';
                    const medals = ['🥇', '🥈', '🥉'];
                    
                    for (let i = 0; i < winners.length; i++) {
                        try {
                            const member = await message.guild.members.fetch(winners[i].discord_id);
                            winnersText += `${medals[i]} ${member.displayName}: ${winners[i].score} points\n`;
                        } catch (err) {
                            console.error(`Could not fetch member ${winners[i].discord_id}:`, err);
                        }
                    }

                    // Send round end message
                    await message.channel.send({
                        embeds: [{
                            title: '🎊 Round Results 🎊',
                            description: winnersText,
                            color: 0xffd700,
                            footer: {
                                text: '🎮 Use /startround to begin a new round!'
                            }
                        }]
                    });
                }

                global.roundManager.isRoundActive = false;
            }

            global.activeRiddles.delete(message.channelId);

        } catch (error) {
            console.error('Error:', error);
            await message.channel.send('An error occurred!');
        }
    }
});

client.once('ready', () => {
    console.log('RiddleMaster is online!');
});

client.on('error', error => {
    console.error('Client error:', error);
});

process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});

client.login(token).catch(error => {
    console.error('Failed to login:', error);
});