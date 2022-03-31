import { formatMoney } from "./helpers.js";
import * as c from "./constants.js";

const AGRICULTURE = "Agriculture";
const TOBACCO = "Tobacco";
const WAREHOUSE_API = "Warehouse API";
const OFFICE_API = "Office API";
const SMART_SUPPLY = "Smart Supply";
const SMART_FACTORIES = "Smart Factories";
const SMART_STORAGE = "Smart Storage";
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
const DROMEDAR = "Dromedar";
const MAX_SELL = "MAX";
const MP_SELL = "MP";

/** @param {NS} ns **/
export async function main(ns) {
	var options = ns.flags([
		["milk", false],
		["sell", false],
		["buy", false],
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
		ns.corporation.sellShares(ns.corporation.getCorporation().numShares);
		ns.corporation.issueDividends(1);
	}
	if (options.buy) {
		ns.corporation.issueDividends(0);
		await stopBuying(ns);
		ns.corporation.buyBackShares(ns.corporation.getCorporation().issuedShares);
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
			corporation = ns.corporation.getCorporation();
		} else {
			return;
		}
	}
	for (var upgrade of [DREAM_SENSE, SMART_FACTORIES, SMART_STORAGE]) {
		if (ns.corporation.getUpgradeLevel(upgrade) < corporation.divisions.length) {
			var cost = ns.corporation.getUpgradeLevelCost(DREAM_SENSE);
			if (corporation.funds > cost) {
				ns.corporation.levelUpgrade(upgrade);
				corporation = ns.corporation.getCorporation();
			}
		}
	}
	for (var unlock of [WAREHOUSE_API, OFFICE_API]) {
		if (!ns.corporation.hasUnlockUpgrade(unlock)) {
			var cost = ns.corporation.getUnlockUpgradeCost(unlock);
			if (cost < corporation.funds) {
				ns.corporation.unlockUpgrade(unlock);
				corporation = ns.corporation.getCorporation();
			}
		}
	}
	// expand to the second division if the first is fully expanded
	// to all cities and only we have all the APIs to fully automate the new division
	if (ns.corporation.hasUnlockUpgrade(OFFICE_API) &&
		ns.corporation.hasUnlockUpgrade(WAREHOUSE_API) &&
		corporation.divisions.length == 1 &&
		corporation.divisions[0].cities.length >= c.CITIES.length) {
		if (corporation.funds > ns.corporation.getExpandIndustryCost(TOBACCO)) {
			ns.corporation.expandIndustry(TOBACCO, TOBACCO);
			corporation = ns.corporation.getCorporation();
		}
	}
	for (var division of corporation.divisions) {
		if (ns.corporation.hasUnlockUpgrade(OFFICE_API)) {
			if (ns.corporation.getHireAdVertCount(division.name) < 1) {
				var cost = ns.corporation.getHireAdVertCost(division.name);
				if (corporation.funds > cost) {
					ns.corporation.hireAdVert(division.name);
					corporation = ns.corporation.getCorporation();
				}
			}
			if (ns.corporation.hasUnlockUpgrade(WAREHOUSE_API)) {
				// only expand if we can manage it completely
				expandDivision(ns, division, corporation);
				corporation = ns.corporation.getCorporation();
			}
			await setupDivisionOffice(ns, division);
		}
		if (ns.corporation.hasUnlockUpgrade(WAREHOUSE_API)) {
			while (corporation.state == "PURCHASE" || corporation.state == "PRODUCTION") {
				await ns.sleep(500);
				corporation = ns.corporation.getCorporation();
			}
			await setupDivisionWarehouse(ns, division);
		}
	}
}

/** @param {NS} ns **/
async function stopBuying(ns) {
	var corporation = ns.corporation.getCorporation();
	if (!ns.corporation.hasUnlockUpgrade(WAREHOUSE_API)) {
		return;
	}
	while (corporation.state == "PURCHASE" || corporation.state == "PRODUCTION") {
		await ns.sleep(500);
		corporation = ns.corporation.getCorporation();
	}
	for (var division of corporation.divisions) {
		for (var city of division.cities) {
			if (!ns.corporation.hasWarehouse(division.name, city)) {
				continue;
			}
			for (var material of [REALESTATE, HARDWARE, ROBOTS, AI_CORES]) {
				ns.corporation.buyMaterial(division.name, city, material, 0);
			}
		}
	}
	while (corporation.state != "START") {
		await ns.sleep(500);
		corporation = ns.corporation.getCorporation();
	}
	while (corporation.state == "START") {
		await ns.sleep(500);
		corporation = ns.corporation.getCorporation();
	}
	while (corporation.state != "START") {
		await ns.sleep(500);
		corporation = ns.corporation.getCorporation();
	}
}

/** @param {NS} ns **/
async function printCorporationInfo(ns, corporation, options) {
	var profit = corporation.revenue - corporation.expenses;
	if (!options.quiet) {
		ns.tprintf("Corporation info: %s", corporation.name);
		ns.tprintf("%20s: %10s", "Current funds", formatMoney(corporation.funds));
		ns.tprintf("%20s: %10s", "Current profit", formatMoney(profit));
		ns.tprintf("%20s: %10s %s", "Current share price", formatMoney(corporation.sharePrice),
			corporation.shareSaleCooldown > 0 ? Math.ceil(corporation.shareSaleCooldown / 5) + " s cooldown" : "");
	}
	ns.toast("Share price: " + formatMoney(corporation.sharePrice) +
		", profit: " + formatMoney(profit), profit > 0 ? "success" : "warning", 5000);
	await ns.write("corporation.txt", JSON.stringify(corporation), "w");
	if (!options.local) {
		await ns.scp("corporation.txt", "home");
	}
}

