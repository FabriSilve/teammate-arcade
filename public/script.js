
// DOM Elements
const canvas = document.querySelector('canvas');

// HOST CONSTANTS
const windowWidth = (window.innerWidth || document.documentElement.clientWidth || 
  document.body.clientWidth) - 5;
const windowHeight = (window.innerHeight|| document.documentElement.clientHeight|| 
  document.body.clientHeight) - 5;

const playerSize = windowWidth / 80;
const projectileSize = windowWidth / 250;

// UTILS
function safeArrayRemove(array, index) {
  array.splice(index, 1);
}

function numberFormat(number) {
  const n = !Number.isFinite(+number) ? 0 : +number;
  return Math.round(n).toString().replace(/\B(?=(?:\d{3})+(?!\d))/g, '\'');
};

function selectColor(colorNum, colors){
  if (colors < 1) colors = 1; // defaults to one color - avoid divide by zero
  return "hsl(" + (colorNum * (360 / colors) % 360) + ",100%,50%)";
}

// CANVAS GAME
canvas.width = windowWidth;
canvas.height = windowHeight;

const contex = canvas.getContext('2d');

let players;
let projectiles;
let meteors;
let particles;

class Player {
  constructor({ id, username, x, color }) {
    this.id = id;
    this.username = username;
    this.x = x;
    this.color = color;
    
    this.score = 0;
    this.y = canvas.height - (3 * playerSize);
    this.radius = playerSize;
  }

  draw() {
    contex.beginPath();
    contex.arc(
      this.x,
      this.y,
      this.radius,
      0,
      Math.PI * 2,
      false,
    );
    contex.fillStyle = this.color;
    contex.fill();
  }

  shoot(angle) {
    const velocity = {
      x: Math.cos(angle),
      y: Math.sin(angle),
    };

    projectiles.push(
      new Projectile(
        this.x,
        this.y,
        projectileSize,
        this.color,
        velocity,
      )
    )
  }

  explode() {
    const counter = Math.floor(Math.random() * (8 - 4) + 4);
    for (let i = 0; i < counter; i += 1) {
      particles.push(
        new Particle(
          this.x,
          this.y,
          Math.random() * (7 - 1) + 1,
          this.color,
          {
            x: (Math.random() - 0.5) * (Math.random() * 8),
            y: (Math.random() - 0.5) * (Math.random() * 8),
          }
        ),
      );
    }
  }
}

class Projectile {
  constructor(x, y, radius, color, velocity) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.velocity = velocity;

    this.speed = 7;
  }

  draw() {
    contex.beginPath();
    contex.arc(
      this.x,
      this.y,
      this.radius,
      0,
      Math.PI * 2,
      false,
    );
    contex.fillStyle = this.color;
    contex.fill();
  }

  update() {
    this.draw();
    this.x = this.x + (this.velocity.x * this.speed);
    this.y = this.y + (this.velocity.y * this.speed);
  }

  explode() {
    const counter = Math.floor(Math.random() * (6 - 3) + 3);
    for (let i = 0; i < counter; i += 1) {
      particles.push(
        new Particle(
          this.x,
          this.y,
          Math.random() * (2 - 1) + 1,
          this.color,
          {
            x: (Math.random() - 0.5) * (Math.random() * 5),
            y: (Math.random() - 0.5) * (Math.random() * 5),
          }
        ),
      );
    }
  }
}

class Meteor {
  constructor(x, y, radius, color, velocity) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.velocity = velocity;
  }

  draw() {
    contex.beginPath();
    contex.arc(
      this.x,
      this.y,
      this.radius,
      0,
      Math.PI * 2,
      false,
    );
    contex.fillStyle = this.color;
    contex.fill();
  }

  update() {
    this.draw();
    this.x = this.x + this.velocity.x;
    this.y = this.y + this.velocity.y;
  }

  explode(x, y) {
    const counter = Math.floor(Math.random() * (10 - 4) + 4);
    for (let i = 0; i < counter; i += 1) {
      particles.push(
        new Particle(
          x,
          y,
          Math.random() * (6 - 1) + 1,
          this.color,
          {
            x: (Math.random() - 0.5) * (Math.random() * 6),
            y: (Math.random() - 0.5) * (Math.random() * 6),
          }
        ),
      );
    }
  }
}

class Particle {
  constructor(x, y, radius, color, velocity) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.velocity = velocity;
    this.alpha = 1;
    this.friction = 0.98;
  }

  draw() {
    contex.save();
    contex.globalAlpha = this.alpha;
    contex.beginPath();
    contex.arc(
      this.x,
      this.y,
      this.radius,
      0,
      Math.PI * 2,
      false,
    );
    contex.fillStyle = this.color;
    contex.fill();
    contex.restore();
  }

  update() {
    this.draw();
    this.x = this.x + this.velocity.x * this.friction;
    this.y = this.y + this.velocity.y * this.friction;
    this.alpha -= 0.005;
  }
}

