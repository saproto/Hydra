var windowDefinitions = [{
  "name": "protube",
  "displayNumber": 1,
  "url": "http://protube.saproto.nl/screen"
},
{
  "name": "smartxp",
  "displayNumber": 3,
  "url": "http://smartxp.saproto.nl/"
},
{
  "name": "narrowcasting",
  "displayNumber": 0,
  "url": "http://smartxp.saproto.nl/pi"
}];

module.exports.replace = function(array) {
	windowDefinitions = array;
}

module.exports.get = function() {
	return windowDefinitions;
}