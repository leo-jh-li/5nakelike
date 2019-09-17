var Terrain = Object.freeze({'UNKNOWN':1, 'FLOOR':2, 'WALL':3, 'STAIRS_UP':4, 'STAIRS_DOWN':5});
var Entity = Object.freeze({'NO_ENTITY':1, 'FOOD':2, 'GOLDEN_APPLE':3, 'POTION':4, 'TRAP':5});
var Body = Object.freeze({'NO_BODY':1, 'HEAD':2, 'TAIL':3});
var Particle = Object.freeze({'NO_PARTICLE':1, 'NEW_SPARKLE':2, 'SPARKLE':3, 'SPARKLE_FINISHED':4});

// Information of each symbol as they appear on the map
var symbols = {
	'terrain': [{'symbol':'X', 'colour':null}, {'symbol':' ', 'colour':null}, {'symbol':'.', 'colour':null}, {'symbol':'#', 'colour':null}, {'symbol':'H', 'colour':BROWN}, {'symbol':'V', 'colour':BROWN}],
	'entity': [{'symbol':'X', 'colour':null}, {'symbol':' ', 'colour':null}, {'symbol':'@', 'colour':RED}, {'symbol':'@', 'colour':GOLD}, {'symbol':'%', 'colour':PURPLE}, {'symbol':'x', 'colour':null}],
	'body': [{'symbol':'X', 'colour':null}, {'symbol':' ', 'colour':null}, {'symbol':'O', 'colour':BRIGHTEST_GREEN}, {'symbol':'O', 'colour':null}],
	'particle': [{'symbol':'X', 'colour':null}, {'symbol':' ', 'colour':null}, {'symbol':'*', 'colour':GOLD}, {'symbol':'*', 'colour':GOLD}, {'symbol':' ', 'colour':null}]
};

var Direction = Object.freeze({'NO_DIRECTION':1, 'UP':2, 'RIGHT':3, 'DOWN':4, 'LEFT':5, 'NE':6, 'SE':7, 'SW':8, 'NW':9});

class Point {
	constructor(x, y) {
		this.x = x;
		this.y = y;
	}
	equals(other) {
		return this.x == other.x && this.y == other.y;
	}
}

class Room {
	constructor(originPoint, w, h) {
		this.originPoint = originPoint;
		this.width = w;
		this.height = h;
	}
}

class Tile {
	constructor(terrain, entity, body, visible, particle) {
		this.terrain = terrain;
		this.entity = entity;
		this.body = body;
		this.visible = visible;
		this.particle = particle;
	}
}

class Level {
	constructor(levelNum) {
		this.tiles = [HEIGHT];
		for (var i = 0; i < HEIGHT; i++) {
			this.tiles[i] = [WIDTH];
			for (var j = 0; j < WIDTH; j++) {
				this.tiles[i][j] = new Tile(Terrain.WALL, Entity.NO_ENTITY, Body.NO_BODY, DEBUG_VISION, Particle.NO_PARTICLE);
			}
		}
		this.levelNum = levelNum;
		this.stairsUp = new Point(1, 1);
		this.stairsDown = new Point(1, 1);
		this.food = []; // Array of Points specifying locations of food
		this.potions = []; // Array of Points specifying locations of potions
		this.visited = false;
	}
	removeFood(p) {
		for(var i = 0; i < this.food.length; i++) {
			if (this.food[i].equals(p)) {
				this.food.splice(i, 1);
			}
		}
	}
	removePotion(p) {
		for(var i = 0; i < this.potions.length; i++) {
			if (this.potions[i].equals(p)) {
				this.potions.splice(i, 1);
			}
		}
	}
}

/**
 * Returns true iff the point as specified by given x and y lies within the level's boundaries.
 *
 * @param {Point} p
 * @return {boolean}
 */
function checkWithinBounds(x, y) {
	return x >= 0 && x < HEIGHT && y >= 0 && y < WIDTH;
}

/**
 * Returns true iff the given point lies within the outer edges of the level.
 *
 * @param {Point} p
 * @return {boolean}
 */
