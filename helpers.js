import { getAvailable, getTotal } from "/budget.js";
import {
	AUGMENTATION_NORMAL_PRIO, AUGMENTATION_BLADEBURNER_PRIO, BLADEBURNER_NODES,
	DAEDALUS, RED_PILL, BLADEBURNERS, CHURCH
} from "/constants.js";

/** @param {NS} ns **/
export function getAugmentationPrios(ns) {
	const prios = [];
	const player = ns.getPlayer();
	if (BLADEBURNER_NODES.includes(player.bitNodeN)) {
		prios.push(...AUGMENTATION_BLADEBURNER_PRIO);
	} else {
		prios.push(...AUGMENTATION_NORMAL_PRIO);
	}
	const database = getDatabase(ns);
	if (database.bitnodemultipliers &&
		database.bitnodemultipliers.HacknetNodeMoney <= 0) {
		// hacknet stuff is worthless, delete it from prios
		return prios.filter(a => a != "Hacknet");
	}
	return prios;
}

/** @param {NS} ns **/
export function getHacknetProfitability(ns) {
	const database = getDatabase(ns);
	const player = ns.getPlayer();
	if (database.bitnodemultipliers) {
		return database.bitnodemultipliers.HacknetNodeMoney *
			player.mults.hacknet_node_money;
	}
	return 1.0;
}

/** @param {NS} ns **/
export function getHackingProfitability(ns) {
	const database = getDatabase(ns);
	const player = ns.getPlayer();
	if (database.bitnodemultipliers) {
		return database.bitnodemultipliers.ServerMaxMoney *
			database.bitnodemultipliers.ServerGrowthRate *
			database.bitnodemultipliers.ScriptHackMoney *
			database.bitnodemultipliers.ScriptHackMoneyGain *
			database.bitnodemultipliers.ServerWeakenRate *
			player.mults.hacking_chance *
			player.mults.hacking_speed *
			player.mults.hacking_grow *
			player.mults.hacking_money;
	}
	return 1.0;
}

export function millisecondToDHMS(milli) {
	return sprintf("%3dd %02d:%02d:%02d",
		Math.floor(milli / (24 * 60 * 60 * 1000)),
		Math.floor(milli / (60 * 60 * 1000)) % 24,
		Math.floor(milli / (60 * 1000)) % 60,
		Math.round(milli / 1000) % 60);
}

/** @param {NS} ns **/
export function getDatabase(ns) {
	const text = ns.read("database.txt");
	if (text) {
		return JSON.parse(text);
	}
	return "{}";
}

/** @param {NS} ns **/
export function getFactiongoals(ns) {
	const text = ns.read("factiongoals.txt");
	if (text) {
		return JSON.parse(text);
	}
	return "{}";
}

/** @param {NS} ns **/
export function getCorporationInfo(ns) {
	const text = ns.read("corporation.txt");
	if (text) {
		return JSON.parse(text);
	}
	return "{}";
}

/** @param {NS} ns **/
export async function getEstimation(ns, goal) {
	ns.write("estimate.txt", "{}", "w");
	if (goal) {
		await runAndWait(ns, "estimate.js", "--write", "--goal");
	} else {
		await runAndWait(ns, "estimate.js", "--write", "--best");
	}
	const text = ns.read("estimate.txt");
	if (text) {
		return JSON.parse(text);
	}
	return "{}";
}

/** @param {NS} ns **/
export async function traverse(ns, startServer, known, path, serverProc) {
	const servers = ns.scan(startServer).
		filter(a => !known.includes(a) &&
			!a.startsWith("pserv-") &&
			!a.startsWith("hacknet-server-") &&
			!a.startsWith("hacknet-node-"));
	for (var server of servers) {
		known.push(server);
		path.push(server);
		await serverProc(ns, server, known, path);
		await traverse(ns, server, known, path, serverProc);
		path.pop();
	}
}

/** @param {NS} ns **/
export function formatMoney(amount) {
	const suffix = [" ", "k", "m", "b", "t", "q", "Q"];
	var sign = " ";
	if (amount < 0) {
		sign = "-";
		amount = - amount;
	}
	var magnitude = Math.min(suffix.length - 1, Math.floor(Math.log10(amount) / 3));
	if (magnitude < 0) {
		magnitude = 0;
	}
	if (amount == 0) {
		magnitude = 0;
	}
	return sign + (amount / Math.pow(10, 3 * magnitude)).toFixed(3) + " " + suffix[magnitude];
}

