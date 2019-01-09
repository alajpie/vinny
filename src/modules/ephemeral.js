const { debug, info, error, fatal, assert } = require("../logging.js");

module.exports = {
	init: function({ config, db, serverId }) {
		return {
			onReady: async function({ dclient }) {
				const channel = dclient.channels.get(config.channel);
				if (!channel) return;
				let b4;
				while (true) {
					const messagesPromise = channel.fetchMessages({
						limit: 50,
						before: b4
					});
					const messages = (await messagesPromise).array();
					if (messages.length === 0) break;
					b4 = messages[messages.length - 1].id;
					for (let msg of messages) {
						debug(
							`deleting ${msg.id} in ${msg.channel.name} (${
								msg.guild.name
							}) in ${(msg.createdTimestamp +
								config.expiry * 1000 -
								Date.now()) /
								1000}s`
						);
						setTimeout(() => {
							debug(
								`deleting in #${msg.channel.name} (${
									msg.guild.name
								}) (leftover)`
							);
							msg.delete();
						}, msg.createdTimestamp + config.expiry * 1000 - Date.now());
					}
				}
			},
			onMessage: function({ msg }) {
				if (msg.channel.id !== config.channel) return;
				debug(
					`deleting ${msg.id} in ${msg.channel.name} (${msg.guild.name}) in ${
						config.expiry
					}s`
				);
				setTimeout(async () => {
					debug(`deleting in #${msg.channel.name} (${msg.guild.name}) (live)`);
					await msg.delete();
				}, config.expiry * 1000);
			}
		};
	}
};
