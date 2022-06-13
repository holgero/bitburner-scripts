import { formatMoney, getAvailableMoney } from "helpers.js";

/** @param {NS} ns */
export async function main(ns) {
	const options = ns.flags([["print", false], ["reserve", 0]]);
	const current = ns.getServerMoneyAvailable("home");
	const budget = readBudget(ns);

	if (options.reserve) {
		const ownerName = options._[0];
		ns.tprintf("Reserving %s for %s", formatMoney(options.reserve), ownerName);
		var owner = budget.owners.find(a=>a.name == ownerName);
		if (!owner) {
			owner = { name:ownerName, holding:0, reserved:0};
			budget.owners.push(owner);
		}
		owner.reserved += options.reserve;
		await writeBudget(ns, budget);
	}

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
	const budget_txt =ns.read("budget.txt");
	const budget = budget_txt ? JSON.parse(budget_txt) : { owners: []};
	return budget;
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