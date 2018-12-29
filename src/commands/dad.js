const request = require("superagent");

module.exports = {
	init: () => ({
		dad: () =>
			request
				.get("https://icanhazdadjoke.com")
				.accept("json")
				.then(res => res.body.joke)
	})
};
