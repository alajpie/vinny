module.exports = {
	commands: { emojistats: null },
	init: ({ db }) => {
		db.prepare(
			"CREATE TABLE IF NOT EXISTS emoji_stats (serverId TEXT, emoji TEXT, count INTEGER, UNIQUE (serverId, emoji))"
		).run();
		const statsPrepared = db.prepare(
			"SELECT RANK() OVER (ORDER BY count DESC) rank, count, emoji FROM emoji_stats WHERE serverId = ? ORDER BY count DESC"
		);

		return {
			emojistats: ({ msg }) => {
				let out = "\u200b\n";
				statsPrepared.all(msg.guild.id).forEach(row => {
					out += `\`#${row.rank} ${row.count.toString().padStart(4, " ")}\`  ${
						row.emoji
					}\n`;
				});
				return out;
			}
		};
	}
};
