require("dotenv").config();
const Discord = require("discord.js");
const moment = require("moment-timezone");

const dclient = new Discord.Client();

async function bump() {
	return dclient.channels.get("516014642724864000").send("!disboard bump");
}

dclient.on("ready", () => {
	console.log(`Logged in as ${dclient.user.tag}!`);
	bump();
});

let timer;

dclient.on("message", msg => {
	if (!msg.guild || msg.guild.id !== "472079800744411136") {
		return;
	}
	if (msg.content.includes(";bumper")) {
		msg.channel.send("sup");
	}
	if (msg.author.id === "302050872383242240") {
		if (msg.embeds[0]) {
			const match = msg.embeds[0].description.match(
				/Please wait another \*\*(\d+)\*\*/
			);
			if (match) {
				const offset = (+match[1] + 1) * 60 * 1000;
				msg.channel.send(
					`Bumping on ${moment()
						.tz("Europe/Warsaw")
						.add(offset, "milliseconds")
						.format()}.`
				);
				setTimeout(() => {
					bump().then(bump);
				}, offset);
			}
		}
	}
});

dclient.login(process.env.VINNY_BUMPER_DISCORD_TOKEN);
