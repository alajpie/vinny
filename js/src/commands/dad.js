const request = require("superagent");

module.exports = {
	dad: () =>
		request
			.get("https://icanhazdadjoke.com")
			.accept("json")
			.then(res => res.body.joke)
};
