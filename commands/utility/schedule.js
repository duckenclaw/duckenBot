const { SlashCommandBuilder, ChannelType } = require('discord.js');
const schedule = require('node-schedule');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('schedule')
        .setDescription('Schedules a message to be sent to the specified text channel.')
        .addChannelOption(option => 
            option.setName('channel')
                .setDescription('The channel to send the message to')
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildText))
        .addStringOption(option => 
            option.setName('message')
                .setDescription('The message to send')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('datetime')
                .setDescription('The time to send the message in YYYY-MM-DD HH:mm format')
                .setRequired(true)),
        
    async execute(interaction) {
        const channel = interaction.options.getChannel('channel');
        const messageContent = interaction.options.getString('message');
        const datetime = interaction.options.getString('datetime');

        console.log(`Retrieved channel: ${channel.id}, type: ${channel.type}`);
        console.log('Channel object: #', channel);
        console.log('Scheduled time:', datetime);

        if (!channel || channel.type !== ChannelType.GuildText) {
            return interaction.reply({ content: 'Please select a valid text channel.', ephemeral: true });
        }

        const date = new Date(datetime);
        if (isNaN(date.getTime())) {
            return interaction.reply({ content: 'Please provide a valid date and time in the format YYYY-MM-DD HH:mm.', ephemeral: true });
        }

        try {
            schedule.scheduleJob(date, async () => {
                try {
                    await channel.send(messageContent);
                    console.log(`Message sent to #${channel.name} at ${date}`);
                } catch (error) {
                    console.error('Error sending message:', error);
                }
            });
            await interaction.reply({ content: `Message scheduled to be sent to ${channel.name} at ${time}`, ephemeral: true });
        } catch (error) {
            console.error('Error scheduling message:', error);
            await interaction.reply({ content: `There was an error scheduling the message: ${error.message}`, ephemeral: true });
        }
    },
};