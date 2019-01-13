module.exports = {
	init: ({ db }) => {
		const scorePrepared = db.prepare(
			"SELECT sum, RANK() OVER (ORDER BY sum DESC) rank FROM points_sum WHERE serverId = ? AND userId = ?"
		);
		const leaderboardsPrepared = db.prepare(
			"SELECT RANK() OVER (ORDER BY sum DESC) rank, sum, userId FROM points_sum ORDER BY sum DESC"
		);
		const leaderboards = ({ msg }) => {
			let out = "```\n";
			leaderboardsPrepared
				.all()
				.slice(0, 10)
				.forEach(row => {
					const u = msg.guild.members.get(row.userId);
					const tag = u ? u.user.tag : "<unknown>";
					out += `#${row.rank} ${row.sum.toString().padStart(7, " ")} ${tag}\n`;
				});
			out += "```";
			return out;
		};
		return {
			score: ({ msg }) => {
				const row = scorePrepared.get(msg.guild.id, msg.author.id);
				return `${row.sum} (#${row.rank})`;
			},
			leaderboards,
			leaderboard: leaderboards
		};
	}
};