/** @param {NS} ns **/
export function getAvailableMoney(ns, totalMoney = false) {
	if (totalMoney) {
		return getTotal(ns);
	}
	return getAvailable(ns);
}

/** @param {NS} ns **/
export function statsGainFactor(ns) {
	var player = ns.getPlayer();
	var stats_mult = Math.min(
		player.mults.strength,
		player.mults.defense,
		player.mults.dexterity,
		player.mults.agility);
	var stats_exp_mult = Math.min(
		player.mults.strength_exp,
		player.mults.defense_exp,
		player.mults.dexterity_exp,
		player.mults.agility_exp);
	return stats_mult * stats_exp_mult;
}

/** @param {NS} ns **/
export async function runAndWait(ns, script, ...args) {
	const pid = ns.run(script, 1, ...args);
	if (!pid) {
		return false;
	}
	while (ns.isRunning(pid)) {
		await ns.sleep(100);
	}
	return true;
}

/** @param {NS} ns **/
function addPossibleAugmentations(ns, database, factionGoals, dependencies, toPurchase, maxprice) {
	for (var goal of factionGoals) {
		var faction = database.factions.find(a => a.name == goal.name);
		if (!faction) {
			continue;
		}
		for (var augName of faction.augmentations) {
			var augmentation = database.augmentations.find(a => a.name == augName);
			var rep = Math.max(goal.reputation, ns.singularity.getFactionRep(goal.name));
			if (augmentation.reputation <= rep && augmentation.price <= maxprice) {
				if (!toPurchase.includes(augmentation)) {
					if (augmentation.requirements.every(a => dependencies.includes(a))) {
						toPurchase.push(augmentation);
						dependencies.push(augmentation.name);
					}
				}
			}
		}
	}
}

/** @param {NS} ns **/
export async function findBestAugmentations(ns) {
	const database = getDatabase(ns);
	const player = ns.getPlayer();
	const factions = player.factions.map(f => ({
		...(database.factions.find(a => a.name == f)),
		reputation: ns.singularity.getFactionRep(f)
	}));
	const money = getAvailableMoney(ns, true);
	const allPrios = getAugmentationPrios(ns).slice(0, 3);
	var prios = [];
	var solution = [];
	while (allPrios.length > 0) {
		prios.push(allPrios.shift());
		var maxPrice = money;
		while (maxPrice > 0) {
			const augmentations = getAugmentationsToPurchase(ns, database, factions, maxPrice);
			filterExpensiveAugmentations(ns, augmentations, money, prios);
			if ((augmentations.filter(a => prios.includes(a.type)).length >
				solution.filter(a => prios.includes(a.type)).length) ||
				(augmentations.filter(a => prios.includes(a.type)).length >=
					solution.filter(a => prios.includes(a.type)).length &&
					augmentations.length > solution.length)) {
				ns.printf("solution with prios %s has %d augs", prios, augmentations.length);
				ns.printf("and %d prioritized augs", augmentations.filter(a => prios.includes(a.type)).length);
				ns.printf(">>>%s", augmentations.map(a => a.name));
				solution = augmentations;
			}
			if (augmentations.length > 0) {
				maxPrice = Math.max(0, augmentations[0].price - 1);
			} else {
				break;
			}
			await ns.sleep(1);
		}
	}
	return solution;
}

/** @param {NS} ns **/
export function getAugmentationsToPurchase(ns, database, factionGoals, maxprice) {
	const toPurchase = [];
	const dependencies = database.owned_augmentations.slice(0);
	addPossibleAugmentations(ns, database, factionGoals, dependencies, toPurchase, maxprice);
	addPossibleAugmentations(ns, database, factionGoals, dependencies, toPurchase, maxprice);
	addPossibleAugmentations(ns, database, factionGoals, dependencies, toPurchase, maxprice);
	setSortc(toPurchase);
	toPurchase.sort((a, b) => a.sortc - b.sortc).reverse();
	return toPurchase;
}

/** @param {NS} ns **/
export function reputationNeeded(ns, database, factionName) {
	const faction = database.factions.find(a => a.name == factionName);
	var previousReputation = Math.pow(1.02, faction.favor - 1) * 25500 - 25000;
	var reputationNeeded = Math.pow(1.02, database.favorToDonate - 1) * 25500 - 25000;
	return Math.max(0, reputationNeeded - previousReputation);
}


