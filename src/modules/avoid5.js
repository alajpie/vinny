const normalize = require("normalize-strings");

module.exports = {
	init: function({ config }) {
		return {
			onMessage: function({ msg }) {
				if (
					msg.channel.id === config.channel &&
					normalize(msg.content.toLowerCase()).includes("e")
				) {
					msg.delete(500);
				}
			}
		};
	}
};
