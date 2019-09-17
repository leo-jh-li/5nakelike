class Role {
	constructor(name, maxHp, gameOverStatsQuantity) {
		this.name = name;
		this.maxHp = maxHp;
		this.gameOverStatsQuantity = gameOverStatsQuantity;
		this.trapDamage = TRAP_DAMAGE;
	}
	eatFoodEffects() {

	}
	setTrapDamage(dmg) {
		this.trapDamage = dmg;
	}
	setOffTrap() {
		var dmgNotShielded = takeDamage(this.trapDamage);
		trapsTriggered++;
		pushMessage(getDmgMsg(TRIGGER_TRAP_MSGS, this.trapDamage, !dmgNotShielded));
	}
}

var RoleType = Object.freeze({'FIGHTER':1, 'ROGUE':2, 'WIZARD':3});

class Fighter extends Role {
	constructor() {
		super('Fighter', 15, 1);
	}
	eatFoodEffects() {
		super.eatFoodEffects();
		shielded = true;
	}
}

class Rogue extends Role {
	constructor() {
		super('Rogue', 12, 0);
		this.visionSlowDown = 2;
		super.setTrapDamage(TRAP_DAMAGE / 2);
	}
}

class Wizard extends Role {
	constructor() {
		super('Wizard', 9, 0);
		this.spellCost = 5;
	}
	eatFoodEffects() {
		super.eatFoodEffects();
		increaseMp(1);
	}
	tryCastSpell(level) {
		if (this.spellCost <= mana) {
			mana -= this.spellCost;
			// Reveal area around every item
			var items = level.food.concat(level.potions)
			for(var i = 0; i < items.length; i++) {
				projectVisionLinesFromPoint(level, new Point(items[i].x, items[i].y), SPELL_REVEAL_RADIUS);
			}
			if (items.length > 0) {
				pushMessage(getRandMsg(CAST_SPELL_MSGS));
			} else {
				pushMessage(NO_ITEMS_REVEALED_MSG);
			}
			return true;
		}
		return false;
	}
}
const roles = [null, new Fighter(), new Rogue(), new Wizard()];