function checkWithinEdges(p) {
	return p.x > 0 && p.x < HEIGHT - 1 && p.y > 0 && p.y < WIDTH - 1;
}

/**
 * Returns true iff the tile at p is of terrain type Floor and has no Entity on it.
 *
 * @param {Level} level
 * @param {Point} p
 * @return {boolean}
 */
function isEmptyFloor(level, p) {
	if (!checkWithinBounds(p.x, p.y)) {
		return false;
	}
	return level.tiles[p.x][p.y].terrain == Terrain.FLOOR && level.tiles[p.x][p.y].entity == Entity.NO_ENTITY;
}

/**
 * Returns true iff the tile at p is of terrain type Floor and has no items (food and potions) on it.
 *
 * @param {Level} level
 * @param {Point} p
 * @return {boolean}
 */
function isItemlessFloor(level, p) {
	if (!checkWithinBounds(p.x, p.y)) {
		return false;
	}
	return level.tiles[p.x][p.y].terrain == Terrain.FLOOR && level.tiles[p.x][p.y].entity != Entity.FOOD && level.tiles[p.x][p.y].entity != Entity.POTION;
}

/**
 * Returns true iff the terrain type at point p on the given level is traversable.
 *
 * @param {Level} level
 * @param {Point} p
 * @return {boolean}
 */
function isTraversableTerrain(level, p) {
	if (!checkWithinBounds(p.x, p.y)) {
		return false;
	}
	var terrainType = level.tiles[p.x][p.y].terrain;
	var traversableTerrain = terrainType == Terrain.FLOOR || terrainType == Terrain.STAIRS_UP || terrainType == Terrain.STAIRS_DOWN;
	return traversableTerrain;
}

/**
 * Returns true iff the tile at point p on the given level is traversable.
 *
 * @param {Level} level
 * @param {Point} p
 * @param {Point} tailEnd
 * @return {boolean}
 */
function isTraversableTile(level, p, tailEnd) {
	var traversableTerrain = isTraversableTerrain(level, p);
	var enterableEntity = level.tiles[p.x][p.y].body != Body.TAIL;
	if (tailEnd) {
		enterableEntity |= tailEnd.equals(new Point(p.x, p.y));
	}
	return traversableTerrain && enterableEntity;
}

/**
 * Returns true iff the terrain at tile p is traversable and has no trap entity.
 *
 * @param {Level} level
 * @param {Point} p
 * @return {boolean}
 */
function isSafeTile(level, p) {
	var traversableTerrain = isTraversableTerrain(level, p);
	var noTrap = level.tiles[p.x][p.y].entity != Entity.TRAP;
	return traversableTerrain && noTrap;
}

/**
 * Returns given point p after applying movement in the direction specified by given Direction dir.
 *
 * @param {Point} p
 * @param {Direction} dir
 * @return {Point}
 */
function applyMovement(p, dir) {
	var applied = new Point(p.x, p.y);
	if (dir == Direction.UP) {
		applied.x -= 1;
	}
	else if (dir == Direction.DOWN) {
		applied.x += 1;
	}
	else if (dir == Direction.LEFT) {
		applied.y -= 1;
	}
	else if (dir == Direction.RIGHT) {
		applied.y += 1;
	}
	else if (dir == Direction.NE) {
		applied.x -= 1;
		applied.y += 1;
	}
	else if (dir == Direction.SE) {
		applied.x += 1;
		applied.y += 1;
	}
	else if (dir == Direction.SW) {
		applied.x += 1;
		applied.y -= 1;
	}
	else if (dir == Direction.NW) {
		applied.x -= 1;
		applied.y -= 1;
	}
	return applied;
}

/**
 * If toward is true, returns num, n closer to dest. Otherwise, returns num, n farther away from dest.
 *
 * @param {number} num
 * @param {number} n
 * @param {number} dest
 * @param {toward} bool
 * @return {number}
 */
