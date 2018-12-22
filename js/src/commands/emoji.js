module.exports = {
	emoji: ({ rawArgs }) =>
		rawArgs
			.toLowerCase()
			.split("")
			.filter(x => x.match(/[a-z ]/))
			.map(x => (x === " " ? "  " : `:regional_indicator_${x}:`))
			.join("\u200b")
};
