import { formatMoney, getDatabase, getAvailableMoney, getRestrictions } from "./helpers.js";
import { reserveBudget, getBudget, deleteBudget } from "budget.js";
import * as c from "./constants.js";

const AGRICULTURE = "Agriculture";
const TOBACCO = "Tobacco";
const SOFTWARE = "Software";
const WAREHOUSE_API = "Warehouse API";
const OFFICE_API = "Office API";
const SMART_SUPPLY = "Smart Supply";
const OPERATIONS = "Operations";
const INTERN = "Intern";
const ENGINEER = "Engineer";
const BUSINESS = "Business";
const MANAGEMENT = "Management";
const RESEARCH = "Research & Development";
const LABORATORY = "Hi-Tech R&D Laboratory";
const MARKET_TA_I = "Market-TA.I";
const MARKET_TA_II = "Market-TA.II";
const METAL = "Metal";
const WATER = "Water";
const DRUGS = "Drugs";
const FOOD = "Food";
const FISHING = "Fishing";
const CHEMICAL = "Chemical";
const CHEMICALS = "Chemicals";
const MINING = "Mining";
const MINERALS = "Minerals";
const PLANTS = "Plants";
const HARDWARE = "Hardware";
const ROBOTS = "Robots";
const AI_CORES = "AI Cores";
const ORE = "Ore";
const REALESTATE = "Real Estate";
const REFINERY = "Refinery";
const RESTAURANT = "Restaurant";
const SPRINGWATER = "Spring Water";
const COMPUTER_HARDWARE = "Computer Hardware";
const PHARMA = "Pharmaceutical";
const HEALTH = "Healthcare";
const UTILITY = "Water Utilities";
const ROBOTICS = "Robotics";
const DROMEDAR = "Dromedar";
const BURNER = "ByteBurner";
const PEAR = "Pear";
const BEAST = "Beast";
const ASPARGIN = "Aspargin";
const HOSPITAL = "Hospital";
const PROPERTY = "Lar Mago";
const MAX_SELL = "MAX";
const MP_SELL = "MP";
const HOLD_BACK_FUNDS = 1e9;
const POORMAN_MONEY = 1e9;
const INDUSTRIES = [AGRICULTURE, TOBACCO, RESTAURANT, SOFTWARE, REALESTATE, REFINERY, SPRINGWATER, CHEMICAL, COMPUTER_HARDWARE, FISHING, ROBOTICS, MINING, PHARMA, UTILITY, HEALTH];

