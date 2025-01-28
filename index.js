const { Client, GatewayIntentBits, Collection } = require('discord.js');
const RoundManager = require('./roundManager');
const fs = require('fs');
const path = require('path');
const { token } = require('./config');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent
    ]
});

global.roundManager = new RoundManager();
client.commands = new Collection();

// Load commands
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    client.commands.set(command.data.name, command);
}

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await interaction.deferReply();
        await command.execute(interaction);
    } catch (error) {
        console.error('Error:', error);
        try {
            if (interaction.deferred) {
                await interaction.editReply('An error occurred! Please try again.');
            } else {
                await interaction.reply('An error occurred! Please try again.');
            }
        } catch (err) {
            console.error('Error sending error message:', err);
        }
    }
});

client.once('ready', () => {
    console.log('RiddleMaster is online!');
});

process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});

client.login(token);