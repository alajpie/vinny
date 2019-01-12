module.exports = {
	init: () => ({
		clap: ({ args }) => args.join("👏"),
		clapwith: ({ args }) =>
			args.length >= 2
				? args.slice(1).join(args[0])
				: "Please specify the separator as the first argument."
	})
};
