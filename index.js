// Importar la biblioteca discord.js
const Discord = require('discord.js');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('warns.sqlite');
// Importar la biblioteca sqlite
// Crear una nueva instancia de un cliente de Discord
const client = new Discord.Client();

// Definir la configuración de la presencia rica
const presenceData = {
    status: 'idle', // Cambiar a 'idle' para estado ausente
    activity: {
        type: 'WATCHING', // Tipo de actividad (PLAYING, LISTENING, WATCHING, STREAMING)
        name: 'BXB OFICIAL BOT', // Nombre de la actividad
        url: 'https://discord.com/' // URL de la actividad (solo para tipo STREAMING)
    }
};

// Prefijo para los comandos
const prefix = 'bxb!'
// Mapa de Warns

db.run('CREATE TABLE IF NOT EXISTS warns (userId TEXT, moderator TEXT, reason TEXT)');

client.on('ready', async () => {
    console.log('¡El bot está listo!');

});



// Evento que se activa cuando el bot está listo y conectado
client.once('ready', () => {
    console.log('¡El bot está en línea!');
    
    // Establecer la presencia rica
    client.user.setPresence(presenceData)
        .catch(console.error);
});


client.on('message', async message => {
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();




    if (command === 'edit') {
        // Obtener la ID del mensaje que contiene el embed a editar
        const messageId = args[0];

        // Verificar si se proporcionó una ID de mensaje
        if (!messageId) {
            return message.channel.send('Debes proporcionar la ID del mensaje que contiene el embed a editar.');
        }

        try {
            // Obtener el mensaje con la ID proporcionada
            const embedMessage = await message.channel.messages.fetch(messageId);

            // Verificar que el mensaje contiene un embed
            if (!embedMessage.embeds.length) {
                return message.channel.send('El mensaje no contiene un embed.');
            }

            // Editar el embed
            const editedEmbed = new Discord.MessageEmbed(embedMessage.embeds[0])
            .setTitle('𝐏𝐫𝐞𝐠𝐮𝐧𝐭𝐚𝐬 𝐅𝐫𝐞𝐜𝐮𝐞𝐧𝐭𝐞𝐬 (𝐅𝐀𝐐)')
            .setDescription('En esta sección encontrarás **respuestas a preguntas e información** relevantes al servidor. Esta lista podrá ser actualizada conforme se vayan encontrando respuestas o información considerada importante.')
            .addField('𝐆𝐄𝐍𝐄𝐑𝐀𝐋', '[Click para Ir](https://discord.com/channels/1184044346941648956/1225250403747364905/1226356304147382312)')
            .addField('𝐑𝐎𝐋𝐄𝐒', '[Click para Ir](https://discord.com/channels/1184044346941648956/1225250403747364905/1226356304961077268)')
            .addField('𝐒𝐀𝐍𝐂𝐈𝐎𝐍𝐄𝐒', '[Click para Ir](https://discord.com/channels/1184044346941648956/1225250403747364905/1226356305808330892)')
            .addField('𝐂𝐀𝐍𝐀𝐋𝐄𝐒', '[Click para Ir](https://discord.com/channels/1184044346941648956/1225250403747364905/1226356306781274122)')
            .addField('𝐒𝐎𝐏𝐎𝐑𝐓𝐄', '[Click para Ir](https://discord.com/channels/1184044346941648956/1225250403747364905/1226356330802184254)')
            .setColor('#e0146e');
            // Actualizar el mensaje con el nuevo embed
            embedMessage.edit(editedEmbed);
        } catch (error) {
            console.error('Error al editar el embed:', error);
            message.channel.send('Ocurrió un error al editar el embed. Asegúrate de que la ID del mensaje sea válida y el bot tenga los permisos necesarios.');
        }
    }

    if (command === 'ping') {
        const embed = new Discord.MessageEmbed()
            .setColor('#0099ff')
            .setTitle('Ping del bot')
            .setDescription('Calculando...');

        const msg = await message.channel.send(embed);

        embed.setDescription(`Pong! La latencia es ${msg.createdTimestamp - message.createdTimestamp}ms. La latencia de la API es ${Math.round(client.ws.ping)}ms.`);
        msg.edit(embed);
    }

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

            const embed = new Discord.MessageEmbed()
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
    if (command === 'purge') {

        const deleteCount = parseInt(args[0], 10);

        if (!deleteCount || deleteCount < 1 || deleteCount > 100) {
            return message.reply('Por favor, proporciona un número entre 1 y 100 para eliminar mensajes.');
        }

        const fetched = await message.channel.messages.fetch({ limit: deleteCount });
        message.channel.bulkDelete(fetched)
            .catch(error => message.reply(`No se pudieron eliminar los mensajes debido a: ${error}`));
    }


    if (command === 'kick') {
        // Verificar permisos del autor del mensaje
        if (!message.member.hasPermission('KICK_MEMBERS')) {
            const permissionEmbed = new Discord.MessageEmbed()
                .setColor('#FF0000')
                .setDescription('No tienes permisos para utilizar este comando.');
            return message.channel.send(permissionEmbed);
        }

        // Verificar si se menciona a un usuario
        const member = message.mentions.members.first();
        if (!member) {
            const mentionEmbed = new Discord.MessageEmbed()
                .setColor('#FF0000')
                .setDescription('Debes mencionar a un miembro del servidor para expulsarlo.');
            return message.channel.send(mentionEmbed);
        }

        // Verificar si el bot tiene permisos para expulsar al usuario
        if (!member.kickable) {
            const kickableEmbed = new Discord.MessageEmbed()
                .setColor('#FF0000')
                .setDescription('No puedo expulsar a este miembro.');
            return message.channel.send(kickableEmbed);
        }

        // Verificar si se proporciona un motivo
        const reason = args.slice(1).join(' ') || 'No se proporcionó un motivo.';

        // Expulsar al miembro del servidor
        try {
            await member.kick(`${message.author.tag} te ha expulsado. Motivo: ${reason}`);
            const successEmbed = new Discord.MessageEmbed()
                .setTitle('𝐔𝐒𝐔𝐀𝐑𝐈𝐎 𝐊𝐈𝐂𝐊𝐄𝐀𝐃𝐎')
                .setColor('#e0146e')
                .addField('Usuario:',`${member.user.toString()}`)
                .addField('Staff:', `${message.author.toString()}`)
                .addField('Motivo:', `${reason}`)
            message.channel.send(successEmbed);
        } catch (error) {
            console.error('Se produjo un error al intentar expulsar al usuario:', error);
            const errorEmbed = new Discord.MessageEmbed()
                .setColor('#FF0000')
                .setDescription('Se produjo un error al intentar expulsar al usuario.');
            message.channel.send(errorEmbed);
        }
    }



    
});



