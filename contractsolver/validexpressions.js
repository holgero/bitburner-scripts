/** @param {NS} ns **/
export async function main(ns) {
	var digits = ns.args[0];
	var target = +ns.args[1];

	var result = validExpressions(digits, target);

	ns.tprintf("Valid expressions to reach %d with '%s': %s", target, digits,
		JSON.stringify(result));
}

export function validExpressions(digits, target) {
	var result = [];
	evaluator(result, "", digits, 0, 0, target);
	return result;
}

function evaluator(result, expression, remaining, lastSummand, value, target) {
	if (remaining == "") {
		if (value == target) {
			result.push(expression);
		}
		return;
	}
	if (remaining.substring(0, 1) == "0") {
		var rest = remaining.substring(1);
		if (expression == "") {
			evaluator(result, "0", rest, 0, 0, target);
			return;
		}
		evaluator(result, expression + "+0", rest, 0, value, target);
		evaluator(result, expression + "-0", rest, 0, value, target);
		evaluator(result, expression + "*0", rest, 0, value - lastSummand, target);
		return;
	}
	for (var ii = 1; ii <= remaining.length; ii++) {
		var next = +remaining.substring(0, ii);
		var rest = remaining.substring(ii);
		if (expression == "") {
			evaluator(result, "" + next, rest, next, next, target);
			continue;
		}
		evaluator(result, expression + "+" + next, rest, next, value + next, target);
		evaluator(result, expression + "-" + next, rest, -next, value - next, target);
		evaluator(result, expression + "*" + next, rest, lastSummand * next, value + lastSummand * (next - 1), target);
	}
}