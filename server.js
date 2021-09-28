const express = require('express');
const { Server } = require('http');
const path = require('path');
const socket = require('socket.io');
const { networkInterfaces } = require('os');

const nets = networkInterfaces();
const results = [];

for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
        // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
        if (net.family === 'IPv4' && !net.internal) {
            results.push(net.address);
        }
    }
}
const lanIp = results[0];

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

server.listen(PORT, () => console.log('Starting server:', `http://${lanIp}:${PORT}`));


// Constants
const events = {
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',

  HOST_DISCONNECTED: 'hostDisconnected',
  PLAYER_DISCONNECTED: 'playerDisconnected',

  NEW_PLAYER: 'newPlayer',
  PLAYER_ADDED: 'playerAdded',
  PLAYER_ACCEPTED: 'playerAccepted',
  PLAYER_REJECTED: 'playerRejected',
  PLAYER_START: 'playerStart',
  PLAYER_SHOOT: 'playerShoot',

  HOST_INIT: 'hostInit',

  GAME_START: 'gameStart',
  GAME_END: 'gameEnd',

  ERROR: 'ERROR,'
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
  
  if (role === roles.HOST) {
    if (!!host) {
      socket.disconnect();
      return;
    }
    host = socket;

    socket.on(events.NEW_PLAYER, player => {
      socket.to(host.id).emit(events.NEW_PLAYER, player)
    });

    socket.on(events.PLAYER_ADDED, (player) => {
      socket.to(player.id).emit(events.PLAYER_ACCEPTED, player)
    });

    socket.on(events.GAME_START, () => {
      socket.broadcast.emit(events.GAME_START);
    })
    socket.on(events.GAME_END, () => {
      socket.broadcast.emit(events.GAME_END);
    })

    socket.on(events.DISCONNECT, function () {
      socket.broadcast.emit(events.HOST_DISCONNECTED);
      host = null;

    });
  } else if (role === roles.PLAYER) {
    if (!host) {
      socket.emit(events.ERROR, 'NO_HOST_FOUND');
      socket.disconnect();
      return;
    }

    socket.on(events.NEW_PLAYER, (username) => {
      const player = {
        id: socket.id,
        username,
      };
      players[socket.id] = player;
      socket.to(host.id).emit(events.NEW_PLAYER, player)
    });

    socket.on(events.PLAYER_START, () => {
      socket.to(host.id).emit(events.PLAYER_START, players[socket.id]);
    })
    socket.on(events.PLAYER_SHOOT, (angle) => {
      const data = {
        id: socket.id,
        angle,
      }
      socket.to(host.id).emit(events.PLAYER_SHOOT, data);
    })

    socket.on(events.PLAYER_ACCEPTED, (data) => socket.emit(events.PLAYER_ACCEPTED, data))

    socket.on(events.PLAYER_START, () => {
      socket.to(host.id).emit(events.PLAYER_START, { id: socket.id } )
    })

    socket.on(events.DISCONNECT, function () {
      if (!!host) {
        socket.to(host.id).emit(events.PLAYER_DISCONNECTED, players[socket.id]);
      }
      delete players[socket.id];
    });

  } else socket.close();
});
