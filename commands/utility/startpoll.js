const { SlashCommandBuilder, ChannelType } = require('discord.js');
const schedule = require('node-schedule');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('startpoll')
        .setDescription('Starts a poll in the channel you used the command in.')
        .addStringOption(option =>
            option.setName('title')
                .setDescription('Question of the poll')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('options')
                .setDescription('The options separated by commas (e.g. Option 1, Option 2, Option 3')
                .setRequired(true)
        ),
    async execute(interaction) {
        const title = interaction.options.getString('title');
        const options = interaction.options.getString('options').split(`, `);
        const optionsCount = options.length;
        
        const pollEmbed = {
            color: 0x009B4B,
            title: title,
            description: options.map((option, index) => `:${numberToEmoji(index + 1)}: ${option}`).join('\n'),
            timestamp: new Date(),
            footer: {
                text: 'React with the corresponding emoji to vote!',
            },
        };

        const pollMessage = await interaction.reply({ embeds: [pollEmbed], fetchReply: true });

        for (let i = 0; i < optionsCount; i++) {
            await pollMessage.react(numberToEmoji(i + 1));
        }
    }
};

function numberToEmoji(number) {
    const emojiNumbers = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
    return emojiNumbers[number - 1];
}