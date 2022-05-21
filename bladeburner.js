import { runAndWait } from "helpers.js";

/** @param {NS} ns */
export async function main(ns) {
	var player;
	do {
		await runAndWait(ns, "commit-crimes.js", "--timed", 110);
		await ns.sleep(10000);
		player = ns.getPlayer();
	} while (player.strength < 100 || player.defense < 100 || player.dexterity < 100 || player.agility < 100);
	if (ns.bladeburner.joinBladeburnerDivision()) {
		ns.tprintf("Joined Bladeburners division");
	}
	if (ns.bladeburner.joinBladeburnerFaction()) {
		ns.tprintf("Joined Bladeburners faction");
	}
	await runContracts(ns);
}

/** @param {NS} ns */
async function runContracts(ns) {
	while (true) {
		const [current, max] = ns.bladeburner.getStamina();
		if (current > max / 2) {
			const contracts = ns.bladeburner.getContractNames();
			var bestChance = 0;
			var bestContract = "";
			for (var contract of contracts) {
				if (ns.bladeburner.getActionCountRemaining("Contract", contract) <= 0) {
					continue;
				}
				var chances = ns.bladeburner.getActionEstimatedSuccessChance("Contract", contract);
				if (chances[0] > bestChance) {
					bestChance = chances[0];
					bestContract = contract;
				}
				if (bestContract) {
					ns.bladeburner.startAction("Contract", contract);
				}
			}
		}
		await ns.sleep(1000);
		while (ns.bladeburner.getCurrentAction().type != "Idle") {
			ns.tprintf("Doing %s", ns.bladeburner.getCurrentAction().name);
			await ns.sleep(1000);
		}
	}
}