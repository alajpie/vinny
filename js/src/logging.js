const chalk = require("chalk");
const util = require("util");

async function log(msg) {
	console.log(msg);
}

function prelog(items) {
	return items
		.map(x => {
			if (typeof x === "string") {
				return x;
			} else {
				return util.inspect(x, { depth: 10, breakLength: Infinity });
			}
		})
		.join(" ");
}

function trace() {
	return new Error().stack
		.split("\n")
		.slice(3)
		.join("\n");
}

async function debug(...items) {
	return log(chalk.bold.gray("DEBUG: ") + chalk.gray(prelog(items)));
}

async function info(...items) {
	return log(chalk.bold.blue("INFO: ") + prelog(items));
}

async function error(...items) {
	return log(
		chalk.bold.red("ERROR: ") + chalk.red(`${prelog(items)}\n${trace()}`)
	);
}

async function fatal(...items) {
	await log(chalk.bold.bgRed("FATAL: " + `${prelog(items)}\n${trace()}`));
	process.exit(1);
}

async function assert(condition, msg, fatal_ = true) {
	if (condition) {
		return debug(`Assertion "${prelog([msg])}" passed`);
	} else {
		if (fatal_) {
			return fatal(`Assertion "${prelog([msg])}" failed`);
		} else {
			return error(`Assertion "${prelog([msg])}" failed`);
		}
	}
}

module.exports = { debug, info, error, fatal, assert };
