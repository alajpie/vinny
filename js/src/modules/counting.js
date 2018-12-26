const { debug, info, error, fatal, assert } = require("../logging.js");

module.exports = {
	init: async function({ config, db, serverId }) {
		db.exec(
			"CREATE TABLE IF NOT EXISTS counting_count (id INTEGER PRIMARY KEY AUTOINCREMENT, serverId TEXT, count INTEGER)"
		);
		db.exec(
			"CREATE TABLE IF NOT EXISTS counting_last (id INTEGER PRIMARY KEY AUTOINCREMENT, serverId TEXT, userId TEXT)"
		);
		db.exec(
			`INSERT INTO counting_count (serverId, count) SELECT ${serverId}, 0 WHERE NOT EXISTS (SELECT 1 FROM counting_count WHERE serverId = ${serverId})`
		);
		db.exec(
			`INSERT INTO counting_last (serverId, userId) SELECT ${serverId}, null WHERE NOT EXISTS (SELECT 1 FROM counting_last WHERE serverId = ${serverId})`
		);
		const getCountPrepared = db.prepare(
			`SELECT count FROM counting_count WHERE serverId = ${serverId}`
		);
		const getLastPrepared = db.prepare(
			`SELECT userId FROM counting_last WHERE serverId = ${serverId}`
		);
		const incrementCountPrepared = db.prepare(
			`UPDATE counting_count SET count = count + 1 WHERE serverId = ${serverId}`
		);
		const updateLastPrepared = db.prepare(
			`UPDATE counting_last SET userId = ? WHERE serverId = ${serverId}`
		);

		return {
			onMessage: function({ msg }) {
				if (msg.channel.id !== config.channel) return;
				if (msg.type === "PINS_ADD") return;
				const last = getLastPrepared.get().userId;
				debug({ last });
				if (msg.author.id === last) {
					msg.delete(500);
					return;
				}
				const count = getCountPrepared.get().count;
				debug({ count });
				if (parseInt(msg.content) !== count) {
					msg.delete(500);
					return;
				}
				incrementCountPrepared.run();
				updateLastPrepared.run(msg.author.id);
				msg.channel.setTopic(`Next number: ${count + 1}`);
			},
			onEdit: function({ prev, next }) {
				if (prev.content === next.content) return;
				msg.delete();
			}
		};
	}
};
