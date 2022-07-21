// card game tests for Last Call BBS servers
// by icegoat, July 2022

// disclaimer: I don't really know Javascript...

// High-level TODOs:
//
// Required items before alpha release + getting feedback:
// * Review past PICO-8 and CircuitPython implementations...
// * XX Hand computation
//   * XX cardGrid -> 12 [a,b,c,d,e] arrays
//   * XX score an [a,b,c,d,e] array
//   * XX array of hand names -> scores
//   * XX review past implementations for score modes
// * XX Game states (play vs. score vs. highscore?) -- different update and draw routines?
//   * XX simple first states: title vs play
// * Save and load persistent high scores (and dates?)
//   * Shift dates to the 1990s or a fixed 1990s-era year?
// * XX Display hands and scores at end of game (w/ leaders for diagonals?)
// * Deck handling
//   * Create randomly shuffled unique-card deck
//   * Draw next cards from this deck rather than randomly generating
//   * Initialize nextCard from this deck
// * XX Remove "debug" last keypress box
// * Allow H or ? to bring up help as well
// * XX Rename .js, and BBS connection string
// * Pass through to tweak colors / contrast (especially in scored hands one...)
//
// Nice to haves, later:
// * Custom textwrap routine that parses two-char string '\n' (or ';', etc) as line separator
// * Instructions, or no? Summary of scoring of hands? Or leave it up to the player to figure out...
// * Top 10 high score list with names (persisted)
//   * w/ NPC scores (random) over time
// * XX Title screen, about, author 
//   * XX Old BBS-style ASCII art title page! (single color for now?)
// * Animation of card placement from deck
//   * Test if certain timer / pause or related commands work
// 
// Code cleanup:
// * Refactor analyze and score/draw hands from one function to separate analyze vs. display
// * More streamlined array initializations?
// * Pass 'card' objects rather than suit and rank to some functions
// * Standard class/structure/etc for card object?
// * Checking inputs based on char strings CHR(#) rather than numbers?
//
// Note: full set of font characters per the demo server are:
//   AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz
//   .,:;!?&#/\\%\'"0123456789+-*()[]^
//   █▟▙▜▛▀▄▐▌▝▘─♥═║╔╗╚╝╠╣>▲▼™`


let debugMode = false;
let lastKey;
//let keyBuffer;
let cursorX;
let cursorY;
const CARDW = 5;
const CARDH = 3;
const CARDX0 = 2;
const CARDY00 = 3;
let CARDY0 = CARDY00; // TODO: not a constant-- rename?
const DECKX0 = 33;
const DECKY0 = 5;
const HELPX0 = 29;
const HELPY0 = 9;
const DEFAULTCOL = 10;
const CARDCOL = 10;
const CURSORCOL = 17;
const CARDSUITS = ["*", "▲", "♥", "█"];
const CARDRANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K"];
const HANDNAMES = ["NONE", "PAIR", "2PR", "3KND", "STRT", "FLSH", "FULL", "4KND", "STFL"];
//TODO: harmonize scores with other versions of game?
const HANDSCORES = [0, 1, 2, 2, 3, 3, 3, 5, 9];
let nextCard = {};
const EMPTYCARD = { 'suit': '', 'rank': '' };
const SCREENMAXX = 55;
const SCREENMAXY = 19;
let msgFloating = '';
let gameState = '';   // valid: title, play, score(?), hiscore(future?)
let deck = [];  // global deck object

// TODO: better array initialization
// create empty 5x5 array
let cardGrid = [['', '', '', '', ''], ['', '', '', '', ''], ['', '', '', '', ''], ['', '', '', '', ''], ['', '', '', '', '']];

function getName() {
  return 'Empty Saloon';
}

function onConnect() {
  // Reset the server variables when a new user connects:
  lastKey = '';
  gameState = 'title';

  newGame();  // DEBUG: skips title menu
  cursorX = 4;  //DEBUG
  cursorY = 4;

  gameState = 'play';  // TODO: remove (skips to play mode for testing)
  //keyBuffer = loadData();

}

