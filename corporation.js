import { formatMoney, getDatabase, getAvailableMoney } from "./helpers.js";
import { reserveBudget, getBudget, deleteBudget } from "budget.js";
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
const MAX_SELL = "1e9";
const MP_SELL = "MP";
const HOLD_BACK_FUNDS = 1e9;
const POORMAN_MONEY = 1e9;
const RICHMAN_MONEY = 1e12;
const MINIMUM_SHARE_PRICE = 1;
const INDUSTRIES = [AGRICULTURE, TOBACCO, FOOD, SOFTWARE];

/** @param {NS} ns **/
export async function main(ns) {
	ns.disableLog("sleep");
	ns.disableLog("getServerMoneyAvailable");
	while (true) {
		var player = ns.getPlayer();
		if (!ns.corporation.hasCorporation()) {
			if (!ns.corporation.createCorporation("ACME", player.bitNodeN != 3)) {
				await ns.sleep(60000);
				continue;
			} else {
				ns.corporation.expandIndustry(AGRICULTURE, AGRICULTURE);
			}
		}
		var corporation = ns.corporation.getCorporation();
		if (!corporation.public) {
			ns.corporation.goPublic(1e9);
			ns.corporation.issueDividends(1);
		}
		await setupCorporation(ns);
		tradeCorporationShares(ns);
		await printCorporationInfo(ns);
		await ns.sleep(10000);
	}
}

function tradeCorporationShares(ns) {
	var corporation = ns.corporation.getCorporation();
	var value = valuation(ns, corporation);
	var low = value / (2 * corporation.totalShares);
	var high = value / (2 * (corporation.totalShares - corporation.issuedShares - corporation.numShares) + 1);
	var target = (low + high) / 2;

	if (shouldSell(ns, corporation, Math.max(target, 0.95 * high), low)) {
		var money = ns.getServerMoneyAvailable("home");
		ns.corporation.sellShares(corporation.numShares);
		ns.corporation.issueDividends(1);
		var earned = ns.getServerMoneyAvailable("home") - money;
		reserveBudget(ns, "corp", earned); // to make sure we can buy back
		ns.toast("Sold corporation shares for " + formatMoney(earned), ns.enums.ToastVariant.SUCCESS, 8000);
		ns.tprintf("Sold corporation shares for %s", formatMoney(earned));
		return;
	}
	if (shouldBuy(ns, corporation, target)) {
		var money = ns.getServerMoneyAvailable("home");
		ns.corporation.issueDividends(0);
		ns.corporation.buyBackShares(corporation.issuedShares);
		var spend = money - ns.getServerMoneyAvailable("home");
		deleteBudget(ns, "corp");
		ns.toast("Bought corporation shares for " + formatMoney(spend), ns.enums.ToastVariant.SUCCESS, 8000);
		ns.tprintf("Bought corporation shares for %s", formatMoney(spend));
	}
}

function shouldSell(ns, corporation, target, low) {
	if (corporation.numShares <= 0 || corporation.shareSaleCooldown) {
		return false;
	}
	if (corporation.sharePrice < MINIMUM_SHARE_PRICE) {
		return false;
	}
	if (getAvailableMoney(ns) > RICHMAN_MONEY) {
		return false;
	}
	return (corporation.sharePrice > target ||
		(corporation.sharePrice > low && getAvailableMoney(ns) < POORMAN_MONEY));
}

function shouldBuy(ns, corporation, target) {
	if (corporation.issuedShares <= 0) {
		return false;
	}
	if (getAvailableMoney(ns) + getBudget(ns, "corp") > RICHMAN_MONEY) {
		return true;
	}
	if (corporation.shareSaleCooldown > 15000) {
		return false;
	}
	if (corporation.sharePrice < target &&
		(corporation.issuedShares * corporation.sharePrice * 1.1 <
			getAvailableMoney(ns) + getBudget(ns, "corp"))) {
		return true;
	}
	if (target == 0 &&
		(corporation.issuedShares * corporation.sharePrice * 1.1 <
			getAvailableMoney(ns) + getBudget(ns, "corp"))) {
		return true;
	}
	return false;
}

