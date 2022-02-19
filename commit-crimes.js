var HOMICIDE = "Homicide";
var MUG = "Mug someone";
var SHOPLIFT = "Shoplift";

/** @param {NS} ns **/
export async function main(ns) {
	var untilHacking = 99999;
	if (ns.args.length > 0) {
		untilHacking = ns.args[0];
	}
	while (ns.getCrimeChance(HOMICIDE) < 0.5) {
		while (ns.getCrimeChance(MUG) < 0.5) {
			await commitCrime(ns, SHOPLIFT);
			if (ns.getPlayer().hacking >= untilHacking) {
				return;
			}
		}
		await commitCrime(ns, MUG);
		if (ns.getPlayer().hacking >= untilHacking) {
			return;
		}
	}
	for (var ii = 0; ii < 100; ii++) {
		await commitCrime(ns, HOMICIDE);
		if (ns.getPlayer().hacking >= untilHacking) {
			return;
		}
	}
}

/** @param {NS} ns **/
async function commitCrime(ns, crime) {
	var waitTime = ns.getCrimeStats(crime).time;
	ns.commitCrime(crime);
	await ns.sleep(waitTime);
	while (ns.isBusy()) {
		await ns.sleep(1000);
	}
}