function onUpdate() {
  // Redraw the screen during every update:
  clearScreen();
  if (gameState == 'title') {
    drawTitle();
  } else if (gameState == 'play') {
    drawGame();
  } else if (gameState == 'scored') {
    drawScored();
  }
}

function drawGame() {

  // Title
  drawText('EMPTY SALOON: Poker Solitaire', 16, 13, 0);
  drawText('(press \'X\' for help)', DEFAULTCOL, 17, 1);

  // Instructions
  // TODO: checking for 'X' or 'x', convert to char string to be more readable?
  if (lastKey == 88 || lastKey == 88 + 32) {
    // TODO: do this using msgFloating generalized message instead and move to onInput()? See a test version there...
    drawText('Arrow keys move cursor', DEFAULTCOL, HELPX0, HELPY0);
    drawText('Space or \'Z\' places card', DEFAULTCOL, HELPX0, HELPY0 + 2);
    drawText('Score points from poker', DEFAULTCOL, HELPX0, HELPY0 + 4);
    drawText(' hands in 12 directions', DEFAULTCOL, HELPX0, HELPY0 + 5);
    drawText('(valid hands in all', DEFAULTCOL, HELPX0, HELPY0 + 6);
    drawText(' 12 directions ═ bonus)', DEFAULTCOL, HELPX0, HELPY0 + 7);
  }

  if (debugMode) {
    // Debugging: Show the most recently pressed key:
    drawText('DEBUG: last key', 14, 0, 17);
    drawBox(10, 0, 18, 5, 3);
    drawText(lastKey, 17, 4 - lastKey.length, 19);
  }

  // Draw Deck / Next Card
  drawText('NEXT:', DEFAULTCOL, DECKX0, DECKY0 - 1);
  drawCard(DECKX0, DECKY0, nextCard.suit, nextCard.rank);
  drawCardBox(CURSORCOL, DECKX0, DECKY0);

  // Draw empty card grid
  for (let x = 0; x <= 4; x++) {
    for (let y = 0; y <= 4; y++) {
      drawCardBoxOnGrid(3, x, y);
    }
  }

  // Draw actual card grid
  drawCardGrid();

  // Draw cursor
  drawCardBoxOnGrid(CURSORCOL, cursorX, cursorY);

  // Draw popup message (if any)
  if (msgFloating != '') {
    // TODO: set box height based on expected wrapped-text height (tricky to determine-- overestimate? use max?)
    drawBox(DEFAULTCOL, HELPX0, HELPY0, SCREENMAXX - HELPX0, 4);
    drawTextWrapped(msgFloating, DEFAULTCOL, HELPX0 + 1, HELPY0 + 1, SCREENMAXX - HELPX0 - 2);
  }

  if (debugMode) {

    // 'B' to run this test
    if (lastKey == 66 || lastKey == 66 + 32) {
      testHandAnalyze();
    }
    // 'C' to run this test
    if (lastKey == 67 || lastKey == 67 + 32) {
      testAnalyzeAllHands();
    }

    // 'D' to run this test
    if (lastKey == 68 || lastKey == 68 + 32) {
      drawTitle();
    }
  }
  if (cardGridFull()) gameState = 'scored'; //TODO: move to separate update function, or not?
}

// draw card grid and score callouts (only once full)
function drawScored() {
  let x0 = 39;
  let y0 = 2;
  CARDY0 = CARDY00 - 1;
  //drawText('Scoring all 12 hands:', 16, 2, 0);
  // Draw actual card grid
  drawCardGrid();
  let score = analyzeAndDrawHands();
  // TODO: Show bonus score for all hands?
  drawText('Your Score:', 16, x0, y0++);
  drawBox(DEFAULTCOL, x0 + 2, y0++, 6, 3);
  // TODO: pad text if 1 digit
  drawText(score, 16, x0 + 4, y0++);
  // TODO: show existing high score
  y0 += 2;
  drawText('High score:', 16, x0, y0++)
  drawBox(DEFAULTCOL, x0 + 2, y0++, 6, 3);
  drawText(99, 16, x0 + 4, y0++);
  // TODO: if new high score, show note (and persist)
  drawTextWrapped('Press [X] to play again', 16, x0, y0 + 5, 16);
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
    nextCard = cardDrawNext();
  } else {
    msgFloating = 'Error: There is already a card in that location.';
  }
}

