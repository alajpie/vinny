const { debug, info, error, fatal, assert } = require("../logging.js");

module.exports = {
	init: ({ config }) => {
		const iam = add => async ({ msg, rawArgs }) => {
			assert(msg.guild.roles.has(config.separatorRole), "valid separator role");
			const separatorRole = msg.guild.roles.get(config.separatorRole);
			const role = msg.guild.roles.find(
				x => x.name.toLowerCase() === rawArgs.toLowerCase()
			);
			if (!role) return "Couldn't find that role :/";
			debug("has", msg.member.roles.has(role.id));
			if (add) {
				if (msg.member.roles.has(role.id)) return "You already were :)";
				if (role.comparePositionTo(separatorRole) >= 0) return "no";
				await msg.member.addRole(role);
				return "Added!";
			} else {
				if (!msg.member.roles.has(role.id))
					return "You weren't but now you aren't even more.";
				if (role.comparePositionTo(separatorRole) >= 0) return "yes you are";
				await msg.member.removeRole(role);
				return "Removed!";
			}
		};
		return {
			iam: iam(true),
			iamn: iam(false),
			iamnot: iam(false)
		};
	}
};
