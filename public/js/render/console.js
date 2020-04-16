function renderError(msg) {
    console.error(msg);
}

function renderGameEvent(data) {
    console.warn(data);
}

function renderPlayerJoined() {
  // meh
}

function renderAllPlayersInfo(players) {
  // console.log("Player info:", players);
  render();
}

function renderOwnId(id) {
  console.log("Player id is "+id);
}

function renderGameStart() {
  console.log("Game is full. Starting...");
}

function renderCardsDealt(totalCards) {
  console.log(totalCards+" cards dealt each");
}

function renderAddCardSlotToHand(player, slot, data) {
}

function renderTable(table) {
  table.forEach(({name, hand}) => {
    console.log(`
      ${name}'s hand:
      cards  : ${hand.map((card, i) => card ? `[?]` : '   ')}
      (slot#): ${hand.map((card, i) => card ? `[${i}]` : '   ')}
    `)
  });
}

function showGame() {
  switch(gameStatus) {
    case "lobby":
      console.log(`
Players in lobby:
${allPlayers.map(({name}, i) => `(# ${i}) ${name}`).join('\n')}.
(${allPlayers.length} total).
      `);
      break;
    case "in progress":
      renderTable();
      break;
  }
}

function showCurrentAction() {
  if(gameStatus === 'lobby') {
    if (ownId === 0) {
      console.log('You are the host! Enter \'start()\' when all players are ready.');
    } else {
      console.log('Waiting for host to start game once all players have joined.');
    }
  }
}

function showOptions() {
  console.log('stuff you can do right now');
}

function render() {
  console.clear();
  showGame();
  showCurrentAction();
  showOptions();
}
