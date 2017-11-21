var windowDefinitions = [];

module.exports.replace = function(array) {
	windowDefinitions = array;
};

module.exports.get = function() {
	return windowDefinitions;
};