import { formatMoney } from "./helpers.js";
import * as c from "./constants.js";

const AGRICULTURE = "Agriculture";
const WAREHOUSE_API = "Warehouse API";
const OFFICE_API = "Office API";
const SMART_SUPPLY = "Smart Supply";
const DREAM_SENSE = "DreamSense";
const UNLOCKS = [WAREHOUSE_API, OFFICE_API];
const OPERATIONS = "Operations";
const ENGINEER = "Engineer";
const WATER = "Water";
const ENERGY = "Energy";
const FOOD = "Food";
const PLANTS = "Plants";
const REALESTATE = "Real Estate";
const MAX_SELL = "MAX";
const MP_SELL = "MP";

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
	await setupCorporation(ns);
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
async function setupCorporation(ns) {
	// ns.tprint("setupCorporation");
	var corporation = ns.corporation.getCorporation();
	printCorporationInfo(ns, corporation);

	if (corporation.divisions.length == 0) {
		if (corporation.funds > ns.corporation.getExpandIndustryCost(AGRICULTURE)) {
			ns.corporation.expandIndustry(AGRICULTURE, AGRICULTURE);
			corporation.funds -= ns.corporation.getExpandIndustryCost(AGRICULTURE);
		}
	}

	var haveUnlocks = true;
	for (var unlock of UNLOCKS) {
		if (!ns.corporation.hasUnlockUpgrade(unlock)) {
			var cost = ns.corporation.getUnlockUpgradeCost(unlock);
			if (cost < corporation.funds) {
				ns.corporation.unlockUpgrade(unlock);
				corporation.funds -= cost;
			} else {
				haveUnlocks = false;
			}
		}
	}
	var agri = ns.corporation.getDivision(AGRICULTURE);
	if (haveUnlocks) {
		if (ns.corporation.getUpgradeLevel(DREAM_SENSE) < 1) {
			var cost = ns.corporation.getUpgradeLevelCost(DREAM_SENSE);
			if (corporation.funds > cost) {
				ns.corporation.levelUpgrade(DREAM_SENSE);
				corporation.funds -= cost;
			}
		}
		if (ns.corporation.getHireAdVertCount(agri.name)<1) {
			var cost = ns.corporation.getHireAdVertCost(agri.name);
			if (corporation.funds > cost) {
				ns.corporation.hireAdVert(agri.name);
				corporation.funds -= cost;
			}
		}
		expandDivision(ns, agri, corporation);
		await setupDivision(ns, agri);
		if (!corporation.public) {
			ns.corporation.goPublic(0);
		}
	}
}

/** @param {NS} ns **/
function printCorporationInfo(ns, corporation) {
	// ns.tprint("printCorporationInfo");
	// ns.tprintf("Corporation info: %s", JSON.stringify(corporation));
	ns.tprintf("Corporation info: %s", corporation.name);
	ns.tprintf("%20s: %10s", "Current funds", formatMoney(corporation.funds));
	ns.tprintf("%20s: %10s", "Current revenue", formatMoney(corporation.revenue));
	ns.tprintf("%20s: %10s", "Current expenses", formatMoney(corporation.expenses));
	ns.tprintf("%20s: %10s %s", "Current share price", formatMoney(corporation.sharePrice),
		corporation.shareSaleCooldown > 0 ? Math.ceil(corporation.shareSaleCooldown / 5) + " s cooldown" : "");
	ns.toast("Share price: " + formatMoney(corporation.sharePrice));
}

/** @param {NS} ns **/
function expandDivision(ns, division, corporation) {
	// ns.tprint("expandDivision");
	if (division.cities.length >= c.CITIES.length) {
		return;
	}
	const expansionCost = ns.corporation.getExpandCityCost() + ns.corporation.getPurchaseWarehouseCost();
	while (corporation.funds > expansionCost) {
		var nextCity = c.CITIES.find(a => !division.cities.includes(a));
		ns.tprintf("Expanding to %s", nextCity);
		if (nextCity) {
			ns.corporation.expandCity(division.name, nextCity);
			ns.corporation.purchaseWarehouse(division.name, nextCity);
			corporation.funds -= expansionCost;
		} else {
			break;
		}
	}
}

/** @param {NS} ns **/
async function setupDivision(ns, division) {
	// ns.tprint("setupDivision");
	for (var city of division.cities) {
		if (ns.corporation.hasUnlockUpgrade(SMART_SUPPLY)) {
			ns.corporation.setSmartSupply(division.name, city, true);
		} else {
			for (var material of [WATER, ENERGY]) {
				var materialInfo =ns.corporation.getMaterial(division.name, city, material);
				// ns.tprintf("material %s in %s: %s", material, city, JSON.stringify(materialInfo));
				if (materialInfo.qty > 10) {
					ns.corporation.buyMaterial(division.name, city, material, -materialInfo.prod);
				} else {
					ns.corporation.buyMaterial(division.name, city, material, 1.0-2*materialInfo.prod);
				}
			}
		}
		var realEstateInfo =ns.corporation.getMaterial(division.name, city, REALESTATE);
		if (realEstateInfo.qty < 100) {
			ns.corporation.buyMaterial(division.name, city, REALESTATE, 0.02);
		} else {
			ns.corporation.buyMaterial(division.name, city, REALESTATE, 0);
		}
		ns.corporation.sellMaterial(division.name, city, FOOD, MAX_SELL, MP_SELL);
		ns.corporation.sellMaterial(division.name, city, PLANTS, MAX_SELL, MP_SELL);
		var office = ns.corporation.getOffice(division.name, city);
		for (var ii = office.employees.length; ii < office.size; ii ++) {
			ns.corporation.hireEmployee(division.name, city);
		}
		await ns.corporation.setAutoJobAssignment(division.name, city, OPERATIONS, 2);
		await ns.corporation.setAutoJobAssignment(division.name, city, ENGINEER, 1);
	}
}

/** @param {NS} ns **/
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