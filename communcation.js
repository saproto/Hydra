var io = require('socket.io-client');
var exec = require('child_process').exec;

var windowDefinitions = require('./windowDefinitions');
var windowManager = require("./windowManager")

var serverUri = 'https://atalanta.saproto.nl';
var serverPort = 1111;

var windowsLoaded = false;

var appPath = "C:\\Petra\\resources\\app\\"

var server = io.connect(serverUri, {
    port: serverPort,
    secure: true
});

server.on('connect', function(){
    server.emit('identify', { client: 'petra' });
    console.log("Connected to Herbert");
});

server.on('soundboard', function(data) {
    console.log("Playing sound "+data);
    exec(appPath + 'cmdmp3 ' + appPath + '\\snd\\' + data + '.mp3');
});

server.on('loadPages', function(data) {
	console.log("Loading new URLs to screens");
	windowDefinitions.replace(data);
	if(windowsLoaded) windowManager.killWindows();
	windowManager.loadWindows();
	windowsLoaded = true;
});

module.exports.getWindowDefinitions = function() {
	server.emit('get-window-definitions', {});
}