const { SlashCommandBuilder } = require('@discordjs/builders');
const moment = require('moment');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('timestamp')
        .setDescription('Generates a Discord timestamp with a specified format.')
        .addStringOption(option =>
            option.setName('datetime')
                .setDescription('The date and time in format YYYY-MM-DD HH:mm')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('flag')
                .setDescription('The timestamp flag (t, T, d, D, f, F, R)')
                .setRequired(true)),
    async execute(interaction) {
        const datetime = interaction.options.getString('datetime');
        const flag = interaction.options.getString('flag');

        // Validate the flag
        const validFlags = ['t', 'T', 'd', 'D', 'f', 'F', 'R'];
        if (!validFlags.includes(flag)) {
            return interaction.reply({ content: 'Invalid flag. Please use one of the following: t, T, d, D, f, F, R.', ephemeral: true });
        }

        // Parse the datetime string
        const parsedDate = moment(datetime, 'YYYY-MM-DD HH:mm', true);
        if (!parsedDate.isValid()) {
            return interaction.reply({ content: 'Invalid datetime format. Please use the format YYYY-MM-DD HH:mm.', ephemeral: true });
        }

        // Convert to UNIX timestamp
        const unixTimestamp = parsedDate.unix();

        // Generate the timestamp
        const discordTimestamp = `<t:${unixTimestamp}:${flag}>`;

        // Send the timestamp
        interaction.reply({ content: `**Timestamp from ${datetime} with ${flag}**\n \`\`\`${discordTimestamp}\`\`\`\n **Chat display**\n${discordTimestamp}`, ephemeral: false });
    },
};