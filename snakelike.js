var startTime = 0;
var endTime = 0

var GameMode = Object.freeze({'MENU':1, 'CLASS_SELECT':2, 'PLAYING':3, 'GAME_OVER':4, 'EXIT':5});
var gameMode = GameMode.MENU;

var canExit = false;

function setup() {
	calculateGradientColours();
}

// Set values to default for a new game
function reinitializeValues() {
	levelStorage.length = 0;
	generatedLevelsCount = 0;
	health = playerRole.maxHp;
	mana = 0;
	playerDir = Direction.NO_DIRECTION;
	currVisionRadius = MAX_VISION_RADIUS;
	moveQueue.length = 0;
	clearMessageLog();
	eraseTail();
	tailLength = 0;
	score = 0;
	foodEaten = 0;
	hasGoldenApple = false;
	escaped = false;
	speed = START_SPEED;
	delay = START_DELAY;
	collisions = 0;
	trapsTriggered = 0;
	damageBlocked = 0;
}

function startGame() {
	reinitializeValues();
	randomizeFoodDistribution();
	addNewLevel();
	currLevel = levelStorage[0];
	movePlayerToStairs(Terrain.STAIRS_UP);
	updatePlayerMap(currLevel, playerCoord, currVisionRadius);
	gameMode = GameMode.PLAYING;
	startTime = new Date().getTime();
	pushMessage(getLevelMsg(currLevel));
	currLevel.visited = true;
}

function endGame() {
	gameMode = GameMode.GAME_OVER;
	endTime = new Date().getTime();
}

function returnToMenu() {
	eraseDisplay();
	gameMode = GameMode.MENU;
	main();
}

// Checks if player has lost the game and ends the game if so.
function checkLoseGame() {
	if (health <= 0 && !DEBUG_INVINCIBLE) {
		endGame();
	}
}

// Updates particle at Point P and the tiles around it by marking this particle as finished and creating new particles in adjacent tiles.
function propagateParticle(p) {
	currLevel.tiles[p.x][p.y].particle = Particle.SPARKLE_FINISHED;
	for (var dir = Direction.UP; dir <= Direction.LEFT; dir++) {
		var neighbour = applyMovement(p, dir);
		if (checkWithinBounds(neighbour.x, neighbour.y) && currLevel.tiles[neighbour.x][neighbour.y].particle == Particle.NO_PARTICLE) {
			currLevel.tiles[neighbour.x][neighbour.y].particle = Particle.NEW_SPARKLE;
		}
	}
}

// Advances particles to next tick.
function particleBurstTick() {
		// Age all new particles
		for (var x = 0; x < HEIGHT; x++) {
			for (var y = 0; y < WIDTH; y++) {
				if (currLevel.tiles[x][y].particle == Particle.NEW_SPARKLE) {
					currLevel.tiles[x][y].particle = Particle.SPARKLE;
				}
			}
		}
		// Propagate all particles
		for (var x = 0; x < HEIGHT; x++) {
			for (var y = 0; y < WIDTH; y++) {
				if (currLevel.tiles[x][y].particle == Particle.SPARKLE) {
					propagateParticle(new Point(x, y));
				}
			}
		}
}

// Repeats particle burst ticks for PARTICLE_BURST_TICKS ticks, each tick PARTICLE_UPDATE_DELAY seconds apart.
function particleBurstLoop(ticksElapsed) {
	particleBurstTick();
	ticksElapsed++;
	// Increase vision radius alongside particle burst
	if (currVisionRadius < Math.min(ticksElapsed, MAX_VISION_RADIUS)) {
		currVisionRadius = Math.min(ticksElapsed, MAX_VISION_RADIUS);
		updatePlayerMap(currLevel, playerCoord, currVisionRadius);
	}
	draw();
	if (ticksElapsed < PARTICLE_BURST_TICKS) {
		setTimeout(function() {
			particleBurstLoop(ticksElapsed);
		}, PARTICLE_UPDATE_DELAY);
	}
}

