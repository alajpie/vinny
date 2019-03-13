module.exports = {
	init: function({ config, db, serverId }) {
		return {
			onReady: function({ dclient, serverId }) {
				function timer() {
					const date = new Date();
					const utc = date.getUTCHours() + ":" + date.getUTCMinutes() + " UTC";
					dclient.guilds
						.get(serverId)
						.members.get(dclient.user.id)
						.setNickname(utc);
					setTimeout(timer, 60000 - (new Date() % 60000)); // next full minute
				}
				timer();
			}
		};
	}
};
