module.exports = {
	init: () => ({
		ping: ({ msg }) => {
			msg.reply("pong!");
		}
	})
};
