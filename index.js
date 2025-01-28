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

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    client.commands.set(command.data.name, command);
}

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        const errorMessage = { content: 'An error occurred!', ephemeral: true };
        try {
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(errorMessage);
            } else {
                await interaction.reply(errorMessage);
            }
        } catch (err) {
            console.error('Error sending error message:', err);
        }
    }
});

client.once('ready', () => {
    console.log('RiddleMaster is online!');
});

client.login(token);