function cardGridEmpty(x, y) {
  return cardGrid[x][y] == '';
}

// get random integer from 0 to range-1
function getRandomInt(range) {
  return Math.floor(Math.random() * range);
}

function dummyDrawNextCard() {
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

  if (gameState == 'title') {
    // enter play mode on any key press
    newGame();
    //gameState = 'play';  //already done within newGame()
  } else if (gameState == 'play') {
    // Remember the last key pressed:
    lastKey = key.toString();

    // Clear popup messages on any keypress
    msgFloating = '';

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
    if (key == 65 || key == 65 + 32) {
      msgFloating = ('Arrow keys move cursor Space or \'Z\' places card Build valid poker hands in all 12 directions (linear and diagonal) to score points');
    }
  } else if (gameState == 'scored') {
    // X or x
    if (key == 88 || key == 88 + 32) {
      newGame();
      //gameState = 'play';  //already done in newGame
    }
  }

}

function newGame() {
  // TODO: actually clear grid, reset deck, etc (for now, hard-resets grid w/ random cards)
  // clear deck
  deckInit();
  nextCard = cardDrawNext();

  cardGrid = [['', '', '', '', ''], ['', '', '', '', ''], ['', '', '', '', ''], ['', '', '', '', ''], ['', '', '', '', '']];
  seedCards(24);  // temporary, for debugging

  CARDY0 = CARDY00;
  cursorX = 2;
  cursorY = 2;

  gameState = 'play';

}

// draw a random card out of the global deck 
function cardDrawNext() {
  let n = Math.floor(Math.random() * deck.length);
  return deck.splice(n, 1)[0];
}

// handle negative numbers
function mod(num, modulus) {
  return ((num % modulus) + modulus) % modulus
}


// seed board with N random cards
function seedCards(n) {

  for (let y = 0; y <= 4; y++) {
    for (let x = 0; x <= 4; x++) {
      placeNextCard(x, y);
      if (--n == 0) return
    }
  }

}

////////////////////////////////////////////////////////////////////
// Parsing and scoring of hands

// assumes hand is an array of 5 cards {suit, rank}
// TODO: return hand as string or #?
//       for now, returns a hand #:
// 0=none,1=pair,2=2pair,3=3kind,4=strgt,5=flush,6=house,7=4kind,8=stfsh
function handAnalyze(hand) {
  let rankcounts = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  let suitcounts = [0, 0, 0, 0];
  let handtype = 0;
  let minrank = 12;
  let maxrank = 0;
  for (let i = 0; i <= 4; i++) {
    suitcounts[hand[i].suit]++;
    rankcounts[hand[i].rank]++;
    if (hand[i].rank < minrank) minrank = hand[i].rank;
    if (hand[i].rank > maxrank) maxrank = hand[i].rank;
  }
  // check for 4 of a kind
  for (let i = 0; i <= 12; i++) {
    if (rankcounts[i] == 4) return 7;
  }
  // check for 3 of a kind (could also be full house...)
  for (let i = 0; i <= 12; i++) {
    if (rankcounts[i] == 3) handtype = 3;
  }
  // check for pair (could also be 2 pair or full house)
  for (let i = 0; i <= 12; i++) {
    if (rankcounts[i] == 2) {
      if (handtype == 3) return 6;  //already had 3kind: full house
      if (handtype == 1) return 2;  //already had pair: 2pair
      handtype = 1;
    }
  }
  if (handtype == 3) return 3; // three of a kind
  if (handtype == 1) return 1; // pair
  // check for flush (could also be straight flush)
  for (let i = 0; i <= 3; i++) {
    if (suitcounts[i] == 5) handtype = 5;
  }
  // check for straight (could also be straight flush)
  if (maxrank - minrank == 4) {
    // since we know by this point there are no duplicated ranks...
    if (handtype == 5) return 8; //already had flush: straight flush
    return 4; //straight
  }
  if (handtype == 5) return 5; //flush, not straight flush
  return 0; //nothing else matched
}

