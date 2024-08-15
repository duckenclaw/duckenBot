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

    // Ask for confirmation before closing the ticket
    await interaction.reply({ content: 'Are you sure you want to close this ticket? Type "confirm" to close.', ephemeral: true });

    // Create a message collector to await the user's confirmation
    const filter = (response) => response.content.toLowerCase() === 'confirm' && response.author.id === interaction.user.id;
    const collector = channel.createMessageCollector({ filter, time: 15000, max: 1 });

    collector.on('collect', async () => {
        // User confirmed, delete the channel
        await interaction.followUp({ content: 'Ticket is closing...', ephemeral: true });
        await channel.delete();
    });

    collector.on('end', (collected) => {
        if (collected.size === 0) {
            interaction.followUp({ content: 'Ticket close request timed out. Please try again if you still want to close the ticket.', ephemeral: true });
        }
    });
}