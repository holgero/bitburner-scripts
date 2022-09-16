import * as c from "constants.js";
import { runAndWait, reputationNeeded, getAvailableMoney } from "helpers.js";

/** @param {NS} ns **/
export async function main(ns) {
	ns.disableLog("sleep");
	ns.rm("stopselling.txt");
	const database = JSON.parse(ns.read("database.txt"));

	await prepareGoalWork(ns, database);
	for (var ii = 0; ii < 10; ii++) {
		const config = JSON.parse(ns.read("factiongoals.txt"));
		await workOnGoals(ns, database, config);
		if (getAvailableMoney(ns) > await getEstimation(ns, false)) {
			await runAndWait(ns, "calculate-goals.js");
		} else {
			break;
		}
	}

	await ns.write("stopselling.txt", "{reason:'shutdown'}", "w");

	if (ns.getPlayer().hasCorporation && ns.fileExists("corporation.txt", "home")) {
		var corporationInfo = JSON.parse(ns.read("corporation.txt"));
		if (corporationInfo.shareSaleCooldown) {
			const config = JSON.parse(ns.read("factiongoals.txt"));
			for (var goal of config.factionGoals.filter(a => a.company)) {
				if (!ns.getPlayer().factions.includes(goal.name)) {
					await runAndWait(ns, "workforcompany.js", goal.name, "IT", "true");
					break;
				}
			}
			var cooldown = corporationInfo.shareSaleCooldown / 5;
			var bonus = corporationInfo.bonusTime / 1000;
			var realtime;
			if (cooldown > 10 * bonus / 9) {
				realtime = cooldown - bonus;
			} else {
				realtime = cooldown / 10;
			}
			if (realtime > 10) {
				ns.tprintf("Share sale cooldown period: %d s", realtime);
				await ns.sleep(1000 * (realtime - 10));
			}
			await ns.sleep(10000);
		}
	}

	if (ns.getTimeSinceLastAug() < 1e6) {
		ns.tprintf("Just installed augs %d s before. Exiting.", ns.getTimeSinceLastAug() / 1000);
		return;
	}
	ns.killall("home", true);
	ns.spawn("plan-augmentations.js", 1, "--run_purchase");
}

/** @param {NS} ns **/
async function prepareGoalWork(ns, database) {
	var focus = ns.singularity.isFocused();
	// first get hacking level to fifty
	while (ns.getPlayer().skills.hacking < 50) {
		await runAndWait(ns, "university.js", "--course", "CS", "--focus", JSON.stringify(focus));
		await ns.sleep(60000);
		focus = ns.singularity.isFocused();
	}
}

/** @param {NS} ns **/
async function workOnGoals(ns, database, config) {
	await runAndWait(ns, "print_goals.js");
	if (config.factionGoals.some(a => a.reputation)) {
		if (!await workOnGoalsPercentage(ns, database, config, 0.25)) return;
		if (!await workOnGoalsPercentage(ns, database, config, 0.50)) return;
		if (!await workOnGoalsPercentage(ns, database, config, 0.75)) return;
		if (!await workOnGoalsPercentage(ns, database, config, 1.00)) return;
	} else {
		ns.tprintf("No goals!");
	}
	ns.tprintf("Finished all goals");
}

/** @param {NS} ns **/
async function checkForDaedalus(ns, database, config) {
	var daedalus = config.factionGoals.find(a => a.name == c.DAEDALUS);
	if (!daedalus || !daedalus.augmentations.includes(c.RED_PILL)) {
		if (ns.getPlayer().skills.hacking >= ns.getServerRequiredHackingLevel(c.WORLD_DAEMON)) {
			ns.spawn("kill-world.js");
		}
	}
	if (config.finalGoal) {
		return;
	}
	const goals = config.factionGoals;
	if (ns.getPlayer().factions.includes(c.DAEDALUS) &&
		goals.some(a => a.name == c.DAEDALUS && a.augmentations.includes(c.RED_PILL))) {
		var goal = goals.find(a => a.name == c.DAEDALUS);
		// single minded now, there are no other goals...
		config.finalGoal = goal;
		goals.forEach(a => a.reputation = 0);
		if (goal.reputation == 0) {
			if (goal.favor < database.favorToDonate) {
				goal.reputation = reputationNeeded(ns, database, goal.name);
				await ns.write("stopselling.txt", "{goal:Daedalus}", "w");
				config.estimatedDonations = 0;
			}
		}
		if (goal.favor >= database.favorToDonate) {
			// reach the red pill
			goal.reputation = database.augmentations.find(a => a.name == c.RED_PILL).reputation;
			config.estimatedDonations = 1;
		}
		await ns.write("factiongoals.txt", JSON.stringify({
			factionGoals: goals,
			estimatedPrice: 0,
			estimatedDonations: config.estimatedDonations
		}), "w");
		config.estimatedPrice = await getEstimation(ns, true);
		await ns.write("factiongoals.txt", JSON.stringify({
			factionGoals: goals,
			estimatedPrice: config.estimatedPrice,
			estimatedDonations: config.estimatedDonations
		}), "w");

		await runAndWait(ns, "print_goals.js");
	}
}

