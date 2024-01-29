import { getRestrictions } from "helpers.js";

const CHALLENGES = [
	{ bn: 1, maxram: 128, maxcore: 1 },
	{ bn: 2, nogang: true },
	{ bn: 3, nocorporation: true },
	{ bn: 6, nobladeburner: true },
	{ bn: 7, nobladeburner: true },
	{ bn: 8, notix4s: true },
	{ bn: 9, nohacknet: true },
	{ bn: 10, nosleeves: true },
	{ bn: 13, nostanek: true },
	{ bn: 14, noend: true },
];

/** @param {NS} ns */
export async function main(ns) {
	const options = ns.flags([
		["node", ns.getResetInfo().currentNode],
		["register", 0],
		["next", false]]);
	if (options.next) {
		ns.tprintf("Next challenge: %d", findNextChallenge(ns));
		return;
	}
	if (options.register) {
		ns.tprintf("Registering challenge done for node: %s", options.register);
		registerChallengeDone(ns, options.register);
	} else {
		ns.tprintf("Setting restrictions for node: %s", options.node);
		setUpChallenge(ns, options.node);
	}
	ns.tprintf("restrictions: %s", JSON.stringify(getRestrictions(ns)));
}

/** @param {NS} ns */
export function registerChallengeDone(ns, register) {
	const challenges = readChallenges(ns);
	if (!challenges.done) {
		challenges.done = [];
	}
	challenges.done.push(register);
	ns.write("challenges.txt", JSON.stringify(challenges), "w");
}

/** @param {NS} ns */
export function findNextChallenge(ns) {
	const challenges = readChallenges(ns);
	if (!challenges.done) {
		return 1;
	}
	for (const challenge of CHALLENGES) {
		if (!challenges.done.includes(challenge.bn)) {
			return challenge.bn;
		}
	}
	return undefined;
}

/** @param {NS} ns */
export function setUpChallenge(ns, node) {
	const challenges = readChallenges(ns);
	if (challenges.done && challenges.done.includes(node)) {
		ns.tprintf("WARNING! Node %d challenge already registered.", node);
	}
	const nodeRestrictions = CHALLENGES.find(a => a.bn == node);
	challenges.restrictions = nodeRestrictions;
	ns.write("challenges.txt", JSON.stringify(challenges), "w");
}

/** @param {NS} ns */
function readChallenges(ns) {
	const restrictionTxt = ns.read("challenges.txt");
	var challenges = {};
	if (restrictionTxt) {
		challenges = JSON.parse(restrictionTxt);
	}
	return challenges;
}