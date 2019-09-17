var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');

var lineHeight = 0;
var symbolWidth = 14;
var symbolHeight = symbolWidth;

var messageLog = ['', '', ''];
var formattedMessageLog = '';

function eraseDisplay()
{
	// Background
	ctx.fillStyle = 'black';
	ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// Sets font style for info display
function setInfoStyle() {
	ctx.fillStyle = DEFAULT_COLOUR;
	ctx.font = 'bold 20px Consolas';
	lineHeight = UI_LINE_HEIGHT;
}

// Sets font style for map display
function setMapStyle() {
	ctx.fillStyle = DEFAULT_COLOUR;
	ctx.font = 'bold 18px Consolas';
	lineHeight = TILE_LINE_HEIGHT;
	ctx.textBaseline = 'top';
}

// Sets font style for UI headers (i.e., the Legend header)
function setHeaderStyle() {
	ctx.fillStyle = DEFAULT_COLOUR;
	ctx.font = 'bold 24px Consolas';
	lineHeight = UI_LINE_HEIGHT;
}


function calculateGradientColours() {
	// BRIGHTEST_GREEN converted to RGB values
	const R_1 = parseInt('0x' + BRIGHTEST_GREEN.substring(1, 3));
	const G_1 = parseInt('0x' + BRIGHTEST_GREEN.substring(3, 5));
	const B_1 = parseInt('0x' + BRIGHTEST_GREEN.substring(5));
	// DARKEST_GREEN converted to RGB values
	const R_2 = parseInt('0x' + DARKEST_GREEN.substring(1, 3));
	const G_2 = parseInt('0x' + DARKEST_GREEN.substring(3, 5));
	const B_2 = parseInt('0x' + DARKEST_GREEN.substring(5));
	// Values for a step in the gradient for each colour
	const R_STEP = (R_2 - R_1) / MAX_LENGTH;
	const G_STEP = (G_2 - G_1) / MAX_LENGTH;
	const B_STEP = (B_2 - B_1) / MAX_LENGTH;
	for (var i = 0; i < MAX_LENGTH; i++) {
		var redHex = getGradientColour(R_1, R_STEP, i);
		var greenHex = getGradientColour(G_1, G_STEP, i);
		var blueHex = getGradientColour(B_1, B_STEP, i)
		GRADIENT_COLOURS[i] = '#' + redHex + greenHex + blueHex;
	}
}

/**
 * Returns str padded with trailing spaces until str is the given length.
 *
 * @param {string} str
 * @param {number} length
 * @return {boolean}
 */
function applyTrailingSpaces(str, length) {
	var ret = str;
	while (ret.length < length) {
		ret += ' ';
	}
	return ret;
}

function drawMenu() {
	eraseDisplay();
	var menuDisplay = '';
	menuDisplay += '+-----------+\n';
	menuDisplay += '| SNAKELIKE |\n';
	menuDisplay += '+-----------+\n';
	// menuDisplay += 'v' + VERSION + '\n';
	menuDisplay += 'a Snake×Rogue game by Leo Li\n\n\n';
	menuDisplay += 'Brave the caves, eat the golden apple at the deepest\n' +
		           ' depths, and return to the surface with your prize!\n';
	menuDisplay += '\nPress enter to start.\n';

	menuDisplay += '\n\nTips:\n';
	menuDisplay += ' - The longer you are, the slower you\'ll move.    \n';
	menuDisplay += ' - Visibility decreases as you descend deeper.    \n';
	menuDisplay += ' - The golden apple doubles your score when eaten.\n';

	setInfoStyle();
	print(menuDisplay, canvas.width / 2, canvas.height / 2 + MENU_OFFSET_Y, true, 'center');
}

function drawClassSelect() {
	eraseDisplay();
	setInfoStyle();
	var classSelectDisplay = '';
	var classHeaderLength = 65;
	classSelectDisplay += '                        Choose your class:                       \n\n';
	classSelectDisplay += applyTrailingSpaces('(1) Fighter - ' + roles[RoleType.FIGHTER].maxHp + ' HP', classHeaderLength) + '\n';
	classSelectDisplay += '            - Eating food grants you a shield which blocks       \n' +
						  '              the next damage you take.                          \n';
	classSelectDisplay += applyTrailingSpaces('(2) Rogue   - ' + roles[RoleType.ROGUE].maxHp + ' HP', classHeaderLength) + '\n';
	classSelectDisplay += '            - Moves slower as visibility decreases.              \n';
	classSelectDisplay += '            - Takes half damage from traps.                      \n';
	classSelectDisplay += applyTrailingSpaces('(3) Wizard  - ' + roles[RoleType.WIZARD].maxHp + ' HP', classHeaderLength) + '\n';
	classSelectDisplay += '            - Eating food builds MP. Spend 5 MP by pressing      \n' +
						  '              space to reveal all items on the current floor.    \n';
	classSelectDisplay += '(4) Random                                                       \n';
	print(classSelectDisplay, canvas.width / 2, canvas.height / 2, true, 'center');
}


/**
 * Draws a bar (HP or MP) with the given parameters.
 *
 * @param {number} x - x of this bar on the canvas.
 * @param {number} y - y of this bar on the canvas.
 * @param {number} currValue - The current value of this bar.
 * @param {number} maxValue - The maximum value of this bar.
 * @param {number} hasShield - True if the player has a shield on this bar.
 * @param {string} filledColour - Colour of the bar when it is filled.
 * @param {string} emptyColour - Colour of the bar when it is empty.
 * @param {string} [shieldColour] - Colour of the shield part of the bar.
 * @return {boolean}
 */
function drawBar(x, y, currValue, maxValue, hasShield, filledColour, emptyColour, shieldColour, barChunkSize) {
	ctx.fillStyle = filledColour;
	var printedBar = '';
	if (currValue > 0) {
		if (hasShield) {
			ctx.fillStyle = shieldColour;
		} else {
			ctx.fillStyle = filledColour;
		}
	} else {
		ctx.fillStyle = emptyColour;
	}
	printedBar += '[';
	print('[', x, y, true);
	for (var i = 1; i <= maxValue; i++) {
		// Draw one hit point: /
		if (i <= currValue) {
			if (hasShield) {
				ctx.fillStyle = shieldColour;
			} else {
				ctx.fillStyle = filledColour;
			}
			print('/', x + ctx.measureText(printedBar).width, y, true);
			printedBar += '/';
		}
		else {
			ctx.fillStyle = DEFAULT_COLOUR;
			print('-', x + ctx.measureText(printedBar).width, y, true);
			printedBar += '-';
		}
		if (i % barChunkSize == 0 && i != maxValue) {
			if (i < currValue) {
				if (hasShield) {
					ctx.fillStyle = shieldColour;
				} else {
					ctx.fillStyle = filledColour;
				}
			} else {
				ctx.fillStyle = DEFAULT_COLOUR;
			}
			print('|', x + ctx.measureText(printedBar).width, y, true);
			printedBar += '|';
		}
	}
	print(']', x + ctx.measureText(printedBar).width, y, true);
}

function drawInfoDisplay() {
	setInfoStyle();

	// Labels for elements on left side (HP, MP, Class)
	var leftLabels = '';
	leftLabels += 'HP\n';
	leftLabelsLines = 2;
	if (playerRole instanceof Wizard) {
		leftLabels += 'MP\n';
		leftLabelsLines++;
	}
	leftLabels += 'CLASS';

	uiLineHeight = (TOP_UI_HEIGHT - TOP_PANEL_MARGIN_Y * 2) / leftLabelsLines;
	print(leftLabels, LEFT_UI_LABEL_X, TOP_UI_HEIGHT / 2, true, 'right');

	// The y offset when the UI area's height is divided in half
	var halfOffsetY = -uiLineHeight / 2;
	if (leftLabelsLines == 3) {
		halfOffsetY = -uiLineHeight;
	}

	// Draw HP bar
	drawBar(LEFT_UI_LABEL_X + LEFT_UI_MARGIN, TOP_UI_HEIGHT / 2 + halfOffsetY, health, playerRole.maxHp, shielded, HP_COLOUR, DEFAULT_COLOUR, SHIELD_COLOUR, HP_BAR_CHUNK_SIZE);
	if (playerRole instanceof Wizard) {
		drawBar(LEFT_UI_LABEL_X + LEFT_UI_MARGIN, TOP_UI_HEIGHT / 2, mana, MAX_MANA, false, MP_COLOUR, DEFAULT_COLOUR, null, MP_BAR_CHUNK_SIZE);
	}

	ctx.fillStyle = DEFAULT_COLOUR;
	var roleDisplay = '\n' + playerRole.name;
	if (leftLabelsLines == 3) {
		roleDisplay = '\n' + roleDisplay;
	}
	print(roleDisplay, LEFT_UI_LABEL_X + LEFT_UI_MARGIN, TOP_UI_HEIGHT / 2, true);


	// Elements on right side (Floor and Score)
	uiLineHeight = (TOP_UI_HEIGHT - TOP_PANEL_MARGIN_Y * 2) / 2;
	print('FLOOR\nSCORE', RIGHT_UI_LABEL_X, TOP_UI_HEIGHT / 2, true, 'right');
	print(currLevel.levelNum.toString() + '\n' + score.toString(), RIGHT_UI_LABEL_X + RIGHT_UI_MARGIN, TOP_UI_HEIGHT / 2, true, 'right');

	// Draw the right panel UI (the legend)
	setHeaderStyle();
	print('LEGEND', canvas.width - RIGHT_PANEL_WIDTH / 2 + LEGEND_HEADER_OFFSET_X, canvas.height / 2 + LEGEND_HEADER_OFFSET_Y, true);
	setInfoStyle();

	var itemY = canvas.height / 2 + LEGEND_HEADER_OFFSET_Y;
	itemY += uiLineHeight * 1.5;
	
	// Draw the unique first item of the legend, the snake body
	var bodyWidth = TILE_LINE_HEIGHT + 3;
	drawTile(symbols.body, Body.HEAD, canvas.width - RIGHT_PANEL_WIDTH / 2 + LEGEND_ICON_OFFSET_X, itemY, GRADIENT_COLOURS[0]);
	drawTile(symbols.body, Body.TAIL, canvas.width - RIGHT_PANEL_WIDTH / 2 + LEGEND_ICON_OFFSET_X - bodyWidth, itemY, GRADIENT_COLOURS[1]);
	drawTile(symbols.body, Body.TAIL, canvas.width - RIGHT_PANEL_WIDTH / 2 + LEGEND_ICON_OFFSET_X - bodyWidth * 2, itemY, GRADIENT_COLOURS[2]);
	setInfoStyle();
	print('You!', canvas.width - RIGHT_PANEL_WIDTH / 2 + LEGEND_LABEL_OFFSET_X, itemY, true);

	// Draw remaining legend contents
	var legend = [{symbolSet: symbols.terrain, tile: Terrain.STAIRS_DOWN, label: 'Ladder (Down)'},
	              {symbolSet: symbols.terrain, tile: Terrain.STAIRS_UP, label: 'Ladder (Up)'},
	              {symbolSet: symbols.entity, tile: Entity.FOOD, label: 'Food'},
	              {symbolSet: symbols.entity, tile: Entity.POTION, label: 'Potion (+' + POTION_HEAL_VALUE + ' HP)'},
	              {symbolSet: symbols.entity, tile: Entity.TRAP, label: 'Trap (' + TRAP_DAMAGE + ' DMG)'}];
	for (var i = 0; i < legend.length; i++) {
		itemY += uiLineHeight;
		drawTile(legend[i].symbolSet, legend[i].tile, canvas.width - RIGHT_PANEL_WIDTH / 2 + LEGEND_ICON_OFFSET_X, itemY);
		setInfoStyle();
		print(legend[i].label, canvas.width - RIGHT_PANEL_WIDTH / 2 + LEGEND_LABEL_OFFSET_X, itemY, true);
	}
}

/**
 * Calculates the colour a tail entity at tile x, y should be and returns it. Returns the brightest colour if input is invalid.
 *
 * @param {number} x
 * @param {number} y
 * @return {string}
 */
function getTailColour(x, y) {
	if (checkWithinBounds(x, y) && currLevel.tiles[x][y].body == Body.TAIL) {
		var dist = getTailDistance(new Point(x, y));
		return GRADIENT_COLOURS[dist - 1];
	}
	return BRIGHTEST_GREEN;
}

/**
 * Draws the symbol of the specified tile at x, y of the canvas.
 *
 * @param {{a: string, b: string}[]} symbolSet - The array of JSONs specifying how to draw these type of tiles.
 * @param {('Terrain'|'Entity'|'Particles'))} tile - The enumerator value specifying what type of tile to draw.
 * @param {number} x - The x of the canvas draw location.
 * @param {number} y - The y of the canvas draw location.
 * @param {string} [overrideColour] - Colour to use.
 */
function drawTile(symbolSet, tile, x, y, overrideColour) {
	if (overrideColour !== undefined) {
		ctx.fillStyle = overrideColour;
	} else {
		// Set appropriate colour
		if (symbolSet == symbols.body && tile == Body.HEAD) {
			// Special case for the head when player is immobile
			ctx.fillStyle = (playerState == PlayerState.IMMOBILE) ? GREY : symbolSet[tile].colour;	
		} else {
			// Set colour to symbol's colour if there is one; default otherwise
			ctx.fillStyle = symbolSet[tile].colour ? symbolSet[tile].colour : DEFAULT_COLOUR;
		}
	}
	ctx.fillText(symbolSet[tile].symbol, x, y);
}

function drawMapDisplay() {
	setMapStyle();
	var map = '';

	// Location to draw a tile
	var x = MAP_X_MARGIN;
	var y = TOP_UI_HEIGHT;

	for (var i = 0; i < HEIGHT; i++) {
		for (var j = 0; j < WIDTH; j++) {
			if (currLevel.tiles[i][j].particle == Particle.SPARKLE || currLevel.tiles[i][j].particle == Particle.NEW_SPARKLE) {
				drawTile(symbols.particle, currLevel.tiles[i][j].particle, x, y);
			} else if (!currLevel.tiles[i][j].visible) {
				drawTile(symbols.terrain, Terrain.UNKNOWN, x, y);
			} else if (currLevel.tiles[i][j].body != Body.NO_BODY) {
				if (currLevel.tiles[i][j].body == Body.HEAD) {
					drawTile(symbols.body, currLevel.tiles[i][j].body, x, y);
				} else {
					drawTile(symbols.body, currLevel.tiles[i][j].body, x, y, getTailColour(i, j));
				}
			} else if (currLevel.tiles[i][j].entity != Entity.NO_ENTITY) {
				drawTile(symbols.entity, currLevel.tiles[i][j].entity, x, y);
			} else {
				drawTile(symbols.terrain, currLevel.tiles[i][j].terrain, x, y);
			}
			x += symbolWidth;
		}
		x = MAP_X_MARGIN;
		y += symbolHeight;
	}
}

/**
 * Updates formattedMessageLog by formatting the messageLog. Adds a '>' in front of each message and splits messages with '\n' in them into separate lines.
 *
 * @return {string}
 */
function formatMessageLog() {
	var formattedMsgs = [];
	for (var i = messageLog.length - 1; i >= 0; i--) {
		var lines = messageLog[i].split('\n');
		if (lines.length !== 0 && lines[0].length !== 0) {
			// Unshift lines, backwards, into result
			for (var j = lines.length - 1; j >= 0 ; j--) {
				// Add arrow only for first line of a message; add whitespace for others
				if (j == 0) {
					formattedMsgs.unshift('> ' + lines[j]);
				} else {
					formattedMsgs.unshift('  ' + lines[j]);
				}
			}
		} else {
			formattedMsgs.unshift('');
		}
	}
	// Turn array into a string, omitting earlier messages if there are more than the log size, and update formattedMessageLog
	formattedMessageLog = '';
	for (var i = formattedMsgs.length - messageLog.length; i < formattedMsgs.length; i++) {
		formattedMessageLog = formattedMessageLog.concat(formattedMsgs[i]) + '\n';
	}
	// Remove trailing \n
	if (formattedMessageLog[formattedMessageLog.length - 1] == '\n') {
		formattedMessageLog = formattedMessageLog.substring(0, formattedMessageLog.length - 1);
	}
}

function drawMessageLog() {
	setInfoStyle();
	print(formattedMessageLog, MESSAGE_X, MESSAGE_Y);
}

function drawGame() {
	eraseDisplay();
	drawInfoDisplay();
	drawMapDisplay();
	drawMessageLog();
	if (DEBUG_MSGS) {
		var debugInfo = '[ Vision: ' + currVisionRadius + '\n  Speed: ' + speed + '\n  Delay: ' + delay + ' ]';
		print(debugInfo, 800, 790);
	}
}

/**
 * Takes number seconds and returns it as a string of format _h_m_s.
 *
 * @param {number} seconds
 * @return {string}
 */
function formatTime(seconds) {
	var ret = '';
	var remaining = seconds;
	var hoursInSeconds = remaining % 3600;
	var hours = ((remaining - hoursInSeconds) / 3600);
	if (hours > 0) {
		ret += hours.toString() + 'h';
	}
	remaining = remaining % 3600;
	var minutesInSeconds = remaining % 60;
	var minutes = ((remaining - minutesInSeconds) / 60);
	if (minutes > 0 || hours > 0) {
		ret += minutes.toString() + 'm';
	}
	var seconds = (remaining % 60).toString();
	// Pad with 0 if seconds is only 1 digit and there are minutes
	if (minutes > 0 && seconds.length < 2) {
		seconds = '0' + seconds;
	}
	ret += seconds + 's';
	return ret;
}

/**
 * Takes a string label and string stat and returns them, padded them with spaces so that the colon lies in the centre.
 *
 * @param {string} label
 * @param {string} stat
 * @return {string}
 */
function formatStatisticLine(label, stat) {
	var labelSpacing = '';
	var statSpacing = '';
	while ((labelSpacing + label).length < stat.length) {
		labelSpacing += ' ';
	}
	while ((statSpacing + stat).length < label.length) {
		statSpacing += ' ';
	}
	return ' ' + labelSpacing + label + ': ' + stat + statSpacing;
}

function drawGameOver() {
	eraseDisplay();
	var screenDisplay = '';
	screenDisplay += '\n\n';
	screenDisplay += '\n'.repeat(playerRole.gameOverStatsQuantity);
	if (escaped) {
		screenDisplay += '+------------------+\n';
		screenDisplay += '| Congratulations! |\n';
		screenDisplay += '+------------------+\n';
		screenDisplay += '\nYou escaped with the golden apple!\n';
	}
	else {
		screenDisplay += '+-----------+\n';
		screenDisplay += '| GAME OVER |\n';
		screenDisplay += '+-----------+\n';
		var progress = 'You lost on floor ' + currLevel.levelNum.toString();
		if (hasGoldenApple) {
			progress += ' with the golden apple';
		}
		progress += '.';
		screenDisplay += '\n' + progress + '\n';
	}
	screenDisplay += '\n\n\n';
	screenDisplay += formatStatisticLine('Class', playerRole.name) + '\n';
	screenDisplay += formatStatisticLine('Length', (tailLength + 1).toString()) + '\n';
	screenDisplay += formatStatisticLine('Score', score.toString()) + '\n';
	if (escaped) {
		screenDisplay += formatStatisticLine('Remaining HP', health.toString()) + '\n';
	}
	screenDisplay += formatStatisticLine('Collisions', collisions.toString()) + '\n';
	screenDisplay += formatStatisticLine('Traps Triggered', trapsTriggered.toString()) + '\n';
	if (playerRole instanceof Fighter) {
		screenDisplay += formatStatisticLine('Damage Blocked', damageBlocked.toString()) + '\n';
	}

	var timeInSeconds = formatTime(Math.round((endTime - startTime) / 1000));
	screenDisplay += formatStatisticLine('Time', timeInSeconds) + '\n';
	screenDisplay += '\nPress enter to return to the menu.';
	setInfoStyle();

	var offsetY = escaped ? GAME_WIN_OFFSET_Y : GAME_LOSE_OFFSET_Y;
	print(screenDisplay, canvas.width / 2, canvas.height / 2  + offsetY, true, 'center');

	// Print Snake in centre
	var printedSnakeDisplay = '';
	// Calculate centre of the screen + half the length of the snake
	var xPos = canvas.width / 2 + ctx.measureText('O'.repeat(tailLength + 1)).width / 2;
	for (var i = 0; i < tailLength + 1; i++) {
		ctx.fillStyle = GRADIENT_COLOURS[i];
		print('O', xPos - ctx.measureText(printedSnakeDisplay).width, canvas.height / 2 + GAME_OVER_SNAKE_OFFSET_Y, true, 'center');
		printedSnakeDisplay += 'O';
	}
}


function draw()
{
	if (gameMode == GameMode.PLAYING) {
		drawGame();
	} else if (gameMode == GameMode.MENU) {
		drawMenu();
	} else if (gameMode == GameMode.CLASS_SELECT) {
		drawClassSelect();
	} else if (gameMode == GameMode.GAME_OVER) {
		drawGameOver();
	}
}

/**
 * Calls fillText to write given text at x, y of canvas.
 *
 * @param {string} text
 * @param {number} x
 * @param {number} y
 * @param {boolean} [centreVertical] - If true, centres text vertically, such that y is the vertical middle of the text.
 * @param {string} [align] - The optional alignment of the text. By default, the text starts at x, y.
 * @return {string}
 */
function print(text, x, y, centreVertical, align) {
	var lines = text.split('\n');
	if (align !== undefined) {
		ctx.textAlign = align;
	} else {
		ctx.textAlign = 'start';
	}
	var y_offset = 0;
	if (centreVertical !== undefined && centreVertical) {
		ctx.textBaseline = 'middle';
		// Remove half of first line's height from offset
		y_offset -= lineHeight / 2;
		// Add half the height of the text to the offset
		y_offset += (lines.length * lineHeight) / 2;
	} else {
		ctx.textBaseline = 'alphabetic';
	}
	for (var i = 0; i < lines.length; i++) {
		ctx.fillText(lines[i], x, y + (i * lineHeight) - y_offset);
	}
}