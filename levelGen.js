var FOOD_DISTRIBUTION = []; // Array holding quantity of food on each level

var generatedLevelsCount = 0;

var levelStorage = [NUM_OF_LEVELS]; // Array holding all generated levels

// Assigns EXTRA_FOOD to random levels
function randomizeFoodDistribution() {
	for (var i = 0; i < NUM_OF_LEVELS - 1; i++) {
		FOOD_DISTRIBUTION[i] = FOOD_MIN;
	}
	var foodToDistribute = EXTRA_FOOD;
	var attempts = 0;
	while (foodToDistribute > 0 && attempts < MAX_RAND_ATTEMPTS) {
		var levelIndex = Math.floor(Math.random() * NUM_OF_LEVELS);
		if (FOOD_DISTRIBUTION[levelIndex] < FOOD_MAX) {
			FOOD_DISTRIBUTION[levelIndex]++;
			foodToDistribute--;
		}
		attempts++;
	}
}

/**
 * Makes a vertical path between Point a and Point b on given level.
 *
 * @param {Level} level
 * @param {Point} a
 * @param {Point} b
 * @return {Point}
 */
function makeVerticalPath(level, a, b) {
	for (var i = Math.min(a.x, b.x); i <= Math.max(a.x, b.x); i++) {
		if (level.tiles[i][a.y].terrain == Terrain.WALL) {
			level.tiles[i][a.y].terrain = Terrain.FLOOR;
		}
	}
}

/**
 * Makes a horizontal path between Point a and Point b on given level.
 *
 * @param {Level} level
 * @param {Point} a
 * @param {Point} b 
 * @return {Point}
 */
function makeHorizontalPath(level, a, b) {
	for (var i = Math.min(a.y, b.y); i <= Math.max(a.y, b.y); i++) {
		if (level.tiles[a.x][i].terrain == Terrain.WALL) {
			level.tiles[a.x][i].terrain = Terrain.FLOOR;
		}
	}
}

/**
 * Creates a path, one tile wide, connecting Point a to Point corner and Point pathCorner to Point b.
 *
 * @param {Level} level
 * @param {Room} room
 * @return {Point}
 */
function connectPoints(level, a, b, pathCorner) {
	makeVerticalPath(level, (a.y == pathCorner.y) ? a : b, pathCorner);
	makeHorizontalPath(level, (a.x == pathCorner.x) ? a : b, pathCorner);
}

/**
 * Returns a Point representing a random tile in the given room.
 *
 * @param {Room} room
 * @return {Point}
 */
function getRandomTileInRoom(room) {
	var x = room.originPoint.x + Math.floor(Math.random() * room.height);
	var y = room.originPoint.y + Math.floor(Math.random() * room.width);
	return new Point(x, y);
}

/**
 * Returns a random point in a given room that lies on the room's edge.
 *
 * @param {Level} level
 * @param {Room} room
 * @return {Point}
 */
function getRandomEdgeFloorInRoom(level, room) {
	var i = 0;
	var p = new Point(0, 0);
	var attempts = 0;
	do {
		if (Math.random() < 0.5) {
			p.x = room.originPoint.x + Math.floor(Math.random() * room.height);
			p.y = (Math.random() < 0.5) ? room.originPoint.y : room.originPoint.y + (room.width - 1);
		}
		else {
			p.x = (Math.random() < 0.5) ? room.originPoint.x : room.originPoint.x + (room.height - 1);
			p.y = room.originPoint.y + Math.floor(Math.random() * room.width);
		}
		attempts++;
	} while (!isEmptyFloor(level, p) && attempts < MAX_RAND_ATTEMPTS);
	return p;
}

/**
 * Return true iff blocking the Floor at p will block p's bordering Floors from accessing each other or if it's adjacent to an item.
 *
 * @param {Level} level
 * @param {Point} p
 * @return {boolean}
 */
