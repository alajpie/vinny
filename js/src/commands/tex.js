const discord = require("discord.js");

const tex = white => {
	if (white) {
		var settings = "\\bg_white \\huge \\dpi{500}";
	} else {
		var settings = "\\huge \\dpi{500} \\color{white}";
	}
	return ({ msg, rawArgs }) =>
		msg.channel.send("", {
			files: [
				new discord.Attachment(
					"https://latex.codecogs.com/png.latex?" +
						encodeURI(settings + " " + rawArgs),
					"hello_there_mobile_user.png"
				)
			]
		});
};

module.exports = { tex: tex(false), whitex: tex(true) };
