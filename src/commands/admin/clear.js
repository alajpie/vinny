const { debug, info, error, fatal, assert } = require("../../logging.js");

module.exports = {
	init: () => ({
		clear: async ({ dclient, args, msg }) => {
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

			let i;
			if (limit === "inf") {
				i = Infinity;
			} else {
				i = parseInt(limit) + 1; // clear out the clear command too
			}
			const toDelete = new Set();
			outer: while (i > 0) {
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
					toDelete.add(x.id);
					if (x.id === limit || i <= 0) {
						break outer;
					}
				}
			}
			debug("finished scanning for messages to delete");
			let deleted = new Set();
			if (dclient.user.bot) {
				deleted = await msg.channel.bulkDelete(Array.from(toDelete), true);
			}
			const remaining = new Set([...toDelete].filter(x => !deleted.has(x)));
			debug(remaining.size, "messages remaining for slow deletion");
			remaining.forEach(x => msg.channel.fetchMessage(x).delete());
			return;
		}
	}),
	canExecute: ({ msg }) => msg.member.hasPermission("MANAGE_MESSAGES")
};