/** @param {NS} ns **/
async function workOnGoalsPercentage(ns, database, config, percentage) {
	ns.tprintf("Round of goals at %d %%", percentage * 100);
	const goals = config.factionGoals;
	const alreadyTried = [];
	while (true) {
		await checkForDaedalus(ns, database, config);
		goals.forEach(a => a.achieved = a.reputation ?
			ns.singularity.getFactionRep(a.name) / percentage : 0);
		var goal = await selectGoal(ns, goals, alreadyTried, config);
		if (!goal) break;
		await workOnGoal(ns, database, goal, percentage, goals, config);
		if (goal == config.finalGoal) break;
		alreadyTried.push(goal);
	}
	if (Math.max(1e12, getAvailableMoney(ns)) < await getEstimation(ns, false)) {
		return false;
	}
	return true;
}

/** @param {NS} ns **/
async function getEstimation(ns, goal) {
	if (goal) {
		await runAndWait(ns, "estimate.js", "--write", "--goal");
	} else {
		await runAndWait(ns, "estimate.js", "--write");
	}
	var estimation = JSON.parse(ns.read("estimate.txt"));
	ns.rm("estimate.txt", "home");
	return estimation.estimatedPrice;
}

/** @param {NS} ns **/
async function workOnGoal(ns, database, goal, percentage, goals, config) {
	if (!goal.reputation || ns.singularity.getFactionRep(goal.name) >= percentage * goal.reputation) {
		return;
	}
	var focus = true;
	ns.tprintf("goal: %s %d", goal.name, percentage * goal.reputation);
	var attempts = 0;
	while (true) {
		if (!ns.getPlayer().factions.includes(goal.name) &&
			goal.location && goal.location != ns.getPlayer().city) {
			if (!goal.money || getAvailableMoney(ns) > goal.money + 200e3) {
				await runAndWait(ns, "travel.js", "--city", goal.location);
			} else {
				ns.tprintf("Cant work on goal %s, needs traveling", goal.name);
				await ns.sleep(15000);
				return;
			}
		}
		// how to spend our time
		if (!ns.singularity.isBusy()) {
			// default way to spend the time is to commit a few crimes
			await runAndWait(ns, "commit-crimes.js");
		}
		if (!goal.backdoor || ns.getServer(goal.backdoor).backdoorInstalled) {
			ns.printf("At start of checks");
			if (await buffStatsToNeeded(ns, goal.stats, focus)) {
				ns.printf("No workout needed");
				if (config.estimatedDonations) {
					var moneyForDonations = Math.max(0,
						getAvailableMoney(ns) - config.estimatedPrice);
					if (ns.getPlayer().hasCorporation &&
						ns.fileExists("corporation.txt", "home")) {
						var corporationInfo = JSON.parse(ns.read("corporation.txt"));
						if (corporationInfo.issuedShares > 0) {
							// dont donate money that is needed for buyback
							moneyForDonations = 0;
						}
					}
					if (moneyForDonations) {
						ns.printf("Will donate %d", moneyForDonations);
						await runAndWait(ns, "donate-faction.js",
							goal.name, percentage * goal.reputation, moneyForDonations);
					}
				}
				if (ns.singularity.getFactionRep(goal.name) > percentage * goal.reputation) {
					break;
				}
				var percentComplete = (100.0 * ns.singularity.getFactionRep(goal.name) / goal.reputation).toFixed(1);
				ns.tprintf("Goal completion (%s %d/%d): %s %%", goal.name,
					ns.singularity.getFactionRep(goal.name),
					goal.reputation,
					percentComplete);
				ns.toast(goal.name + ": " + percentComplete + " %", "success", 5000);
				if (goals.filter(a => a.reputation > 0 && a.reputation > ns.singularity.getFactionRep(a.name)).length == 0 &&
					percentage > 0.999 &&
					percentComplete > 90) {
					await ns.write("stopselling.txt", "{lastgoal:" + percentComplete + "}", "w");
				} else {
					ns.rm("stopselling.txt");
				}
				if (goal.company && !ns.getPlayer().factions.includes(goal.name)) {
					ns.printf("Start working at company");
					await runAndWait(ns, "workforcompany.js", goal.name, "IT");
				}
				ns.printf("Start working for faction");
				await runAndWait(ns, "workforfaction.js", goal.name, goal.work);
				if (goal.name != c.DAEDALUS) {
					await checkForDaedalus(ns, database, config);
					if (config.finalGoal) {
						// we have more important things to do
						return;
					}
				}
			}
			await ns.sleep(60000);
		} else {
			ns.printf("Not working and nothing to do");
			if (!ns.fileExists(c.programs[0].name)) {
				await runAndWait(ns, "writeprogram.js", 0);
				await ns.sleep(1000);
			} else {
				await ns.sleep(60000);
			}
		}
		focus = ns.singularity.isFocused();

		// join future factions early, if we can
		await futureGoalConditions(ns, goals);

		// if there is no progress towards the goal give up.
		if (!ns.getPlayer().factions.includes(goal.name)) {
			if (!goal.company || ns.getPlayer().company == "") {
				attempts++;
				if (attempts >= 3) {
					ns.printf("No progress towards %s, try again later", goal.name);
					return;
				}
			}
		}

		await ns.sleep(100);
	}
}

