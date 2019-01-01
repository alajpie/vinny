const { debug, info, error, fatal, assert } = require("../logging.js");

module.exports = {
	init: ({ dclient }) => ({
		debug: ({ msg, args }) => {
			if (args[0] === "roles") {
				const roles = {};
				msg.guild.roles.array().forEach(x => (roles[x.name] = x.id));
				debug(roles);
			}
		}
	})
};
