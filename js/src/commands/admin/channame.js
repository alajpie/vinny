module.exports = {
	channame: ({ msg, rawArgs }) => {
		if (msg.member.hasPermission("MANAGE_CHANNELS")) {
			msg.channel.setName(rawArgs.replace(/ /g, "\u205f"));
		} else {
			return "no";
		}
	}
};
