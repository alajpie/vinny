const glob = require("glob");
const path = require("path");
const { debug, info, error, fatal, assert } = require("../logging.js");

const argsRegex = /"(.*?)"|'(.*?)'|(\S+)/g;

const commandPaths = glob.sync(path.join(__dirname, "../commands/*.js"));
const commands = {};
commandPaths.forEach(x => {
	Object.assign(commands, require(path.resolve(x)));
});

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
				if (typeof commands[command] === "function") {
					const result = commands[command](args, {
						dclient,
						msg,
						config: config[command] || {}
					});
					if (result) {
						msg.channel.send(result);
					}
				}
			}
		});
	}
};
