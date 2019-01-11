const coin = () => (Math.random()<0.5?"Heads!":"Tails!")

module.exports = {
	init: () => ({ coin, flip: coin })
};
