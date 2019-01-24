const zalgo = require("to-zalgo");

module.exports = { init: () => ({ zalgo: ({ rawArgs }) => zalgo(rawArgs) }) };