function relativeStep(num, n, dest, toward) {
	if (toward) {
		if (num == dest) {
			return num;
		}
		return (num < dest) ? num + n : num - n;
	}
	else {
		return (num < dest) ? num - n : num + n;
	}
}

/**
 * Reveals a valid set of coordinates and returns true iff vision projection should continue through this tile.
 *
 * @param {Level} level
 * @param {Point} origin
 * @param {Point} p
 * @return {boolean}
 */
function attemptTileReveal(level, origin, p) {
	// Don't let vision pass between diagonal walls (unless this tile is a wall)
	if (level.tiles[p.x][p.y].terrain != Terrain.WALL) {
		var xTowardsOrigin = relativeStep(p.x, 1, origin.x, true);
		var yTowardsOrigin = relativeStep(p.y, 1, origin.y, true);
		if (level.tiles[xTowardsOrigin][p.y].terrain == Terrain.WALL && level.tiles[p.x][yTowardsOrigin].terrain == Terrain.WALL) {
			return false;
		}
	}
	level.tiles[p.x][p.y].visible = true;
	if (level.tiles[p.x][p.y].terrain == Terrain.WALL) {
		return false;
	}
	return true;
}

/**
 * Reveals tiles in player's vision on given level from given Point origin to given Point point.
 *
 * @param {Level} level
 * @param {Point} origin
 * @param {Point} p
 */
function projectVisionLine(level, origin, p) {
	var width = p.y - origin.y;
	var height = p.x - origin.x;
	var slope = 0;
	var longerSide = 0;
	var horiFlip = 1;
	var vertFlip = 1;
	var widthLonger = Math.abs(width) >= Math.abs(height);
	if (widthLonger) {
		longerSide = Math.abs(width);
		slope = Math.abs(height / width);
	}
	else {
		longerSide = Math.abs(height);
		slope = Math.abs(width / height);
	}
	if (width < 0) {
		vertFlip = -1;
	}
	if (height > 0) {
		horiFlip = -1;
	}
	var currX = origin.x;
	var currY = origin.y;
	for (var i = 0; i < longerSide; i++) {
		if (widthLonger) {
			currX -= slope * horiFlip;
			currY += vertFlip;
		}
		else {
			currX -= horiFlip;
			currY += slope * vertFlip;

		}
		if (checkWithinBounds(Math.round(currX), Math.round(currY))) {
			if (!attemptTileReveal(level, origin, new Point(Math.round(currX), Math.round(currY)))) {
				break;
			}
		}
	}
}

/**
 * Reveals tiles in player's vision with visionRadius range in all directions.
 *
 * @param {Level} level
 * @param {Point} origin
 * @param {number} visionRadius
 */
function projectVisionLinesFromPoint(level, origin, visionRadius) {
	level.tiles[origin.x][origin.y].visible = true;
	for (var i = -visionRadius; i <= visionRadius; i++) {
		for (var j = -visionRadius; j <= visionRadius; j++) {
			if (Math.abs(i) + Math.abs(j) <= visionRadius) {
				if (checkWithinBounds(origin.x + i, origin.y + j) && !(level.tiles[origin.x + i][origin.y + j].visible)) {
					projectVisionLine(level, origin, new Point(origin.x + i, origin.y + j));
				}
			}
		}
	}
}

/**
 * Adds tiles to player's visible map as appropriate.
 *
 * @param {Level} level
 * @param {Point} origin
 * @param {number} visionRadius
 */
function updatePlayerMap(level, origin, visionRadius) {
	projectVisionLinesFromPoint(level, origin, visionRadius);
}

/**
 * Returns the percentage that difficulty should be increased given the level number.
 * Difficulty begins increasing from floors 11 up to 19.
 *
 * @param {number} levelNum
 * @return {number}
 */
function getDifficultyPercent(levelNum) {
	if (HARD_LEVEL_START < levelNum && levelNum < HARD_LEVEL_END) {
		return (levelNum - HARD_LEVEL_START) / (HARD_LEVEL_END - HARD_LEVEL_START);
	}
	return 0;
}