function vitalCrossroads(level, p) {
	// Vector of adjacent points that border p
	var neighbours = [];
	for (var dir = Direction.UP; dir <= Direction.LEFT; dir++) {
		var neighbour = applyMovement(p, dir);
		if (isSafeTile(level, neighbour)) {
			// p is vital if there are adjacent items
			if (!isItemlessFloor(level, neighbour)) {
				return true;
			}
			neighbours.push(neighbour);
		}
	}
	if (neighbours.length == 0) {
		// Case where p is surrounded by traps; doesn't happen to items if items are spawned first
		return false;
	}
	if (neighbours.length == 1) {
		return false;
	}
	if (neighbours.length == 2 || neighbours.length == 3) {
		var requiredFloors = [];
		for (var i = 0; i < neighbours.length; i++) {
			for (var j = 0; j < neighbours.length; j++) {
				if (i != j) {
					requiredFloors.push(new Point(neighbours[i].x, neighbours[j].y));
				}
			}
		}
		// Case where p might be in a 1 tile wide hallway - means this is a vital crossroads
		if (neighbours.length == 2) {
			if (neighbours[0].x == neighbours[1].x || neighbours[0].y == neighbours[1].y) {
				return true;
			}
		}
		for (var i = 0; i < requiredFloors.length; i++) {
			if (!isItemlessFloor(level, requiredFloors[i])) {
				return true;
			}
		}
		return false;
	}
	if (neighbours.length == 4) {
		var numDiagonalFloors = 0;
		for (var dir = Direction.NE; dir <= Direction.NW; dir++) {
			if (isItemlessFloor(level, applyMovement(p, dir))) {
				numDiagonalFloors++;
			}
		}
		return numDiagonalFloors < 3;
	}
	return true;
}

/**
 * Returns true iff the tile at Point p on Level level has Floor terrain, has no entity, and is not a part of a unique pathway in its immediate area.
 *
 * @param {Level} level
 * @param {Point} p
 * @return {boolean}
 */
function isNonVitalFloor(level, p) {
	return isEmptyFloor(level, p) && !vitalCrossroads(level, p);
}

/**
 * Returns the point of an Entity-less Floor tile in the given room that would not block nearby pathways if it had any obstructive terrain or entities on it.
 *
 * @param {Level} level
 * @param {Room} room
 * @return {Point}
 */
function getNonVitalFloor(level, room) {
	var i = 0;
	var p = new Point(0, 0);
	var attempts = 0;
	do {
		p = getRandomTileInRoom(room);
		attempts++;
	} while (!isNonVitalFloor(level, p) && attempts < MAX_RAND_ATTEMPTS);
	return p;
}

/**
 * Creates an arbitrary path, w tiles wide, from Point a to Point b on given level.
 *
 * @param {Level} level
 * @param {number} w
 * @param {Point} a
 * @param {Point} b
 * @return {Level}
 */
function generateCorridor(level, w, a, b) {
	if (a.equals(b)) {
		return;
	}

	// Place the corner of this path at one of the two points' "intersections" at random
	var pathCornerX = (Math.random() < 0.5) ? a.x : b.x;
	var pathCornerY = (pathCornerX == a.x) ? b.y : a.y;
	var pathCorner = new Point(pathCornerX, pathCornerY);

	// The widths of this path diagonally inwards and diagonally outwards of this path corner
	var extensionInwards = 0;
	var extensionOutwards = 0;
	connectPoints(level, a, b, pathCorner);
	w--;

	// Extend the width of this path
	while (w > 0) {
		// Randomly decide whether to extend the path on the inside or outside...
		var inwards = (Math.random() < 0.5) ? true : false;
		// ...unless one of the directions has been marked as invalid
		if (extensionInwards < 0) {
			inwards = false;
		}
		else if (extensionOutwards < 0) {
			inwards = true;
		}
		var currExtension = inwards ? ++extensionInwards : ++extensionOutwards;
		var newPathCornerX = relativeStep(pathCornerX, currExtension, (pathCornerX == a.x) ? b.x : a.x, inwards);
		var newPathCornerY = relativeStep(pathCornerY, currExtension, (pathCornerY == a.y) ? b.y : a.y, inwards);
		var newPointA = new Point(a.x, a.y);
		var newPointB = new Point(b.x, b.y);
		if (pathCornerX == a.x) {
			newPointA.x = relativeStep(a.x, currExtension, b.x, inwards);
			newPointB.y = relativeStep(b.y, currExtension, a.y, inwards);
		}
		else {
			newPointB.x = relativeStep(b.x, currExtension, a.x, inwards);
			newPointA.y = relativeStep(a.y, currExtension, b.y, inwards);
		}

		// Validate the prospective path
		var newCorner = new Point(newPathCornerX, newPathCornerY);
		if (checkWithinEdges(newCorner)) {
			connectPoints(level, newPointA, newPointB, newCorner);
			w--;
		}
		else {
			// Mark the corresponding direction as invalid for future path generation
			inwards ? extensionInwards = -1 : extensionOutwards = -1;
		}
		// Stop if this corridor can expand no more
		if (extensionInwards < 0 && extensionOutwards < 0) {
			break;
		}
	}
}

