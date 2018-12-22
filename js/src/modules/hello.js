const { debug, info, error, fatal, assert } = require("../logging.js");

module.exports = {
	onMessage: function(dclient, msg) {
		if (msg.content.includes("a0673fbf-b2d2-481a-9f26-7823ea7eda08")) {
			msg.channel.send("boop");
		}
	}
};
