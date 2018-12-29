const superb = require("superb");

const lovesomeone = () => `is ${superb.random()}!`;

module.exports = {
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
