module.exports = {
	init: () => ({
		del: ({ msg }) => {
			msg.delete(500);
		}
	})
};
