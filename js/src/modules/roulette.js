const debounce = require("debounce");

async function updatePersistent(message, channel, dclient) {
	let alreadyThere = false;
	(await channel.fetchMessages({ limit: 50 })).array().forEach((x, i) => {
		// not the exact message because if we change the config
		// we want the old persistent message deleted
		if (
			x.author.id === dclient.user.id &&
			x.content.includes("Every message you send here")
		) {
			if (i === 0) {
				alreadyThere = true;
			} else {
				x.delete();
			}
		}
	});
	if (!alreadyThere) {
		channel.send(message);
	}
}

module.exports = {
	init: function({ config }) {
		const uP = debounce(updatePersistent, 1000);
		const percentage = config.percentage || 1;
		const message = `**Every message you send here is a ${percentage}% chance of getting banned from this channel.**`;
		return {
			onReady: function({ msg, dclient }) {
				uP(message, dclient.channels.get(config.channel), dclient);
			},

			onMessage: async function({ msg, dclient }) {
				if (msg.channel.id !== config.channel) return;
				if (msg.author.id === dclient.user.id) return;
				if (Math.random() <= percentage / 100) {
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