/** @param {NS} ns **/
export async function main(ns) {
	ns.disableLog("sleep");
	ns.disableLog("getServerMoneyAvailable");
	while (true) {
		var player = ns.getPlayer();
		if (!ns.corporation.hasCorporation()) {
			const restrictions = getRestrictions(ns);
			if (restrictions && restrictions.nocorporation) {
				return;
			}
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
		setDividends(ns);
		await printCorporationInfo(ns);
		await ns.sleep(10000);
	}
}

/** @param {NS} ns **/
function setDividends(ns) {
	const corporation = ns.corporation.getCorporation();
	if (corporation.funds < 0) {
		ns.corporation.issueDividends(0);
	}
	if (corporation.issuedShares > 0) {
		ns.corporation.issueDividends(1);
	} else {
		const database = getDatabase(ns);
		if (database.bitnodemultipliers.CorporationValuation < 0.05) {
			// trading shares is not profitable, so take some dividends instead
			ns.corporation.issueDividends(0.5);
		} else {
			ns.corporation.issueDividends(0);
		}
	}
}

/** @param {NS} ns **/
function tradeCorporationShares(ns) {
	var corporation = ns.corporation.getCorporation();
	const valuePerShare = valuation(ns, corporation) / corporation.totalShares;
	const low = 0.5 * valuePerShare;
	const high = 1.5 * valuePerShare;

	if (shouldSell(ns, corporation, 0.9 * high, low)) {
		var money = ns.getServerMoneyAvailable("home");
		const sharesToSell = Math.min(corporation.numShares - 1, 10e9);
		ns.corporation.sellShares(sharesToSell);
		var earned = ns.getServerMoneyAvailable("home") - money;
		reserveBudget(ns, "corp", earned); // to make sure we can buy back
		ns.toast("Sold corporation shares for " + formatMoney(earned), ns.enums.ToastVariant.SUCCESS, 8000);
		ns.tprintf("Sold %d corporation shares for %s", sharesToSell, formatMoney(earned));
		return;
	}
	if (shouldBuy(ns, corporation, valuePerShare)) {
		var money = ns.getServerMoneyAvailable("home");
		const affordableShares = Math.min(corporation.issuedShares,
			Math.floor(money / (1.1 * corporation.sharePrice)));
		if (affordableShares > 0.95 * corporation.issuedShares) {
			ns.corporation.buyBackShares(affordableShares);
			var spend = money - ns.getServerMoneyAvailable("home");
			ns.toast("Bought corporation shares for " + formatMoney(spend), ns.enums.ToastVariant.SUCCESS, 8000);
			ns.tprintf("Bought corporation shares for %s", formatMoney(spend));
			if (affordableShares >= corporation.issuedShares) {
				deleteBudget(ns, "corp");
			}
		}
		return;
	}
	if (shouldIssue(ns, corporation, low, high)) {
		const corpGain = ns.corporation.issueNewShares();
		ns.tprintf("Issued new shares for %s", formatMoney(corpGain));
		return;
	}
}

/** @param {NS} ns **/
function shouldSell(ns, corporation, target, low) {
	if (corporation.numShares <= 1 || corporation.shareSaleCooldown) {
		return false;
	}
	if (corporation.sharePrice < minimumSharePrice(ns)) {
		return false;
	}
	return (corporation.sharePrice > target ||
		(corporation.sharePrice > low && getAvailableMoney(ns) < POORMAN_MONEY));
}

/** @param {NS} ns **/
function shouldIssue(ns, corporation, low, high) {
	if (corporation.issueNewSharesCooldown) {
		return false;
	}
	if (corporation.sharePrice < low) {
		return true;
	}
	if (corporation.sharePrice < minimumSharePrice(ns) && corporation.sharePrice <= high) {
		return true;
	}
	return false;
}

/** @param {NS} ns **/
function shouldBuy(ns, corporation, target) {
	if (corporation.issuedShares <= 0) {
		return false;
	}
	if (corporation.shareSaleCooldown > 16500) {
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
function minimumSharePrice(ns) {
	const database = getDatabase(ns);
	const valuationFactor = database.bitnodemultipliers.CorporationValuation;
	if (valuationFactor < 1) {
		return Math.max(1, 10 * valuationFactor);
	}
	return 10;
}

/** @param {NS} ns **/
function canSpend(ns) {
	const corp = ns.corporation.getCorporation();
	if (corp.numShares <= 1) {
		// corporation currently belongs someone else, so freely spend its funds
		return true;
	}
	const database = getDatabase(ns);
	if (database.bitnodemultipliers.CorporationValuation < 0.05) {
		// valuation is too low for trading, share price is not important
		return true;
	}
	if (corp.funds > 100 * HOLD_BACK_FUNDS) {
		return true;
	}
	// keep funds to increase share price
	return false;
}

/** @param {NS} ns **/
async function setupCorporation(ns) {
	// ns.print("setupCorporation");
	expandIndustry(ns);
	buyCorporationUpgrades(ns);
	var corporation = ns.corporation.getCorporation();

	if (ns.corporation.hasUnlock(WAREHOUSE_API)) {
		while (corporation.state == "PURCHASE" || corporation.state == "PRODUCTION") {
			await ns.sleep(100);
			corporation = ns.corporation.getCorporation();
		}
		for (var divisionName of corporation.divisions) {
			await setupDivisionWarehouse(ns, divisionName);
		}
	}
	if (ns.corporation.hasUnlock(OFFICE_API)) {
		for (var divisionName of corporation.divisions) {
			corporation = ns.corporation.getCorporation();
			if (ns.corporation.getHireAdVertCount(divisionName) <
				3 * corporation.divisions.length &&
				canSpend(ns)) {
				var cost = ns.corporation.getHireAdVertCost(divisionName);
				if (corporation.funds - HOLD_BACK_FUNDS > cost ||
					ns.corporation.getHireAdVertCount(divisionName) == 0) {
					ns.corporation.hireAdVert(divisionName);
					corporation = ns.corporation.getCorporation();
				}
			}
			await setupDivisionOffice(ns, divisionName, corporation.divisions.length);
			if (ns.corporation.hasUnlock(WAREHOUSE_API)) {
				const division = ns.corporation.getDivision(divisionName);
				if (division.products.length) {
					// don't expand this division if there is a product development going on
					var product = ns.corporation.getProduct(divisionName, c.SECTOR12,
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
	if (!canSpend(ns)) {
		return;
	}
	const corporation = ns.corporation.getCorporation();
	var money = corporation.funds;
	for (var unlock of [WAREHOUSE_API, OFFICE_API]) {
		if (!ns.corporation.hasUnlock(unlock)) {
			var cost = ns.corporation.getUnlockCost(unlock);
			if (money > cost) {
				ns.corporation.purchaseUnlock(unlock);
				money -= cost;
			}
		}
	}
	money -= HOLD_BACK_FUNDS;
	for (var unlock of ns.corporation.getConstants().unlockNames) {
		if (!ns.corporation.hasUnlock(unlock)) {
			var cost = ns.corporation.getUnlockCost(unlock);
			if (money > cost) {
				ns.corporation.purchaseUnlock(unlock);
				money -= cost;
			}
		}
	}

	for (const upgrade of ns.corporation.getConstants().upgradeNames) {
		var maxLevel = 4 * corporation.divisions.length;
		if (upgrade == "Wilson Analytics") {
			maxLevel /= 4; // it's too expensive
		}
		if (ns.corporation.getUpgradeLevel(upgrade) < maxLevel ||
			ns.corporation.getUpgradeLevelCost(upgrade) < money / 1000) {
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
	if (!canSpend(ns)) {
		return;
	}
	const corporation = ns.corporation.getCorporation();
	if (!ns.corporation.hasUnlock(OFFICE_API) ||
		!ns.corporation.hasUnlock(WAREHOUSE_API)) {
		// need the APIs for automatic expansion
		return;
	}
	if (corporation.divisions.length >= INDUSTRIES.length) {
		// maximum expansion reached
		return;
	}
	if (corporation.divisions.length > 0) {
		var currentDivision = ns.corporation.getDivision(corporation.divisions[corporation.divisions.length - 1]);
		if (currentDivision.cities.length < c.CITIES.length) {
			// not fully expanded
			return;
		}
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
	const corporation = ns.corporation.getCorporation();
	const value = valuation(ns, corporation);
	const valuePerShare = value / corporation.totalShares;
	const low = 0.5 * valuePerShare;
	const high = 1.5 * valuePerShare;
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
	if (!canSpend(ns)) {
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
	const cities = ns.corporation.getDivision(divisionName).cities;
	for (var city of cities) {
		var office = ns.corporation.getOffice(divisionName, city);
		// increase office size only after being present in all cities
		if (cities.length == c.CITIES.length &&
			office.size < 9 * sizeFactor) {
			const funds = ns.corporation.getCorporation().funds;
			if (ns.corporation.getOfficeSizeUpgradeCost(divisionName, city, 3) < funds - HOLD_BACK_FUNDS) {
				ns.corporation.upgradeOfficeSize(divisionName, city, 3);
			}
			office = ns.corporation.getOffice(divisionName, city);
		}
		if (cities.length == c.CITIES.length && sizeFactor == 15 &&
			divisionName == REALESTATE && office.size < 500) {
			// achievement "small city"
			const funds = ns.corporation.getCorporation().funds;
			if (ns.corporation.getOfficeSizeUpgradeCost(divisionName, city, 3) < funds - HOLD_BACK_FUNDS) {
				ns.corporation.upgradeOfficeSize(divisionName, city, 3);
			}
			office = ns.corporation.getOffice(divisionName, city);
		}
		if (cities.length == c.CITIES.length && sizeFactor == 15 &&
			ns.corporation.getOffice(REALESTATE, city).size >= 500) {
			const funds = ns.corporation.getCorporation().funds - HOLD_BACK_FUNDS;
			if (ns.corporation.getOfficeSizeUpgradeCost(divisionName, city, 3) < funds / 1000) {
				ns.corporation.upgradeOfficeSize(divisionName, city, 3);
			}
			office = ns.corporation.getOffice(divisionName, city);
		}
		for (var ii = office.numEmployees; ii < office.size; ii++) {
			ns.corporation.hireEmployee(divisionName, city);
		}
		office = ns.corporation.getOffice(divisionName, city);
		distributeEmployees(ns, divisionName, city, office);
		makeEmployeesHappy(ns, divisionName, city, office);
	}
	for (var researchName of [LABORATORY, MARKET_TA_I, MARKET_TA_II]) {
		if (!ns.corporation.hasResearched(divisionName, researchName)) {
			const points = ns.corporation.getDivision(divisionName).researchPoints;
			if (points && ns.corporation.getResearchCost(divisionName, researchName) < points) {
				ns.corporation.research(divisionName, researchName);
			}
		}
	}
	if (ns.corporation.hasResearched(divisionName, MARKET_TA_II)) {
		for (const researchName of ns.corporation.getConstants().researchNames) {
			try {
				const points = ns.corporation.getDivision(divisionName).researchPoints;
				if (points && ns.corporation.getResearchCost(divisionName, researchName) < points) {
					ns.corporation.research(divisionName, researchName);
				}
			} catch (error) {
				// ns.printf("Error researching %s: %v", researchName, error);
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
			case RESTAURANT:
				if (division.products.length == 0) {
					ns.corporation.makeProduct(division.name, c.SECTOR12, RESTAURANT, 1e8, 1e8);
				}
				var product = ns.corporation.getProduct(division.name, c.SECTOR12, RESTAURANT);
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
				var product = ns.corporation.getProduct(division.name, c.SECTOR12, DROMEDAR);
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
				var product = ns.corporation.getProduct(division.name, c.SECTOR12, BURNER);
				if (product.developmentProgress < 100) {
					ns.printf("Product %s at %d%%", product.name, product.developmentProgress);
					// no return here: we can still produce AI Cores
				}
				break;
			case REALESTATE:
				if (division.products.length == 0) {
					ns.corporation.makeProduct(division.name, c.SECTOR12, PROPERTY, 1e8, 1e8);
				}
				var product = ns.corporation.getProduct(division.name, c.SECTOR12, PROPERTY);
				if (product.developmentProgress < 100) {
					ns.printf("Product %s at %d%%", product.name, product.developmentProgress);
					// no return here: we can still produce Real Estate
				}
				break;
			case COMPUTER_HARDWARE:
				if (division.products.length == 0) {
					ns.corporation.makeProduct(division.name, c.SECTOR12, PEAR, 1e8, 1e8);
				}
				var product = ns.corporation.getProduct(division.name, c.SECTOR12, PEAR);
				if (product.developmentProgress < 100) {
					ns.printf("Product %s at %d%%", product.name, product.developmentProgress);
					// no return here: we can still produce hardware
				}
				break;
			case ROBOTICS:
				if (division.products.length == 0) {
					ns.corporation.makeProduct(division.name, c.SECTOR12, BEAST, 1e8, 1e8);
				}
				var product = ns.corporation.getProduct(division.name, c.SECTOR12, BEAST);
				if (product.developmentProgress < 100) {
					ns.printf("Product %s at %d%%", product.name, product.developmentProgress);
					// no return here: we can still produce robots
				}
				break;
			case PHARMA:
				if (division.products.length == 0) {
					ns.corporation.makeProduct(division.name, c.SECTOR12, ASPARGIN, 1e8, 1e8);
				}
				var product = ns.corporation.getProduct(division.name, c.SECTOR12, ASPARGIN);
				if (product.developmentProgress < 100) {
					ns.printf("Product %s at %d%%", product.name, product.developmentProgress);
					// no return here: we can still produce drugs
				}
				break;
			case HEALTH:
				if (division.products.length == 0) {
					ns.corporation.makeProduct(division.name, c.SECTOR12, HOSPITAL, 1e8, 1e8);
				}
				var product = ns.corporation.getProduct(division.name, c.SECTOR12, HOSPITAL);
				if (product.developmentProgress < 100) {
					ns.printf("Product %s at %d%%", product.name, product.developmentProgress);
					return;
				}
				break;
		}
		if (ns.corporation.hasUnlock(SMART_SUPPLY)) {
			ns.corporation.setSmartSupply(division.name, city, true);
		} else {
			var materials = [];
			switch (division.type) {
				case FOOD:
				case RESTAURANT:
					materials = [WATER, FOOD];
					break;
				case AGRICULTURE:
					materials = [WATER, CHEMICALS];
					break;
				case TOBACCO:
					materials = [PLANTS];
					break;
				case SOFTWARE:
					materials = [HARDWARE];
					break;
				case REALESTATE:
					materials = [METAL, PLANTS, WATER, HARDWARE];
					break;
				case REFINERY:
					materials = [ORE];
					break;
				case SPRINGWATER:
					materials = [];
					break;
				case CHEMICAL:
					materials = [PLANTS, WATER];
					break;
				case COMPUTER_HARDWARE:
					materials = [METAL];
					break;
				case FISHING:
					materials = [PLANTS];
					break;
				case ROBOTICS:
					materials = [HARDWARE, AI_CORES];
					break;
				case MINING:
					materials = [HARDWARE];
					break;
				case PHARMA:
					materials = [WATER, CHEMICALS];
					break;
				case UTILITY:
					materials = [HARDWARE];
					break;
				case HEALTH:
					materials = [ROBOTS, AI_CORES, DRUGS, FOOD];
					break;
			}
			const wareHouse = ns.corporation.getWarehouse(division.name, city);
			var capacity = wareHouse.size - wareHouse.sizeUsed;
			for (var material of materials) {
				var materialInfo = ns.corporation.getMaterial(division.name, city, material);
				var materialToBuy = -materialInfo.productionAmount;
				if (materialInfo.stored > 100) {
					// too much
					materialToBuy -= 1;
				} else if (materialInfo.stored > 80) {
					// still reduce
					materialToBuy -= 0.25;
				} else if (materialInfo.stored > 20) {
					// this is fine
				} else if (materialInfo.stored > 10) {
					// a bit need more
					materialToBuy += 0.25;
				} else {
					// get going!
					materialToBuy += 1.0;
				}
				materialToBuy = Math.max(0, Math.min(materialToBuy, capacity / 2));
				ns.corporation.buyMaterial(division.name, city, material, materialToBuy);
				capacity -= materialToBuy;
			}
		}
		switch (division.type) {
			case RESTAURANT:
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
			case REALESTATE:
				setMaterialSellParameters(ns, division.name, city, REALESTATE);
				setProductSellParameters(ns, division.name, city, PROPERTY);
				break;
			case REFINERY:
				setMaterialSellParameters(ns, division.name, city, METAL);
				break;
			case SPRINGWATER:
				setMaterialSellParameters(ns, division.name, city, WATER);
				break;
			case CHEMICAL:
				setMaterialSellParameters(ns, division.name, city, CHEMICALS);
				break;
			case FISHING:
				setMaterialSellParameters(ns, division.name, city, FOOD);
				break;
			case COMPUTER_HARDWARE:
				setMaterialSellParameters(ns, division.name, city, HARDWARE);
				setProductSellParameters(ns, division.name, city, PEAR);
				break;
			case ROBOTICS:
				setMaterialSellParameters(ns, division.name, city, ROBOTS);
				setProductSellParameters(ns, division.name, city, BEAST);
				break;
			case MINING:
				setMaterialSellParameters(ns, division.name, city, ORE);
				setMaterialSellParameters(ns, division.name, city, MINERALS);
				break;
			case PHARMA:
				setMaterialSellParameters(ns, division.name, city, DRUGS);
				setProductSellParameters(ns, division.name, city, ASPARGIN);
				break;
			case UTILITY:
				setMaterialSellParameters(ns, division.name, city, WATER);
				break;
			case HEALTH:
				setProductSellParameters(ns, division.name, city, HOSPITAL);
				break;
		}
		var buying = false;
		if (division.type != REALESTATE) {
			buying = purchaseAdditionalMaterial(ns, division.name, city, REALESTATE, 3000) || buying;
		}
		if (division.type != ROBOTICS) {
			buying = purchaseAdditionalMaterial(ns, division.name, city, ROBOTS, 25) || buying;
		}
		if (division.type != SOFTWARE) {
			if (division.type != COMPUTER_HARDWARE) {
				buying = purchaseAdditionalMaterial(ns, division.name, city, HARDWARE, 250) || buying;
			}
			buying = purchaseAdditionalMaterial(ns, division.name, city, AI_CORES, 150) || buying;
		}
		// if the warehouse is full and we are currently allowed to spend
		// expand the warehouse
		if (canSpend(ns) &&
			ns.corporation.hasUnlock(OFFICE_API)) {
			var maxWarehouse = ns.corporation.getOffice(divisionName, city).size / 3;
			if (division.cities.length < 6) {
				// restrict size while still expanding to more cities
				maxWarehouse = Math.min(division.cities.length, maxWarehouse);
			}
			const beforeLevel = ns.corporation.getWarehouse(division.name, city).level;
			while (ns.corporation.getWarehouse(division.name, city).level < maxWarehouse &&
				ns.corporation.getCorporation().funds - HOLD_BACK_FUNDS >
				ns.corporation.getUpgradeWarehouseCost(division.name, city)) {
				ns.corporation.upgradeWarehouse(division.name, city);
			}
			const afterLevel = ns.corporation.getWarehouse(division.name, city).level;
			if (afterLevel > beforeLevel) {
				ns.printf("Upgraded warehouse division '%s' in %s to level %d",
					divisionName, city, afterLevel);
			}
		}
	}
}

/** @param {NS} ns **/
function setMaterialSellParameters(ns, divisionName, city, material) {
	if (ns.corporation.hasUnlock(OFFICE_API)) {
		if (ns.corporation.hasResearched(divisionName, MARKET_TA_II)) {
			ns.corporation.setMaterialMarketTA2(divisionName, city, material, true);
		}
		else if (ns.corporation.hasResearched(divisionName, MARKET_TA_I)) {
			ns.corporation.setMaterialMarketTA1(divisionName, city, material, true);
		}
	}
	ns.corporation.sellMaterial(divisionName, city, material, MAX_SELL, MP_SELL);
}

/** @param {NS} ns **/
function setProductSellParameters(ns, divisionName, city, product) {
	if (ns.corporation.hasUnlock(OFFICE_API)) {
		if (ns.corporation.hasResearched(divisionName, MARKET_TA_II)) {
			ns.corporation.setProductMarketTA2(divisionName, product, true);
		}
		else if (ns.corporation.hasResearched(divisionName, MARKET_TA_I)) {
			ns.corporation.setProductMarketTA1(divisionName, product, true);
		}
	}
	ns.corporation.sellProduct(divisionName, city, product, MAX_SELL, MP_SELL, true);
}

/** @param {NS} ns **/
function purchaseAdditionalMaterial(ns, divisionName, city, material, baseAmount) {
	var amount = baseAmount * ns.corporation.getWarehouse(divisionName, city).level;
	var info = ns.corporation.getMaterial(divisionName, city, material);
	// ns.printf("Can spend money for %s in %s: %s", material, city, canSpend);

	if (canSpend(ns) && info.stored < amount) {
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
function distributeEmployees(ns, divisionName, city, office) {
	// ns.tprint("distributeEmployees");
	var toDistribute = office.numEmployees;
	var divisor = 9;
	divisor += Math.floor(toDistribute / 25);
	var wanted = {
		management: Math.floor(toDistribute / divisor),
		business: Math.floor(toDistribute / divisor),
		research: Math.floor(toDistribute / divisor),
		intern: Math.floor(toDistribute / divisor),
		engineers: Math.ceil(toDistribute / divisor)
	};
	if (ns.corporation.hasUnlock(WAREHOUSE_API)) {
		var warehouse = ns.corporation.getWarehouse(divisionName, city);
		if (toDistribute > 0 && warehouse.sizeUsed / warehouse.size > 0.8) {
			wanted.engineers++;
		}
	}
	wanted.operations = Math.max(0, toDistribute
		- wanted.management - wanted.business - wanted.research - wanted.intern - wanted.engineers);

	if (ns.corporation.hasUnlock(WAREHOUSE_API)) {
		const products = ns.corporation.getDivision(divisionName).products;
		if (products.length) {
			var product = ns.corporation.getProduct(divisionName, c.SECTOR12, products[0]);
			if (product.developmentProgress < 100) {
				// during development we want engineers only
				wanted.engineers = toDistribute;
				wanted.management = 0;
				wanted.business = 0;
				wanted.research = 0;
				wanted.intern = 0;
				wanted.operations = 0;
			}
		}
	}
	const have = office.employeeJobs;
	// ns.tprintf("Employee distribution: %s", JSON.stringify(office.employeeJobs));
	// ns.tprintf("Wanted: %s", JSON.stringify(wanted));
	// ns.tprintf("Have:   %s", JSON.stringify(have));
	if (wanted.business < have[BUSINESS]) {
		ns.corporation.setAutoJobAssignment(divisionName, city, BUSINESS, wanted.business);
	}
	if (wanted.research < have[RESEARCH]) {
		ns.corporation.setAutoJobAssignment(divisionName, city, RESEARCH, wanted.research);
	}
	if (wanted.management < have[MANAGEMENT]) {
		ns.corporation.setAutoJobAssignment(divisionName, city, MANAGEMENT, wanted.management);
	}
	if (wanted.intern < have[INTERN]) {
		ns.corporation.setAutoJobAssignment(divisionName, city, INTERN, wanted.intern);
	}
	if (wanted.engineers < have[ENGINEER]) {
		ns.corporation.setAutoJobAssignment(divisionName, city, ENGINEER, wanted.engineers);
	}
	if (wanted.operations < have[OPERATIONS]) {
		ns.corporation.setAutoJobAssignment(divisionName, city, OPERATIONS, wanted.operations);
	}
	if (wanted.business > have[BUSINESS]) {
		ns.corporation.setAutoJobAssignment(divisionName, city, BUSINESS, wanted.business);
	}
	if (wanted.research > have[RESEARCH]) {
		ns.corporation.setAutoJobAssignment(divisionName, city, RESEARCH, wanted.research);
	}
	if (wanted.management > have[MANAGEMENT]) {
		ns.corporation.setAutoJobAssignment(divisionName, city, MANAGEMENT, wanted.management);
	}
	if (wanted.engineers > have[ENGINEER]) {
		ns.corporation.setAutoJobAssignment(divisionName, city, ENGINEER, wanted.engineers);
	}
	if (wanted.intern > have[INTERN]) {
		ns.corporation.setAutoJobAssignment(divisionName, city, INTERN, wanted.intern);
	}
	if (wanted.operations > have[OPERATIONS]) {
		ns.corporation.setAutoJobAssignment(divisionName, city, OPERATIONS, wanted.operations);
	}
	// ns.printf("Employee distribution: %s", JSON.stringify(office.employeeJobs));
	// ns.print("Done distributing");
}

/** @param {NS} ns **/
function makeEmployeesHappy(ns, divisionName, city, office) {
	// ns.tprintf("Checking employees in division %s, city %s", division.name, city);
	// ns.tprintf("Office: %s", JSON.stringify(office));
	if (office.avgMorale < 0.85 * office.maxMorale) {
		ns.printf("Morale is %s, need a party in division %s, city %s", office.avgMorale.toFixed(1), divisionName, city);
		ns.corporation.throwParty(divisionName, city, 1e6);
	}
	if (office.avgEnergy < 0.85 * office.maxEnergy) {
		ns.printf("Energy is %s, need a cofee in division %s, city %s", office.avgEnergy.toFixed(1), divisionName, city);
		ns.corporation.buyTea(divisionName, city);
	}
	/*
	if (office.avgHap < office.minHap + 0.75 * (office.maxHap - office.minHap)) {
		ns.tprintf("Happines is %s, need a party in division %s, city %s", office.avgHap, divisionName, city);
		ns.corporation.throwParty(disvision.name, city, 1e6);
	}
	if (office.avgMor < office.minMor + 0.75 * (office.maxMor - office.minMor)) {
		ns.tprintf("Morale is %s, need a party in division %s, city %s", office.avgMor, divisionName, city);
		ns.corporation.throwParty(disvision.name, city, 1e6);
	}
	if (office.avgEne < office.minEne + 0.75 * (office.maxEne - office.minEne)) {
		ns.tprintf("Energy is %s, need a cofee in division %s, city %s", office.avgEne, divisionName, city);
	}
	*/
}