// example hands, test hand analysis on them:
function testHandAnalyze() {
  let handeval = 0;
  let h = [];
  let x0 = 30;

  drawText('testHandAnalyze():', 17, 0, 0);
  h = [{ 'suit': 1, 'rank': 3 }, { 'suit': 1, 'rank': 11 }, { 'suit': 1, 'rank': 4 }, { 'suit': 2, 'rank': 7 }, { 'suit': 1, 'rank': 5 }];
  handeval = handAnalyze(h);
  drawText('hand:' + HANDNAMES[handeval] + ' (' + HANDSCORES[handeval] + 'pts)', 17, x0, 1);
  h = [{ 'suit': 1, 'rank': 3 }, { 'suit': 3, 'rank': 6 }, { 'suit': 2, 'rank': 10 }, { 'suit': 2, 'rank': 6 }, { 'suit': 0, 'rank': 5 }];
  handeval = handAnalyze(h);
  drawText('hand ' + HANDNAMES[handeval] + ' (' + HANDSCORES[handeval] + 'pts)', 17, x0, 2);
  h = [{ 'suit': 1, 'rank': 3 }, { 'suit': 3, 'rank': 6 }, { 'suit': 2, 'rank': 10 }, { 'suit': 3, 'rank': 10 }, { 'suit': 0, 'rank': 6 }];
  handeval = handAnalyze(h);
  drawText('hand:' + HANDNAMES[handeval] + ' (' + HANDSCORES[handeval] + 'pts)', 17, x0, 3);
  h = [{ 'suit': 1, 'rank': 3 }, { 'suit': 3, 'rank': 6 }, { 'suit': 2, 'rank': 10 }, { 'suit': 2, 'rank': 6 }, { 'suit': 0, 'rank': 6 }];
  handeval = handAnalyze(h);
  drawText('hand:' + HANDNAMES[handeval] + ' (' + HANDSCORES[handeval] + 'pts)', 17, x0, 4);
  h = [{ 'suit': 1, 'rank': 3 }, { 'suit': 3, 'rank': 6 }, { 'suit': 2, 'rank': 7 }, { 'suit': 2, 'rank': 4 }, { 'suit': 0, 'rank': 5 }];
  handeval = handAnalyze(h);
  drawText('hand:' + HANDNAMES[handeval] + ' (' + HANDSCORES[handeval] + 'pts)', 17, x0, 5);
  h = [{ 'suit': 1, 'rank': 3 }, { 'suit': 1, 'rank': 6 }, { 'suit': 1, 'rank': 10 }, { 'suit': 1, 'rank': 0 }, { 'suit': 1, 'rank': 12 }];
  handeval = handAnalyze(h);
  drawText('hand:' + HANDNAMES[handeval] + ' (' + HANDSCORES[handeval] + 'pts)', 17, x0, 6);
  h = [{ 'suit': 1, 'rank': 10 }, { 'suit': 3, 'rank': 6 }, { 'suit': 2, 'rank': 10 }, { 'suit': 2, 'rank': 6 }, { 'suit': 0, 'rank': 6 }];
  handeval = handAnalyze(h);
  drawText('hand:' + HANDNAMES[handeval] + ' (' + HANDSCORES[handeval] + 'pts)', 17, x0, 7);
  h = [{ 'suit': 1, 'rank': 6 }, { 'suit': 3, 'rank': 6 }, { 'suit': 2, 'rank': 10 }, { 'suit': 2, 'rank': 6 }, { 'suit': 0, 'rank': 6 }];
  handeval = handAnalyze(h);
  drawText('hand:' + HANDNAMES[handeval] + ' (' + HANDSCORES[handeval] + 'pts)', 17, x0, 8);
  h = [{ 'suit': 0, 'rank': 3 }, { 'suit': 0, 'rank': 6 }, { 'suit': 0, 'rank': 2 }, { 'suit': 0, 'rank': 4 }, { 'suit': 0, 'rank': 5 }];
  handeval = handAnalyze(h);
  drawText('hand:' + HANDNAMES[handeval] + ' (' + HANDSCORES[handeval] + 'pts)', 17, x0, 9);
}

