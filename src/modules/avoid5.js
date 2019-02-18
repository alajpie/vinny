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
			},
			onEdit: function({ next }) {
				if (
					next.channel.id === config.channel &&
					normalize(next.content.toLowerCase()).includes("e")
				) {
					next.delete(500);
				}
			}
		};
	}
};
