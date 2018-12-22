const discord = require("discord.js");
const yaml = require("js-yaml");
const fs = require("promise-fs");
const path = require("path");
const glob = require("glob");
const delve = require("dlv");
const { debug, info, error, fatal, assert } = require("./logging.js");

async function main() {
	info(`Commit ${process.env.COMMIT || "unknown"}`);
	if (process.env.NODE_ENV === "production") {
		info("Production tier");
	} else {
		info("Dev tier");
	}

	debug("Loading config");
	assert(!!process.env.CONFIG, "valid config path");
	const configString = await fs.readFile(process.env.CONFIG);
	const config = yaml.safeLoad(configString);
	debug("Config loaded:", config);

	debug("Loading secrets");
	assert(!!process.env.SECRETS, "valid secrets path");
	const secretsString = await fs.readFile(process.env.SECRETS);
	const secrets = yaml.safeLoad(secretsString);
	debug("Secrets loaded");

	debug("Loading modules");
	const modulePaths = glob.sync(path.join(__dirname, "modules/*.js"));
	const modules = {};
	modulePaths.forEach(x => {
		modules[path.parse(x).name] = require(path.resolve(x));
	});
	info("Modules loaded:", Object.keys(modules));

	await initaliseDiscord(config, secrets, modules);
}

async function initaliseDiscord(config, secrets, modules) {
	const dclient = new discord.Client();

	dclient.on("ready", x => {
		info(`Logged in as ${dclient.user.tag}`);
	});

	dclient.on("ready", () => {
		for (let [name, mod] of Object.entries(modules)) {
			if (typeof mod.onReady === "function") {
				const moduleConfig = delve(
					config,
					["servers", obj.guild.id, "moduleConfig", name],
					{}
				);
				mod.onReady({ dclient, config: moduleConfig });
			}
		}
	});

	function callModules(obj, event, args) {
		const serverModules = delve(
			config,
			["servers", obj.guild.id, "modules"],
			[]
		);
		for (let [name, mod] of Object.entries(modules)) {
			if (
				serverModules.includes(name) &&
				typeof mod[event] === "function"
			) {
				const moduleConfig = delve(
					config,
					["servers", obj.guild.id, "moduleConfig", name],
					{}
				);
				mod[event](
					Object.assign(args, { dclient, config: moduleConfig })
				);
			}
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

	dclient.login(secrets.discordToken);

	return new Promise((resolve, reject) => {
		dclient.on("ready", x => {
			resolve(dclient);
		});
	});
}

main();
