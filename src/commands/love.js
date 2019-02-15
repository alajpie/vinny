const superb = require("superb");

const lovesomeone = () => `is ${superb.random()}!`;

module.exports = {
	commands: { love: null, lovesomeone: ["lovesomebody", "lovesbd", "loveu"] },
	init: () => ({
		love: ({ msg }) => {
			msg.reply(`you're ${superb.random()}!`);
		},
		lovesomeone,
		lovesomebody: lovesomeone,
		lovesbd: lovesomeone,
		loveu: lovesomeone
	})
};
