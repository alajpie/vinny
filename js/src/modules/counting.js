const { debug, info, error, fatal, assert } = require("../logging.js");

module.exports = {
	init: async function({ config, db, serverId }) {
		db.prepare(
			"CREATE TABLE IF NOT EXISTS counting_count (id INTEGER PRIMARY KEY, serverId TEXT, count INTEGER)"
		).run();
		db.prepare(
			"CREATE TABLE IF NOT EXISTS counting_last (id INTEGER PRIMARY KEY, serverId TEXT, userId TEXT)"
		).run();
		db.prepare(
			"INSERT INTO counting_count (serverId, count) SELECT ?, 0 WHERE NOT EXISTS (SELECT 1 FROM counting_count WHERE serverId = ?)"
		).run(serverId, serverId);
		db.prepare(
			"INSERT INTO counting_last (serverId, userId) SELECT ?, null WHERE NOT EXISTS (SELECT 1 FROM counting_last WHERE serverId = ?)"
		).run(serverId, serverId);
		const getCountPrepared = db
			.prepare("SELECT count FROM counting_count WHERE serverId = ?")
			.bind(serverId);
		const getLastPrepared = db
			.prepare("SELECT userId FROM counting_last WHERE serverId = ?")
			.bind(serverId);
		const incrementCountPrepared = db
			.prepare(
				"UPDATE counting_count SET count = count + 1 WHERE serverId = ?"
			)
			.bind(serverId);
		const updateLastPrepared = db.prepare(
			"UPDATE counting_last SET userId = ? WHERE serverId = ?"
		);

		return {
			onMessage: function({ msg }) {
				if (msg.channel.id !== config.channel) return;
				if (msg.type === "PINS_ADD") return;
				db.transaction(() => {
					const last = getLastPrepared.get().userId;
					debug({ last });
					if (msg.author.id === last) {
						msg.delete(500);
						return;
					}
					const count = getCountPrepared.get().count;
					debug({ count });
					if (msg.content !== count.toString()) {
						msg.delete(500);
						return;
					}
					incrementCountPrepared.run();
					updateLastPrepared.run(msg.author.id, serverId);
					msg.channel.setTopic(`Next number: ${count + 1}`);
				})();
			},
			onEdit: function({ prev, next }) {
				if (next.channel.id !== config.channel) return;
				if (prev.content === next.content) return;
				next.delete();
			}
		};
	}
};
