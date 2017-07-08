const Sequelize = require("sequelize");
const env = require('dotenv').config();
const Random = require("random-js");
const TelegramBot = require('node-telegram-bot-api');
const request = require('request');
const db = new Sequelize(process.env.MYSQL_DATABASE, process.env.MYSQL_USER, process.env.MYSQL_PASSWORD, {
    host: process.env.MYSQL_HOST,
    dialect: 'mysql', logging: false
});
const bot = new TelegramBot(process.env.TOKEN, {polling: true});

//Model
const Message = require("./Model/Message");
const MessageModel = new Message(db);

const User = require("./Model/User");
const UserModel = new User(db);

const Pidor = require("./Model/Pidor");
const PidorModel = new Pidor(db);

//Repository
const MessageRepository = require("./Repository/MessageRepository");
const UserRepository = require("./Repository/UserRepository");
const PidorRepository = require("./Repository/PidorRepository");

//Modules
const MessageGenerator = require("./Generator/MessageGenerator");
const PidorGenerator = require("./Generator/PidorGenerator");

//Strings
const catP = [
    "Вот тебе котя!",
    "Держи котю",
    "Котя - топчик",
    "СМОТРИ КАКОЙ ЗАБАВНЫЙ!",
    "Всем котю!",
    ":3"
];
const names = [
    "антон",
    "Антон",
    "антоха",
    "Антоха",
    "Тох ",
    "тох ",
    "тоха ",
    "Тоха ",
    "антонио",
    "Антонио",
];

bot.on('message', (msg) => {
    let randomizer = new Random(Random.engines.mt19937().seed('fsdfbk' + Math.random()));

    (new UserRepository(UserModel)).store(msg.from);
    if (typeof msg.text !== 'undefined' && msg.text.length > 1 && msg.text.charAt(0) !== '/') {
        let mention = new RegExp(names.join("|")).test(msg.text);
        let chance = randomizer.bool(0.3);
        (new MessageRepository(MessageModel)).store(msg, names);
        if (chance || mention) {
            bot.sendChatAction(msg.chat.id, 'typing');

            (new MessageGenerator(MessageModel, msg)).get(names).then(function (res) {
                console.log(res);
                if (res !== false && res.length > 0) {
                    let options = {};
                    if (mention) {
                        options = {
                            reply_to_message_id: msg.message_id
                        };
                    }
                    bot.sendMessage(msg.chat.id, res, options);
                }
            });
        }
    }
});


bot.onText(/\/boobs/, (msg, match) => {
    bot.sendChatAction(msg.chat.id, 'upload_photo');
    let r = request.get('http://api.oboobs.ru/boobs/0/1/random', function (err, res, body) {
        let json = JSON.parse(body);
        let photoLink = 'http://media.oboobs.ru/' + json[0].preview;
        const photo = request(photoLink);
        const chatId = msg.chat.id;
        bot.sendPhoto(chatId, photo, {
            caption: json[0].model
        });
    });
});

bot.onText(/\/cat/, (msg, match) => {
    bot.sendChatAction(msg.chat.id, 'upload_photo');
    let r = request.get('http://thecatapi.com/api/images/get?format=src', function (err, res, body) {
        const photo = request(this.uri.href);
        const chatId = msg.chat.id;
        bot.sendPhoto(chatId, photo, {
            caption: catP[Math.floor(Math.random() * catP.length)]
        });
    });
});

bot.onText(/\/top/, (msg, match) => {
    if(msg.chat.id > 0) {
        bot.sendMessage(msg.chat.id, "Не-не. Только в чатиках топчик работает");
        return false;
    }
    bot.sendChatAction(msg.chat.id, 'typing');

    let now= new Date().toISOString().slice(0, 19).replace('T', ' ');
    let yesterday = new Date(new Date().getTime() - (24 * 60 * 60 * 1000)).toISOString().slice(0, 19).replace('T', ' ');
    let sql = 'SELECT count(m.id) c, m.user, u.first_name, u.last_name from messages m LEFT JOIN users u ON m.user = u.user WHERE m.chat = '+msg.chat.id+' AND m.createdAt BETWEEN \''+yesterday+'\' AND \''+now+'\' GROUP by m.user, u.first_name, u.last_name ORDER BY c DESC LIMIT 5';

    db.query(sql).spread((results, metadata) => {
        let result = '*Топ 5 пейсателей:* \n\n';
        results.forEach(function (item) {
            result += item.first_name + (item.last_name !== '' && item.last_name !== null ? ' ' + item.last_name : '') + ' - *' + item.c + '*\n';
        });
        if(results.length < 1) {
            result = 'Все молчали =('
        }
        bot.sendMessage(msg.chat.id, result, {
            parse_mode: 'Markdown'
        });
    })
});

bot.onText(/\/new_pidor/, (msg, match) => {
    bot.sendChatAction(msg.chat.id, 'typing');
    (new PidorGenerator(PidorRepository, new UserRepository, msg)).get();
});
