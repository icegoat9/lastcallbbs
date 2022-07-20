// card game tests for Last Call BBS servers
// by icegoat, 2022

let lastKey;
//let keyBuffer;
let cursorX;
let cursorY;
const CARDW = 5;
const CARDH = 3;
const CARDX0 = 2;
const CARDY0 = 3;
const DECKX0 = 30;
const DECKY0 = 5;
const HELPX0 = 29;
const HELPY0 = 10;
const DEFAULTCOL = 10;
const CARDCOL = 10;
const CURSORCOL = 17;
const CARDSUITS = ["*", "▲", "♥", "█"];
const CARDRANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K"];
let nextCard = { 'suit': 0, 'rank': 0 };
const EMPTYCARD = { 'suit': '', 'rank': '' };
const SCREENMAXX = 55;
const SCREENMAXY = 19;
let msgFloating = '';

// TODO: better array initialization
// create empty 5x5 array
let cardGrid = [['', '', '', '', ''], ['', '', '', '', ''], ['', '', '', '', ''], ['', '', '', '', ''], ['', '', '', '', '']];

function getName() {
  return 'Card Test Server';
}

function onConnect() {
  // Reset the server variables when a new user connects:
  cursorX = 2;
  cursorY = 2;
  lastKey = '';
  //keyBuffer = loadData();
}

function onUpdate() {
  // It is safe to completely redraw the screen during every update:
  clearScreen();

  // Title
  drawText('Empty Saloon: Poker Solitaire', 16, 13, 0);
  drawText('(press \'X\' for help)', DEFAULTCOL, 17, 1);

  // Instructions
  // TODO: checking for 'X' or 'x', convert to char string to be more readable?
  if (lastKey == 88 || lastKey == 120) {
    // TODO: do this using msgFloating generalized message instead? See test in onInput()...
    drawText('Arrow keys move cursor', DEFAULTCOL, HELPX0, HELPY0);
    drawText('Space or \'Z\' places card', DEFAULTCOL, HELPX0, HELPY0 + 1);
    drawText('Build valid poker hands', DEFAULTCOL, HELPX0, HELPY0 + 3);
    drawText(' in all 12 directions', DEFAULTCOL, HELPX0, HELPY0 + 4);
    drawText(' (linear and diagonal)', DEFAULTCOL, HELPX0, HELPY0 + 5);
    drawText(' to score points', DEFAULTCOL, HELPX0, HELPY0 + 6);
  }

  // Debugging: Draw the full color palette:
  //drawText('COLOR REFERENCE', 14, 21, 18);
  //for (let i = 1; i <= 17; i++) {
  //  const text = (i < 10) ? ('0' + i) : i;
  //  drawText(text, i, i * 3, 19);
  //}

  // Debugging: Show the most recently pressed key:
  drawText('DEBUG', 14, 50, 17);
  drawBox(10, 50, 18, 5, 3);
  drawText(lastKey, 17, 54 - lastKey.length, 19);

  // Note: full set of font characters are:
  //
  //  AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz
  //  .,:;!?&#/\\%\'"0123456789+-*()[]^
  //  █▟▙▜▛▀▄▐▌▝▘─♥═║╔╗╚╝╠╣>▲▼™`

  // Draw Deck / Next Card
  drawText('NEXT:', DEFAULTCOL, DECKX0, DECKY0 - 1);
  drawCard(DECKX0, DECKY0, nextCard.suit, nextCard.rank);
  drawCardBox(CURSORCOL, DECKX0, DECKY0);


  // Draw card grid
  for (let x = 0; x <= 4; x++) {
    for (let y = 0; y <= 4; y++) {
      drawCardBoxOnGrid(3, x, y);
    }
  }

  // Draw dummy cards
  //  drawCardOnGrid(2, 2, 0, 0);
  //  drawCardOnGrid(3, 2, 1, 11);
  //  drawCardOnGrid(4, 2, 2, 2);
  //  drawCardOnGrid(1, 1, 3, 12);

  // Initialize dummy card grid
  cardGrid[0][0] = { 'suit': 0, 'rank': 0 };
  cardGrid[1][1] = { 'suit': 1, 'rank': 11 };
  cardGrid[2][2] = { 'suit': 2, 'rank': 2 };
  cardGrid[3][3] = { 'suit': 2, 'rank': 9 };
  cardGrid[4][4] = { 'suit': 3, 'rank': 12 };

  // Draw actual card grid
  drawCardGrid()

  // Draw cursor
  drawCardBoxOnGrid(CURSORCOL, cursorX, cursorY);

  // Draw popup message (if any)
  if (msgFloating != '') {
    // TODO: set box height based on expected wrapped-text height (tricky to determine-- overestimate? use max?)
    drawBox(DEFAULTCOL, HELPX0, HELPY0, SCREENMAXX - HELPX0, 8);
    drawTextWrapped(msgFloating, DEFAULTCOL, HELPX0 + 1, HELPY0 + 1, SCREENMAXX - HELPX0 - 2);
  }

}


