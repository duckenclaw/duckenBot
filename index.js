// Require the necessary discord.js classes
const { Client, Events, GatewayIntentBits, Collection, Partials } = require('discord.js');
const { token } = require('./config.json');
const fs = require('node:fs');
const path = require('node:path');
const { channel } = require('node:diagnostics_channel');

// Create a new client instance
const client = new Client({ 
		intents: [
			GatewayIntentBits.Guilds,
			GatewayIntentBits.GuildMessages,
			GatewayIntentBits.MessageContent,
			GatewayIntentBits.GuildMembers,
			GatewayIntentBits.GuildMessageTyping,
			GatewayIntentBits.GuildMessageReactions,
		],
		partials: [Partials.Message, Partials.Channel, Partials.Reaction]
	});

client.commands = new Collection();
client.reactionRoleMaps = new Map();

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);
let loadedCommandCount = 0;

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        // Set a new item in the Collection with the key as the command name and the value as the exported module
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
            loadedCommandCount++;
        } else {
            console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }
}
console.log(`Loaded ${loadedCommandCount} commands from ${commandFolders.length} folders.`);

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);
    try {
        const userTag = interaction.user?.tag ?? 'unknown#0000';
        const userId = interaction.user?.id ?? 'unknown';
        const guildId = interaction.guild?.id ?? 'DM';
        console.log(`[Interaction] /${interaction.commandName} by ${userTag} (${userId}) in guild ${guildId}`);
    } catch {}

    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }

    try {
        await command.execute(interaction);
        console.log(`[Interaction] /${interaction.commandName} executed successfully.`);
    } catch (error) {
        console.error('Error executing command:', error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
        } else {
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    }
});

// Handle reaction adds to assign roles based on configured mappings
client.on(Events.MessageReactionAdd, async (reaction, user) => {
    try {
        if (user.bot) return;

        // Ensure complete data when using partials
        if (reaction.partial) {
            try { await reaction.fetch(); } catch (e) { return; }
        }
        if (reaction.message.partial) {
            try { await reaction.message.fetch(); } catch (e) { return; }
        }

        const messageId = reaction.message.id;
        const emojiLog = reaction.emoji.id ?? reaction.emoji.name;
        console.log(`[ReactionAdd] messageId=${messageId} emoji=${emojiLog} userId=${user.id}`);
        const mappingContainer = client.reactionRoleMaps.get(messageId);
        if (!mappingContainer) {
            console.log('[ReactionAdd] No mapping for this message. Ignoring.');
            return;
        }

        const key = reaction.emoji.id ?? reaction.emoji.name;
        const roleId = mappingContainer.emojiToRoleId.get(key);
        if (!roleId) {
            console.log('[ReactionAdd] Emoji not mapped. Ignoring.');
            return;
        }

        const guild = reaction.message.guild;
        if (!guild) {
            console.log('[ReactionAdd] No guild on message.');
            return;
        }

        const member = await guild.members.fetch(user.id).catch(() => null);
        if (!member) {
            console.log('[ReactionAdd] Could not fetch member.');
            return;
        }

        // If user already has any of the roles in this mapping, skip
        const anyRoleAlreadyAssigned = Array.from(mappingContainer.emojiToRoleId.values())
            .some(rid => member.roles.cache.has(rid));
        if (anyRoleAlreadyAssigned) {
            console.log('[ReactionAdd] Member already has one of the mapped roles. Skipping.');
            return;
        }

        await member.roles.add(roleId).then(() => {
            console.log(`[ReactionAdd] Assigned role ${roleId} to user ${user.id}.`);
        }).catch(err => {
            console.error('[ReactionAdd] Failed to assign role:', err);
        });
    } catch (err) {
        console.error('Error handling MessageReactionAdd:', err);
    }
});

client.once(Events.ClientReady, readyClient => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);
    try {
        console.log(`Connected guilds: ${readyClient.guilds.cache.size}`);
    } catch {}
});

client.on(Events.ShardError, error => {
	console.error('A websocket connection encountered an error:', error);
});

client.on('warn', info => {
	console.warn('[Warn]', info);
});

client.on('error', error => {
	console.error('[Error event]', error);
});

// Log in to Discord with your client's token
client.login(token);