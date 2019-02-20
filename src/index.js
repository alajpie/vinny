const discord = require("discord.js");
const yaml = require("js-yaml");
const fs = require("promise-fs");
const path = require("path");
const glob = require("glob");
const sqlite = require("better-sqlite3");
const ON_DEATH = require("death"); // intentionally ugly
const asynclock = require("async-lock");
const _ = require("lodash");
const lock = new asynclock();
const { debug, info, error, fatal, assert } = require("./logging.js");

process.on("unhandledRejection", e => {
	error(e);
});

async function main() {
	debug("Opening SQLite database");
	assert(!!process.env.SQLITE, "valid SQLite path");
	const db = sqlite(process.env.SQLITE);
	ON_DEATH(() => {
		db.close();
		process.exit(1);
	});
	debug("SQLite opened");
	db.pragma("journal_mode = WAL");
	db.pragma("synchronous = NORMAL");
	debug("WAL mode set");
	db.pragma("foreign_keys = ON");
	debug("Foreign key validation enabled");

	debug("Loading config");
	assert(!!process.env.CONFIG, "valid config path");
	try {
		await fs.access(process.env.CONFIG, fs.constants.R_OK);
	} catch (e) {
		fatal("unreadable config path,", e);
	}
	const configString = await fs.readFile(process.env.CONFIG);
	const config = yaml.safeLoad(configString);
	debug("Config loaded:", config);

	debug("Loading secrets");
	assert(!!process.env.SECRETS, "valid secrets path");
	try {
		await fs.access(process.env.SECRETS, fs.constants.R_OK);
	} catch (e) {
		fatal("unreadable secrets path,", e);
	}
	const secretsString = await fs.readFile(process.env.SECRETS);
	const secrets = yaml.safeLoad(secretsString);
	debug("Secrets loaded");

	debug("Loading modules");
	const modulePaths = glob.sync(path.join(__dirname, "modules/**/*.js"));
	const modules = [];
	modulePaths.forEach(x => {
		const mod = require(path.resolve(x));
		mod.name = mod.name || path.parse(x).name;
		modules.push(mod);
	});
	info("Modules loaded:", modules.map(x => x.name));
	const moduleInstances = {};
	const promises = [];
	for (let [serverId, serverConfig] of Object.entries(config.servers)) {
		moduleInstances[serverId] = [];
		promises.push(
			...modules.map(async mod => {
				if (_.get(serverConfig, ["modules"], []).includes(mod.name)) {
					moduleInstances[serverId].push(
						await mod.init({
							config: _.get(serverConfig, ["moduleConfig", mod.name], {}),
							db,
							serverId,
							lock
						})
					);
				}
			})
		);
	}
	await Promise.all(promises);

	await initaliseDiscord(config, secrets, moduleInstances);
}

async function initaliseDiscord(config, secrets, moduleInstances) {
	const dclient = new discord.Client();

	dclient.on("ready", x => {
		info(`Logged in as ${dclient.user.tag}`);
	});

	dclient.on("ready", () => {
		for (let [server, mods] of Object.entries(moduleInstances)) {
			mods.forEach(x => {
				if (typeof x.onReady === "function") {
					x.onReady({ dclient });
				}
			});
		}
	});

	function callModules(obj, event, args) {
		if (moduleInstances.hasOwnProperty(obj.guild.id)) {
			// if we're handling this server
			moduleInstances[obj.guild.id].forEach(x => {
				if (typeof x[event] === "function") {
					x[event](Object.assign(args, { dclient }));
				}
			});
		}
	}

	dclient.on("messageUpdate", (prev, next) => {
		callModules(next, "onEdit", { prev, next });
	});

	dclient.on("guildMemberUpdate", (prev, next) => {
		callModules(next, "onMemberEdit", { prev, next });
	});

	dclient.on("message", msg => {
		callModules(msg, "onMessage", { msg });
	});

	// shim for getting reaction events on all messages, not just cached ones
	// https://github.com/discordjs/guide/blob/master/code-samples/popular-topics/reactions/raw-event.js
	const events = {
		MESSAGE_REACTION_ADD: "messageReactionAdd",
		MESSAGE_REACTION_REMOVE: "messageReactionRemove"
	};

	dclient.on("raw", async event => {
		if (!events.hasOwnProperty(event.t)) return;

		const { d: data } = event;
		const user = dclient.users.get(data.user_id);
		const channel =
			dclient.channels.get(data.channel_id) || (await user.createDM());

		if (channel.messages.has(data.message_id)) return;

		const message = await channel.fetchMessage(data.message_id);
		const emojiKey = data.emoji.id
			? `${data.emoji.name}:${data.emoji.id}`
			: data.emoji.name;
		let reaction = message.reactions.get(emojiKey);

		if (!reaction) {
			const emoji = new Discord.Emoji(
				dclient.guilds.get(data.guild_id),
				data.emoji
			);
			reaction = new Discord.MessageReaction(
				message,
				emoji,
				1,
				data.user_id === dclient.user.id
			);
		}

		dclient.emit(events[event.t], reaction, user);
	});
	// end

	dclient.on("messageReactionAdd", (react, user) => {
		callModules(react.message, "onReact", { react, user });
	});

	dclient.on("messageReactionRemove", (react, user) => {
		callModules(react.message, "onUnreact", { react, user });
	});

	dclient.login(secrets.discordToken);

	return new Promise((resolve, reject) => {
		dclient.on("ready", x => {
			resolve(dclient);
		});
	});
}

main();
