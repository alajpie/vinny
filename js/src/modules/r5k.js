const { debug, info, error, fatal, assert } = require("../logging.js");

function strip(msg) {
	return msg.content.toLowerCase().replace(/[^0-9a-z]/g, "");
}

module.exports = {
	init: function({ config, db }) {
		db.prepare(
			"CREATE TABLE IF NOT EXISTS r5k (message TEXT PRIMARY KEY) WITHOUT ROWID"
		).run();
		const existsPrepared = db.prepare("SELECT 1 FROM r5k WHERE message = ?");
		const insertPrepared = db.prepare("INSERT INTO r5k (message) VALUES (?)");
		function check(msg, dclient) {
			if (msg.author.id === dclient.user.id) return;
			if (msg.type === "PINS_ADD") return;
			const stripped = strip(msg);
			db.transaction(() => {
				const exists = existsPrepared.get(stripped);
				debug({ stripped, exists: !!exists });
				if (exists && msg.channel.id === config.channel) {
					msg.delete(500);
					dclient.channels
						.get(config.failChannel)
						.send(`${msg.author.tag}: ${msg.content}`);
				} else if (!exists) {
					insertPrepared.run(stripped);
				}
			})();
		}

		return {
			onMessage: function({ msg, dclient }) {
				return check(msg, dclient);
			},
			onEdit: function({ prev, next, dclient }) {
				if (prev.content === next.content) return;
				return check(next, dclient);
			}
		};
	}
};
