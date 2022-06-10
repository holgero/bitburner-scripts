import * as c from "constants.js";

/** @param {NS} ns */
export async function main(ns) {
	const database = JSON.parse(ns.read("database.txt"));
	const bb = database.factions.find(a => a.name == c.BLADEBURNERS);
	// ns.tprintf("%s", JSON.stringify(bb));
	const myMoney = ns.getServerMoneyAvailable("home");
	const myReputation = ns.getFactionRep(c.BLADEBURNERS);
	var haveMoney = 0;
	var haveRep = 0;
	for (var augName of bb.augmentations) {
		// ns.tprintf("%s", aug);
		const aug = database.augmentations.find(a => a.name == augName);
		if (aug.reputation < myReputation) haveRep++;
		if (aug.price < myMoney) haveMoney++;
	}
	ns.tprintf("Have rep for %d augs and money for %d augs", haveRep, haveMoney);
}