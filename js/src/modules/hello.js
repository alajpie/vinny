module.exports = {
	onMessage: function({ config, msg }) {
		if (msg.content.includes("a0673fbf-b2d2-481a-9f26-7823ea7eda08")) {
			msg.channel.send(
				`${config.name || "Autoclave"} says ${config.greeting || "hi"}!`
			);
		}
	}
};