/** @param {NS} ns **/
export async function main(ns) {
	var digits = ns.args[0];
	var target = +ns.args[1];

	ns.tprintf("Valid expressions to reach %d with '%s': %s", target,
		digits, JSON.stringify(validExpressions(digits, target)));
}

export function validExpressions(digits, target) {
	var result = [];
	return result;
}