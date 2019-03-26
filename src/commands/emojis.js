const _ = require("lodash");

module.exports = {
	init: () => ({
		emojis: ({ msg, dclient, globalConfig }) => {
			const mojis = [];
			let servers = _.get(
				globalConfig,
				["servers", msg.guild.id, "moduleConfig", "emojis", "servers"],
				[]
			);
			const restrictedChannels = _.get(
				globalConfig,
				[
					"servers",
					msg.guild.id,
					"moduleConfig",
					"emojis",
					"restrictedChannels"
				],
				[]
			);
			const restrictedServers = _.get(
				globalConfig,
				[
					"servers",
					msg.guild.id,
					"moduleConfig",
					"emojis",
					"restrictedServers"
				],
				[]
			);

			if (restrictedChannels.includes(msg.channel.id)) {
				servers = [...servers, ...restrictedServers];
			}

			for (const serverId of servers) {
				const guild = dclient.guilds.get(serverId);
				for (const emoji of guild.emojis.array()) {
					mojis.push(emoji.toString());
				}
			}
			return mojis.join(" ");
		}
	})
};
