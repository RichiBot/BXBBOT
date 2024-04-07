const { Client, MessageEmbed } = require('discord.js');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('warns.sqlite');

const client = new Client();
const prefix = 'b!'; // Nuevo prefijo

// Crear tabla de advertencias si no existe
db.run('CREATE TABLE IF NOT EXISTS warns (userId TEXT, moderator TEXT, reason TEXT)');

client.on('message', async message => {
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === 'warn') {
        if (!message.member.hasPermission('MANAGE_MESSAGES')) {
            return message.reply('¡No tienes permiso para dar advertencias!');
        }

        const targetUser = message.mentions.users.first();
        if (!targetUser) {
            return message.reply('Por favor, menciona al usuario al que quieres advertir.');
        }

        const reason = args.slice(1).join(' ');
        if (!reason) {
            return message.reply('Por favor, proporciona una razón para la advertencia.');
        }

        db.run('INSERT INTO warns (userId, moderator, reason) VALUES (?, ?, ?)', [targetUser.id, message.author.tag, reason], err => {
            if (err) {
                console.error('Error al insertar advertencia:', err);
                return;
            }
            message.channel.send(`Se ha dado una advertencia a ${targetUser.tag} por: ${reason}`);
        });
    }

    if (command === 'sanciones') {
        const targetUser = message.mentions.users.first() || message.author;

        db.all('SELECT * FROM warns WHERE userId = ?', [targetUser.id], (err, rows) => {
            if (err) {
                console.error('Error al obtener advertencias:', err);
                return;
            }
            if (!rows || rows.length === 0) {
                return message.reply('No hay advertencias registradas para este usuario.');
            }

            const embed = new MessageEmbed()
                .setColor('#ff0000')
                .setTitle(`Advertencias para ${targetUser.tag}`)
                .setDescription(rows.map((row, index) => `**Advertencia ${index + 1}:**\nModerador: ${row.moderator}\nRazón: ${row.reason}`));

            message.channel.send(embed);
        });
    }

    if (command === 'removerwarn') {
        if (!message.member.hasPermission('MANAGE_MESSAGES')) {
            return message.reply('¡No tienes permiso para quitar advertencias!');
        }
    
        const targetUser = message.mentions.users.first();
        if (!targetUser) {
            return message.reply('Por favor, menciona al usuario del cual quieres quitar una advertencia.');
        }
    
        const index = parseInt(args[1], 10);
        if (isNaN(index) || index <= 0) {
            return message.reply('Por favor, proporciona un número de advertencia válido para quitar.');
        }
    
        db.all('SELECT rowid, * FROM warns WHERE userId = ?', [targetUser.id], (err, rows) => {
            if (err) {
                console.error('Error al obtener advertencias:', err);
                return;
            }
            if (!rows || rows.length === 0 || index > rows.length) {
                return message.reply('No hay una advertencia con ese número para este usuario.');
            }
    
            const removedWarn = rows[index - 1];
            db.run('DELETE FROM warns WHERE rowid = ?', [removedWarn.rowid], err => {
                if (err) {
                    console.error('Error al quitar advertencia:', err);
                    return;
                }
                message.channel.send(`Se ha quitado la advertencia ${index} de ${targetUser.tag}.`);
            });
        });
    }
});

client.login('MTIyNDI0OTM3MTQzNzE3MDc1OA.GgUtEE.tE0GJspULtDIsouqYQeSoC0Zde7_nCt2J9xI6Y');




/// Odio el dia que dije que sabia programar