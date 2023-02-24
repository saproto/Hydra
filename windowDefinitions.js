var windowDefinitions = [
	{
		url: 'https://proto.utwente.nl/smartxp',
		displayNumber: 0
	},
	{
		url: 'https://jukebox.today/proto',
		displayNumber: 1,
		js: 'jukebox.js'
	},
	{
		url: 'https://proto.utwente.nl/narrowcasting',
		displayNumber: 2
	}
];

module.exports.get = function() {
	return windowDefinitions;
};
