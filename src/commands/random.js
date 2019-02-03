const ulid = require("ulid").ulid;
const uuid = require("uuid/v4");
const coin = () => (Math.random() < 0.5 ? "Heads!" : "Tails!");

module.exports = {
	init: () => ({ coin, flip: coin, ulid: () => ulid(), uuid })
};
