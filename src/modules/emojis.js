require("string.prototype.matchall").shim();

module.exports = {
	init: function({ config }) {
		return {
			onMessage: function({ msg, dclient }) {
				if (msg.author.id === dclient.user.id) return;
				for (const match of msg.content
					.toLowerCase()
					.matchAll(/(?:[^<]|^):([^ \n:]+):/g)) {
					for (const serverId of config.servers) {
						const guild = dclient.guilds.get(serverId);
						const emoji = guild.emojis.find(
							x => x.name.toLowerCase() === match[1]
						);
						if (emoji) {
							msg.channel.send(emoji.toString());
							break;
						}
					}
				}
			}
		};
	}
};
