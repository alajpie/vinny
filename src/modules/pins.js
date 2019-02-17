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
				const pins = new Set();
				const antipins = new Set();
				react.message.reactions.forEach(x => {
					if (config.pins.includes(x.emoji.toString())) {
						x.users.array().forEach(y => pins.add(y.id));
					}
					if (config.antipins.includes(x.emoji.toString())) {
						x.users.array().forEach(y => antipins.add(y.id));
					}
				});
				pins.delete(react.message.author.id)
				if (
					pins.size - antipins.size >= config.threshold &&
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
