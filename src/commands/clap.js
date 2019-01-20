const clap = (separator, chunks) => {
	if (chunks.length === 1) {
		return separator + chunks[0] + separator;
	} else {
		return chunks.join(separator);
	}
};

module.exports = {
	init: () => ({
		clap: ({ args }) => clap("👏", args),
		clapwith: ({ args }) =>
			args.length >= 2
				? clap(args[0], args.slice(1))
				: "Please specify the separator as the first argument."
	})
};
