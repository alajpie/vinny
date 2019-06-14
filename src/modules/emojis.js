require("string.prototype.matchall").shim();

module.exports = {
	init: function({ config }) {
		return {
			onMessage: function({ msg, dclient }) {
				if (msg.author.id === dclient.user.id) return;
				const queue = [];
				for (const match of msg.content
					.toLowerCase()
					.matchAll(/(?:[^<]|^):([^ \n:]+):/g)) {
					const servers = [
						...config.servers,
						...(config.restrictedChannels &&
						config.restrictedChannels.includes(msg.channel.id)
							? config.restrictedServers
							: [])
					];
					for (const serverId of servers) {
						const guild = dclient.guilds.get(serverId);
						const emoji = guild.emojis.find(
							x =>
								x.name.toLowerCase().replace("_", "") ===
								match[1].replace("_", "")
						);
						if (emoji) {
							queue.push(emoji.toString());
							break;
						}
					}
				}
				if (queue.length) {
					msg.channel.send(queue.join(" "));
				}
			}
		};
	}
};
