const HOMICIDE = "Homicide";
const MUG = "Mug someone";
const SHOPLIFT = "Shoplift";
var crimeCount = 0;

/** @param {NS} ns **/
export async function main(ns) {
	var options = ns.flags([["until_hack", 0], ["until_stats", 0]]);
	while (ns.getCrimeChance(HOMICIDE) < 0.5) {
		while (ns.getCrimeChance(MUG) < 0.5) {
			await commitCrime(ns, SHOPLIFT);
			if (checkCondition(ns.getPlayer(), options))  return;
		}
		await commitCrime(ns, MUG);
		if (checkCondition(ns.getPlayer(), options))  return;
	}
	for (var ii = 0; ii < 100; ii++) {
		await commitCrime(ns, HOMICIDE);
		if (checkCondition(ns.getPlayer(), options))  return;
	}
}

/** @param {NS} ns **/
async function commitCrime(ns, crime) {
	if (ns.isBusy()) {
		await ns.sleep(10000);
	} else {
		var waitTime = ns.getCrimeStats(crime).time;
		ns.commitCrime(crime);
		await ns.sleep(waitTime);
		while (ns.isBusy()) {
			await ns.sleep(1000);
		}
	}
}

function checkCondition(player, options) {
	if (options.until_hack && player.hacking >= options.until_hack) {
		return true;
	}
	if (options.until_stats) {
		var stats = options.until_stats;
		var count = 0;
		if (player.agility >= stats) {
			count++;
		}
		if (player.dexterity >= stats) {
			count++;
		}
		if (player.strength >= stats) {
			count++;
		}
		if (player.defense >= stats) {
			count++;
		}
		return count >= 3;
	}
	return false;
}