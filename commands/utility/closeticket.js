const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('closeticket')
        .setDescription('Closes the current ticket channel.'),
    async execute(interaction) {
        // Call the function to close the ticket
        await closeTicket(interaction);
    },
};
async function closeTicket(interaction) {
    const channel = interaction.channel;

    // Check if the channel is a ticket channel
    if (!channel.name.startsWith('ticket-')) {
        return interaction.reply({ content: 'This command can only be used in a ticket channel.', ephemeral: true });
    }

    await interaction.followUp({ content: 'Ticket is closing...', ephemeral: true });
    await channel.delete();

}