// Evento que se activa cada vez que se recibe un mensaje
client.on('message', message => {
    // Verificar si el mensaje comienza con el prefijo y si el autor no es un bot
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    // Obtener los argumentos y el comando
    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // Comando de ejemplo para enviar un embed
    if (command === 'faqembedsend') {
        // Crear un nuevo embed
        const embed = new Discord.MessageEmbed()
            .setTitle('𝐏𝐫𝐞𝐠𝐮𝐧𝐭𝐚𝐬 𝐅𝐫𝐞𝐜𝐮𝐞𝐧𝐭𝐞𝐬 (𝐅𝐀𝐐)')
            .setDescription('En esta sección encontrarás **respuestas a preguntas e información** relevantes al servidor. Esta lista podrá ser actualizada conforme se vayan encontrando respuestas o información considerada importante.')
            .setColor('#e0146e');

        const embed2 = new Discord.MessageEmbed()
            .setTitle('𝐆𝐄𝐍𝐄𝐑𝐀𝐋')
            .addField('¿𝗤𝘂𝗲́ 𝗲𝘀 𝗕𝗫𝗕?', 'BXB fue ideado por los Overlord como un servidor autosuficiente y activo en el que sus miembros pudieran hablar y jugar entre sí (ya sean conocidos o desconocidos) en un entorno agradable, sin la intervención de otros clanes (en Roblox o Discord).')
            .setColor('#e0146e')
            .addField('¿𝗖𝘂𝗮́𝗹 𝗲𝘀 𝗹𝗮 𝗺𝗶𝘀𝗶𝗼́𝗻 𝗱𝗲 𝗕𝗫𝗕?', 'Garantizar un entorno de convivencia grato para todos sus miembros.')
            .addField('¿𝗖𝘂𝗮́𝗹𝗲𝘀 𝘀𝗼𝗻 𝗹𝗼𝘀 𝗼𝗯𝗷𝗲𝘁𝗶𝘃𝗼𝘀 𝗮𝗰𝘁𝘂𝗮𝗹𝗲𝘀 𝗱𝗲 𝗕𝗫𝗕?','BXB cuenta al momento con dos objetivos principales: aumentar la cantidad de miembros y mejorar el entorno del servidor dentro de Discord.')
            .addField('¿𝗖𝗼́𝗺𝗼 𝗽𝘂𝗲𝗱𝗼 𝗮𝘆𝘂𝗱𝗮𝗿?', '¡Tu sola presencia ya nos ayuda mucho! Mantente activo, danos a conocer entre tus amigos y si tienes alguna idea que pueda ayudar, haznos saber');
        
        const embed3 = new Discord.MessageEmbed()
            .setTitle('𝐑𝐎𝐋𝐄𝐒')
            .addField('Filosofía de los roles', 'Cabe destacar que a excepción de los auto-roles, cada rol dentro de BXB debe ganarse de una forma u otra.')
            .addField('𝗢𝘃𝗲𝗿𝗹𝗼𝗿𝗱', 'Son los creadores y dueños de BXB. Tienen todas las potestades posibles y dirigen las áreas que mantienen el funcionamiento del servidor.')
            .addField('𝗚𝗿𝗮𝗻𝗱 𝗢𝘃𝗲𝗿𝘀𝗲𝗲𝗿', 'Se trata de un administrador general, influye en todas las actividades del servidor y actúa directamente bajo el mando de los Overlord y atento a las reglas de BXB.')
            .addField('𝗢𝘃𝗲𝗿𝘀𝗲𝗲𝗿','Son los moderadores de los distintos canales de BXB, velan por el cumplimiento de las normas de la comunidad BXB dentro de los canales, aplican sanciones y sirven de nexo entre los miembros y la administración.')
            .addField('𝗥𝗲𝗰𝗹𝘂𝘁𝗮𝗱𝗼𝗿𝗲𝘀', 'Se encargan de la inclusión de nuevos miembros al servidor, a quiénes invitan, dan la bienvenida y supervisan por poco tiempo.')
            .addField('𝗣𝗿𝗼𝗴𝗿𝗮𝗺𝗮𝗱𝗼𝗿𝗲𝘀', 'Se encargan del desarrollo de bots (o demás aspectos técnicos) requeridos por el servidor.')
            .addField('𝗘𝗻𝗰𝗮𝗿𝗴𝗮𝗱𝗼 𝗱𝗲 𝗲𝘃𝗲𝗻𝘁𝗼𝘀', 'Se encargan de realizar eventos para la diversión de los miembros, aparte inciden en las actividades diarias.')
            .addField('¿𝗛𝗮𝘆 𝗼𝘁𝗿𝗮𝘀 𝗺𝗮𝗻𝗲𝗿𝗮𝘀 𝗱𝗲 𝗼𝗯𝘁𝗲𝗻𝗲𝗿 𝗿𝗼𝗹𝗲𝘀?', 'Pueden conseguirse roles personalizados por medio de mejoras al servidor y a través de los eventos. Aparte, las medallas de lealtad y actividad (junto con el active member) se dan a un número escaso de miembros que cumplan con los requerimientos y no son permanentes.')
            .addField('¿𝗤𝘂𝗲́ 𝘀𝗼𝗻 𝗹𝗼𝘀 𝗿𝗼𝗹𝗲𝘀 𝘂́𝗻𝗶𝗰𝗼𝘀?', 'Son roles particulares, otorgados a miembros quiénes realizaron actos destacados. Actualmente solo hay cuatro: Overlord, Grand Overseer, BXB Designer y The One Who Remains.')
            .setColor('#e0146e');
            
        const embed4 = new Discord.MessageEmbed()
            .setTitle('𝐒𝐀𝐍𝐂𝐈𝐎𝐍𝐄𝐒')
            .addField('¿𝗣𝗼𝗿 𝗾𝘂𝗲́ 𝘀𝗲𝗿𝗶́𝗮 𝗺𝘂𝘁𝗲𝗮𝗱𝗼?','Básicamente, por incumplir las reglas de una u otra manera, debes entender que cada medida disciplinaria se da por una razón y con evidencia.')
            .addField('¿𝗧𝗲𝗻𝗴𝗼 𝗱𝗲𝗿𝗲𝗰𝗵𝗼 𝗮 𝗽𝗿𝗼𝘁𝗲𝘀𝘁𝗮𝗿?', 'La administración revisa cuidadosamente (e incluso busca segundas opiniones) al momento de moderar, si lo haces sin motivo, ten en cuenta que el castigo puede extenderse.')
            .addField('¿𝗖𝗼́𝗺𝗼 𝗽𝗼𝗱𝗿𝗶́𝗮 𝘀𝗲𝗿 𝗲𝘅𝗽𝘂𝗹𝘀𝗮𝗱𝗼 𝗱𝗲 𝗕𝗫𝗕?', 'Por lo general, esto se lleva a cabo cuando se realiza una falta contra las normas de la comunidad de BXB y se insiste en seguir luego de haber recibido una advertencia verbal, si el miembro no se retracta será expulsado (Depende del administrador en cuestión)')
            .addField('¿𝗟𝗮𝘀 𝗲𝘅𝗽𝘂𝗹𝘀𝗶𝗼𝗻𝗲𝘀 𝘀𝗼𝗻 𝗽𝗲𝗿𝗺𝗮𝗻𝗲𝗻𝘁𝗲𝘀?', 'No, cada miembro tiene la libertad de volver, siempre y cuando decida cumplir las normas de la comunidad BXB. En casos particulares, tendrán que reunirse con la administración.')
            .addField('¿𝗘𝗻 𝗾𝘂𝗲́ 𝗰𝗮𝘀𝗼𝘀 𝗯𝗮𝗻𝗲𝗮𝗻?', 'Debe haberse cometido una falta extremadamente grave que será discutida y castigada por los Overlord.')
            .setColor('#e0146e');
        
        const embed5 = new Discord.MessageEmbed()
            .setTitle('𝐂𝐀𝐍𝐀𝐋𝐄𝐒')
            .addField('¿𝗤𝘂𝗲́ 𝗲𝘀𝘁𝗮́ 𝗽𝗲𝗿𝗺𝗶𝘁𝗶𝗱𝗼 𝗲𝗻 𝗖𝗛𝗔𝗧?', 'Hablar sencillamente. No se pueden mandar enlaces, vídeos, mensajes de más de 5 emojis, mensajes repetidos o textos de más de 250 caracteres (spam).')
            .addField('¿𝗤𝘂𝗲́ 𝗲𝘀𝘁𝗮́ 𝗽𝗲𝗿𝗺𝗶𝘁𝗶𝗱𝗼 𝗲𝗻 𝗜𝗡𝗧𝗘𝗥𝗔𝗖𝗖𝗜𝗢𝗡𝗘𝗦?', 'Usar las interacciones de Nekotina (u otros bots) y hablar.')
            .addField('¿𝗤𝘂𝗲́ 𝗲𝘀𝘁𝗮́ 𝗽𝗲𝗿𝗺𝗶𝘁𝗶𝗱𝗼 𝗲𝗻 𝗦𝗣𝗔𝗠?', 'Es el canal más libre en materia de contenido, pero les recordamos que el canal para hablar sigue siendo chat.')
            .addField('¿𝗔𝗹𝗴𝗼 𝗾𝘂𝗲 𝗱𝗲𝗯𝗮 𝘀𝗮𝗯𝗲𝗿 𝗱𝗲 𝗹𝗼𝘀 𝗱𝗲𝗺𝗮́𝘀 𝗰𝗮𝗻𝗮𝗹𝗲𝘀?', 'Deben utilizarse para lo que indica su respectivo título, si se incurre en una acción que se considere inválida, habrá consecuencias.')
            .addField('¿𝗠𝗼𝗱𝗲𝗿𝗮𝗻 𝗹𝗼𝘀 𝗰𝗮𝗻𝗮𝗹𝗲𝘀 𝗱𝗲 𝘃𝗼𝘇? ', 'Sí, pero atiende a cada moderador.')
            .setColor('#e0146e');

        const embed6 = new Discord.MessageEmbed()
            .setTitle('𝐒𝐎𝐏𝐎𝐑𝐓𝐄')
            .addField('¿𝗣𝘂𝗲𝗱𝗼 𝗼𝗯𝘁𝗲𝗻𝗲𝗿 𝗮𝘆𝘂𝗱𝗮 𝗱𝗲𝗹 𝘀𝘁𝗮𝗳𝗳?', 'Puedes emplear el bot de Ticket Tool para recibir apoyo.')
            .addField('¿𝗣𝘂𝗲𝗱𝗼 𝗱𝗮𝗿 𝘀𝘂𝗴𝗲𝗿𝗲𝗻𝗰𝗶𝗮𝘀?', 'Puedes emplear el bot de Ticket Tool para darlas a conocer.')
            .setColor('#e0146e');
        // Enviar el embed al mismo canal donde se recibió el mensaje
        message.channel.send(embed);
        message.channel.send(embed2);
        message.channel.send(embed3);
        message.channel.send(embed4);
        message.channel.send(embed5);
        message.channel.send(embed6);
        message.delete();
    }


    if (command === 'serverinfo') {
        const serverOwner = message.guild.owner;
        const serverInfoEmbed = new Discord.MessageEmbed()
            .setColor('#0099ff')
            .setTitle('Información del Servidor')
            .setThumbnail(message.guild.iconURL())
            .addField('Nombre del Servidor', message.guild.name, true)
            .addField('ID del Servidor', message.guild.id, true)
            .addField('Propietario del Servidor', serverOwner.user.tag, true)
            .addField('Cantidad de Miembros', message.guild.memberCount, true)
            .addField('Cantidad de Roles', message.guild.roles.cache.size, true)
            .addField('Cantidad de Canales', message.guild.channels.cache.size, true)
            .addField('Fecha de Creación', message.guild.createdAt.toDateString(), true)
            .setTimestamp();

        message.channel.send(serverInfoEmbed);
    }


    if (command === 'updatebot'){
        const update = new Discord.MessageEmbed()
        .setTitle('Bot Update')
        .setDescription('Actualizando Informacion del Bot...')
        .setColor('#e0146e');
        message.channel.send(update);
    }



});


// Iniciar sesión del bot usando tu token
client.login('MTIyNDI0OTM3MTQzNzE3MDc1OA.GgUtEE.tE0GJspULtDIsouqYQeSoC0Zde7_nCt2J9xI6Y');
