import { formatMoney } from "./helpers.js";

const AGRICULTURE = "Agriculture";
const SMART_SUPPLY = "Smart Supply";
const WAREHOUSE_API = "Warehouse API";
const OFFICE_API = "Office API";
const UNLOCKS = [SMART_SUPPLY, WAREHOUSE_API, OFFICE_API];

/** @param {NS} ns **/
export async function main(ns) {
	var options = ns.flags([["milk", false]]);
	if (!options._.length == 1) {
		ns.tprint("Invalid usage!");
		return;
	}
	var processList = JSON.parse(options._[0]);

	var player = ns.getPlayer();
	if (!player.hasCorporation) {
		var selfFund = (player.bitNodeN != 3)
		ns.corporation.createCorporation("ACME", selfFund);
	}
	setupCorporation(ns);
	if (options.milk) {
		ns.corporation.sellShares(1000000000);
		await ns.sleep(30000);
		ns.corporation.buyBackShares(1000000000);
	}
	if (processList.length) {
		restorePreviousScripts(ns, processList);
	}
}

/** @param {NS} ns **/
function setupCorporation(ns) {
	var corporation = ns.corporation.getCorporation();
	// ns.tprintf("Corporation info: %s", JSON.stringify(corporation));
	ns.tprintf("Corporation info: %s", corporation.name);
	ns.tprintf("%20s: %10s", "Current funds", formatMoney(corporation.funds));
	ns.tprintf("%20s: %10s", "Current revenue", formatMoney(corporation.revenue));
	ns.tprintf("%20s: %10s", "Current expenses", formatMoney(corporation.expenses));
	ns.tprintf("%20s: %10s %s", "Current share price", formatMoney(corporation.sharePrice),
		corporation.shareSaleCooldown > 0 ? corporation.shareSaleCooldown : "");
	if (corporation.divisions.length == 0) {
		ns.corporation.expandIndustry(AGRICULTURE, AGRICULTURE);
	}
	for (var unlock of UNLOCKS) {
		if (!ns.corporation.hasUnlockUpgrade(unlock)) {
			var cost = ns.corporation.getUnlockUpgradeCost(unlock);
			if (cost < corporation.funds) {
				ns.corporation.unlockUpgrade(unlock);
				corporation.funds -= cost;
			}
		}
	}
}

function restorePreviousScripts(ns, processList) {
	// ns.tprintf("Commands to restore: %s", JSON.stringify(processList));
	// run all scripts, but the last
	for (var ii = 0; ii < processList.length - 1; ii++) {
		var process = processList[ii];
		ns.run(process.filename, process.threads, ...process.args);
	}
	var lastProcess = processList.pop();
	// ns.tprintf("Last command to restore: %s", JSON.stringify(lastProcess));
	// and spawn the last one
	ns.spawn(lastProcess.filename, lastProcess.threads, ...lastProcess.args);
}