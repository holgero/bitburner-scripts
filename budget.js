/** @param {NS} ns */
function writeBudget(ns, budget) {
	ns.write("budget.txt", JSON.stringify(budget), "w");
}

/** @param {NS} ns */
export function readBudget(ns) {
	const budget_txt = ns.read("budget.txt");
	const budget = budget_txt ? JSON.parse(budget_txt) : { owners: [] };
	return budget;
}

/** @param {NS} ns */
export function getBudget(ns, ownerName) {
	const budget = readBudget(ns);
	const owner = budget.owners.find(a => a.name == ownerName);
	if (!owner) {
		return 0;
	}
	return owner.reserved;
}

/** @param {NS} ns */
export function getHolding(ns, ownerName) {
	const budget = readBudget(ns);
	const owner = budget.owners.find(a => a.name == ownerName);
	if (!owner) {
		return 0;
	}
	return owner.holding;
}

/** @param {NS} ns */
export function setHolding(ns, ownerName, amount) {
	const budget = readBudget(ns);
	const owner = budget.owners.find(a => a.name == ownerName);
	if (!owner) {
		ns.printf("Owner %s has no budget.", ownerName);
		return false;
	}
	owner.holding = amount;
	writeBudget(ns, budget);
	return true;
}

/** @param {NS} ns */
export function reserveBudget(ns, ownerName, amount) {
	const budget = readBudget(ns);
	var owner = budget.owners.find(a => a.name == ownerName);
	if (!owner) {
		owner = { name: ownerName, holding: 0, reserved: 0 };
		budget.owners.push(owner);
	}
	owner.reserved += amount;
	writeBudget(ns, budget);
}

/** @param {NS} ns */
export function releaseBudget(ns, ownerName, amount) {
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
	writeBudget(ns, budget);
	return true;
}

/** @param {NS} ns */
export function useBudget(ns, ownerName, amount) {
	const budget = readBudget(ns);
	const owner = budget.owners.find(a => a.name == ownerName);
	if (!owner) {
		ns.printf("Owner %s has no budget.", ownerName);
		return false;
	}
	owner.reserved = Math.max(0, owner.reserved - amount);
	owner.holding += amount;
	writeBudget(ns, budget);
	return true;
}

/** @param {NS} ns */
export function unuseBudget(ns, ownerName, amount) {
	const budget = readBudget(ns);
	const owner = budget.owners.find(a => a.name == ownerName);
	if (!owner) {
		ns.printf("Owner %s has no budget.", ownerName);
		return false;
	}
	owner.reserved += amount;
	owner.holding = Math.max(0, owner.holding - amount);
	writeBudget(ns, budget);
	return true;
}

/** @param {NS} ns */
export function cleanBudget(ns) {
	const budget = readBudget(ns);
	budget.owners = budget.owners.filter(a => a.reserved != 0 || a.holding != 0);
	writeBudget(ns, budget);
}

/** @param {NS} ns */
export function deleteBudget(ns, ownerName) {
	const budget = readBudget(ns);
	budget.owners = budget.owners.filter(a => a.name != ownerName);
	writeBudget(ns, budget);
	return true;
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