const fullwidth = require("fullwidth").default;

module.exports = {
	init: () => ({
		aes: ({ rawArgs }) => fullwidth(rawArgs),
		pooraes: ({ rawArgs }) => rawArgs.split("").join(" ")
	})
};
