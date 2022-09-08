const HOMICIDE = "Homicide";
const MUG = "Mug someone";
const SHOPLIFT = "Shoplift";

/** @param {NS} ns **/
export async function main(ns) {
	var options = ns.flags([["until_hack", 0], ["until_stats", 0], ["timed", 0]]);
	var startTime = ns.getPlayer().playtimeSinceLastAug;
	while (ns.singularity.getCrimeChance(HOMICIDE) < 0.5) {
		while (ns.singularity.getCrimeChance(MUG) < 0.5) {
			await commitCrime(ns, SHOPLIFT);
			if (checkCondition(ns, options, startTime))  return;
		}
		await commitCrime(ns, MUG);
		if (checkCondition(ns, options, startTime))  return;
	}
	while (!checkCondition(ns, options, startTime)) {
		await commitCrime(ns, HOMICIDE);
	}
}

/** @param {NS} ns **/
async function commitCrime(ns, crime) {
	if (ns.singularity.isBusy()) {
		await ns.sleep(1000);
	} else {
		ns.singularity.commitCrime(crime);
	}
}

function checkCondition(ns, options, startTime) {
	var player = ns.getPlayer();
	if (options.timed) {
		var now = player.playtimeSinceLastAug;
		// ns.printf("Timed option: %d", options.timed);
		if ((now - startTime)/1000 > options.timed) return true;
	}
	if (options.until_hack && player.skills.hacking >= options.until_hack) {
		return true;
	}
	if (options.until_stats) {
		var stats = options.until_stats;
		var count = 0;
		if (player.skills.agility >= stats) {
			count++;
		}
		if (player.skills.dexterity >= stats) {
			count++;
		}
		if (player.skills.strength >= stats) {
			count++;
		}
		if (player.skills.defense >= stats) {
			count++;
		}
		return count >= 3;
	}
	return false;
}