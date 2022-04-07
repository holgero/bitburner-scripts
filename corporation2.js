import { formatMoney } from "./helpers.js";
import * as c from "./constants.js";

const AGRICULTURE = "Agriculture";
const TOBACCO = "Tobacco";
const SOFTWARE = "Software";
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
const LABORATORY = "Hi-Tech R&D Laboratory";
const MARKET_TA_I = "Market-TA.I";
const MARKET_TA_II = "Market-TA.II";
const WATER = "Water";
const ENERGY = "Energy";
const FOOD = "Food";
const PLANTS = "Plants";
const HARDWARE = "Hardware";
const ROBOTS = "Robots";
const AI_CORES = "AI Cores";
const REALESTATE = "Real Estate";
const RESTAURANT = "Restaurant";
const DROMEDAR = "Dromedar";
const BURNER = "ByteBurner";
const MAX_SELL = "MAX";
const MP_SELL = "MP";
const HOLD_BACK_FUNDS = 10e9;

const INDUSTRIES = [AGRICULTURE, TOBACCO, FOOD, SOFTWARE];

/** @param {NS} ns **/
export async function main(ns) {
	var options = ns.flags([
		["milk", false],
		["sell", false],
		["buy", false],
		["setup", false],
		["quiet", false],
		["local", false],
		["restart", "[]"]]);
	var processList = JSON.parse(options.restart);

	if (options.milk && !ns.corporation.getCorporation().shareSaleCooldown) {
		ns.corporation.sellShares(1000000000);
		await ns.sleep(1000);
		ns.corporation.buyBackShares(1000000000);
	}
	if (options.sell && !ns.corporation.getCorporation().shareSaleCooldown) {
		ns.corporation.sellShares(ns.corporation.getCorporation().numShares);
		ns.corporation.issueDividends(1);
	}
	if (options.buy) {
		ns.corporation.issueDividends(0);
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
	await printCorporationInfo(ns, options);
	if (processList.length) {
		restorePreviousScripts(ns, processList);
	}
}

/** @param {NS} ns **/
async function setupCorporation(ns) {
	ns.print("setupCorporation");
	expandIndustry(ns);
	buyCorporationUpgrades(ns);
	var corporation = ns.corporation.getCorporation();

	if (ns.corporation.hasUnlockUpgrade(WAREHOUSE_API)) {
		while (corporation.state == "PURCHASE" || corporation.state == "PRODUCTION") {
			await ns.sleep(100);
			corporation = ns.corporation.getCorporation();
		}
		for (var division of corporation.divisions) {
			await setupDivisionWarehouse(ns, division);
		}
	}
	if (ns.corporation.hasUnlockUpgrade(OFFICE_API)) {
		for (var division of corporation.divisions) {
			corporation = ns.corporation.getCorporation();
			if (ns.corporation.getHireAdVertCount(division.name) <
				corporation.divisions.length &&
				corporation.numShares == 0) {
				var cost = ns.corporation.getHireAdVertCost(division.name);
				if (corporation.funds - HOLD_BACK_FUNDS > cost) {
					ns.corporation.hireAdVert(division.name);
					corporation = ns.corporation.getCorporation();
				}
			}
			await setupDivisionOffice(ns, division, corporation.divisions.length);
			if (ns.corporation.hasUnlockUpgrade(WAREHOUSE_API)) {
				if (division.products.length) {
					// don't expand this division if there is a product development going on
					var product = ns.corporation.getProduct(division.name,
						division.products[0]);
					if (product.developmentProgress < 100) {
						continue;
					}
				}
				// only expand if we can manage it completely
				expandDivision(ns, division, corporation);
			}
		}
	}
}

/** @param {NS} ns **/
function buyCorporationUpgrades(ns) {
	var corporation = ns.corporation.getCorporation();
	if (corporation.numShares > 0) {
		// spend money only while the shares belong to someone else
		return;
	}
	var money = corporation.funds - HOLD_BACK_FUNDS;
	for (var upgrade of [DREAM_SENSE, SMART_FACTORIES, SMART_STORAGE]) {
		if (ns.corporation.getUpgradeLevel(upgrade) < corporation.divisions.length) {
			var cost = ns.corporation.getUpgradeLevelCost(upgrade);
			if (money > cost) {
				ns.corporation.levelUpgrade(upgrade);
				money -= cost;
			}
		}
	}
	for (var unlock of [WAREHOUSE_API, OFFICE_API]) {
		if (!ns.corporation.hasUnlockUpgrade(unlock)) {
			var cost = ns.corporation.getUnlockUpgradeCost(unlock);
			if (money > cost) {
				ns.corporation.unlockUpgrade(unlock);
				money -= cost;
			}
		}
	}
}

/** @param {NS} ns **/
function expandIndustry(ns) {
	var corporation = ns.corporation.getCorporation();
	if (corporation.numShares > 0) {
		// expand only while the shares belong to someone else
		return;
	}
	if (!ns.corporation.hasUnlockUpgrade(OFFICE_API) ||
		!ns.corporation.hasUnlockUpgrade(WAREHOUSE_API)) {
		// need the APIs for automatic expansion
		return;
	}
	if (corporation.divisions.length >= INDUSTRIES.length) {
		// maximum expansion reached
		return;
	}
	var currentDivision = corporation.divisions.slice(-1);
	if (currentDivision.cities.length < c.CITIES.length) {
		// not fully expanded
		return;
	}
	var industry = INDUSTRIES[corporation.divisions.length];
	if (corporation.funds - HOLD_BACK_FUNDS <
		ns.corporation.getExpandIndustryCost(industry)) {
		// not enough funds to expand
		return;
	}
	ns.tprintf("Expanding to industry: %s");
	ns.corporation.expandIndustry(industry, industry);
}

/** @param {NS} ns **/
async function printCorporationInfo(ns, options) {
	var corporation = ns.corporation.getCorporation();
	corporation.valuation = valuation(ns, corporation);
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
function valuation(ns, corporation) {
	var profit = corporation.revenue - corporation.expenses;

	var val = corporation.funds + profit * 85e3;
	val *= Math.pow(1.1, corporation.divisions.length);
	val = Math.max(val, 0);

	return val;
}

/** @param {NS} ns **/
function expandDivision(ns, division, corporation) {
	if (corporation.numShares > 0) {
		return;
	}
	if (division.cities.length >= c.CITIES.length) {
		return;
	}
	var money = corporation.funds - HOLD_BACK_FUNDS;
	const expansionCost = ns.corporation.getExpandCityCost() + ns.corporation.getPurchaseWarehouseCost();
	for (var nextCity of c.CITIES.filter(a => !division.cities.includes(a))) {
		ns.tprintf("Expanding to %s", nextCity);
		if (money > expansionCost) {
			ns.corporation.expandCity(division.name, nextCity);
			ns.corporation.purchaseWarehouse(division.name, nextCity);
			money -= expansionCost;
		}
	}
}

/** @param {NS} ns **/
async function setupDivisionOffice(ns, division, sizeFactor) {
	ns.print("setupDivisionOffices");
	for (var city of division.cities) {
		var office = ns.corporation.getOffice(division.name, city);
		// increase office size only after being present in all cities
		if (division.cities.length == c.CITIES.length &&
			office.size < 9 * sizeFactor) {
			var corp = ns.corporation.getCorporation();
			if (ns.corporation.getOfficeSizeUpgradeCost(division.name, city, 3) < corp.funds - HOLD_BACK_FUNDS) {
				ns.corporation.upgradeOfficeSize(division.name, city, 3);
			}
			office = ns.corporation.getOffice(division.name, city);
		}
		for (var ii = office.employees.length; ii < office.size; ii++) {
			ns.corporation.hireEmployee(division.name, city);
		}
		office = ns.corporation.getOffice(division.name, city);
		await distributeEmployees(ns, division, city, office);
	}
	if (division.research) {
		for (var researchName of [LABORATORY, MARKET_TA_I, MARKET_TA_II]) {
			if (!ns.corporation.hasResearched(division.name, researchName)) {
				if (ns.corporation.getResearchCost(division.name, researchName) < division.research) {
					ns.corporation.research(division.name, researchName);
					break;
				}
			}
		}
	}
}

/** @param {NS} ns **/
async function setupDivisionWarehouse(ns, division) {
	ns.print("setupDivisionWarehouse");
	for (var city of division.cities) {
		if (!ns.corporation.hasWarehouse(division.name, city)) {
			ns.corporation.purchaseWarehouse(division.name, city);
		}
		switch (division.type) {
			case FOOD:
				if (division.products.length == 0) {
					ns.corporation.makeProduct(division.name, c.SECTOR12, RESTAURANT, 1e8, 1e8);
				}
				var product = ns.corporation.getProduct(division.name, RESTAURANT);
				if (product.developmentProgress < 100) {
					ns.tprintf("Product %s at %s%%", product.name,
						product.developmentProgress.toFixed(2));
					return;
				}
				break;
			case TOBACCO:
				if (division.products.length == 0) {
					ns.corporation.makeProduct(division.name, c.SECTOR12, DROMEDAR, 1e8, 1e8);
				}
				var product = ns.corporation.getProduct(division.name, DROMEDAR);
				if (product.developmentProgress < 100) {
					ns.tprintf("Product %s at %d%%", product.name, product.developmentProgress);
					return;
				}
				break;
			case SOFTWARE:
				if (division.products.length == 0) {
					ns.corporation.makeProduct(division.name, c.SECTOR12, BURNER, 1e8, 1e8);
				}
				var product = ns.corporation.getProduct(division.name, BURNER);
				if (product.developmentProgress < 100) {
					ns.tprintf("Product %s at %d%%", product.name, product.developmentProgress);
					// no return here: we can still produce AI Cores
				}
				break;
		}
		if (ns.corporation.hasUnlockUpgrade(SMART_SUPPLY)) {
			ns.corporation.setSmartSupply(division.name, city, true);
		} else {
			var materials = [];
			switch (division.type) {
				case FOOD:
					materials = [WATER, FOOD, ENERGY];
					break;
				case AGRICULTURE:
					materials = [WATER, ENERGY];
					break;
				case TOBACCO:
					materials = [WATER, PLANTS];
					break;
				case SOFTWARE:
					materials = [ENERGY, HARDWARE];
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
			case FOOD:
				setProductSellParameters(ns, division.name, city, RESTAURANT);
				break;
			case AGRICULTURE:
				setMaterialSellParameters(ns, division.name, city, FOOD);
				setMaterialSellParameters(ns, division.name, city, PLANTS);
				break;
			case TOBACCO:
				setProductSellParameters(ns, division.name, city, DROMEDAR);
				break;
			case SOFTWARE:
				setMaterialSellParameters(ns, division.name, city, AI_CORES);
				setProductSellParameters(ns, division.name, city, BURNER);
				break;
		}
		var buying = false;
		buying = purchaseAdditionalMaterial(ns, division.name, city, REALESTATE, 3000) || buying;
		buying = purchaseAdditionalMaterial(ns, division.name, city, ROBOTS, 25) || buying;
		if (division.type != SOFTWARE) {
			buying = purchaseAdditionalMaterial(ns, division.name, city, HARDWARE, 250) || buying;
			buying = purchaseAdditionalMaterial(ns, division.name, city, AI_CORES, 150) || buying;
		}
		// if the warehouse is full and we are currently allowed to spend
		// expand the warehouse
		if (!buying && ns.corporation.getCorporation().numShares == 0 &&
			ns.corporation.hasUnlockUpgrade(OFFICE_API)) {
			if (ns.corporation.getWarehouse(division.name, city).level <
				Math.min(ns.corporation.getOffice(division.name, city).employees.length,
					division.cities.length) &&
				ns.corporation.getCorporation().funds - HOLD_BACK_FUNDS >
				ns.corporation.getUpgradeWarehouseCost(division.name, city)) {
				ns.corporation.upgradeWarehouse(division.name, city);
			}
		}
	}
}

/** @param {NS} ns **/
function setMaterialSellParameters(ns, divisionName, city, material) {
	if (ns.corporation.hasUnlockUpgrade(OFFICE_API)) {
		if (ns.corporation.hasResearched(divisionName, MARKET_TA_II)) {
			ns.corporation.setMaterialMarketTA2(divisionName, city, material, true);
			return;
		}
		if (ns.corporation.hasResearched(divisionName, MARKET_TA_I)) {
			ns.corporation.setMaterialMarketTA1(divisionName, city, material, true);
			return;
		}
	}
	ns.corporation.sellMaterial(divisionName, city, material, MAX_SELL, MP_SELL);
}

/** @param {NS} ns **/
function setProductSellParameters(ns, divisionName, city, product) {
	if (ns.corporation.hasUnlockUpgrade(OFFICE_API)) {
		if (ns.corporation.hasResearched(divisionName, MARKET_TA_II)) {
			ns.corporation.setProductMarketTA2(divisionName, product, true);
			return;
		}
		if (ns.corporation.hasResearched(divisionName, MARKET_TA_I)) {
			ns.corporation.setProductMarketTA1(divisionName, product, true);
			return;
		}
	}
	ns.corporation.sellProduct(divisionName, city, product, MAX_SELL, MP_SELL, true);
}

/** @param {NS} ns **/
function purchaseAdditionalMaterial(ns, divisionName, city, material, baseAmount) {
	var amount = baseAmount * ns.corporation.getWarehouse(divisionName, city).level;
	ns.printf("Buying %d of %s for %s in %s", amount, material, divisionName, city);
	var info = ns.corporation.getMaterial(divisionName, city, material);
	var corp = ns.corporation.getCorporation();
	// only spend on addtl. materials while we don't own the company
	var canSpend = corp.numShares == 0;

	if (canSpend && info.qty < amount) {
		ns.corporation.buyMaterial(divisionName, city, material, baseAmount / 500.0);
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
async function distributeEmployees(ns, division, city, office) {
	ns.print("distributeEmployees");
	var toDistribute = office.size;
	var wanted = {
		management: Math.floor(toDistribute / 9),
		business: Math.floor(toDistribute / 9),
		research: Math.floor(toDistribute / 9),
		engineers: Math.floor(toDistribute / 4)
	};
	if (ns.corporation.hasUnlockUpgrade(WAREHOUSE_API)) {
		var warehouse = ns.corporation.getWarehouse(division.name, city);
		if (warehouse.sizeUsed / warehouse.size > 0.8) {
			wanted.engineers++;
		}
	}
	wanted.operations = toDistribute
		- wanted.management - wanted.business - wanted.research - wanted.engineers;

	if (ns.corporation.hasUnlockUpgrade(WAREHOUSE_API)) {
		if (division.products.length) {
			var product = ns.corporation.getProduct(division.name, division.products[0]);
			if (product.developmentProgress < 100) {
				// during development we want engineers only
				wanted.engineers = toDistribute;
				wanted.management = 0;
				wanted.business = 0;
				wanted.research = 0;
				wanted.operations = 0;
			}
		}
	}
	var have = { management: 0, business: 0, research: 0, engineers: 0, operations: 0 };
	for (var employee of office.employees) {
		switch (ns.corporation.getEmployee(division.name, city, employee).pos) {
			case RESEARCH:
				have.research++;
				break;
			case MANAGEMENT:
				have.management++;
				break;
			case BUSINESS:
				have.business++;
				break;
			case ENGINEER:
				have.engineers++;
				break;
			case OPERATIONS:
				have.operations++;
				break;
		}
	}
	ns.printf("Wanted: %s", JSON.stringify(wanted));
	ns.printf("Have:   %s", JSON.stringify(have));
	if (wanted.business != have.business) {
		await ns.corporation.setAutoJobAssignment(division.name, city, BUSINESS, wanted.business);
	}
	if (wanted.research != have.research) {
		await ns.corporation.setAutoJobAssignment(division.name, city, RESEARCH, wanted.research);
	}
	if (wanted.management != have.management) {
		await ns.corporation.setAutoJobAssignment(division.name, city, MANAGEMENT, wanted.management);
	}
	if (wanted.engineers != have.engineers) {
		await ns.corporation.setAutoJobAssignment(division.name, city, ENGINEER, wanted.engineers);
	}
	if (wanted.operations != have.operations) {
		await ns.corporation.setAutoJobAssignment(division.name, city, OPERATIONS, wanted.operations);
	}
	ns.print("Done distributing");
}

/** @param {NS} ns **/
function restorePreviousScripts(ns, processList) {
	ns.printf("Commands to restore: %s", JSON.stringify(processList));
	// run all scripts, but the last
	for (var ii = 0; ii < processList.length - 1; ii++) {
		var process = processList[ii];
		ns.run(process.filename, process.threads, ...process.args);
	}
	var lastProcess = processList.pop();
	ns.printf("Last command to restore: %s", JSON.stringify(lastProcess));
	// and spawn the last one
	ns.spawn(lastProcess.filename, lastProcess.threads, ...lastProcess.args);
}