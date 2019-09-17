// Messages
const FLR_MSGS = [{level: 1, msg: 'You hungrily enter the caves.'},
				  {level: 4, msg: 'It\'s a gradual but unmistakable change: the light dwindles\nwith each ladder you slither down...'},
				  {level: 8, msg: 'The shadows continue to creep closer.'},
				  {level: 12, msg: 'The tunnels are starting to feel more cramped...'},
				  {level: 16, msg: 'The darkness grows oppressive, and the winding passages\ndizzying. Your journey\'s end must be drawing near.'},
				  {level: 20, msg: 'A curious object glows in the distance. Could it be?'}];
const EAT_GOLDEN_APPLE_MSG = 'It\'s delicious! As you eat it, the golden apple invigorates\n' + 
							 'you and your body begins to emit a warm, bright light.';
const HIGH_FOOD_THRESHOLD = FOOD_MAX;
const HIGH_FOOD_MSG = 'The aroma of food fills the air.';
const EAT_MSGS = ['Yum!', 'Tasssty!', 'Mmm!'];
const CRITICAL_HP = 3;
const POTION_LOW_HP_MSG = ['I needed that.', 'I feel much better.'];
const POTION_MED_HP_MSGS = ['A little pick-me-up.', '*gulp gulp*', '*chug chug*'];
const POTION_HEAL_TO_FULL_MSGS = ['Good as new.'];
const POTION_FULL_HP_MSGS = ['There\'s a potion here, but I don\'t need it.'];
const COLLIDE_MSGS = ['Ouch!', 'Ow!', 'Oof!'];
const TRIGGER_TRAP_MSGS = ['Ouch, a trap!', 'Ow, a trap...', 'Ugh, a trap...'];
const CAST_SPELL_MSGS = ['Fwash! Items revealed!', 'Fwsh! Items revealed!', 'Fwoosh! Items revealed!'];
const NO_ITEMS_REVEALED_MSG = 'Fzzt... You don\'t sense any items on this floor...';


function getLevelMsg(level) {
	var msg = [];
	// Push level number unless the player is entering level 1 for the first time
	if (!(level.levelNum == 1 && !level.visited)) {
		msg.push('You slither onto floor ' + level.levelNum + '.');
	}
	if (!level.visited) {
		for (var i = 0; i < FLR_MSGS.length; i++) {
			if (level.levelNum == FLR_MSGS[i].level) {
				msg.push(FLR_MSGS[i].msg);
				break;
			} else if (level.levelNum < FLR_MSGS[i].level) {
				break;
			}
		}
	}
	// For high levels of food
	if (level.food.length >= HIGH_FOOD_THRESHOLD) {
		msg.push(HIGH_FOOD_MSG);
	}
	return msg;
}

function getRandMsg(msgSet) {
	var randIndex = Math.floor(Math.random() * msgSet.length);
	return msgSet[randIndex];
}

/**
 * Returns a random message from the given message set along with how much damage was taken.
 *
 * @param {string[]} msgSet
 * @param {number} dmg
 * @param {boolean} dmgNegated - Whether this damage was blocked.
 * @return {string}
 */
function getDmgMsg(msgSet, dmg, dmgNegated) {
	var msg = '';
	if (dmgNegated) {
		msg += 'Damage blocked!';
	} else {
		var randIndex = Math.floor(Math.random() * msgSet.length);
		msg += msgSet[randIndex] + ' (-' + dmg + ' HP)';
	}
	return msg;
}

/**
 * Returns a random message from the given message set along with how much HP was healed.
 *
 * @param {string[]} msgSet
 * @param {boolean} fullyHealed - Whether the player will be full HP after healing.
 * @return {string}
 */
function getHealMsg(msgSet, fullyHealed) {
	var randIndex = Math.floor(Math.random() * msgSet.length);
	var msg = msgSet[randIndex];
	if (fullyHealed) {
		msg += ' (Fully healed!)';
	} else {
		msg += ' (+' + POTION_HEAL_VALUE + ' HP)';
	}
	return msg;
}