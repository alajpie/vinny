const { debug, info, error, fatal, assert } = require("../logging.js");

const argsRegex = /"(.*?)"|'(.*?)'|(\S+)/g;

module.exports = {
	onMessage: function({ config, dclient, msg }) {
		if (msg.author.id === dclient.user.id) return;
		const prefixes = config.prefixes || ["'", ";"];
		prefixes.forEach(prefix => {
			const commandRegex = new RegExp(
				`(?:^|\\s)${prefix}(\\w+)(?: +(.*?) *)?(?:$|${prefix}end)`,
				"g"
			);
			let commandMatch, argsMatch;
			while (
				(commandMatch = commandRegex.exec(
					msg.content.replace(/\n/g, " ")
				))
			) {
				const [_, command, rawArgs] = commandMatch;
				const args = [];
				while ((argsMatch = argsRegex.exec(rawArgs))) {
					args.push(argsMatch.slice(1).find(x => x));
				}
				debug({ command, prefix, args });
			}
		});
	}
};
