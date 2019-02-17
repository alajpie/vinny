module.exports = {
	init: ({ config }) => ({
		wave: async ({ rawArgs, msg }) => {
			if (!rawArgs) return;
			const orig = rawArgs.toLowerCase();
			const nuMsg = await msg.channel.send(orig); // not "new" because it's a reserved keyword
			const wave = async (nuMsg, orig, i) => {
				if (i === orig.length) {
					return nuMsg.delete();
				}
				const nu =
					orig.substr(0, i) + orig[i].toUpperCase() + orig.substr(i + 1);
				await nuMsg.edit(nu);
				setTimeout(() => wave(nuMsg, orig, i + 1), config.delay || 1000);
			};
			wave(nuMsg, orig, 0);
		}
	})
};
