const VERSION = '1.0.0';
// Debugging variables
const DEBUG_BUTTONS = false;
const DEBUG_VISION = false;
const DEBUG_MSGS = false;
const DEBUG_INVINCIBLE = false;
const DEBUG_SKIP_MENU = false;
const DEBUG_MOVE_ON_PRESS = false; // If true, player moves only on keypress

const NUM_OF_LEVELS = 20;
const WIDTH = 49;
const HEIGHT = 49;

const ROOM_DIMENSION_MIN = 2;
const ROOM_DIMENSION_MEAN = 8;
const ROOM_DIMENSION_MAX = 10;
const ROOM_DIMENSION_MAX_DEVIATION = 4;

const ROOM_QUANTITY_MIN = 3;
const ROOM_QUANTITY_MEAN = 9;
const ROOM_QUANTITY_MAX_DEVIATION = 6;

const CORRIDOR_WIDTH_MIN = 1;
const CORRIDOR_WIDTH_MEAN = 3;
const CORRIDOR_WIDTH_MAX = 4;
const CORRIDOR_WIDTH_MAX_DEVIATION = 2;

const MIN_STAIRS_DIST = 20;	// The minimum distance apart that a level's two sets of stairs must be

const RAND_NORM_QUANTITY = 3;	// Number of summed random values used in randNorm()

// Values for increasing difficulty
const HARD_LEVEL_START = NUM_OF_LEVELS / 2;
const HARD_LEVEL_END = NUM_OF_LEVELS - 1;
const HARD_BORDER_WIDTH = 3;
const HARD_ROOM_QUANTITY_CHANGE = 3;
const HARD_ROOM_DIMENSION_MEAN_CHANGE = -4;
const HARD_CORRIDOR_WIDTH_MEAN_CHANGE = -2;

// Values for the bottom-most level
const FINAL_ROOM_DIST_FROM_TOP = 8;
const FINAL_ROOM_DIST_FROM_SIDES = 15;
const FINAL_ROOM_HEIGHT = 19;
const FINAL_CORRIDOR_DIST_FROM_BOTTOM = 3;
const FINAL_CORRIDOR_WIDTH = 3;
const GOLDEN_APPLE_GLOW_RADIUS = 5;
const GOLDEN_APPLE_SCORE_MULTIPLIER = 2;
const GOLDEN_APPLE_SPEED_INCREMENT = 10;

const FOOD_MIN = 1;
const FOOD_MAX = 3;
const EXTRA_FOOD = 6;
const MAX_LENGTH = NUM_OF_LEVELS * FOOD_MIN + EXTRA_FOOD + 1;
const POTION_HEAL_VALUE = 3;
const POTION_SPAWN_CHANCE = 0.15;
const MAX_TRAPS = 4;
const DELAY_INCREMENT = 2;
const START_SPEED = 30;
const START_DELAY = 50;
const IMMOBILIZE_DELAY = 300;
const PARTICLE_UPDATE_DELAY = 5;
const PARTICLE_BURST_TICKS = 80;
const PARTICLE_BURST_IMMOBILE_DURATION = 2000;

const MAX_MANA = 10;
const HP_BAR_CHUNK_SIZE = 3;
const MP_BAR_CHUNK_SIZE = 5;
const MAX_VISION_RADIUS = 15;
const MIN_VISION_RADIUS = 5;
const SPELL_REVEAL_RADIUS = 2;
const COLLISION_DAMAGE = 1;
const TRAP_DAMAGE = 2;

const MAX_RAND_ATTEMPTS = 100;

const FOOD_POINTS = 100;
const VICTORY_POINTS = 5000;

// UI values
const MENU_OFFSET_Y = -32;
const LEFT_MARGIN = 15;
const TOP_PANEL_MARGIN_Y = 3;
const UI_LINE_HEIGHT = 24;
// Right panel
const RIGHT_PANEL_WIDTH = 400;
const RIGHT_PANEL_OFFSET_X = -45;
const LEGEND_HEADER_OFFSET_X = RIGHT_PANEL_OFFSET_X + 55;
const LEGEND_HEADER_OFFSET_Y = -144;
const LEGEND_ICON_OFFSET_X = -10;
const LEGEND_LABEL_OFFSET_X = 15;
// Top panel
const TOP_UI_HEIGHT = TOP_PANEL_MARGIN_Y * 2 + UI_LINE_HEIGHT * 3;
const LEFT_UI_LABEL_X = LEFT_MARGIN + 55;
const LEFT_UI_MARGIN = 15;
const RIGHT_UI_LABEL_X = 626;
const RIGHT_UI_MARGIN = 60;
// Map display
const MAP_X_MARGIN = LEFT_MARGIN + 0;
const TILE_LINE_HEIGHT = 11;
// Message log
const MESSAGE_X = LEFT_MARGIN + 0;
const MESSAGE_Y = 790;
// Game over screen
const GAME_WIN_OFFSET_Y = -56;
const GAME_LOSE_OFFSET_Y = -68;
const GAME_OVER_SNAKE_OFFSET_Y = GAME_LOSE_OFFSET_Y - 10;

// Colours
const DEFAULT_COLOUR = '#bebebe';
const RED = '#bd0d0d';
const GOLD = 'gold';
const BROWN = '#c47410';
const PURPLE = '#9a26ed';
const GREY = '#454545';
const HP_COLOUR = 'PaleGreen';
const SHIELD_COLOUR = 'Orange';
const MP_COLOUR = 'LightSkyBlue';
const BRIGHTEST_GREEN = '#31d90f';
const DARKEST_GREEN = '#166107';
// Gradient colours going from BRIGHTEST_GREEN to DARKEST_GREEN
var GRADIENT_COLOURS = [];