// draw at screen x,y
function drawCardBox(color, x, y) {
  drawBox(color, x, y, CARDW, CARDH);
}

// draw at screen x,y
function drawCard(x, y, suit, rank) {
  drawCardBox(CARDCOL, x, y);
  drawText(CARDRANKS[rank], CARDCOL, x + 1, y + 1);
  drawText(CARDSUITS[suit], CARDCOL, x + 3, y + 1);
}

// draw at card grid x,y (range: 0 to 4)
function drawCardBoxOnGrid(color, gridx, gridy) {
  let xy = gridXYtoScreenXY(gridx, gridy);
  drawBox(color, xy.x, xy.y, CARDW, CARDH);
}

// draw at card grid x,y (range: 0 to 4)
function drawCardOnGrid(gridx, gridy, suit, rank) {
  let xy = gridXYtoScreenXY(gridx, gridy);
  drawCard(xy.x, xy.y, suit, rank);
}

// draw all cards in cardGrid object...
function drawCardGrid() {
  for (let x = 0; x <= 4; x++) {
    for (let y = 0; y <= 4; y++) {
      if (!cardGridEmpty(x, y)) {
        drawCardOnGrid(x, y, cardGrid[x][y].suit, cardGrid[x][y].rank)
      }
    }
  }
}

// convert from card grid x,y (range: 0 to 4) to screen x,y
function gridXYtoScreenXY(gridx, gridy) {
  return { 'x': CARDX0 + gridx * CARDW, 'y': CARDY0 + gridy * CARDH };
}

// card is {'suit': suit, 'rank': rank}
function placeNextCard(gridx, gridy) {
  if (cardGridEmpty(gridx, gridy)) {
    cardGrid[gridx][gridy] = { 'suit': nextCard.suit, 'rank': nextCard.rank };
    drawNewCard();
  }
  else {
    msgFloating = 'Already a card in that location: try somewhere else';
  }
}

function cardGridEmpty(x, y) {
  return cardGrid[x][y] == '';
}

// get random integer from 0 to range-1
function getRandomInt(range) {
  return Math.floor(Math.random() * range);
}

function drawNewCard() {
  // TODO: create an actual deck object to draw from
  // placeholder: general random card (may already exist on grid)
  nextCard.suit = getRandomInt(4);
  nextCard.rank = getRandomInt(13);
}

// is card grid full (of 25 placed cards)?
function cardGridFull() {
  for (let x = 0; x <= 4; x++) {
    for (let y = 0; y <= 4; y++) {
      if (cardGridEmpty(x, y)) return false;
    }
  }
  return true;
}

function onInput(key) {
  // Clear popup messages on any keypress
  msgFloating = '';

  // Remember the last key pressed:
  lastKey = key.toString();

  // Arrow keys
  if (key == 20) cursorX = mod(cursorX + 1, 5);
  if (key == 19) cursorX = mod(cursorX - 1, 5);
  if (key == 18) cursorY = mod(cursorY + 1, 5);
  if (key == 17) cursorY = mod(cursorY - 1, 5);

  // Place
  // Check for Space, Z, or z
  if (key == 32 || key == 90 || key == 122) {
    placeNextCard(cursorX, cursorY);
  }

  // TODO: remove this (at least until I write a custom wrapped text function that interprets \n or similar for
  //       more control over line spacing?)
  // DEBUG: Dummy test of help using msgFloating (triggered by 'A')
  if (key == 65) {
    msgFloating = ('Arrow keys move cursor Space or \'Z\' places card Build valid poker hands in all 12 directions (linear and diagonal) to score points');
  }

}

// handle negative numbers
function mod(num, modulus) {
  return ((num % modulus) + modulus) % modulus
}