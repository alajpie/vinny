module.exports = {
	init: function({ config, db }) {
		db.prepare(
			"CREATE TABLE IF NOT EXISTS pins (messageId TEXT PRIMARY KEY) WITHOUT ROWID"
		).run();
		const existsPrepared = db.prepare("SELECT 1 FROM pins WHERE messageId = ?");
		const insertPrepared = db.prepare(
			"INSERT INTO pins (messageId) VALUES (?)"
		);

		return {
			onReact: function({ react, user, dclient }) {
				if (react.message.channel.id === config.channel) return;
				const set = new Set();
				react.message.reactions.forEach(x => {
					if (config.emojis.includes(x.emoji.toString())) {
						x.users.array().forEach(y => set.add(y.id));
					}
				});
				set.delete(react.message.author.id)
				if (
					set.size >= config.threshold &&
					!existsPrepared.get(react.message.id)
				) {
					dclient.channels
						.get(config.channel)
						.send(
							`<@${react.message.author.id}> in <#${
								react.message.channel.id
							}>: ${react.message.content}`,
							{ files: react.message.attachments.array().map(x => x.url) }
						);
					insertPrepared.run(react.message.id);
				}
			}
		};
	}
};
