const { SlashCommandBuilder, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reactionroles')
        .setDescription('Send a message with reactions that grant roles')
        .addStringOption(option =>
            option.setName('message')
                .setDescription('Text message to send')
                .setRequired(true)
        )
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Target channel to send the message to')
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildText)
        )
        .addRoleOption(option =>
            option.setName('role1')
                .setDescription('First role to assign')
                .setRequired(true)
        )
        .addRoleOption(option =>
            option.setName('role2')
                .setDescription('Second role to assign')
                .setRequired(true)
        )
        .addRoleOption(option =>
            option.setName('role3')
                .setDescription('Third role to assign')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('reaction-emojis')
                .setDescription('Three emojis separated by spaces (unicode or custom)')
                .setRequired(true)
        ),

    async execute(interaction) {
        const targetChannel = interaction.options.getChannel('channel');
        const messageText = interaction.options.getString('message');
        const role1 = interaction.options.getRole('role1');
        const role2 = interaction.options.getRole('role2');
        const role3 = interaction.options.getRole('role3');
        const emojisInput = interaction.options.getString('reaction-emojis');

        if (!targetChannel || targetChannel.type !== ChannelType.GuildText) {
            return interaction.reply({ content: 'Please provide a valid text channel.', ephemeral: true });
        }

        const emojiTokens = emojisInput.trim().split(/\s+/);
        if (emojiTokens.length !== 3) {
            return interaction.reply({ content: 'Please provide exactly three emojis separated by spaces.', ephemeral: true });
        }

        // Parse emojis (supports unicode and custom <a:name:id> or <:name:id>)
        const parsedEmojis = emojiTokens.map(token => {
            const customMatch = token.match(/^<a?:\w+:(\d+)>$/);
            if (customMatch) {
                return { input: token, key: customMatch[1], reactId: customMatch[1] };
            }
            return { input: token, key: token, reactId: token };
        });

        try {
            const sent = await targetChannel.send({ content: messageText });

            // React sequentially to ensure ordering
            for (const p of parsedEmojis) {
                await sent.react(p.reactId);
            }

            // Store mapping on the client for reaction handler to use
            const mapping = new Map();
            mapping.set(parsedEmojis[0].key, role1.id);
            mapping.set(parsedEmojis[1].key, role2.id);
            mapping.set(parsedEmojis[2].key, role3.id);

            // Initialize map container on client if not present (defensive)
            if (!interaction.client.reactionRoleMaps) {
                interaction.client.reactionRoleMaps = new Map();
            }
            interaction.client.reactionRoleMaps.set(sent.id, {
                guildId: interaction.guildId,
                channelId: targetChannel.id,
                emojiToRoleId: mapping,
            });

            await interaction.reply({ content: `Reaction roles message sent in #${targetChannel.name}. Users can react to get roles.`, ephemeral: true });
        } catch (error) {
            console.error('Error creating reaction roles message:', error);
            await interaction.reply({ content: 'Failed to send message or add reactions. Check my permissions and emoji formatting.', ephemeral: true });
        }
    },
};