/**
 * Creates a corridor between two given rooms on given level.
 *
 * @param {Level} level
 * @param {Room} r1
 * @param {Room} r2
 * @return {Level}
 */
function createCorridorBetweenRooms(level, r1, r2) {
	// Get random points on the edges of the rooms
	var a = getRandomEdgeFloorInRoom(level, r1);
	var b = getRandomEdgeFloorInRoom(level, r2);
	var corridorWidthMeanChange = Math.round(getDifficultyPercent(level.levelNum) * HARD_CORRIDOR_WIDTH_MEAN_CHANGE);
	var corridorWidth = genNorm(CORRIDOR_WIDTH_MEAN + corridorWidthMeanChange, CORRIDOR_WIDTH_MAX_DEVIATION);
	corridorWidth = clamp(corridorWidth, CORRIDOR_WIDTH_MIN, CORRIDOR_WIDTH_MAX);
	generateCorridor(level, corridorWidth, a, b);
}

/**
 * Returns a random array of Points representing a configuration of traps.
 *
 * @param {Point} p
 * @return {Point[]}
 */
 function getRandomTrapConfig(p) {
 	var config = [p];
 	var configQuantity = 4;

 	// Pick random trap configuration
 	var configIndex = Math.floor(Math.random() * configQuantity);

 	switch (configIndex) {
 		// Single tile trap
 		case (0):
 			break;
 		// 1x2 or 2x1 trap
 		case (1):
 			// Randomly decide offset
 			var offset = Math.random() < 0.5 ? 1 : -1;
 			// Randomly offset x or y
 			if (Math.random() < 0.5) {
 				config.push(new Point(p.x + offset, p.y));
 			} else {
 				config.push(new Point(p.x, p.y + offset));
 			}
 			break;
 		// 2x2 trap
 		case (2):
 			// Pick random diagonal to be the opposite corner of this 2x2 trap
 			var randDiag = Math.floor(Math.random() * (Direction.NW - Direction.NE + 1) + Direction.NE);
			var oppositeCorner = applyMovement(p, randDiag);
			config.push(oppositeCorner);
			// Add the two other corners
			config.push(new Point(p.x, relativeStep(p.y, 1, oppositeCorner.y, true)));
			config.push(new Point(relativeStep(p.x, 1, oppositeCorner.x, true), p.y));
 			break;
 		// 3 tile L-shaped trap
 		case (3):
 			// Pick random diagonal direction to extend toward
 			var randDiag = Math.floor(Math.random() * (Direction.NW - Direction.NE + 1) + Direction.NE);
			var oppositeCorner = applyMovement(p, randDiag);
			// Extend the trap
			config.push(new Point(p.x, relativeStep(p.y, 1, oppositeCorner.y, true)));
			config.push(new Point(relativeStep(p.x, 1, oppositeCorner.x, true), p.y));
 			break;
 	}
 	return config;
 }

/**
 * Takes a new level and carves rooms and paths into it.
 *
 * @param {Level} level
 * @return {Level}
 */