// test analyzing all hands and print summary to screen for debugging
function testAnalyzeAllHands() {
  let x0 = 30;
  let y0 = 3;
  let h = [];
  let handeval = 0;
  drawText('testAnalyzeAllHands:', 17, x0, y0 + 0);
  //analyze row hands
  for (let y = 0; y <= 4; y++) {
    for (let x = 0; x <= 4; x++) {
      h[x] = cardGrid[x][y];
    }
    handeval = handAnalyze(h);
    drawText('row ' + y + ':' + HANDNAMES[handeval] + ' (' + HANDSCORES[handeval] + 'pts)', 17, x0, y0 + y + 2);
  }
  //analyze col hands
  for (let x = 0; x <= 4; x++) {
    for (let y = 0; y <= 4; y++) {
      h[y] = cardGrid[x][y];
    }
    handeval = handAnalyze(h);
    drawText('col ' + x + ':' + HANDNAMES[handeval] + ' (' + HANDSCORES[handeval] + 'pts)', 17, x0, y0 + x + 7);
  }
  //analyze diag hands
  for (let i = 0; i <= 4; i++) {
    h[i] = cardGrid[i][i];
  }
  handeval = handAnalyze(h);
  drawText('diag 1:' + HANDNAMES[handeval] + ' (' + HANDSCORES[handeval] + 'pts)', 17, x0, y0 + 12);
  for (let i = 0; i <= 4; i++) {
    h[i] = cardGrid[i][4 - i];
  }
  handeval = handAnalyze(h);
  drawText('diag 2:' + HANDNAMES[handeval] + ' (' + HANDSCORES[handeval] + 'pts)', 17, x0, y0 + 13);
}

// Analyze all hands and draw score boxes to screen, return total score
// TODO: split up function: only analyze once, return array of hand evals, separate draw routine
function analyzeAndDrawHands() {
  let h = [];
  let handeval = 0;
  let score = 0;
  let scoredhands = 0;
  //analyze row hands
  for (let y = 0; y <= 4; y++) {
    for (let x = 0; x <= 4; x++) {
      h[x] = cardGrid[x][y];
    }
    handeval = handAnalyze(h);
    if (handeval > 0) scoredhands++;
    score += HANDSCORES[handeval];
    drawScoreBox(y, handeval);
  }
  //analyze col hands
  for (let x = 0; x <= 4; x++) {
    for (let y = 0; y <= 4; y++) {
      h[y] = cardGrid[x][y];
    }
    handeval = handAnalyze(h);
    if (handeval > 0) scoredhands++;
    score += HANDSCORES[handeval];
    drawScoreBox(x + 5, handeval);
  }
  //analyze diag hands
  for (let i = 0; i <= 4; i++) {
    h[i] = cardGrid[i][i];
  }
  handeval = handAnalyze(h);
  if (handeval > 0) scoredhands++;
  score += HANDSCORES[handeval];
  drawScoreBox(11, handeval);
  for (let i = 0; i <= 4; i++) {
    h[i] = cardGrid[i][4 - i];
  }
  handeval = handAnalyze(h);
  if (handeval > 0) scoredhands++;
  score += HANDSCORES[handeval];
  drawScoreBox(12, handeval);

  // TODO: split out scoring vs. display into separate functions
  // add bonus score if all 12 hands scored
  if (scoredhands == 12) score += 25;
  return score;
}

