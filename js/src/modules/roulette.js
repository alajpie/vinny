const debounce = require("debounce");

async function updatePersistent(message, channel, dclient) {
	(await channel.fetchMessages({ limit: 50 })).array().forEach(x => {
		if (x.author.id === dclient.user.id && x.content === message) {
			x.delete();
		}
	});
	channel.send(message);
}

module.exports = {
	init: function({ config }) {
		const uP = debounce(updatePersistent, 1000);
		const message =
			"**Every message you send here is a 1% chance of getting banned from this channel.**";
		return {
			onMessage: async function({ msg, dclient }) {
				if (msg.channel.id !== config.channel) return;
				if (msg.author.id === dclient.user.id) return;
				if (Math.random() <= 1 / 100) {
					msg.channel.send(`Bye ${msg.author.tag}...`);
					msg.channel.overwritePermissions(msg.author, {
						SEND_MESSAGES: false
					});
				}
				uP(message, msg.channel, dclient);
			}
		};
	}
};