/** @param {NS} ns **/
export function goalCompletion(ns, factionGoals) {
	var totalRep = 0;
	var repNeeded = 0;
	for (var goal of factionGoals) {
		if (goal.reputation) {
			totalRep += goal.reputation;
			repNeeded += Math.max(0, goal.reputation - ns.singularity.getFactionRep(goal.name));
		} else {
			if (![BLADEBURNERS, CHURCH].includes(goal.name)) {
				const rep = ns.singularity.getFactionRep(goal.name);
				totalRep += rep;
			}
		}
	}

	if (totalRep) {
		return 1 - repNeeded / totalRep;
	}
	return 1;
}

function setSortc(toPurchase) {
	toPurchase.forEach(a => a.sortc = undefined);
	for (var aug of toPurchase) {
		if (aug.sortc == undefined) {
			aug.sortc = aug.price;
		}
		if (aug.requirements.length) {
			var requirement = toPurchase.find(a => a.name == aug.requirements[0]);
			if (requirement) {
				var sortc = (1.9 * aug.price + requirement.price) / 2.9;
				aug.sortc = sortc;
				requirement.sortc = requirement.sortc ? Math.max(requirement.sortc, sortc + 1) : sortc + 1;
			}
		}
	}
}

/** @param {NS} ns **/
export function filterExpensiveAugmentations(ns, toPurchase, money, preferedTypes = []) {
	var len = toPurchase.length;
	while (canAfford(toPurchase, money) < toPurchase.length) {
		const idx = canAfford(toPurchase, money);
		if (idx > len) {
			ns.tprintf("Something is rotten %s %d", JSON.stringify(toPurchase), idx);
			ns.exit();
		}
		len--;
		if (findAugToRemove(ns, toPurchase, idx, preferedTypes)) {
			continue;
		}
		// only preferred types in toPurchase, remove the first not affordable aug
		toPurchase.splice(idx, 1);
		setSortc(toPurchase);
		toPurchase.sort((a, b) => a.sortc - b.sortc).reverse();
	}
}

function findAugToRemove(ns, toPurchase, idx, preferedTypes) {
	// find one aug between 0 and idx (inclusive) that can be removed
	// start with the most expensive aug (lowest index).
	for (var ii = 0; ii <= idx; ii++) {
		if (!preferedTypes.includes(toPurchase[ii].type)) {
			const removeAug = toPurchase[ii].name;
			ns.printf("Remove %s", removeAug);
			toPurchase.splice(ii, 1);
			const toKeep = toPurchase.filter(a => !a.requirements.includes(removeAug));
			toPurchase.splice(0, toPurchase.length);
			toPurchase.push(...toKeep);
			return true;
		}
	}
	return false;
}

function canAfford(toPurchase, money) {
	var factor = 1.0;
	var sum = 0;
	for (var ii = 0; ii < toPurchase.length; ii++) {
		var augmentation = toPurchase[ii];
		var toPay = factor * augmentation.price;
		if (sum + toPay > money) {
			return ii;
		}
		sum += toPay;
		factor = factor * 1.9;
	}
	return toPurchase.length;
}

/** @param {NS} ns **/
export function getStartState(ns) {
	const player = ns.getPlayer();
	if (player.playtimeSinceLastBitnode < 60 * 60 * 1000) {
		return "fresh";
	} else if (player.playtimeSinceLastAug < 60 * 1000) {
		return "augs";
	}
	return "restart";
}

/** @param {NS} ns **/
export function isEndgame(ns) {
	if (!ns.getPlayer().factions.includes(DAEDALUS)) {
		return false;
	}
	if (getDatabase(ns).owned_augmentations.includes(RED_PILL)) {
		return false;
	}
	const goals = getFactiongoals(ns);
	if (goals.factionGoals) {
		const daedalusGoal = goals.factionGoals.find(a => a.name == DAEDALUS);
		if (daedalusGoal && daedalusGoal.reputation > 0) {
			return true;
		}
	}
	return false;
}

export function waitForDaedalus(database, player) {
	if (player.factions.includes(DAEDALUS)) {
		return false;
	}
	if (database.owned_augmentations.length < database.bitnodemultipliers.DaedalusAugsRequirement) {
		return false;
	}
	if (player.skills.hacking >= 2500) {
		return true;
	}
	if (player.skills.hacking >= 0.9 * 2500 && money >= 100e9) {
		return true;
	}
	return false;
}