/** @param {NS} ns **/
async function setupCorporation(ns) {
	// ns.print("setupCorporation");
	expandIndustry(ns);
	buyCorporationUpgrades(ns);
	var corporation = ns.corporation.getCorporation();

	if (ns.corporation.hasUnlockUpgrade(WAREHOUSE_API)) {
		while (corporation.state == "PURCHASE" || corporation.state == "PRODUCTION") {
			await ns.sleep(100);
			corporation = ns.corporation.getCorporation();
		}
		for (var divisionName of corporation.divisions) {
			await setupDivisionWarehouse(ns, divisionName);
		}
	}
	if (ns.corporation.hasUnlockUpgrade(OFFICE_API)) {
		for (var divisionName of corporation.divisions) {
			corporation = ns.corporation.getCorporation();
			if (ns.corporation.getHireAdVertCount(divisionName) <
				corporation.divisions.length &&
				corporation.numShares == 0) {
				var cost = ns.corporation.getHireAdVertCost(divisionName);
				if (corporation.funds - HOLD_BACK_FUNDS > cost ||
					ns.corporation.getHireAdVertCount(divisionName) == 0) {
					ns.corporation.hireAdVert(divisionName);
					corporation = ns.corporation.getCorporation();
				}
			}
			await setupDivisionOffice(ns, divisionName, corporation.divisions.length);
			if (ns.corporation.hasUnlockUpgrade(WAREHOUSE_API)) {
				const division = ns.corporation.getDivision(divisionName);
				if (division.products.length) {
					// don't expand this division if there is a product development going on
					var product = ns.corporation.getProduct(divisionName,
						division.products[0]);
					if (product.developmentProgress < 100) {
						continue;
					}
				}
				// only expand if we can manage it completely
				expandDivision(ns, divisionName, corporation);
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
	var money = corporation.funds;
	for (var unlock of [WAREHOUSE_API, OFFICE_API]) {
		if (!ns.corporation.hasUnlockUpgrade(unlock)) {
			var cost = ns.corporation.getUnlockUpgradeCost(unlock);
			if (money > cost) {
				ns.corporation.unlockUpgrade(unlock);
				money -= cost;
			}
		}
	}
	money -= HOLD_BACK_FUNDS;
	for (var upgrade of [DREAM_SENSE, SMART_FACTORIES, SMART_STORAGE]) {
		if (ns.corporation.getUpgradeLevel(upgrade) < corporation.divisions.length) {
			var cost = ns.corporation.getUpgradeLevelCost(upgrade);
			if (money > cost) {
				ns.corporation.levelUpgrade(upgrade);
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
	var currentDivision = ns.corporation.getDivision(corporation.divisions[corporation.divisions.length - 1]);
	if (currentDivision.cities.length < c.CITIES.length) {
		// not fully expanded
		return;
	}
	var industry = INDUSTRIES[corporation.divisions.length];
	const industryData = ns.corporation.getIndustryData(industry)
	if (corporation.funds - HOLD_BACK_FUNDS < industryData.startingCost) {
		// not enough funds to expand
		return;
	}
	ns.tprintf("Expanding to industry: %s", industry);
	ns.corporation.expandIndustry(industry, industry);
}

/** @param {NS} ns **/
async function printCorporationInfo(ns) {
	var corporation = ns.corporation.getCorporation();
	var value = valuation(ns, corporation);
	var low = value / (2 * corporation.totalShares);
	var high = value / (2 * (corporation.totalShares - corporation.issuedShares - corporation.numShares) + 1);
	corporation.valuation = value;
	var profit = corporation.revenue - corporation.expenses;
	corporation.bonusTime = ns.corporation.getBonusTime();
	ns.printf("Corporation: share=%s (%s-%s), funds=%s, profit=%s, cool=%d s, owned=%s",
		formatMoney(corporation.sharePrice), formatMoney(low), formatMoney(high),
		formatMoney(corporation.funds),
		formatMoney(profit),
		Math.ceil(corporation.shareSaleCooldown / 5),
		corporation.issuedShares == 0 ? "*" : "-");
	ns.write("corporation.txt", JSON.stringify(corporation), "w");
	if (ns.getHostname() != "home") {
		ns.scp("corporation.txt", "home");
	}
}

/** @param {NS} ns **/
function valuation(ns, corporation) {
	var profit = corporation.revenue - corporation.expenses;

	var val = corporation.funds + profit * 85e3;
	val *= Math.pow(1.1, corporation.divisions.length);
	val = Math.max(val, 0);

	const database = getDatabase(ns);
	val *= database.bitnodemultipliers.CorporationValuation;

	return val;
}

/** @param {NS} ns **/
function expandDivision(ns, divisionName, corporation) {
	const division = ns.corporation.getDivision(divisionName);
	if (corporation.numShares > 0) {
		return;
	}
	if (division.cities.length >= c.CITIES.length) {
		return;
	}
	var money = corporation.funds - HOLD_BACK_FUNDS;
	const corporationConstants = ns.corporation.getConstants();
	const expansionCost = corporationConstants.officeInitialCost + corporationConstants.warehouseInitialCost;
	// ns.printf("Cost to expand: %s", formatMoney(expansionCost));
	for (var nextCity of c.CITIES.filter(a => !division.cities.includes(a))) {
		if (money > expansionCost) {
			ns.tprintf("Expanding to %s", nextCity);
			ns.corporation.expandCity(division.name, nextCity);
			ns.corporation.purchaseWarehouse(division.name, nextCity);
			money -= expansionCost;
		}
	}
}

/** @param {NS} ns **/
async function setupDivisionOffice(ns, divisionName, sizeFactor) {
	// ns.print("setupDivisionOffices");
	const division = ns.corporation.getDivision(divisionName);
	for (var city of division.cities) {
		var office = ns.corporation.getOffice(divisionName, city);
		// increase office size only after being present in all cities
		if (division.cities.length == c.CITIES.length &&
			office.size < 9 * sizeFactor) {
			var corp = ns.corporation.getCorporation();
			if (ns.corporation.getOfficeSizeUpgradeCost(divisionName, city, 3) < corp.funds - HOLD_BACK_FUNDS) {
				ns.corporation.upgradeOfficeSize(divisionName, city, 3);
			}
			office = ns.corporation.getOffice(divisionName, city);
		}
		for (var ii = office.employees; ii < office.size; ii++) {
			ns.corporation.hireEmployee(divisionName, city);
		}
		office = ns.corporation.getOffice(divisionName, city);
		distributeEmployees(ns, division, city, office);
		makeEmployeesHappy(ns, division, city, office);
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
async function setupDivisionWarehouse(ns, divisionName) {
	// ns.print("setupDivisionWarehouse");
	const division = ns.corporation.getDivision(divisionName);
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
					ns.printf("Product %s at %s%%", product.name,
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
					ns.printf("Product %s at %s%%", product.name,
						product.developmentProgress.toFixed(2));
					return;
				}
				break;
			case SOFTWARE:
				if (division.products.length == 0) {
					ns.corporation.makeProduct(division.name, c.SECTOR12, BURNER, 1e8, 1e8);
				}
				var product = ns.corporation.getProduct(division.name, BURNER);
				if (product.developmentProgress < 100) {
					ns.printf("Product %s at %d%%", product.name, product.developmentProgress);
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
	var info = ns.corporation.getMaterial(divisionName, city, material);
	var corp = ns.corporation.getCorporation();
	// only spend on addtl. materials while we don't own the company
	var canSpend = corp.numShares == 0;

	if (canSpend && info.qty < amount) {
		// ns.printf("Buying %d of %s for %s in %s", amount, material, divisionName, city);
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
function distributeEmployees(ns, division, city, office) {
	// ns.tprint("distributeEmployees");
	var toDistribute = office.employees;
	var wanted = {
		management: Math.floor(toDistribute / 9),
		business: Math.floor(toDistribute / 9),
		research: Math.floor(toDistribute / 9),
		engineers: 1 + Math.floor(toDistribute / 9)
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
	const have = office.employeeJobs;
	// ns.tprintf("Employee distribution: %s", JSON.stringify(office.employeeJobs));
	// ns.tprintf("Wanted: %s", JSON.stringify(wanted));
	// ns.tprintf("Have:   %s", JSON.stringify(have));
	if (wanted.business < have[BUSINESS]) {
		ns.corporation.setAutoJobAssignment(division.name, city, BUSINESS, wanted.business);
	}
	if (wanted.research < have[RESEARCH]) {
		ns.corporation.setAutoJobAssignment(division.name, city, RESEARCH, wanted.research);
	}
	if (wanted.management < have[MANAGEMENT]) {
		ns.corporation.setAutoJobAssignment(division.name, city, MANAGEMENT, wanted.management);
	}
	if (wanted.engineers < have[ENGINEER]) {
		ns.corporation.setAutoJobAssignment(division.name, city, ENGINEER, wanted.engineers);
	}
	if (wanted.operations < have[OPERATIONS]) {
		ns.corporation.setAutoJobAssignment(division.name, city, OPERATIONS, wanted.operations);
	}
	if (wanted.business > have[BUSINESS]) {
		ns.corporation.setAutoJobAssignment(division.name, city, BUSINESS, wanted.business);
	}
	if (wanted.research > have[RESEARCH]) {
		ns.corporation.setAutoJobAssignment(division.name, city, RESEARCH, wanted.research);
	}
	if (wanted.management > have[MANAGEMENT]) {
		ns.corporation.setAutoJobAssignment(division.name, city, MANAGEMENT, wanted.management);
	}
	if (wanted.engineers > have[ENGINEER]) {
		ns.corporation.setAutoJobAssignment(division.name, city, ENGINEER, wanted.engineers);
	}
	if (wanted.operations > have[OPERATIONS]) {
		ns.corporation.setAutoJobAssignment(division.name, city, OPERATIONS, wanted.operations);
	}
	// ns.printf("Employee distribution: %s", JSON.stringify(office.employeeJobs));
	// ns.print("Done distributing");
}

/** @param {NS} ns **/
function makeEmployeesHappy(ns, division, city, office) {
	// ns.tprintf("Checking employees in division %s, city %s", division.name, city);
	// ns.tprintf("Office: %s", JSON.stringify(office));
	if (office.avgHap < 0.85 * office.maxHap) {
		ns.printf("Happines is %s, need a party in division %s, city %s", office.avgHap.toFixed(1), division.name, city);
		ns.corporation.throwParty(division.name, city, 1e6);
	}
	if (office.avgMor < 0.85 * office.maxMor) {
		ns.printf("Morale is %s, need a party in division %s, city %s", office.avgMor.toFixed(1), division.name, city);
		ns.corporation.throwParty(division.name, city, 1e6);
	}
	if (office.avgEne < 0.85 * office.maxEne) {
		ns.printf("Energy is %s, need a cofee in division %s, city %s", office.avgEne.toFixed(1), division.name, city);
		ns.corporation.buyCoffee(division.name, city);
	}
	/*
	if (office.avgHap < office.minHap + 0.75 * (office.maxHap - office.minHap)) {
		ns.tprintf("Happines is %s, need a party in division %s, city %s", office.avgHap, division.name, city);
		ns.corporation.throwParty(disvision.name, city, 1e6);
	}
	if (office.avgMor < office.minMor + 0.75 * (office.maxMor - office.minMor)) {
		ns.tprintf("Morale is %s, need a party in division %s, city %s", office.avgMor, division.name, city);
		ns.corporation.throwParty(disvision.name, city, 1e6);
	}
	if (office.avgEne < office.minEne + 0.75 * (office.maxEne - office.minEne)) {
		ns.tprintf("Energy is %s, need a cofee in division %s, city %s", office.avgEne, division.name, city);
	}
	*/
}