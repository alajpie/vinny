module.exports = {
	init: function({ config }) {
		return {
			onMessage: function({ msg }) {
				if (
					msg.channel.id === config.channel &&
					msg.content.toLowerCase().includes("e")
				) {
					msg.delete(500);
				}
			}
		};
	}
};
