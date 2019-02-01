const delve = require("dlv");
const Twit = require("twit");

module.exports = {
	init: ({secrets}) => {
		const T = new Twit({
			consumer_key: secrets.twitterConsumerKey,
			consumer_secret: secrets.twitterConsumerSecret,
			app_only_auth: true
		});

		const re = /\bhttps?:\/\/twitter\.com\/[^\/]+\/status\/([0-9]+)/g;

		return {
			onMessage: ({ msg }) => {
				const match = re.exec(msg.content);

				if (match === null) {
					return;
				}

				const id = match[1];

				T.get("statuses/show/:id", {
					id,
					include_entities: true
				}).then(function(result) {
					const media = delve(result, "data.extended_entities.media", []);
					const photos = media.filter(e => e && e.type === "photo");
					const has_multiple_photos = photos.length > 1;

					const is_thread = delve(result, "data.in_reply_to_user_id", 0) === delve(result, "data.user.id", 1);

					var info = [];

					if (is_thread) {
						info.push("thread");
					}

					if (has_multiple_photos) {
						info.push(`${photos.length - 1} more photos`);
					}

					if (info.length > 0) {
						msg.channel.send(`[${info.join(", ")}]`);
					}
				});
			},
		};
	}
};