class UI {
  constructor() {
    // UI ELEMENTS
    this.gameScoreLabel = document.querySelector('#gameScoreLabel');
    this.playersList = document.querySelector('#playersList');
    this.menuContainer = document.querySelector('#menuContainer');
    this.menuScoreLabel = document.querySelector('#menuScoreLabel');
  }

  showMenu(bool) {
    this.menuContainer.style.display = bool ? 'flex' : 'none';
  }

  updateScoreGame(score) {
    this.gameScoreLabel.innerHTML = numberFormat(score);
  }

  updateScoreMenu(score) {
    this.menuScoreLabel.innerHTML = numberFormat(score);
  }

  updatePlayersList(players) {
    const playerNames = players.reduce(
      (names, player) => names += `
        <div
          class="player ${player.ready ? 'ready' : 'notReady'}"
          style="color: ${player.color};"
        >
          ${player.username}
        </div>
      `,
      '',
    );
    this.playersList.innerHTML = playerNames;
  }
}
const ui = new UI();

class Game {
  constructor() {
    this.intervalsToClean = [];
    this.score = 0;

    this.LAST_STAND = false;
    this.SAFE_HEART = true;
    this.GAME_BACKGROUND = 'rgba(0, 0, 0, .1)';

    this.endGameCallback;
    this.spawnCounter = 0;
  }

  start(connectedPlayers, endGameCallback) {
    meteors = [];
    particles = [];
    projectiles = [];
    players = connectedPlayers.map((player) => new Player(player));
    
    this.endGameCallback = endGameCallback;
    this.score = 0;
    this.spawnCounter = 0;
    animateGame(endGameCallback);
    this.spawnMeteor();

    ui.showMenu(false);
  }

  createMeteor(speed, minRadius, maxRadius) {
    const x = Math.random() * (canvas.width - 100) + 100;
    const radius = Math.random() * (maxRadius - minRadius) + minRadius;
    const y = -radius;
  
    const target = {
      x: canvas.width / 2,
      y: canvas.height,
    };
  
    const angle = Math.atan2(target.y - y, target.x - x);
  
    const velocity = {
      x: Math.cos(angle) * ((Math.random() * speed) + 0.5),
      y: Math.sin(angle) * ((Math.random() * speed) + 0.5),
    };
  
    const mainColor = Math.random() * 10;
    const color = `hsl(${Math.floor(mainColor * 5)}, 50%,  50%)`;
  
    meteors.push(
      new Meteor(
        x,
        y,
        radius,
        color,
        velocity,
      )
    )
  }

  spawnMeteor() {
    this.intervalsToClean = setInterval(() => {
      this.spawnCounter += 1;
      for (let i = 0; i < Math.round(players.length / 2); i += 1) {
        this.createMeteor(1, playerSize * 2, 100);
      }

      if (this.spawnCounter % 7 === 0) this.createMeteor(1, playerSize * 3, 150);
      if (this.spawnCounter % 23 === 0) this.createMeteor(1.5, playerSize, 50);
      if (this.spawnCounter % 37 === 0) this.createMeteor(0.5, 300, 500);
    }, 4000);
  }

  endGame() {
    clearInterval(this.intervalsToClean);
    this.intervalsToClean = [];
    this.endGameCallback();

    ui.updateScoreMenu(this.score);
    ui.showMenu(true);
    ui.updateScoreGame(0);
  }
}
const game = new Game();