// Starts a particle burst at given Point p.
function startParticleBurst(p) {
	// Place first particle
	currLevel.tiles[p.x][p.y].particle = Particle.NEW_SPARKLE;
	draw();
	setTimeout(function() {
		particleBurstLoop(0);
	}, PARTICLE_UPDATE_DELAY);
}

// Takes input
window.addEventListener('keydown', event => {
	// Prevent page scrolling
	if (event.key == 'ArrowUp' || event.key == 'ArrowLeft' || event.key == 'ArrowRight' || event.key == 'ArrowDown' || event.key == ' ') {
		event.preventDefault();
	}
	if (gameMode == GameMode.PLAYING) {
		var dir;
		var validButtonPressed = false;
		switch (event.key) {
			case 'ArrowUp':
			case 'W':
			case 'w':
				dir = Direction.UP;
				validButtonPressed = true;
				break;
			case 'ArrowLeft':
			case 'A':
			case 'a':
				dir = Direction.LEFT;
				validButtonPressed = true;
				break;
			case 'ArrowRight':
			case 'D':
			case 'd':
				dir = Direction.RIGHT;
				validButtonPressed = true;
				break;
			case 'ArrowDown':
			case 'S':
			case 's':
				dir = Direction.DOWN;
				validButtonPressed = true;
				break;
			case ' ':
				if (playerRole instanceof Wizard) {
					playerRole.tryCastSpell(currLevel);
				}
				break;
			case 'J':
			case 'j':
				if (DEBUG_BUTTONS) {
					// Jump to next level
					if (currLevel.levelNum == generatedLevelsCount) {
						if (currLevel.levelNum == NUM_OF_LEVELS - 1) {
							// Create the final level
							addLastLevel();
						}
						else {
							addNewLevel();
						}
					}
					changeLevel(currLevel.levelNum, Terrain.STAIRS_UP);
				}
				break;
			case 'V':
			case 'v':
				if (DEBUG_BUTTONS) {
					// Reveal current level
					for (var i = 0; i < HEIGHT; i++) {
						for (var j = 0; j < WIDTH; j++) {
							currLevel.tiles[i][j].visible = true;
						}
					}
				}
				break;
			case 'Escape':
				if (canExit) {
					returnToMenu();
				} else {
					// Open the "return to main menu" window for CAN_EXIT_WINDOW duration
					canExit = true;
					setTimeout(function() {
						canExit = false;
					}, CAN_EXIT_WINDOW);
				}

		}
		if (validButtonPressed && playerState == PlayerState.ACTIVE) {
			var dest = applyMovement(playerCoord, dir);
			enqueueMove(dir);
		}
	} else if (gameMode == GameMode.MENU) {
		// Press enter to start
		if (event.key == 'Enter') {
			gameMode = GameMode.CLASS_SELECT;
			main();
		}
	} else if (gameMode == GameMode.CLASS_SELECT) {
		if (event.key == '1' || event.key == '2' || event.key == '3') {
			playerRole = roles[parseInt(event.key)];
			gameMode = GameMode.PLAYING;
			main();
		} else if (event.key == '4') {
			// Set random class
			playerRole = roles[Math.floor(Math.random() * (roles.length - 1) + 1)];
			gameMode = GameMode.PLAYING;
			main();
		}
	} else if (gameMode == GameMode.GAME_OVER) {
		// Press enter to continue
		if (event.key == 'Enter') {
			returnToMenu();
		}
	}
});

/**
 * Pushes given messages to the messageLog.
 *
 * @param {string[]} msgs - Array of messages to push.
 */
function pushMessage(msgs) {
	if (!Array.isArray(msgs)) {
		msgs = [msgs];
	}
	// Move all messages up
	for (var i = 0; i < messageLog.length - msgs.length; i++) {
		// Move each message up by the number of new lines
		messageLog[i] = messageLog[i + msgs.length];
	}
	// Push new messages
	for (var i = 0; i < msgs.length; i++) {
		messageLog[messageLog.length - msgs.length + i] = msgs[i];
	}
	formatMessageLog();
}

