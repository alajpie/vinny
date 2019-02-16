module.exports = {
	init: function({ config }) {
		return {
			onMemberEdit: function({ prev, next, dclient }) {
				if (prev.nickname === next.nickname) return;
				if (!next.roles.has(config.role)) return;
				dclient.channels
					.get(config.channel)
					.send(`${next.user.username}: ${next.nickname}`);
			}
		};
	}
};