// draw score box (hand name and score) for hand #n evaluated to heval
//  0-4: rows 0-4
//  5-9: cols 0-4
//  10: \ diagonal
//  11: / diagonal
function drawScoreBox(n, heval) {
  let x = 0;
  let y = 0;
  const SCORECOL = 12;
  if (n < 5) {
    x = CARDX0 + 5 * CARDW + 3;
    y = CARDY0 + n * CARDH + 1;
    drawText('---', SCORECOL - 4, x - 3, y); // draw leader
  } else if (n < 10) {
    x = CARDX0 + (n - 5) * CARDW;
    y = CARDY0 + 5 * CARDH + 1;
    drawText('I', SCORECOL - 4, x + 2, y - 1); // draw leader
  } else if (n == 11) {
    x = CARDX0 + 5 * CARDW + 3;
    y = CARDY0 + 5 * CARDH + 1;
    drawText('\\  ', SCORECOL - 4, x - 3, y - 1); // draw leader
    drawText(' \\ ', SCORECOL - 4, x - 3, y); // draw leader
  } else {
    x = CARDX0 + 5 * CARDW + 3;
    y = CARDY0 - CARDH + 1;
    drawText(' / ', SCORECOL - 4, x - 3, y); // draw leader
    drawText('/  ', SCORECOL - 4, x - 3, y + 1); // draw leader
  }
  //drawBox(SCORECOL, x, y, 7, 4);
  drawText(HANDNAMES[heval], SCORECOL, x, y);
  drawText(' (' + HANDSCORES[heval] + ')', SCORECOL - 4, x, y + 1);
}

// populate global deck object with cards in order
function deckInit() {
  deck = [];
  for (let s = 0; s < 4; s++) {
    for (let r = 0; r < 13; r++) {
      deck.push({ 'suit': s, 'rank': r });
    }
  }
}

//////////////////////////////////
// Title / intro

function drawTitle() {
  let x0 = 2;
  let y0 = 1;
  let c = 14;
  clearScreen();
  drawText("███████╗███╗   ███╗██████╗ ████████╗██╗   ██╗     ", c, x0 + 4, y0++);
  drawText("██╔════╝████╗ ████║██╔══██╗╚══██╔══╝╚██╗ ██╔╝       ", c, x0 + 4, y0++);
  drawText("█████╗  ██╔████╔██║██████╔╝   ██║    ╚████╔╝        ", c, x0 + 4, y0++);
  drawText("██╔══╝  ██║╚██╔╝██║██╔═══╝    ██║     ╚██╔╝         ", c, x0 + 4, y0++);
  drawText("███████╗██║ ╚═╝ ██║██║        ██║      ██║          ", c, x0 + 4, y0++);
  drawText("╚══════╝╚═╝     ╚═╝╚═╝        ╚═╝      ╚═╝          ", c, x0 + 4, y0++);
  drawText("                                                    ", c, x0, y0++);
  drawText("███████╗ █████╗ ██╗      ██████╗  ██████╗ ███╗   ██╗", c, x0, y0++);
  drawText("██╔════╝██╔══██╗██║     ██╔═══██╗██╔═══██╗████╗  ██║", c, x0, y0++);
  drawText("███████╗███████║██║     ██║   ██║██║   ██║██╔██╗ ██║", c, x0, y0++);
  drawText("╚════██║██╔══██║██║     ██║   ██║██║   ██║██║╚██╗██║", c, x0, y0++);
  drawText("███████║██║  ██║███████╗╚██████╔╝╚██████╔╝██║ ╚████║", c, x0, y0++);
  drawText("╚══════╝╚═╝  ╚═╝╚══════╝ ╚═════╝  ╚═════╝ ╚═╝  ╚═══╝", c, x0, y0++);
  y0++;
  drawText("               press any key to enter", c, x0, y0++);
  y0++;
  drawText("v0.2 alpha, icegoat9 (c)1995", 4, 26, 18);
}