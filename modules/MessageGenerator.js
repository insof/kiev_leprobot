const MarkovGen = require('markov-generator');

const regex = /[^a-zA-Zа-яА-я]+/g;

module.exports = class MessageGenerator {
    constructor(MessageModel, msg) {
        this.MessageModel = MessageModel;
        this.msg = msg;
    }

    get() {
        let Message = this.MessageModel.getModel();

        let m = [];

        let words = this.msg.text.split(' ');
        words = words.filter(function (item) {
            return item.length > 3;
        });
        words = words.map(function (x) {
            return x.replace(regex, '');
        });

        console.log(words);

        let word = words[Math.floor(Math.random() * words.length)];
        console.log(word);

        Message.findAll({where: {body: {$like: '%' + word + '%'}}, limit: 100, attributes: ['body']}).then(Messages => {
            Messages.forEach(function (item) {
                m.push(item.body)
            });

            console.log(m);

            if (m.length > 1) {
                let markov = new MarkovGen({
                    input: m,
                    minLength: 4
                });

                return markov.makeChain(4);
            }

            return false;
        });
    }
};