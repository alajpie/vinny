const _ = require("lodash");

module.exports = {
	init: () => ({
		emojis: ({ msg, dclient, globalConfig }) => {
			const mojis = [];
			for (const serverId of _.get(
				globalConfig,
				["servers", msg.guild.id, "moduleConfig", "emojis", "servers"],
				[]
			)) {
				const guild = dclient.guilds.get(serverId);
				for (const emoji of guild.emojis.array()) {
					mojis.push(emoji.toString());
				}
			}
			return mojis.join(" ");
		}
	})
};
