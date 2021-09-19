const express = require('express');
const { Server } = require('http');
const path = require('path');
const socket = require('socket.io');


// Server
const PORT = 5000;
const PING_TIMEOUT = 60000;

const app = express();
const server = Server(app);

app.set('port', PORT);
app.use('/public', express.static(__dirname + '/public'));

app.get('/', (_req, res) => res.sendFile(path.join(__dirname, '/public/index.html')));
app.get('/controller', (_req, res) => res.sendFile(path.join(__dirname, '/public/controller/index.html')));
app.get('/host', (_req, res) => res.sendFile(path.join(__dirname, '/public/host/index.html')));
app.get('/constants', (_req, res) => res.json({ events, roles }));

server.listen(PORT, () => console.log('Starting server on port ', PORT));


// Constants
const events = {
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  NEW_PLAYER: 'newPlayer',
  HOST_DISCONNECTED: 'hostDisconnected',
  PLAYER_DISCONNECTED: 'playerDisconnected',
  SYNC_PLAYERS: 'syncPlayers',
  PLAYERS_DATA: 'playersData',
  PLAYER_DATA: 'playerData',
};

const roles = {
  HOST: 'host',
  PLAYER: 'player',
};

const players = {};

let host = null;

// Socket
const io = socket(server, { pingTimeout: PING_TIMEOUT });

io.on(events.CONNECTION, function (socket) {
  const role = socket.handshake.query.role;
  console.log('connected socket ', socket.id, role)

  if (role === roles.HOST) {
    if (!!host) {
      socket.disconnect();
      return;
    }
    host = socket;

    socket.on(events.SYNC_PLAYERS, function () {
      console.log('request sync data')
      socket.emit(events.PLAYERS_DATA, players);
    })

    socket.on(events.DISCONNECT, function () {
      socket.broadcast.emit(events.HOST_DISCONNECTED);
      host = null;
      console.log('disconnected socket ', socket.id, role)

    });
  } else if (role === roles.PLAYER) {
    if (!host) {
      socket.disconnect();
      return;
    }
    players[socket.id] = {
      id: socket.id,
      color: '0x' + Math.floor(Math.random() * 16777215).toString(16),

      speed: 0,
      rotation: 0,
    }

    socket.to(host.id).to(socket.id).emit(events.NEW_PLAYER, players[socket.id]);

    socket.on(events.PLAYER_DATA, function (data) {
      players[socket.id] = {
        speed: data.speed,
        rotation: data.rotation,
      };
    });

    socket.on(events.DISCONNECT, function () {
      if (!!host) {
        socket.to(host.id).emit(events.PLAYER_DISCONNECTED, players[socket.id]);
      }
      delete players[socket.id];
      console.log('disconnected socket ', socket.id, role)

    });

  } else socket.close();
});