function generateLevel(level) {
	// Create rooms
	var difficultyPercent = getDifficultyPercent(level.levelNum);
	var border = Math.max(1, Math.round(difficultyPercent * HARD_BORDER_WIDTH));
	var dimensionChange = Math.round(difficultyPercent * HARD_ROOM_DIMENSION_MEAN_CHANGE);
	var roomQuantityChange = Math.round(difficultyPercent * HARD_ROOM_QUANTITY_CHANGE);
	var roomsToGenerate = genNorm(ROOM_QUANTITY_MEAN + roomQuantityChange, ROOM_QUANTITY_MAX_DEVIATION);
	roomsToGenerate = Math.max(roomsToGenerate, ROOM_QUANTITY_MIN);
	var currRoomCount = 0;
	var x = 0;
	var y = 0;
	var height;
	var width;
	var prevRoom = null;
	var rooms = [];
	while (currRoomCount < roomsToGenerate) {
		// Choose the upper left corner for this room
		x = Math.floor(Math.random() * (HEIGHT - 1 - border * 2) + border);
		y = Math.floor(Math.random() * (WIDTH - 1 - border * 2) + border);
		height = genNorm(ROOM_DIMENSION_MEAN + dimensionChange, ROOM_DIMENSION_MAX_DEVIATION);
		width = genNorm(ROOM_DIMENSION_MEAN + dimensionChange, ROOM_DIMENSION_MAX_DEVIATION);
		height = clamp(height, ROOM_DIMENSION_MIN, ROOM_DIMENSION_MAX);
		width = clamp(width, ROOM_DIMENSION_MIN, ROOM_DIMENSION_MAX);

		// Discard this room if it crosses the boundaries
		if (!checkWithinEdges(new Point(x + height, y + width))) {
			continue;
		}

		// Create the room and place its floors onto this level
		for (var i = x; i < x + height; i++) {
			for (var j = y; j < y + width; j++) {
				if (level.tiles[i][j].terrain == Terrain.WALL) {
					level.tiles[i][j].terrain = Terrain.FLOOR;
				}
			}
		}
		rooms.push(new Room(new Point(x, y), width, height));

		// Create a corridor connecting this room to the previous room generated, if there is one
		if (rooms.length > 1) {
			createCorridorBetweenRooms(level, rooms[currRoomCount], rooms[currRoomCount - 1]);
		}
		prevRoom = new Room(new Point(x, y), width, height);
		currRoomCount++;
	}
	// Create more corridors on more difficult floors
	if (difficultyPercent > 0) {
		// Connect the final room to the first room
		createCorridorBetweenRooms(level, rooms[rooms.length - 1], rooms[0]);
		// Connect the final room to a random room that's not the first one
		createCorridorBetweenRooms(level, rooms[rooms.length - 1], rooms[Math.floor(Math.random() * (rooms.length - 2) + 1)]);
		// Connect the first room to a random room that's not the first one
		createCorridorBetweenRooms(level, rooms[0], rooms[Math.floor(Math.random() * (rooms.length - 2) + 1)]);
	}
	// Spawn potions in random rooms
	var potionsToSpawn = (Math.random() < POTION_SPAWN_CHANCE) ? 1 : 0;
	var potionsSpawned = 0;
	while (potionsSpawned < potionsToSpawn) {
		var potionPoint = getNonVitalFloor(level, rooms[Math.floor(Math.random() * rooms.length)]);
		level.tiles[potionPoint.x][potionPoint.y].entity = Entity.POTION;
		level.potions.push(new Point(potionPoint.x, potionPoint.y));
		potionsSpawned++;
	}
	// Pick random room to place the up stairs in
	var upRoomIndex = Math.floor(Math.random() * rooms.length);
	// Choose random tile for up stairs
	var stairs = getNonVitalFloor(level, rooms[upRoomIndex]);
	level.tiles[stairs.x][stairs.y].terrain = Terrain.STAIRS_UP;
	level.stairsUp = new Point(stairs.x, stairs.y);
	// Find random tile for down stairs, repeating until the two sets of stairs are at least MIN_STAIRS_DIST apart
	var attempts = 0;
	while (Math.sqrt(Math.pow(stairs.x - level.stairsUp.x, 2) + Math.pow(stairs.y - level.stairsUp.y, 2)) < MIN_STAIRS_DIST && attempts < MAX_RAND_ATTEMPTS) {
		stairs = getNonVitalFloor(level, rooms[Math.floor(Math.random() * rooms.length)]);
		attempts++;
	}
	level.tiles[stairs.x][stairs.y].terrain = Terrain.STAIRS_DOWN;
	level.stairsDown = new Point(stairs.x, stairs.y);
	
	// Place food
	var foodToPlace = FOOD_DISTRIBUTION[level.levelNum - 1];
	attempts = 0;
	while (foodToPlace > 0 && attempts < MAX_RAND_ATTEMPTS) {
		var foodPoint = getNonVitalFloor(level, rooms[Math.floor(Math.random() * rooms.length)]);
		if (isNonVitalFloor(level, foodPoint)) {
			level.tiles[foodPoint.x][foodPoint.y].entity = Entity.FOOD;
			level.food.push(new Point(foodPoint.x, foodPoint.y));
			foodToPlace--;
		}
		attempts++;
	}

	// Place traps
	var trapSetsToPlace = Math.floor(Math.random() * MAX_TRAPS);
	attempts = 0;
	while (trapSetsToPlace > 0 && attempts < MAX_RAND_ATTEMPTS) {
		var trapPoint = getNonVitalFloor(level, rooms[Math.floor(Math.random() * rooms.length)]);
		// Get a random configuration of traps and place as many parts of it on the map as possible
		var trapConfig = getRandomTrapConfig(trapPoint);

		for (var i = 0; i < trapConfig.length; i++) {
			if (isNonVitalFloor(level, trapConfig[i])) {
				level.tiles[trapConfig[i].x][trapConfig[i].y].entity = Entity.TRAP;
			}
		}
		trapSetsToPlace--;
		attempts++;
	}
}

