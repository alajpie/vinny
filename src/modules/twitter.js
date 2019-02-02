const delve = require("dlv");
const Twit = require("twit");

const re = /\bhttps?:\/\/twitter\.com\/[^\/]+\/status\/([0-9]+)/g;

module.exports = {
	init: ({ secrets }) => {
		const T = new Twit({
			consumer_key: secrets.twitterConsumerKey,
			consumer_secret: secrets.twitterConsumerSecret,
			app_only_auth: true
		});

		return {
			onMessage: async ({ msg }) => {
				const match = re.exec(msg.content);

				if (!match) {
					return;
				}

				const id = match[1];

				const tweet = await T.get("statuses/show/:id", {
					id,
					include_entities: true
				});

				const media = delve(tweet, "data.extended_entities.media", []);
				const photos = media.filter(e => e && e.type === "photo");
				const hasMultiplePhotos = photos.length > 1;

				const isThread =
					delve(tweet, "data.in_reply_to_user_id", 0) ===
					delve(tweet, "data.user.id", 1);

				let info = [];

				if (isThread) {
					info.push("thread");
				}

				if (hasMultiplePhotos) {
					info.push(`${photos.length - 1} more photos`);
				}

				if (info.length > 0) {
					msg.channel.send(`[${info.join(", ")}]`);
				}
			}
		};
	}
};
