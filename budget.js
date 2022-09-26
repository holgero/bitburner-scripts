/** @param {NS} ns */
async function writeBudget(ns, budget) {
	await ns.write("budget.txt", JSON.stringify(budget), "w");
}

/** @param {NS} ns */
export function readBudget(ns) {
	const budget_txt = ns.read("budget.txt");
	const budget = budget_txt ? JSON.parse(budget_txt) : { owners: [] };
	return budget;
}

/** @param {NS} ns */
export async function reserveBudget(ns, amount, ownerName) {
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
export async function releaseBudget(ns, amount, ownerName) {
	const budget = readBudget(ns);
	const owner = budget.owners.find(a => a.name == ownerName);
	if (!owner) {
		ns.printf("Owner %s has no budget.", ownerName);
		return false;
	}
	if (amount > owner.reserved) {
		ns.printf("Owner %s's budget is too small (%s) to release %s.",
			ownerName, owner.reserved, amount);
		return false;
	}
	owner.reserved -= amount;
	await writeBudget(ns, budget);
	return true;
}

/** @param {NS} ns */
export async function useBudget(ns, amount, ownerName) {
	const budget = readBudget(ns);
	const owner = budget.owners.find(a => a.name == ownerName);
	if (!owner) {
		ns.printf("Owner %s has no budget.", ownerName);
		return false;
	}
	if (amount > owner.reserved) {
		ns.printf("Owner %s's budget is too small (%s) to use %s.",
			ownerName, owner.reserved, amount);
		return false;
	}
	owner.reserved -= amount;
	owner.holding += amount;
	await writeBudget(ns, budget);
	return true;
}

/** @param {NS} ns */
export async function unuseBudget(ns, amount, ownerName) {
	const budget = readBudget(ns);
	const owner = budget.owners.find(a => a.name == ownerName);
	if (!owner) {
		ns.printf("Owner %s has no budget.", ownerName);
		return false;
	}
	if (amount > owner.holding) {
		ns.printf("Owner %s's holding is too small (%s) to unuse %s.",
			ownerName, owner.reserved, amount);
		return false;
	}
	owner.reserved += amount;
	owner.holding -= amount;
	await writeBudget(ns, budget);
	return true;
}

/** @param {NS} ns */
export async function cleanBudget(ns) {
	const budget = readBudget(ns);
	budget.owners = budget.owners.filter(a => a.reserved != 0 || a.holding != 0);
	await writeBudget(ns, budget);
}

/** @param {NS} ns */
export function getAvailable(ns) {
	const budget = readBudget(ns);
	var reserved = 0;
	for (var owner of budget.owners) {
		reserved += owner.reserved;
	}
	const current = ns.getServerMoneyAvailable("home");
	return Math.max(0, current - reserved);
}

/** @param {NS} ns */
export function getTotal(ns) {
	const budget = readBudget(ns);
	var holdings = 0;
	for (var owner of budget.owners) {
		holdings += owner.holding;
	}
	const current = ns.getServerMoneyAvailable("home");
	return current + holdings;
}