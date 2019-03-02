module.exports = {
	init: function({ config }) {
		const prefixes = config.prefixes || ["'", "‘", ";"];

		return {
			onMessage: function({ msg }) {
				function getRandomInt(min, max) {
					// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
					min = Math.ceil(min);
					max = Math.floor(max);
					return Math.floor(Math.random() * (max - min)) + min; // The maximum is exclusive and the minimum is inclusive
				}

				prefixes.forEach(prefix => {
					const diceRegex = new RegExp(
						prefix +
							"([1-9][0-9]|[1-9])?d(100|[1-9][0-9]|[2-9])((?:|\\+|-)(?:[1-9][0-9]|[1-9]))?"
					);
					match = msg.content.match(diceRegex);
					if (match) {
						const dice = parseInt(match[1]) || 1;
						const sides = parseInt(match[2]);
						const modifier = parseInt(match[3]) || 0;
						const rolls = [...Array(dice)]
							.map(() => getRandomInt(1, sides + 1))
							.sort((x, y) => x - y);
						const result = rolls.reduce((x, y) => x + y) + modifier;
						const modifierDisplay =
							modifier === 0
								? ""
								: modifier > 0
								? " + " + modifier
								: " - " + -modifier;
						if (dice > 1 || modifierDisplay) {
							msg.channel.send(
								`[${rolls.join(", ")}]${modifierDisplay} = ${result}`
							);
						} else {
							msg.channel.send(result);
						}
					}
				});
			}
		};
	}
};
