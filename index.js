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

// Initialize collections
client.commands = new Collection();
global.roundManager = new RoundManager();
global.activeRiddles = new Map();

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
        await command.execute(interaction);
    } catch (error) {
        console.error('Error executing command:', error);
        try {
            await interaction.reply({ content: 'Error executing command!', ephemeral: true });
        } catch (e) {
            console.error('Error sending error message:', e);
        }
    }
});

client.once('ready', () => {
    console.log('RiddleMaster is online!');
});

// Error handling
process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});

client.login(token);