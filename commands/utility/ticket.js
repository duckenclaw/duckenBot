const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket')
        .setDescription('Creates a private support ticket.'),
    async execute(interaction) {
        // Call the function to create the ticket
        await createTicket(interaction);
    },
};
async function createTicket(interaction) {
    const guild = interaction.guild;
    const user = interaction.user;

    // Find or create a category for tickets
    let ticketCategory = guild.channels.cache.find(c => c.name === "Tickets" && c.type === 4); // 4 = Category type

    if (!ticketCategory) {
        ticketCategory = await guild.channels.create({
            name: "Tickets",
            type: 4 // Category type
        });
    }

    // Get the current ticket number based on the existing channels
    const ticketNumber = guild.channels.cache.filter(c => c.name.startsWith('ticket-')).size + 1;

    // Create the channel with the correct permissions
    const ticketChannel = await guild.channels.create({
        name: `ticket-${ticketNumber}`,
        type: 0, // 0 = Text channel type
        parent: ticketCategory.id,
        permissionOverwrites: [
            {
                id: guild.roles.everyone.id,
                deny: ['ViewChannel'],
            },
            {
                id: user.id,
                allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'],
            },
            {
                id: "1260642087431438376", // Moderator role ID
                allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'],
            },
            {
                id: "1267092995619160158", // Bot id
                allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory', 'ManageChannels'],
            }
        ]
    });

    // Send a confirmation message to the user
    await interaction.reply({ content: `Your ticket has been created: #${ticketChannel}`, ephemeral: true });

    // Send an initial message in the ticket channel
    await ticketChannel.send(`Hello ${user}, a moderator will be with you shortly. Use this channel to discuss your issue.`);
}