module.exports = {
	init: () => ({
		dance: ({ args }) => {
			let x = ["u", "w", "u"];
			if (args.length >= 3) {
				x = args;
			} else if (args.length === 1 && args[0].length === 3) {
				x = args[0].split("");
			}
			return (
				x[0] +
				x[1] +
				" " +
				x[2] +
				"\n" +
				x[0] +
				" " +
				x[1] +
				x[2] +
				"\n"
			).repeat(3);
		}
	})
};
