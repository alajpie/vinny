module.exports = {
	init: () => ({
		addbot: ({ msg }) => {
			if (msg.member.hasPermission("ADMINISTRATOR")) {
				msg.channel.send(
					"<https://discordapp.com/oauth2/authorize?client_id=408348099866656791&permissions=8&scope=bot>"
				);
			} else {
				return "no";
			}
		}
	}),
	canExecute: ({ msg }) => msg.member.hasPermission("MANAGE_CHANNELS")
};
