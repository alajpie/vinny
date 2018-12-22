const fullwidth = require("fullwidth").default;

module.exports = {
	aes: ({ rawArgs }) => fullwidth(rawArgs),
	pooraes: ({ rawArgs }) => rawArgs.split("").join(" ")
};
