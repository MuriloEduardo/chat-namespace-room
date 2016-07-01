// Setup basic express server
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 9000;
var url = require('url');

server.listen(port, function () {
  console.log('Server listening at port %d', port);
});

// Routing
app.use(express.static(__dirname + '/public'));

app.get('/*', function(req, res) {
  res.sendfile(__dirname + '/public/index.html');

  // Chatroom
  var numUsers = 0;
  var nsp = io.of(req.url);
  nsp.on('connection', function (socket) {
    var addedUser = false;

    // when the client emits 'new message', this listens and executes
    // quando o cliente emite ' nova mensagem ' , este ouve e executa
    socket.on('new message', function (data) {
      // we tell the client to execute 'new message'
      socket.broadcast.emit('new message', {
        username: socket.username,
        message: data
      });
    });

    // when the client emits 'add user', this listens and executes
    // quando o cliente emite "adicionar usuário ' , este ouve e executa
    socket.on('add user', function (username) {
      if (addedUser) return;

      // we store the username in the socket session for this client
      socket.username = username;
      ++numUsers;
      addedUser = true;
      socket.emit('login', {
        numUsers: numUsers
      });
      // echo globally (all clients) that a person has connected
      socket.broadcast.emit('user joined', {
        username: socket.username,
        numUsers: numUsers
      });
    });

    // when the client emits 'typing', we broadcast it to others
    // quando o cliente emite " digitação " , nós transmiti-lo aos outros
    socket.on('typing', function () {
      socket.broadcast.emit('typing', {
        username: socket.username
      });
    });

    // when the client emits 'stop typing', we broadcast it to others
    // quando o cliente emite ' parar de escrever ' , nós transmiti-lo aos outros
    socket.on('stop typing', function () {
      socket.broadcast.emit('stop typing', {
        username: socket.username
      });
    });

    // when the user disconnects.. perform this
    // quando o utilizador desliga .. executar esta
    socket.on('disconnect', function () {
      if (addedUser) {
        --numUsers;

        // echo globally that this client has left
        socket.broadcast.emit('user left', {
          username: socket.username,
          numUsers: numUsers
        });
      }
    });
  });
});