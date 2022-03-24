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
const BUSINESS = "Business";
const MANAGEMENT = "Management";
const RESEARCH = "Research & Development";
const WATER = "Water";
const ENERGY = "Energy";
const FOOD = "Food";
const PLANTS = "Plants";
const HARDWARE = "Hardware";
const ROBOTS = "Robots";
const AI_CORES = "AI Cores";
const REALESTATE = "Real Estate";
const MAX_SELL = "MAX";
const MP_SELL = "MP";

/** @param {NS} ns **/
export async function main(ns) {
	var options = ns.flags([["milk", false]]);
	if (options._.length < 1) {
		ns.tprint("Invalid usage!");
		return;
	}
	var processList = JSON.parse(options._[0]);
	if (!options.milk) {
		options = JSON.parse(options._[1]);
	}

	var player = ns.getPlayer();
	if (!player.hasCorporation) {
		var selfFund = (player.bitNodeN != 3)
		ns.corporation.createCorporation("ACME", selfFund);
	}
	await setupCorporation(ns, options);
	if (options.milk) {
		ns.corporation.sellShares(1000000000);
		await ns.sleep(10000);
		ns.corporation.buyBackShares(1000000000);
	} else {
		if (options.public) {
			var corp = ns.corporation.getCorporation();
			if (!corp.public) {
				var ipoShares = Math.min(1e9, Math.floor(options.public / corp.sharePrice));
				ns.corporation.goPublic(ipoShares);
				await ns.sleep(10000);
				if (ipoShares > 0) {
					ns.corporation.buyBackShares(ipoShares);
				}
			}
		}
	}
	if (processList.length) {
		restorePreviousScripts(ns, processList);
	}
}

/** @param {NS} ns **/
async function setupCorporation(ns, options) {
	var corporation = ns.corporation.getCorporation();
	await printCorporationInfo(ns, corporation, options);

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
		if (ns.corporation.getHireAdVertCount(agri.name) < 1) {
			var cost = ns.corporation.getHireAdVertCost(agri.name);
			if (corporation.funds > cost) {
				ns.corporation.hireAdVert(agri.name);
				corporation.funds -= cost;
			}
		}
		expandDivision(ns, agri, corporation);
		await setupDivision(ns, agri);
	}
}

/** @param {NS} ns **/
async function printCorporationInfo(ns, corporation, options) {
	// ns.tprint("printCorporationInfo");
	// ns.tprintf("Corporation info: %s", JSON.stringify(corporation));
	var profit = corporation.revenue - corporation.expenses;
	if (!options.quiet) {
		ns.tprintf("Corporation info: %s", corporation.name);
		ns.tprintf("%20s: %10s", "Current funds", formatMoney(corporation.funds));
		ns.tprintf("%20s: %10s", "Current profit", formatMoney(profit));
	}
	ns.tprintf("%20s: %10s %s", "Current share price", formatMoney(corporation.sharePrice),
		corporation.shareSaleCooldown > 0 ? Math.ceil(corporation.shareSaleCooldown / 5) + " s cooldown" : "");
	ns.toast("Share price: " + formatMoney(corporation.sharePrice) +
		", profit: " + formatMoney(profit), profit > 0 ? "success" : "warning", 5000);
	await ns.write("shareprice.txt", corporation.sharePrice, "w");
	await ns.scp("shareprice.txt", "home");
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
				var materialInfo = ns.corporation.getMaterial(division.name, city, material);
				// ns.tprintf("material %s in %s: %s", material, city, JSON.stringify(materialInfo));
				if (materialInfo.qty > 10) {
					ns.corporation.buyMaterial(division.name, city, material, -materialInfo.prod);
				} else {
					ns.corporation.buyMaterial(division.name, city, material, 1.0 - 2 * materialInfo.prod);
				}
			}
		}
		ns.corporation.sellMaterial(division.name, city, FOOD, MAX_SELL, MP_SELL);
		ns.corporation.sellMaterial(division.name, city, PLANTS, MAX_SELL, MP_SELL);
		purchaseAdditionalMaterial(ns, division.name, city, REALESTATE, 5000);
		purchaseAdditionalMaterial(ns, division.name, city, HARDWARE, 100);
		purchaseAdditionalMaterial(ns, division.name, city, ROBOTS, 50);
		purchaseAdditionalMaterial(ns, division.name, city, AI_CORES, 200);
		var office = ns.corporation.getOffice(division.name, city);
		for (var ii = office.employees.length; ii < office.size; ii++) {
			ns.corporation.hireEmployee(division.name, city);
		}
		await distributeEmployees(ns, division.name, city, office.employees.length);
	}
}

/** @param {NS} ns **/
function purchaseAdditionalMaterial(ns, divisionName, city, material, maxAmount) {
	var info = ns.corporation.getMaterial(divisionName, city, material);
	if (info.qty < maxAmount) {
		ns.corporation.buyMaterial(divisionName, city, material, 0.2);
	} else {
		ns.corporation.buyMaterial(divisionName, city, material, 0);
	}
}

/** @param {NS} ns **/
async function distributeEmployees(ns, divisionName, city, number) {
	var toDistribute = number;
	var engineers = 0

	if (toDistribute >= 8) {
		await ns.corporation.setAutoJobAssignment(divisionName, city, BUSINESS, 1);
		await ns.corporation.setAutoJobAssignment(divisionName, city, RESEARCH, 1);
		await ns.corporation.setAutoJobAssignment(divisionName, city, MANAGEMENT, 1);
		engineers++;
		toDistribute -= 4;
	}
	if (toDistribute >= 3) {
		engineers++;
		toDistribute--;
	}
	await ns.corporation.setAutoJobAssignment(divisionName, city, ENGINEER, engineers);
	await ns.corporation.setAutoJobAssignment(divisionName, city, OPERATIONS, toDistribute);
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