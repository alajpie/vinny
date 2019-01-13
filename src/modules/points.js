module.exports = {
	init: function({ db }) {
		db.prepare(
			"CREATE TABLE IF NOT EXISTS points (serverId TEXT, userId TEXT, change INTEGER, time INTEGER)"
		).run();
		db.prepare(
			"CREATE TABLE IF NOT EXISTS points_sum (serverId TEXT, userId TEXT, sum INTEGER, UNIQUE (serverId, userId))"
		).run();
		const insertPrepared = db.prepare(
			"INSERT INTO points (serverId, userId, change, time) VALUES (?, ?, ?, ?)"
		);
		const increaseSumPrepared = db.prepare(
			"INSERT INTO points_sum (serverId, userId, sum) VALUES (?, ?, ?) ON CONFLICT (serverId, userId) DO UPDATE SET sum = sum + ?"
		);
		return {
			onMessage: function({ msg, dclient }) {
				if (msg.author.id === dclient.user.id) return;
				const change = Math.floor(5 + Math.min(msg.content.length / 10, 10));
				db.transaction(() => {
					insertPrepared.run(msg.guild.id, msg.author.id, change, Date.now());
					increaseSumPrepared.run(msg.guild.id, msg.author.id, change, change);
				})();
			}
		};
	}
};