/** @param {NS} ns **/
function expandDivision(ns, division, corporation) {
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
	for (var city of division.cities) {
		var office = ns.corporation.getOffice(division.name, city);
		// increase size of headquarters only after being present in all cities
		if (division.cities.length == c.CITIES.length &&
			city == c.SECTOR12 &&
			office.size < 12) {
			var corp = ns.corporation.getCorporation();
			if (ns.corporation.getOfficeSizeUpgradeCost(division.name, city, 3) < corp.funds) {
				ns.corporation.upgradeOfficeSize(division.name, city, 3);
			}
			office = ns.corporation.getOffice(division.name, city);
		}
		for (var ii = office.employees.length; ii < office.size; ii++) {
			ns.corporation.hireEmployee(division.name, city);
		}
		office = ns.corporation.getOffice(division.name, city);
		await distributeEmployees(ns, division.name, city, office.employees.length);
	}
}

/** @param {NS} ns **/
async function setupDivisionWarehouse(ns, division) {
	for (var city of division.cities) {
		if (!ns.corporation.hasWarehouse(division.name, city)) {
			ns.corporation.purchaseWarehouse(division.name, city);
		}
		if (division.type == TOBACCO) {
			if (division.products.length == 0) {
				ns.corporation.makeProduct(division.name, c.SECTOR12, DROMEDAR, 1e8, 1e8);
			}
			var product = ns.corporation.getProduct(division.name, DROMEDAR);
			if (product.developmentProgress < 100) {
				ns.tprintf("Product %s at %d%%", product.name, product.developmentProgress);
				return;
			}
		}
		if (ns.corporation.hasUnlockUpgrade(SMART_SUPPLY)) {
			ns.corporation.setSmartSupply(division.name, city, true);
		} else {
			var materials = [];
			switch (division.type) {
				case AGRICULTURE:
					materials = [WATER, ENERGY];
					break;
				case TOBACCO:
					materials = [WATER, PLANTS];
					break;
			}
			for (var material of materials) {
				var materialInfo = ns.corporation.getMaterial(division.name, city, material);
				var materialToBuy = -materialInfo.prod;
				if (materialInfo.qty > 100) {
					// too much
					materialToBuy -= 1;
				} else if (materialInfo.qty > 80) {
					// still reduce
					materialToBuy -= 0.25;
				} else if (materialInfo.qty > 20) {
					// this is fine
				} else if (materialInfo.qty > 10) {
					// a bit need more
					materialToBuy += 0.25;
				} else {
					// get going!
					materialToBuy += 1.0;
				}
				materialToBuy = Math.max(0, materialToBuy);
				ns.corporation.buyMaterial(division.name, city, material, materialToBuy);
			}
		}
		switch (division.type) {
			case AGRICULTURE:
				ns.corporation.sellMaterial(division.name, city, FOOD, MAX_SELL, MP_SELL);
				ns.corporation.sellMaterial(division.name, city, PLANTS, MAX_SELL, MP_SELL);
				break;
			case TOBACCO:
				ns.corporation.sellProduct(division.name, city, DROMEDAR, MAX_SELL, MP_SELL);
				break;
		}
		var buying = false;
		buying = purchaseAdditionalMaterial(ns, division.name, city, REALESTATE, 3000) || buying;
		buying = purchaseAdditionalMaterial(ns, division.name, city, HARDWARE, 250) || buying;
		buying = purchaseAdditionalMaterial(ns, division.name, city, ROBOTS, 25) || buying;
		buying = purchaseAdditionalMaterial(ns, division.name, city, AI_CORES, 150) || buying;
		// if the warehouse is full and we are currently allowed to spend
		// expand the warehouse (still limited to level 3, just to be cautious)
		if (!buying && ns.corporation.getCorporation().numShares == 0) {
			if (ns.corporation.getWarehouse(division.name, city).level <
				 Math.min(3, division.cities.length) &&
				ns.corporation.getCorporation().funds >
				 ns.corporation.getUpgradeWarehouseCost(division.name, city)) {
				ns.corporation.upgradeWarehouse(division.name, city);
			}
		}
	}
}

/** @param {NS} ns **/
function purchaseAdditionalMaterial(ns, divisionName, city, material, baseAmount) {
	var amount = baseAmount * ns.corporation.getWarehouse(divisionName, city).level;
	// ns.tprintf("Buying %d of %s for %s in %s", amount, material, divisionName, city);
	var info = ns.corporation.getMaterial(divisionName, city, material);
	var corp = ns.corporation.getCorporation();
	// only spend on addtl. materials while we don't own the company
	var canSpend = corp.numShares == 0;

	if (canSpend && info.qty < amount) {
		ns.corporation.buyMaterial(divisionName, city, material, baseAmount/500.0);
		ns.corporation.sellMaterial(divisionName, city, material, "0", "MP");
		return true;
	}
	ns.corporation.buyMaterial(divisionName, city, material, 0);
	if (info.qty > 1.1 * amount) {
		ns.corporation.sellMaterial(divisionName, city, material, "0.1", "MP");
	} else {
		ns.corporation.sellMaterial(divisionName, city, material, "0", "MP");
	}
	return false;
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