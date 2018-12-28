const glob = require("glob");
const path = require("path");
const { debug, info, error, fatal, assert } = require("../logging.js");

const argsRegex = /"(.*?)"|'(.*?)'|(\S+)/g;

const commandPaths = glob.sync(path.join(__dirname, "../commands/**/*.js"));
const commandPacks = [];
commandPaths.forEach(x => {
	const commandPack = require(path.resolve(x));
	commandPacks.push(commandPack);
	commandPack.name = commandPack.name || path.parse(x).name;
});
info("Command packs loaded:", commandPacks.map(x => x.name));

module.exports = {
	init: function({ config }) {
		let commands = {};
		commandPacks.forEach(x => {
			if (!config.blacklist || !config.blacklist.includes(x.name)) {
				commands = Object.assign(
					commands,
					x.init({ config: config[x.name] || {} })
				);
			}
		});
		const prefixes = config.prefixes || ["'", ";"];

		return {
			onMessage: function({ dclient, msg }) {
				if (msg.author.id === dclient.user.id) return;
				prefixes.forEach(async prefix => {
					const commandRegex = new RegExp(
						`(?:^|\\s)${prefix}(\\w+)(?: +(.*?) *)?(?:$|${prefix}end)`,
						"g"
					);
					let commandMatch, argsMatch;
					while (
						(commandMatch = commandRegex.exec(msg.content.replace(/\n/g, " ")))
					) {
						const [_, command, rawArgs] = commandMatch;
						const args = [];
						if (rawArgs !== undefined) {
							while ((argsMatch = argsRegex.exec(rawArgs))) {
								args.push(argsMatch.slice(1).find(x => x));
							}
						}
						debug({ command, prefix, args });
						if (command === "help") {
							const executableCommands = [];
							commandPacks.forEach(x => {
								if (
									typeof x.canExecute !== "function" ||
									x.canExecute({ msg })
								) {
									// causes side effects if .init() is impure, TODO add .commands property?
									executableCommands.push(Object.keys(x.init({ config })));
								}
							});
							msg.channel.send(
								`Available commands: ${executableCommands
									.map(x => `[${x.join(", ")}]`)
									.join(", ")}`
							);
						} else if (typeof commands[command] === "function") {
							const result = await commands[command]({
								args,
								rawArgs,
								dclient,
								msg
							});
							if (result) {
								msg.channel.send(result);
							}
						}
					}
				});
			}
		};
	}
};
