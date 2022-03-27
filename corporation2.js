import { formatMoney } from "./helpers.js";
import * as c from "./constants.js";

const AGRICULTURE = "Agriculture";
const WAREHOUSE_API = "Warehouse API";
const OFFICE_API = "Office API";
const SMART_SUPPLY = "Smart Supply";
const DREAM_SENSE = "DreamSense";
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
	var options = ns.flags([
		["milk", false],
		["sell", 0],
		["buy", 0],
		["setup", false],
		["public", false],
		["quiet", false],
		["local", false],
		["restart", "[]"]]);
	var processList = JSON.parse(options.restart);

	if (options.milk) {
		ns.corporation.sellShares(1000000000);
		await ns.sleep(1000);
		ns.corporation.buyBackShares(1000000000);
	}
	if (options.sell) {
		ns.corporation.sellShares(options.sell);
		ns.corporation.issueDividends(1);
	}
	if (options.buy) {
		ns.corporation.buyBackShares(options.buy);
		ns.corporation.issueDividends(0);
	}
	if (options.setup) {
		var player = ns.getPlayer();
		if (!player.hasCorporation) {
			var selfFund = (player.bitNodeN != 3)
			ns.corporation.createCorporation("ACME", selfFund);
		}
		await setupCorporation(ns);
	}
	await printCorporationInfo(ns, ns.corporation.getCorporation(), options);
	if (options.public) {
		var corp = ns.corporation.getCorporation();
		if (!corp.public) {
			var ipoShares = Math.min(1e9, Math.floor(options.public / corp.sharePrice));
			ns.corporation.goPublic(ipoShares);
			await ns.sleep(5000);
			if (ipoShares > 0) {
				ns.corporation.buyBackShares(ipoShares);
			}
		}
	}
	if (processList.length) {
		restorePreviousScripts(ns, processList);
	}
}

/** @param {NS} ns **/
async function setupCorporation(ns) {
	var corporation = ns.corporation.getCorporation();
	if (corporation.divisions.length == 0) {
		if (corporation.funds > ns.corporation.getExpandIndustryCost(AGRICULTURE)) {
			ns.corporation.expandIndustry(AGRICULTURE, AGRICULTURE);
			corporation.funds -= ns.corporation.getExpandIndustryCost(AGRICULTURE);
		} else {
			return;
		}
	}
	// this one is needed to increase the popularity over time
	if (ns.corporation.getUpgradeLevel(DREAM_SENSE) < 1) {
		var cost = ns.corporation.getUpgradeLevelCost(DREAM_SENSE);
		if (corporation.funds > cost) {
			ns.corporation.levelUpgrade(DREAM_SENSE);
			corporation.funds -= cost;
		}
	}
	for (var unlock of [WAREHOUSE_API, OFFICE_API]) {
		if (!ns.corporation.hasUnlockUpgrade(unlock)) {
			var cost = ns.corporation.getUnlockUpgradeCost(unlock);
			if (cost < corporation.funds) {
				ns.corporation.unlockUpgrade(unlock);
				corporation.funds -= cost;
			}
		}
	}
	var agri = ns.corporation.getDivision(AGRICULTURE);
	if (ns.corporation.hasUnlockUpgrade(OFFICE_API)) {
		if (ns.corporation.getHireAdVertCount(agri.name) < 1) {
			var cost = ns.corporation.getHireAdVertCost(agri.name);
			if (corporation.funds > cost) {
				ns.corporation.hireAdVert(agri.name);
				corporation.funds -= cost;
			}
		}
		if (ns.corporation.hasUnlockUpgrade(WAREHOUSE_API)) {
			// only expand if we can manage it completely
			expandDivision(ns, agri, corporation);
		}
		await setupDivisionOffice(ns, agri);
	}
	if (ns.corporation.hasUnlockUpgrade(WAREHOUSE_API)) {
		while (corporation.state == "PURCHASE" || corporation.state == "PRODUCTION") {
			await ns.sleep(500);
			corporation = ns.corporation.getCorporation();
		}
		await setupDivisionWarehouse(ns, agri);
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
	await ns.write("corporation.txt", JSON.stringify(corporation), "w");
	if (!options.local) {
		await ns.scp("corporation.txt", "home");
	}
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
async function setupDivisionOffice(ns, division) {
	// ns.tprint("setupDivision");
	for (var city of division.cities) {
		var office = ns.corporation.getOffice(division.name, city);
		if (office.size < 12) {
			var corp = ns.corporation.getCorporation();
			if (ns.corporation.getOfficeSizeUpgradeCost(division.name, city, 3) < corp.funds) {
				ns.corporation.upgradeOfficeSize(division.name, city, 3);
			}
			office = ns.corporation.getOffice(division.name, city);
		}
		for (var ii = office.employees.length; ii < office.size; ii++) {
			ns.corporation.hireEmployee(division.name, city);
		}
		await distributeEmployees(ns, division.name, city, office.employees.length);
	}
}

/** @param {NS} ns **/
async function setupDivisionWarehouse(ns, division) {
	// ns.tprint("setupDivision");
	for (var city of division.cities) {
		if (!ns.corporation.hasWarehouse(division.name, city)) {
			ns.corporation.purchaseWarehouse(division.name, city);
		}
		if (ns.corporation.hasUnlockUpgrade(SMART_SUPPLY)) {
			ns.corporation.setSmartSupply(division.name, city, true);
		} else {
			for (var material of [WATER, ENERGY]) {
				var materialInfo = ns.corporation.getMaterial(division.name, city, material);
				// ns.tprintf("material %s in %s: %s", material, city, JSON.stringify(materialInfo));
				if (materialInfo.qty > 10) {
					ns.corporation.buyMaterial(division.name, city, material, -materialInfo.prod);
				} else {
					ns.corporation.buyMaterial(division.name, city, material, 0.25 - materialInfo.prod);
				}
			}
		}
		ns.corporation.sellMaterial(division.name, city, FOOD, MAX_SELL, MP_SELL);
		ns.corporation.sellMaterial(division.name, city, PLANTS, MAX_SELL, MP_SELL);
		purchaseAdditionalMaterial(ns, division.name, city, REALESTATE, 4000);
		purchaseAdditionalMaterial(ns, division.name, city, HARDWARE, 300);
		purchaseAdditionalMaterial(ns, division.name, city, ROBOTS, 40);
		purchaseAdditionalMaterial(ns, division.name, city, AI_CORES, 200);
	}
}

/** @param {NS} ns **/
function purchaseAdditionalMaterial(ns, divisionName, city, material, maxAmount) {
	var info = ns.corporation.getMaterial(divisionName, city, material);
	var corp = ns.corporation.getCorporation();
	// only spend on addtl. materials while we don't own the company
	var canSpend = corp.numShares == 0;

	if (canSpend && info.qty < maxAmount) {
		ns.corporation.buyMaterial(divisionName, city, material, 0.25);
		ns.corporation.sellMaterial(divisionName, city, material, "0", "MP");
	} else {
		ns.corporation.buyMaterial(divisionName, city, material, 0);
		if (info.qty > 1.1 * maxAmount) {
			ns.corporation.sellMaterial(divisionName, city, material, "0.1", "MP");
		} else {
			ns.corporation.sellMaterial(divisionName, city, material, "0", "MP");
		}
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