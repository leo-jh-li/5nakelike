var PlayerState = Object.freeze({'ACTIVE':1, 'IMMOBILE':2, 'CONSUMING_APPLE':3});
var playerState = PlayerState.ACTIVE;

var playerRole = roles[RoleType.FIGHTER];

var playerCoord = new Point(0, 0);
var health = playerRole.maxHp;
var shielded = false;
var mana = 0;
var currLevel; // The level the player is currently on
var playerDir = Direction.NO_DIRECTION; // Current direction of the player
var inputDir = Direction.NO_DIRECTION; 
var currVisionRadius = MAX_VISION_RADIUS;
var moveQueue = [];	// Queue of moves the player has input
var queueCap = 5;
var tail = []; // Array of Points representing the tail, ordered from furthest to closest Points
var tailLength = 0;

var score = 0;
var foodEaten = 0;
var hasGoldenApple = false;
var escaped = false;
var speed = START_SPEED;
var delay = START_DELAY;
var collisions = 0;
var trapsTriggered = 0;
var damageBlocked = 0;

/**
 * Adds given Direction dir to the move queue if it isn't at capacity.
 *
 * @param {Direction} dir
 * @return {number}
 */
function enqueueMove(dir) {
	if (moveQueue.length < queueCap) {
		moveQueue.push(dir);
	}
}

/**
 * Returns distance of the tail at p from the head, or null if there is no tail at p.
 *
 * @param {Point} p
 * @return {number}
 */
function getTailDistance(p) {
	for (var i = 1; i <= tailLength; i++) {
		// Start at end of array in case tail is not fully formed
		if (tail[tail.length - i].equals(p)) {
			return i;
		}
	}
	return null;
}

// Resets the list of tail entities and removes them from the current level.
function eraseTail() {
	tail.forEach(p => currLevel.tiles[p.x][p.y].body = Body.NO_BODY);
	tail = [];
}

function processLeaveLevel() {
	moveQueue = [];
	eraseTail();
}

/**
 * Returns the penalty to visibility on the given level.
 *
 * @param {number} levelNum
 * @return {number}
 */
function getVisionLoss(levelNum) {
	return Math.round((levelNum - 1) / 2);
}

/**
 * Returns the degree of visibility loss going to the given level from the previous one.
 *
 * @param {number} levelNum
 * @return {number}
 */
function getRelativeVisionLoss(levelNum) {
	if (levelNum == 0) {
		return 0;
	}
	return getVisionLoss(levelNum) - getVisionLoss(levelNum - 1);
}

function updateSpeed(levelNum) {
	if (!hasGoldenApple) {
		speed = START_SPEED - foodEaten;
		delay = START_DELAY + (DELAY_INCREMENT * foodEaten);
		if (playerRole instanceof Rogue) {
			// Rogue slows down for each decrease in visibility
			var visionLost = getVisionLoss(levelNum);
			speed -= visionLost;
			delay += playerRole.visionSlowDown * visionLost;
		}
	}
}

function eatFood(levelNum) {
	score += FOOD_POINTS;
	foodEaten++;
	tailLength++;
	updateSpeed(levelNum);
	playerRole.eatFoodEffects();
}

/**
 * Increases health by given value.
 *
 * @param {number} value
 */
function increaseHp(value) {
	health += value;
	health = clamp(health, 0, playerRole.maxHp);
}

/**
 * Decreases health by given value, or removes shield if there is one. Returns true if damage was taken, or false if it was shielded.
 *
 * @param {number} value
 * @return {number} value
 */
function takeDamage(value) {
	if (shielded) {
		shielded = false;
		damageBlocked += value;
		return false;
	} else {
		health -= value;
		health = clamp(health, 0, playerRole.maxHp);
		return true;
	}
}

/**
 * Increases mana by given value.
 *
 * @param {number} value
 */
function increaseMp(value) {
	mana += value;
	mana = clamp(mana, 0, MAX_MANA);
}

/**
 * Sets player vision radius based on given levelNum and whether they have the golden apple.
 *
 * @param {number} levelNum
 */
function updateVisionRadius(levelNum) {
	if (!hasGoldenApple) {
		// Lose 1 vision every two levels
		currVisionRadius = Math.max(MIN_VISION_RADIUS, MAX_VISION_RADIUS - getVisionLoss(levelNum));
		if (playerRole instanceof Rogue) {
			updateSpeed(levelNum);
		}
	}
}

function eatGoldenApple() {
	foodEaten++;
	tailLength++;
	hasGoldenApple = true;
	score *= GOLDEN_APPLE_SCORE_MULTIPLIER;
	speed = START_SPEED + GOLDEN_APPLE_SPEED_INCREMENT;
	delay = START_DELAY - DELAY_INCREMENT * GOLDEN_APPLE_SPEED_INCREMENT;
	pushMessage(EAT_GOLDEN_APPLE_MSG);
}

function setImmobile() {
	playerState = PlayerState.IMMOBILE;
}

function collide() {
	var dmgNotShielded = takeDamage(COLLISION_DAMAGE);
	collisions++;
	pushMessage(getDmgMsg(COLLIDE_MSGS, COLLISION_DAMAGE, !dmgNotShielded));
	eraseTail();
	playerDir = Direction.NO_DIRECTION;
	setImmobile();
	moveQueue.length = 0;
}

// Sets location of player to the currLevel's stairs of the given stairs type
function movePlayerToStairs(stairsType) {
	if (stairsType == Terrain.STAIRS_UP) {
		playerCoord = currLevel.stairsUp;
	} else if (stairsType == Terrain.STAIRS_DOWN) {
		playerCoord = currLevel.stairsDown;
	}
	currLevel.tiles[playerCoord.x][playerCoord.y].body = Body.HEAD;
}