const SERVER_PING = 5000;
const HOST_PADDING = 5;

async function initHost() {
  const response = await fetch(`${window.location.origin}/constants`);
  const constants = await response.json();
  console.log('constants fetched', constants);

  const roles = constants.roles;
  const events = constants.events;

  let players = {};
  
  const socket = io.connect(
    window.location.origin,
    {
      query: `role=${roles.HOST}`,
      reconnection: false,
    },
  );

  socket.on(events.NEW_PLAYER, (newPlayer) => {
    console.log('new player', newPlayer);
    players[newPlayer.id] = newPlayer;
    console.log('players', players)
    // init player in game
  });

  socket.on(events.PLAYER_DISCONNECTED, (player) => {
    console.log('player disconnected')
    delete players[player.id]
    // remove player
    console.log('players', players)
  });

  socket.on(events.PLAYERS_DATA, (serverPlayers) => {
    console.log('Data received', players);
    players = serverPlayers;
  });

  // setInterval(() => {
  //   socket.emit(events.SYNC_PLAYERS);
  // }, SERVER_PING);

  const windowWidth = (window.innerWidth || document.documentElement.clientWidth || 
  document.body.clientWidth) - HOST_PADDING;
  const windowHeight = (window.innerHeight|| document.documentElement.clientHeight|| 
  document.body.clientHeight) - HOST_PADDING;

  var config = {
    type: Phaser.AUTO,
    width: windowWidth,
    height: windowHeight,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 }
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
  };

  var game = new Phaser.Game(config);

  function preload () {
    this.load.setBaseURL(`${window.location.origin}/public/host`);

    this.load.image('sky', 'assets/sky.png');
    this.load.image('ground', 'assets/platform.png');
    this.load.image('star', 'assets/star.png');
    this.load.image('bomb', 'assets/bomb.png');
    this.load.spritesheet('dude', 
        'assets/dude.png',
        { frameWidth: 32, frameHeight: 48 }
    );
  }

  let platforms;
  function create () {
    this.add.image(0, 0, 'sky').setOrigin(0, 0);

    platforms = this.physics.add.staticGroup();
    platforms.create(400, 568, 'ground').setScale(2).refreshBody();
    platforms.create(600, 400, 'ground');
    platforms.create(50, 250, 'ground');
    platforms.create(750, 220, 'ground');

    this.add.image(windowWidth / 2, windowHeight / 2, 'star');



    var particles = this.add.particles('red');

    var emitter = particles.createEmitter({
        speed: 100,
        scale: { start: 1, end: 0 },
        blendMode: 'ADD'
    });

    var logo = this.physics.add.image(400, 100, 'logo');

    logo.setVelocity(100, 200);
    logo.setBounce(1, 1);
    logo.setCollideWorldBounds(true);

    emitter.startFollow(logo);
  }

  function update() {

  }
}

initHost();
