module.exports = {
	mock: ({ rawArgs }) =>
		rawArgs
			.split("")
			.map((x, i) => {
				if (x.toLowerCase() === "l") {
					return x.toUpperCase();
				} else if (x.toLowerCase() === "i") {
					return x.toLowerCase();
				} else {
					if (Math.random() < 0.1) {
						return i % 2 ? x.toLowerCase() : x.toUpperCase();
					} else {
						return i % 2 ? x.toUpperCase() : x.toLowerCase();
					}
				}
			})
			.join("")
};