function clearMessageLog() {
	for (var i = 0; i < messageLog.length; i++) {
		messageLog[i] = '';
	}
	formattedMessageLog = '';
}

/**
 * Changes the current level.
 *
 * @param {number} destLevelNum - levelNum of the level to change to.
 * @param {Terrain} stairs - The type of stairs to move the player to on the new level.
 */
function changeLevel(destLevelNum, stairs) {
	processLeaveLevel();
	currLevel = levelStorage[destLevelNum];
	pushMessage(getLevelMsg(currLevel));
	currLevel.visited = true;
	playerDir = Direction.NO_DIRECTION;
	updateVisionRadius(currLevel.levelNum);
	movePlayerToStairs(stairs);
	updatePlayerMap(currLevel, playerCoord, currVisionRadius);
	setImmobile();
}

function move() {
	// Move player up/down a floor if they're on stairs
	if (playerDir != Direction.NO_DIRECTION) {
		switch (currLevel.tiles[playerCoord.x][playerCoord.y].terrain) {
			case (Terrain.STAIRS_UP):
				if (currLevel.levelNum == 1) {
					if (hasGoldenApple) {
						score += VICTORY_POINTS;
						var maxScore = ((NUM_OF_LEVELS - 1) * FOOD_MIN + EXTRA_FOOD) * FOOD_POINTS * GOLDEN_APPLE_SCORE_MULTIPLIER + VICTORY_POINTS;
						if (score == maxScore && collisions == 0 && trapsTriggered == 0) {
							// Give bonus point if player has maximum score and didn't hit anything
							score += 1;
						}
						escaped = true;
						playerDir = Direction.NO_DIRECTION;
						endGame();
					}
					break;
				}
				// Move to previous level
				changeLevel(currLevel.levelNum - 2, Terrain.STAIRS_DOWN);
				break;
			case (Terrain.STAIRS_DOWN):
				if (currLevel.levelNum == NUM_OF_LEVELS) {
					break;
				}
				if (currLevel.levelNum == generatedLevelsCount) {
					if (currLevel.levelNum == NUM_OF_LEVELS - 1) {
						// Create the final level
						addLastLevel();
					}
					else {
						addNewLevel();
					}
				}
				// Move to the next level
				changeLevel(currLevel.levelNum, Terrain.STAIRS_UP);
				break;
		}
	}

	var move = Direction.NO_DIRECTION;
	// Pop command from queue, dumping commands that are the same direction as the player's current direction
	if (moveQueue.length > 0) {
		move = moveQueue.shift();
		while (moveQueue.length > 0 && move == playerDir) {
			move = moveQueue.shift();
		}
	}
	// If no valid command was popped, keep direction
	if (move == Direction.NO_DIRECTION && !DEBUG_MOVE_ON_PRESS) {
		move = playerDir;
	}
	// Update player direction
	var desiredDest = applyMovement(playerCoord, move);
	if (tail.length > 0) {
		// Disallow a player from moving backward, toward itself
		if (!desiredDest.equals(tail[tail.length-1])) {
			playerDir = move;
		}
	}
	else {
		playerDir = move;
	}
	if (playerDir == Direction.NO_DIRECTION) {
		return;
	}
	var dest = applyMovement(playerCoord, playerDir);
	var tailEnd = null;
	if (tail.length > 0 && tail.length == tailLength) {
		tailEnd = tail[0];
	}
	if (isTraversableTile(currLevel, dest, tailEnd)) {
		// If player has a tail, leave it behind
		if (tailLength > 0) {
			currLevel.tiles[playerCoord.x][playerCoord.y].body = Body.TAIL;
			tail.push(new Point(playerCoord.x, playerCoord.y));
			// Remove the last piece of the tail unless the player just ate
			// food or if the tail is not fully propgated, like when going
			// through stairs
			if (currLevel.tiles[dest.x][dest.y].entity != Entity.FOOD && tail.length - 1 == tailLength) {
				currLevel.tiles[tail[0].x][tail[0].y].body = Body.NO_BODY;
				if (tail.length > 0) {
					tail.shift();
				}
			}
		} else {
			// Empty the space the player left
			currLevel.tiles[playerCoord.x][playerCoord.y].body = Body.NO_BODY;
		}
		// Process contact with body
		switch (currLevel.tiles[dest.x][dest.y].body) {
			case (Body.TAIL):
				// Allow moving into your tail if it's the last piece
				if (!dest.equals(tail[0])) {
					collide();
					if (health <= 0 && !DEBUG_INVINCIBLE) {
						endGame();
					}
				}
				break;
		}
		// Process contact with entities
		switch (currLevel.tiles[dest.x][dest.y].entity) {
			case (Entity.FOOD):
				currLevel.tiles[dest.x][dest.y].entity = Entity.NO_ENTITY;
				currLevel.tiles[playerCoord.x][playerCoord.y].body = Body.TAIL;
				// Start the tail
				if (tailLength == 0) {
					tail.push(new Point(playerCoord.x, playerCoord.y));
				}
				eatFood(currLevel.levelNum);
				pushMessage(getRandMsg(EAT_MSGS));
				currLevel.removeFood(dest);
				break;
			case (Entity.GOLDEN_APPLE):
				eatGoldenApple();
				currLevel.tiles[dest.x][dest.y].entity = Entity.NO_ENTITY;
				playerCoord = applyMovement(playerCoord, playerDir);
				playerDir = Direction.NO_DIRECTION;
				playerState = PlayerState.CONSUMING_APPLE;
				break;
			case (Entity.POTION):
				if (health < playerRole.maxHp) {
					currLevel.tiles[dest.x][dest.y].entity = Entity.NO_ENTITY;
					currLevel.removePotion(dest);
					// Push potion drinking message based on health situation
					if (health <= CRITICAL_HP) {
						// When healing at low HP
						pushMessage(getHealMsg(POTION_LOW_HP_MSG, false));
					} else if (health + POTION_HEAL_VALUE >= playerRole.maxHp) {
						// Fully healed
						pushMessage(getHealMsg(POTION_HEAL_TO_FULL_MSGS, true));
					} else {
						// When healing at Moderate HP
						pushMessage(getHealMsg(POTION_MED_HP_MSGS, false));
					}
					increaseHp(POTION_HEAL_VALUE);
				} else {
					pushMessage(getRandMsg(POTION_FULL_HP_MSGS));
				}
				break;
			case (Entity.TRAP):
				currLevel.tiles[dest.x][dest.y].entity = Entity.NO_ENTITY;
				playerRole.setOffTrap();
				checkLoseGame();
				break;
		}
		currLevel.tiles[dest.x][dest.y].body = Body.HEAD;
		// Process movement
		playerCoord = applyMovement(playerCoord, playerDir);
		updatePlayerMap(currLevel, playerCoord, currVisionRadius);
	}
	else {
		collide();
		checkLoseGame();
	}
}

// Process one tick, or turn, of the game, and update the game display.
function processTick() {
	move();
	draw();
}

// Runs game for one tick and sets up the next tick.
function gameLoop() {
	if (gameMode == GameMode.PLAYING) {
		processTick();
		if (playerState == PlayerState.IMMOBILE) {
			setTimeout(function() {
				playerState = PlayerState.ACTIVE;
				gameLoop();
			}, IMMOBILIZE_DELAY);
		}
		else if (playerState == PlayerState.CONSUMING_APPLE) {
			startParticleBurst(playerCoord);
			setTimeout(function() {
				playerState = PlayerState.ACTIVE;
				gameLoop();
			}, PARTICLE_BURST_IMMOBILE_DURATION);
		}
		else {
			setTimeout(gameLoop, delay);
		}
	}
	
}

function main() {	
	if (gameMode == GameMode.PLAYING) {
		startGame();
		setTimeout(gameLoop, delay);
	} else {
		draw();
	}
}

setup();
if (DEBUG_SKIP_MENU) {
	gameMode = GameMode.PLAYING;
}
main();
