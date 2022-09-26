import { formatMoney, getAvailableMoney } from "helpers.js";

/** @param {NS} ns */
export async function main(ns) {
	const options = ns.flags([
		["print", false],
		["clean", false],
		["reserve", 0],
		["release", 0],
		["unuse", 0],
		["use", 0]]);
	const ownerName = options._[0];

	if (options.reserve) {
		ns.tprintf("Reserving %s for %s", formatMoney(options.reserve), ownerName);
		await reserveBudget(ns, options.reserve, ownerName);
	}

	if (options.release) {
		ns.tprintf("Releasing %s from %s", formatMoney(options.release), ownerName);
		if (await releaseBudget(ns, options.release, ownerName)) {
			ns.tprintf("Success");
		} else {
			ns.tprintf("Failed!");
		}
	}

	if (options.use) {
		ns.tprintf("Using %s from %s", formatMoney(options.use), ownerName);
		if (await useBudget(ns, options.use, ownerName)) {
			ns.tprintf("Success");
		} else {
			ns.tprintf("Failed!");
		}
	}

	if (options.unuse) {
		ns.tprintf("Unusing %s from %s", formatMoney(options.unuse), ownerName);
		if (await unuseBudget(ns, options.unuse, ownerName)) {
			ns.tprintf("Success");
		} else {
			ns.tprintf("Failed!");
		}
	}

	if (options.clean) {
		ns.tprintf("Cleaning budget");
		await cleanBudget(ns);
	}

	const current = ns.getServerMoneyAvailable("home");
	const budget = readBudget(ns);
	if (options.print) {
		const available = getAvailable(budget, current);
		const total = getTotal(budget, current);
		ns.tprintf("Current money: %s, available %s, total: %s",
			formatMoney(current), formatMoney(available), formatMoney(total));
		for (var owner of budget.owners) {
			ns.tprintf("%s holds %s and reserves %s",
				owner.name, formatMoney(owner.holding), formatMoney(owner.reserved));
		}
	}
}

/** @param {NS} ns */
async function writeBudget(ns, budget) {
	await ns.write("budget.txt", JSON.stringify(budget), "w");
}

/** @param {NS} ns */
function readBudget(ns) {
	const budget_txt = ns.read("budget.txt");
	const budget = budget_txt ? JSON.parse(budget_txt) : { owners: [] };
	return budget;
}

/** @param {NS} ns */
async function reserveBudget(ns, amount, ownerName) {
	const budget = readBudget(ns);
	var owner = budget.owners.find(a => a.name == ownerName);
	if (!owner) {
		owner = { name: ownerName, holding: 0, reserved: 0 };
		budget.owners.push(owner);
	}
	owner.reserved += amount;
	await writeBudget(ns, budget);
}

/** @param {NS} ns */
async function releaseBudget(ns, amount, ownerName) {
	const budget = readBudget(ns);
	const owner = budget.owners.find(a => a.name == ownerName);
	if (!owner) {
		ns.printf("Owner %s has no budget.", ownerName);
		return false;
	}
	if (amount > owner.reserved) {
		ns.printf("Owner %s's budget is too small (%s) to release %s.",
			ownerName, formatMoney(owner.reserved), formatMoney(amount));
		return false;
	}
	owner.reserved -= amount;
	await writeBudget(ns, budget);
	return true;
}

/** @param {NS} ns */
async function useBudget(ns, amount, ownerName) {
	const budget = readBudget(ns);
	const owner = budget.owners.find(a => a.name == ownerName);
	if (!owner) {
		ns.printf("Owner %s has no budget.", ownerName);
		return false;
	}
	if (amount > owner.reserved) {
		ns.printf("Owner %s's budget is too small (%s) to use %s.",
			ownerName, formatMoney(owner.reserved), formatMoney(amount));
		return false;
	}
	owner.reserved -= amount;
	owner.holding += amount;
	await writeBudget(ns, budget);
	return true;
}

/** @param {NS} ns */
async function unuseBudget(ns, amount, ownerName) {
	const budget = readBudget(ns);
	const owner = budget.owners.find(a => a.name == ownerName);
	if (!owner) {
		ns.printf("Owner %s has no budget.", ownerName);
		return false;
	}
	if (amount > owner.holding) {
		ns.printf("Owner %s's holding is too small (%s) to unuse %s.",
			ownerName, formatMoney(owner.reserved), formatMoney(amount));
		return false;
	}
	owner.reserved += amount;
	owner.holding -= amount;
	await writeBudget(ns, budget);
	return true;
}

/** @param {NS} ns */
async function cleanBudget(ns) {
	const budget = readBudget(ns);
	budget.owners = budget.owners.filter(a => a.reserved != 0 || a.holding != 0);
	await writeBudget(ns, budget);
}

function getAvailable(budget, current) {
	var reserved = 0;
	for (var owner of budget.owners) {
		reserved += owner.reserved;
	}
	return Math.max(0, current - reserved);
}

function getTotal(budget, current) {
	var holdings = 0;
	for (var owner of budget.owners) {
		holdings += owner.holding;
	}
	return current + holdings;
}