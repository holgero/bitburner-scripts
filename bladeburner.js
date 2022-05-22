// import { runAndWait } from "helpers.js";

/** @param {NS} ns */
export async function main(ns) {
	if (!ns.bladeburner.joinBladeburnerDivision()) {
		ns.tprintf("Not in Bladeburners division");
		return;
	}
	ns.tprintf("Joined Bladeburners division");
	while (!ns.bladeburner.joinBladeburnerFaction()) {
		ns.tprintf("Not in Bladeburners faction");
		await ns.sleep(10000);
		return;
	}
	ns.tprintf("Joined Bladeburners faction");
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