function animateGame(endGameCallback) {
  const frameId = requestAnimationFrame(() => animateGame(endGameCallback));
  contex.fillStyle = game.GAME_BACKGROUND;
  contex.fillRect(0, 0, canvas.width, canvas.height);

  players.forEach((player) => player.draw());

  particles.forEach((particle, particleIndex) => {
    const shouldRemove = particle.alpha <= 0;
    if (shouldRemove) safeArrayRemove(particles, particleIndex);
    else particle.update();
  });

  projectiles.forEach((projectile, projectileIndex) => {
    const shouldRemove = projectile.x < 0
    || projectile.y < 0
    || projectile.x > canvas.width
    || projectile.y > canvas.height
    if (shouldRemove) safeArrayRemove(projectiles, projectileIndex);
    else projectile.update();
  });

  meteors.forEach((meteor, meteorIndex) => {
    meteor.update();

    players.forEach((player, playerIndex) => {
      const distance = Math.hypot(player.x - meteor.x, player.y - meteor.y);
      const hasHitPlayer = distance - meteor.radius - player.radius < -1;
      if (hasHitPlayer) {
        player.explode()
        safeArrayRemove(players, playerIndex);

        meteor.explode(player.x, player.y);
        if (meteor.radius - playerSize > playerSize * 1.2) {
          gsap.to(meteor, { radius: meteor.radius - playerSize});
        } else {
          safeArrayRemove(meteors, meteorIndex);
        }
      }
    });

    projectiles.forEach((projectile, projectileIndex) => {
      const distance = Math.hypot(projectile.x - meteor.x, projectile.y - meteor.y);
      const hasHitMeteor = distance - meteor.radius - projectile.radius < -1;
      if (hasHitMeteor) {
        game.score += Math.round(meteor.radius);
        ui.updateScoreGame(game.score);

        meteor.explode(projectile.x, projectile.y);

        projectile.explode();
        safeArrayRemove(projectiles, projectileIndex);

        // MOVE IN SCLASS
        if (meteor.radius - playerSize > playerSize * 1.2) {
          gsap.to(meteor, { radius: meteor.radius - playerSize});
        } else {
          safeArrayRemove(meteors, meteorIndex);
        }
      }
    });

    const isOutOfScreen = (meteor.x + meteor.radius) < 0 || (meteor.x - meteor.radius) > canvas.width;
    if (isOutOfScreen) safeArrayRemove(meteors, meteorIndex);

    const isBelovePlayers = meteor.y + meteor.radius - 5 > canvas.height;
    if (isBelovePlayers) {
      if (game.SAFE_HEART) {
        cancelAnimationFrame(frameId);
        game.endGame(endGameCallback);
      } else {
        safeArrayRemove(meteors, meteorIndex);
      }
    }
  });

  if (players.length < 1 && game.LAST_STAND) {
    cancelAnimationFrame(frameId);
    game.endGame(endGameCallback);
  }
}

// QR Code
QrCreator.render({
  text: `${window.location.origin}/controller`,
  radius: 0, // 0.0 to 0.5
  ecLevel: 'H', // L, M, Q, H
  fill: '#fff', // foreground color
  background: 'black', // color or null for transparent
  size: Math.max(200, Math.round(window.innerHeight / 4)) // in pixels
}, document.querySelector('#qrCode'));

// SOCKET CONSTANTS
const SERVER_PING = 5000;
const HOST_PADDING = 5;

async function initHost() {
  const response = await fetch(`${window.location.origin}/constants`);
  const constants = await response.json();

  const roles = constants.roles;
  const events = constants.events;

  let connectedPlayers = [
    // { username, color, x, score },
  ];

  const socket = io.connect(
    window.location.origin,
    {
      query: `role=${roles.HOST}`,
      reconnection: false,
    },
  );

  socket.emit(
    events.HOST_INIT,
    {
      windowSize: {
        x: windowWidth,
        y: windowHeight,
      },
      playerSize: playerSize,
    },
  );

  socket.on(events.NEW_PLAYER, (player) => {
    const counter = connectedPlayers.length + 1;
    let x;
    const halfScreen = windowWidth / 2;
    if (counter === 1) x = halfScreen;
    else if (counter % 2 === 0) x = halfScreen + (Math.round(counter / 2) * (playerSize * 3));
    else x = halfScreen - ((Math.round(counter / 2) - 1) * (playerSize * 3));

    const completePlayer = {
      id: player.id,
      username: player.username,
      color: selectColor(Math.floor(Math.random() * 70), 70),
      x,
      ready: false,
      angle: 0,
    }
    connectedPlayers.push(completePlayer);
    socket.emit(events.PLAYER_ADDED, completePlayer);

    ui.updatePlayersList(connectedPlayers);
    
  });

  socket.on(events.PLAYER_DISCONNECTED, (player) => {
    connectedPlayers = connectedPlayers.filter((p) => p.id !== player.id);
    ui.updatePlayersList(connectedPlayers);
  })

  socket.on(events.PLAYER_START, (player) => {
    const p = connectedPlayers.find((p) => p.id === player.id);
    p.ready = true;

    ui.updatePlayersList(connectedPlayers);

    const allReady =connectedPlayers.every((p) => p.ready);
    if (allReady) {
      // init game passing registered players
      socket.emit(events.GAME_START, connectedPlayers);
      const endCallback = () => {
        socket.emit(events.GAME_END);
        connectedPlayers.forEach(p => p.ready = false);
        ui.updatePlayersList(connectedPlayers);
      }
      game.start(connectedPlayers, endCallback);
    }
  });

  socket.on(events.PLAYER_SHOOT, (data) => {
    const player = players.find((p) => p.id === data.id);
    if (player) player.shoot(data.angle)
  });

  
};

initHost();