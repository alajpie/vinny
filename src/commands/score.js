module.exports = {
	init: ({ db }) => {
		const scorePrepared = db.prepare(
			"SELECT sum, RANK() OVER (ORDER BY sum DESC) rank FROM points_sum WHERE serverId = ? AND userId = ?"
		);
		const leaderboardsPrepared = db.prepare(
			"SELECT RANK() OVER (ORDER BY sum DESC) rank, sum, userId FROM points_sum ORDER BY sum DESC LIMIT 10"
		);
		const leaderboards = ({ msg, dclient }) => {
			let out = "```\n";
			leaderboardsPrepared.all().forEach(row => {
				const user = dclient.users.get(row.userId);
				const name = user ? user.username : `<@!${row.userId}>`;
				out += `#${row.rank} ${row.sum.toString().padStart(7, " ")} ${name}\n`;
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
