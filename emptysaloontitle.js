// test title display

function getName() {
  return '(X)titletest';
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

  drawTitle();

  // Debugging: Show the most recently pressed key:
  drawText('DEBUG', 14, 50, 17);
  drawBox(10, 50, 18, 5, 3);
  drawText(lastKey, 17, 54 - lastKey.length, 19);

}

function onInput(key) {
}

function drawTitle() {
  let x0 = 2;
  let y0 = 0;
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
  drawText("              press any key to enter", c, x0, y0++);
  y0++;
  drawText("v0.2 alpha, icegoat9 (c)1995", 5, x0, y0++);
}