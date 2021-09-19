async function initController() {
  const response = await fetch(`${window.location.origin}/constants`);
  const constants = await response.json();
  console.log('constants fetched', constants);

  const roles = constants.roles;
  const events = constants.events;

  const player = {};
  
  const socket = io.connect(
    window.location.origin,
    {
      query: `role=${roles.PLAYER}`,
      reconnection: false,
    },
  );

  socket.on(events.NEW_PLAYER, (newPlayer) => {
    console.log('new player', newPlayer);
    player = newPlayer;
  });

  socket.on(events.HOST_DISCONNECTED, () => {
    console.log('host disconnected')
    socket.close();
    window.location.pathname = '/';
  });
}

initController();
