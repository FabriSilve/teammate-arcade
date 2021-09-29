// TODO: add modal worning if device not in landscape

// // TRYING TO FIX navbar on mobile
// document.documentElement.webkitRequestFullScreen();
// window.scrollTo(0,1);


  try {
  let player = {};
  let connected = false;

  const joystick = document.getElementById('joystick');
  const aButton = document.getElementById('aButton');
  const stick = document.getElementById('stick');
  const usernameInput = document.getElementById('usernameInput');
  const playerUsername = document.getElementById('playerUsername');
  const playerStatus = document.getElementById('playerStatus');
  const saveButton = document.getElementById('saveButton');
  const infoButton = document.getElementById('infoButton');
  const menuContainer = document.getElementById('menuContainer');
  const joinButton = document.getElementById('joinButton');
  const startButton = document.getElementById('startButton');
  const centralBars = document.getElementsByClassName('centralBar');

  console.log('central bars', centralBars)

  const joystickWidth = joystick.offsetWidth;
  const maxDiff = joystickWidth * 0.3;


  let dragStart = null;
  let currentPos = { x: 0, y: 0 };

  function handleMouseDown(event) {
    stick.style.transition = '0.05s';
    if (event.changedTouches) {
      dragStart = {
        x: event.changedTouches[0].clientX,
        y: event.changedTouches[0].clientY,
      };
      return;
    }
    dragStart = {
      x: event.clientX,
      y: event.clientY,
    };
  }

  function handleMouseMove(event) {
    event.preventDefault()
    if (dragStart === null) return;
    if (event.changedTouches) {
      event.clientX = event.changedTouches[0].clientX;
      event.clientY = event.changedTouches[0].clientY;
    }
    const xDiff = event.clientX - dragStart.x;
    const yDiff = event.clientY - dragStart.y;
    const angle = Math.atan2(yDiff, xDiff);
    const distance = Math.min(maxDiff, Math.hypot(xDiff, yDiff));
    const xNew = distance * Math.cos(angle);
    const yNew = distance * Math.sin(angle);
    stick.style.transform = `translate3d(${xNew}px, ${yNew}px, 0px)`;
    currentPos = { x: xNew, y: yNew };

    // const roundedX = Math.round(currentPos.x)
    // const roundedY = Math.round(currentPos.y)
    // const pX = roundedX ** 2
    // const pY = roundedY ** 2
    // const radius = Math.sqrt(pX + pY)
    // const rotationRadiants = Math.atan2(roundedX, roundedY);
    
    player.angle = angle;
  }

  function handleMouseUp(event) {
    if (dragStart === null) return;
    stick.style.transition = '.1s';
    stick.style.transform = `translate3d(0px, 0px, 0px)`;
    dragStart = null;
    currentPos = { x: 0, y: 0 };
  }

  stick.addEventListener('mousedown', handleMouseDown);
  stick.addEventListener('touchstart', handleMouseDown);

  stick.addEventListener('mousemove', handleMouseMove);
  stick.addEventListener('mouseup', handleMouseUp);
  stick.addEventListener('touchmove', handleMouseMove);
  stick.addEventListener('touchend', handleMouseUp);
  // document.addEventListener('mousemove', handleMouseMove);
  // document.addEventListener('mouseup', handleMouseUp);
  // document.addEventListener('touchmove', handleMouseMove);
  // document.addEventListener('touchend', handleMouseUp);


  let canShoot = true;
  async function initController(username) {
    const response = await fetch(`${window.location.origin}/constants`);
    const constants = await response.json();

    const roles = constants.roles;
    const events = constants.events;

    
    const socket = io.connect(
      window.location.origin,
      {
        query: {
          role: roles.PLAYER,
          username,
        },
        reconnection: false,
      },
    );

    // socket.emit(events.PLAYER_START);

    socket.emit(events.NEW_PLAYER, username);
    // Show loader

    socket.on(events.PLAYER_ACCEPTED, (data) => {
      // hide loader
      // Update player color
      player = data;
      for (let i = 0; i < centralBars.length; i += 1) {
        centralBars[i].style.backgroundColor = data.color;
        centralBars[i].classList.add('playerActive');
      }
    })

    socket.on(events.ERROR, (message) => console.error(message))

    socket.on(events.HOST_DISCONNECTED, () => {
      socket.close();
      playerUsername.addEventListener('click', openMenu, true)
      connected = false;
      playerStatus.innerHTML = '<span class="offline">disconnected</span>';
      for (let i = 0; i < centralBars.length; i += 1) {
        centralBars[i].style.backgroundColor = '#222222';
        centralBars[i].classList.remove('playerActive');
      }
    });

    startButton.addEventListener('click', (event) => {
      socket.emit(events.PLAYER_START)
      try {
        navigator.vibrate([50]);
      } catch (e) {
        console.log('Error using vibration', e.message);
      }
    });
    
    socket.on(events.GAME_START, () => {
      aButton.addEventListener('touchstart', (event) => {
      // aButton.addEventListener('click', (event) => {
        event.preventDefault();
    
        if (canShoot) {
          socket.emit(events.PLAYER_SHOOT, player.angle);
          canShoot = false;
          setTimeout(() => { canShoot = true; }, 200);
          try {
            navigator.vibrate([50]);
          } catch (e) {
            console.log('Error using vibration', e.message);
          }
        }
      });
      // disable startButton handler
      // disable joinButton handler
    })

    socket.on(events.GAME_END, () => {
      // disable aButton
    })
  }

  // initController();

  // MENU MODAL

  infoButton.addEventListener('click', (event) => {
    event.preventDefault();
    const answers = [
      "https://media.wired.com/photos/59326d5344db296121d6aee9/master/pass/8552.gif",
      "https://c.tenor.com/-HogLUf9vbQAAAAd/someone-has-a-lot-of-questions-annoyed.gif",
      "https://i0.wp.com/media.giphy.com/media/6Q3M4BIK0lX44/giphy.gif?resize=468%2C306&ssl=1",
      "https://c.tenor.com/kUdzaxgpu-QAAAAM/im-done-answering-you-questions-no-more-questions.gif",
      "https://c.tenor.com/fwxHWIqXK6cAAAAM/stop-asking-me-questions-stop-asking-questions.gif",
    ];
    const answer = answers[Math.floor(Math.random() * answers.length)];
    window.open(answer, '_blank').focus()
  });

  let username;
  function getUserFromCookie() {
    try {
      const cookie = document.cookie;
      const matches = /username=([a-zA-Z]{3,15})/i.exec(cookie) || [];
      username =  matches[0] && matches[1] ? matches[1] : undefined;
      if (!!username) {
        usernameInput.value = username
      }
    } catch (e) {
      console.error('Error using cookies', e.message)
    }
  }
  getUserFromCookie();
  if (username) {
    menuContainer.style.display = 'none';
    playerUsername.innerHTML = username;
  }

  function openMenu() {
    menuContainer.style.display = 'flex';
  }
  playerUsername.addEventListener('click', openMenu)

  saveButton.addEventListener('click', (event) => {
    event.preventDefault();
    username = usernameInput.value.toUpperCase();
    if (!username) {
      usernameInput.focus();
      return;
    }
    try {
      document.cookie = `username=${username}; path=/; max-age=${60 * 60 * 24 * 7};`;
    } catch (e) {
      console.error('Error setting cookies', e.message);
    }

    menuContainer.style.display = 'none';
    playerUsername.innerHTML = username;
  });

  function joinServer(event) {
    event.preventDefault();

    if (!connected) {
      playerUsername.removeEventListener('click', openMenu);
      initController(username);
      connected = true;
      playerStatus.innerHTML = '<span class="online">connected</span>';
    }
    
    try {
      navigator.vibrate([50]);
    } catch (e) {
      console.log('Error using vibration', e.message);
    }
  }
  joinButton.addEventListener('click', joinServer);
} catch (e) {
  console.error('Somthing went wrong', e.message);
  location.reload();
}
