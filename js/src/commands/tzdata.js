const moment = require("moment-timezone");

module.exports = {
	init: ({ db, serverId }) => {
		db.prepare(
			"CREATE TABLE IF NOT EXISTS tzdata (userId TEXT PRIMARY KEY, timezone TEXT)"
		).run();
		db.prepare(
			"CREATE TABLE IF NOT EXISTS tzdata_servers (serverId TEXT, userId TEXT, UNIQUE (serverId, userId), FOREIGN KEY (userId) REFERENCES tzdata (userId) ON DELETE CASCADE)"
		).run();
		const insertTimezonePrepared = db.prepare(
			"INSERT INTO tzdata (userId, timezone) VALUES (?, ?) ON CONFLICT (userId) DO UPDATE SET timezone=excluded.timezone"
		);
		const insertServerPrepared = db.prepare(
			"INSERT INTO tzdata_servers (serverId, userId) VALUES (?, ?) ON CONFLICT (serverId, userId) DO NOTHING"
		);
		const existsTimezonePrepared = db.prepare(
			"SELECT 1 FROM tzdata WHERE userId = ?"
		);
		const existsServerPrepared = db.prepare(
			"SELECT 1 FROM tzdata_servers WHERE serverId = ? AND userId = ?"
		);
		const deleteServerPrepared = db.prepare(
			"DELETE FROM tzdata_servers WHERE serverId = ? AND userId = ?"
		);

		return {
			tz: ({ args, msg }) => {
				const userId = msg.author.id;
				if (args.length > 0) {
					const timezone = args[0];
					// called with a timezone
					if (!moment.tz.zone(timezone)) {
						msg.channel.send(
							"Invalid timezone, please use what this page: <https://jsfiddle.net/d708xu4e> says."
						);
						return;
					}
					db.transaction(() => {
						insertTimezonePrepared.run(userId, timezone);
						insertServerPrepared.run(serverId, userId);
					})();
					msg.channel.send("Updated!");
				} else {
					// called _without_ a timezone, toggling
					db.transaction(() => {
						const timezoneExists = existsTimezonePrepared.get(userId);
						if (!timezoneExists) {
							msg.channel.send("Please specify a timezone.");
							return;
						}
						const serverExists = existsServerPrepared.get(serverId, userId);
						if (!serverExists) {
							insertServerPrepared.run(serverId, userId);
							msg.channel.send("Added to the timezone list on this server.");
						} else {
							deleteServerPrepared.run(serverId, userId);
							msg.channel.send(
								"Removed from the timezone list on this server."
							);
						}
					})();
				}
			}
		};
	}
};
