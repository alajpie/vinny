const glob = require("glob");
const path = require("path");
const escapeStringRegexp = require("escape-string-regexp");
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
	init: function({ config, db, serverId, lock }) {
		let commands = {};
		commandPacks.forEach(x => {
			if (!config.blacklist || !config.blacklist.includes(x.name)) {
				commands = Object.assign(
					commands,
					x.init({ config: config[x.name] || {}, db, serverId, lock })
				);
			}
		});
		let prefixes = config.prefixes || ["'", ";"];
		prefixes = prefixes.map(x => escapeStringRegexp(x));

		return {
			onMessage: function({ dclient, msg }) {
				if (msg.author.id === dclient.user.id) return;
				prefixes.forEach(async prefix => {
					const commandRegex = new RegExp(
						`(?:^|\\s)${prefix}(\\w+)(?: +(.*?) *)?(?:$|${prefix}end)`,
						"igs"
					);
					let commandMatch, argsMatch;
					while ((commandMatch = commandRegex.exec(msg.content))) {
						let [_, command, rawArgs] = commandMatch;
						command = command.toLowerCase();
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
									if (typeof x.commands === "object") {
										const inPack = [];
										Object.keys(x.commands).forEach(y => {
											if (x.commands[y]) {
												inPack.push(`${y} (${x.commands[y].join(", ")})`);
											} else {
												inPack.push(y);
											}
										});
										executableCommands.push(inPack);
									} else {
										executableCommands.push(Object.keys(x.init({ config })));
									}
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
								rawArgs: rawArgs || "",
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