// Creates a new level and moves the player to its (up) stairs
function addNewLevel() {
	var newLevel = new Level(++generatedLevelsCount);
	generateLevel(newLevel);
	levelStorage[generatedLevelsCount - 1] = newLevel;
}

function addLastLevel() {
	var newLevel = new Level(++generatedLevelsCount);
	
	// Create central room
	var finalRoomWidth = WIDTH - FINAL_ROOM_DIST_FROM_SIDES*2;
	for (var i = FINAL_ROOM_DIST_FROM_TOP; i < FINAL_ROOM_DIST_FROM_TOP + FINAL_ROOM_HEIGHT; i++) {
		for (var j = FINAL_ROOM_DIST_FROM_SIDES; j < FINAL_ROOM_DIST_FROM_SIDES + finalRoomWidth; j++) {
			if (newLevel.tiles[i][j].terrain == Terrain.WALL) {
				newLevel.tiles[i][j].terrain = Terrain.FLOOR;
			}
		}
	}
	var roomCentreY = FINAL_ROOM_DIST_FROM_SIDES + Math.floor(finalRoomWidth / 2);
	// Create corridor to that room
	for (var i = HEIGHT - finalRoomWidth - FINAL_ROOM_DIST_FROM_TOP; i < HEIGHT - FINAL_CORRIDOR_DIST_FROM_BOTTOM; i++) {
		for (var j = roomCentreY - Math.floor(FINAL_CORRIDOR_WIDTH / 2); j < roomCentreY + FINAL_CORRIDOR_WIDTH - 1; j++) {
			if (newLevel.tiles[i][j].terrain == Terrain.WALL) {
				newLevel.tiles[i][j].terrain = Terrain.FLOOR;
			}
		}
	}
	// Place stairs up in centre of corridor
	var stairsX = HEIGHT - FINAL_CORRIDOR_DIST_FROM_BOTTOM - 1;
	var stairsY = roomCentreY - Math.floor(FINAL_CORRIDOR_WIDTH / 2) + 1;
	newLevel.tiles[stairsX][stairsY].terrain = Terrain.STAIRS_UP;
	newLevel.stairsUp = new Point(stairsX, stairsY);
	// Place golden apple
	var goldAppleX = FINAL_ROOM_DIST_FROM_TOP + Math.floor(FINAL_ROOM_HEIGHT / 2);
	newLevel.tiles[goldAppleX][stairsY].entity = Entity.GOLDEN_APPLE;
	// Add glow effect around golden apple
	projectVisionLinesFromPoint(newLevel, new Point(goldAppleX, stairsY), GOLDEN_APPLE_GLOW_RADIUS);
	levelStorage[generatedLevelsCount - 1] = newLevel;
}