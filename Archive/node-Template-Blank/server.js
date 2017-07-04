// Dependency's Stuff
var express = require('express');
var app = express();
var serv = require('http').Server(app);

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});
app.use('/', express.static(__dirname + '/'));

// Port to serve to
var port = 80;
serv.listen(port);
console.log("Server started on port " + port);

// --- Socket Logic ---
var SOCKET_LIST = {};
var io = require('socket.io')(serv, {});

// Send to all sockets function
function sendAll(data) {
    for (var i in SOCKET_LIST) {
        var socket = SOCKET_LIST[i];
        socket.emit('relay', data);
    }
}

// Connection Function
io.sockets.on('connection', function (socket) {
    socket.id = Math.random();
    SOCKET_LIST[socket.id] = socket;
    console.log("New Connection: " + socket.id);

    // Hi Function
    socket.on('hi', function (data) {
        console.log("User " + socket.id + " says " + data);
        sendAll(data);
    });

    // Disconnect Function
    socket.on('disconnect', function () {
        delete SOCKET_LIST[socket.id];
        console.log("User " + socket.id + " has left");
    });
});

// To use somewhere else - setInterval(function () {}, 1000 / 30);