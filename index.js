const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');
const schedule = require('node-schedule');
const fs = require('fs');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

const token = '24547bbf6650fb1861881f19e4d9f5617bd457c163352dfdd1caf50a943f3885'; // Remplacez par le token de votre bot
const clientId = '1268842768755593298'; // Remplacez par l'ID de votre application
let channelId = null; // Initialement, le canal est nul
const targetDate = new Date('2030-01-10');

// Fonction pour calculer le temps restant
function getTimeRemaining(endtime) {
    const total = Date.parse(endtime) - Date.parse(new Date());
    const seconds = Math.floor((total / 1000) % 60);
    const minutes = Math.floor((total / 1000 / 60) % 60);
    const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
    const days = Math.floor(total / (1000 * 60 * 60 * 24));
    
    return {
        total,
        days,
        hours,
        minutes,
        seconds
    };
}

// Création des commandes slash
const commands = [
    new SlashCommandBuilder()
        .setName('setchannel')
        .setDescription('Définit le canal où le bot enverra les messages')
        .addChannelOption(option => option.setName('channel').setDescription('Choisissez un canal').setRequired(true)),
    new SlashCommandBuilder()
        .setName('countdown')
        .setDescription('Affiche le temps restant avant de devenir millionnaire')
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(token);

// Enregistrement des commandes slash
(async () => {
    try {
        console.log('Started refreshing application (/) commands.');
        await rest.put(
            Routes.applicationCommands(clientId),
            { body: commands },
        );
        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'setchannel') {
        channelId = interaction.options.getChannel('channel').id; // Récupérer l'ID du canal choisi
        await interaction.reply(`Canal défini sur <#${channelId}>. Les messages seront envoyés ici.`);
    }

    if (interaction.commandName === 'countdown') {
        const timeLeft = getTimeRemaining(targetDate);
        await interaction.reply(`Il reste ${timeLeft.days} jours, ${timeLeft.hours} heures, ${timeLeft.minutes} minutes et ${timeLeft.seconds} secondes avant de devenir millionnaire!`);
    }
});

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);

    // Planifier un job quotidien à 9h00
    schedule.scheduleJob('0 9 * * *', () => {
        if (channelId) {
            const timeLeft = getTimeRemaining(targetDate);
            const channel = client.channels.cache.get(channelId);
            if (channel) {
                channel.send(`Il reste ${timeLeft.days} jours, ${timeLeft.hours} heures, ${timeLeft.minutes} minutes et ${timeLeft.seconds} secondes avant de devenir millionnaire!`);
            } else {
                console.log('Channel not found!');
            }
        } else {
            console.log('Aucun canal défini. Utilisez la commande /setchannel pour définir un canal.');
        }
    });
});

client.login(token);