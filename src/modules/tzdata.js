const moment = require("moment-timezone");
const { debug, info, error, fatal, assert } = require("../logging.js");

async function update(dataPrepared, channel, dclient) {
	const data = dataPrepared.all();
	const messageHeader =
		"Use the `tz` command with what this page: <https://jsfiddle.net/d708xu4e> says to add yourself to the list.";
	let messageText = messageHeader;
	data.map(row => {
		row.numericOffset =
			// timezone database has opposite offsets, see https://github.com/eggert/tz/blob/2017b/etcetera#L36-L42
			moment.tz.zone(row.timezone).utcOffset(moment()) / -60;
		return row;
	})
		.sort((a, b) => a.numericOffset - b.numericOffset)
		.forEach(row => {
			let numericOffset = row.numericOffset;
			let formattedOffset;
			if (numericOffset > 0) {
				formattedOffset = "+" + numericOffset;
			} else if (numericOffset === 0) {
				formattedOffset = " 0";
			} else {
				formattedOffset = numericOffset.toString();
			}
			const time = moment()
				.tz(row.timezone)
				.format("HH:mm");
			const tag = dclient.users.get(row.userId).tag;
			messageText += `\n\`${time} (${formattedOffset})\` ${tag}`;
		});
	const messages = await dclient.channels
		.get(channel)
		.fetchMessages({ limit: 10 });
	const persistentMessage = messages
		.array()
		.find(
			x =>
				x.author.id === dclient.user.id &&
				x.content.includes(messageHeader)
		);
	if (persistentMessage) {
		persistentMessage.edit(messageText);
	} else {
		dclient.channels.get(channel).send(messageText);
	}
}

module.exports = {
	init: function({ config, db, serverId }) {
		assert(!!config.channel, "valid channel");
		db.prepare(
			"CREATE TABLE IF NOT EXISTS tzdata (userId TEXT PRIMARY KEY, timezone TEXT)"
		).run();
		db.prepare(
			"CREATE TABLE IF NOT EXISTS tzdata_servers (serverId TEXT, userId TEXT, UNIQUE (serverId, userId), FOREIGN KEY (userId) REFERENCES tzdata (userId) ON DELETE CASCADE)"
		).run();
		const dataPrepared = db
			.prepare(
				"SELECT tzdata.userId, tzdata.timezone FROM tzdata INNER JOIN tzdata_servers ON tzdata.userId=tzdata_servers.userId WHERE tzdata_servers.serverId = ?"
			)
			.bind(serverId);

		return {
			onReady: function({ dclient }) {
				function timer() {
					update(dataPrepared, config.channel, dclient);
					setTimeout(timer, 60000 - (new Date() % 60000)); // next full minute
				}
				timer();
			}
		};
	}
};