/** @param {NS} ns **/
async function selectGoal(ns, goals, alreadyTried, config) {
	if (config.finalGoal) {
		return config.finalGoal;
	}
	goals.sort((a, b) => (a.reputation - a.achieved) - (b.reputation - b.achieved));
	goals.reverse();
	var factions = ns.getPlayer().factions;
	var runGoals = goals.filter(a => !alreadyTried.includes(a) && (a.reputation - a.achieved) > 0);
	if (runGoals.length == 0) {
		return undefined;
	}
	for (var goal of runGoals) {
		if (factions.includes(goal.name)) {
			return goal;
		}
	}
	// everything that follows is only possible in the first round where the
	// player has not joined all necessary factions
	// start with the factions that require stats
	var statsFactions = runGoals.filter(a => a.stats).sort((a, b) => (a.stats - b.stats));
	if (statsFactions.length > 0) {
		return statsFactions[0];
	}
	for (var goal of runGoals) {
		if (!goal.backdoor && !goal.company && !goal.money || goal.money < getAvailableMoney(ns)) {
			return goal;
		}
	}
	for (var goal of runGoals) {
		if (!goal.company) {
			return goal;
		}
	}
	for (var goal of runGoals) {
		return goal;
	}
	return undefined;
}

/** @param {NS} ns **/
function lowStats(ns, stats) {
	var player = ns.getPlayer();
	var result = [];
	if (player.skills.agility < stats) {
		result.push("Agility");
	}
	if (player.skills.dexterity < stats) {
		result.push("Dexterity");
	}
	if (player.skills.defense < stats) {
		result.push("Defense");
	}
	if (player.skills.strength < stats) {
		result.push("Strength");
	}
	return result;
}

/** @param {NS} ns **/
async function buffStatsToNeeded(ns, stats, focus) {
	if (!stats) {
		return true;
	}
	var statsTooLow = lowStats(ns, stats);
	if (statsTooLow.length == 0) {
		return true;
	}
	ns.printf("Too low on stats: %s", JSON.stringify(statsTooLow));
	if (statsTooLow.length == 1) {
		await runAndWait(ns, "workout.js", statsTooLow[0], focus);
	}
	return false;
}

/** @param {NS} ns **/
async function futureGoalConditions(ns, goals) {
	for (var goal of goals) {
		if (ns.getPlayer().factions.includes(goal.name)) {
			continue;
		}
		ns.printf("Checking future goal %s", goal.name);
		if (goal.location && ns.getPlayer().city != goal.location) {
			if (!goal.money || getAvailableMoney(ns) >= goal.money) {
				if (!goal.stats || lowStats(ns, goal.stats).length == 0) {
					await runAndWait(ns, "travel.js", "--city", goal.location);
					return;
				}
			}
		}
	}
}