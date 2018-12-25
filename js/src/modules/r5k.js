const { debug, info, error, fatal, assert } = require("../logging.js");

function strip(msg) {
	return msg.content.toLowerCase().replace(/[^0-9a-z]/g, "");
}

async function check(db, config, msg, dclient) {
	if (msg.channel.id !== config.channel) return;
	if (msg.author.id === dclient.user.id) return;
	const stripped = strip(msg);
	const exists = await db.get(
		"SELECT 1 FROM r5k WHERE message = ?",
		stripped
	);
	debug({ stripped, exists: !!exists });
	if (exists) {
		msg.delete(500);
		dclient.channels
			.get(config.failChannel)
			.send(`${msg.author.tag}: ${msg.content}`);
	} else {
		await db.run(
			"INSERT INTO r5k (message) SELECT $m WHERE NOT EXISTS (SELECT 1 FROM r5k WHERE message = $m)",
			{ $m: stripped }
		);
	}
}

module.exports = {
	init: async function({ config, db }) {
		await db.run(
			"CREATE TABLE IF NOT EXISTS r5k (message TEXT PRIMARY KEY)"
		);
		return {
			onMessage: function({ msg, dclient }) {
				return check(db, config, msg, dclient);
			},
			onEdit: function({ prev, next, dclient }) {
				if (prev.content === next.content) return;
				return check(db, config, next, dclient);
			}
		};
	}
};
