module.exports = {
	clear: async ({ args, msg }) => {
		if (!msg.member.hasPermission("MANAGE_MESSAGES")) return "no";
		if (args[1]) {
			// a range
			// so both numbers are IDs
			var limit = BigInt(args[0]) < BigInt(args[1]) ? args[0] : args[1];
			var b4 = BigInt(args[0]) > BigInt(args[1]) ? args[0] : args[1];
			var b4 = (BigInt(b4) + 1n).toString(); // inclusive from both sides
		} else {
			// not a range
			// the number can be a count or an ID
			var limit = args[0];
			var b4 = "";
		}
		/// we return after `limit` messages or if a message's id equals `limit`
		/// so regardless of whether a count or a message's ID is provided, it does the right thing
		/// (since message IDs are very big numbers, they are unlikely to be specified or counted down to)

		let i = parseInt(limit) + 1; // clear out the clear command too
		const promises = [];
		while (i > 0) {
			const messagesPromise = msg.channel.fetchMessages({
				limit: 50,
				before: b4
			});
			const messages = (await messagesPromise).array();
			if (messages.length === 0) {
				break;
			}
			b4 = messages[messages.length - 1].id;
			for (var x of messages) {
				i--;
				promises.push(x.delete());
				if (x.id === limit || i <= 0) {
					await Promise.all(promises);
					return;
				}
			}
		}
		await Promise.all(promises);
		return;
	}
};
