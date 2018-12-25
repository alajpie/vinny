module.exports = {
	init: () => ({ commit: () => process.env.COMMIT || "unknown" })
};
