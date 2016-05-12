var io = require('socket.io-client');
var exec = require('child_process').exec;

var serverUri = 'https://atalanta.saproto.nl';
var serverPort = 1111;

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