const regex = /<:(\w+):(\d+)>/g;

module.exports = {
	init: function({ config, db }) {
		db.prepare(
			"CREATE TABLE IF NOT EXISTS emoji_stats (serverId TEXT, emoji TEXT, count INTEGER, UNIQUE (serverId, emoji))"
		).run();
		const incrementPrepared = db.prepare(
			"INSERT INTO emoji_stats (serverId, emoji, count) VALUES (?, ?, 1) ON CONFLICT (serverId, emoji) DO UPDATE SET count = count + 1"
		);

		return {
			onMessage: function({ msg, dclient }) {
				const set = new Set();
				let match;
				while ((match = regex.exec(msg.content))) {
					const [whole, name, id] = match;
					if (
						msg.guild.emojis.get(id) &&
						msg.guild.emojis.get(id).name === name &&
						!set.has(whole)
					) {
						set.add(whole);
						incrementPrepared.run(msg.guild.id, whole);
					}
				}
			}
		};
	}
};
