/** @param {NS} ns **/
export async function main(ns) {
	var input = ns.args[0];

	ns.tprintf("Input: %s", input);
	ns.tprintf("Sanitized solutions: %s", JSON.stringify(sanitizeParenthesis(input)));
}

export function sanitizeParenthesis(input) {
	// strip bad parentheses at the beginning and at the end
	while (input.charAt(0) == ')') {
		input = input.substring(1);
	}
	if (input.length == 0) {
		return [];
	}
	while (input.charAt(input.length - 1) == '(') {
		input = input.substring(0, input.length - 1);
	}
	if (input.length == 0) {
		return [];
	}
	var left = 0;
	var right = 0;
	for (var ii = 0; ii < input.length; ii++) {
		if (input.charAt(ii) == '(') {
			left++;
		} else if (input.charAt(ii) == ')') {
			if (left > 0) {
				left--;
			} else {
				right++;
			}
		}
	}
	var result = [];
	sanitize(left, right, 0, "", input, result);
	return result;
}

function sanitize(left, right, open, sane, input, result) {
	// ns.tprintf("%d %d %d %s %s %s", left, right, open, sane, input, JSON.stringify(result));
	if (input.length == 0) {
		if (left == 0 && right == 0 && open == 0) {
			var candidate = sane + input;
			if (!result.includes(candidate)) {
				result.push(candidate);
			}
		}
		return;
	}
	switch (input.charAt(0)) {
		case '(':
			if (left > 0) {
				sanitize(left - 1, right, open, sane, input.substring(1), result);
			}
			sanitize(left, right, open + 1, sane + input.charAt(0), input.substring(1), result);
			break;
		case ')':
			if (right > 0) {
				sanitize(left, right - 1, open, sane, input.substring(1), result);
			}
			if (open > 0) {
				sanitize(left, right, open - 1, sane + input.charAt(0), input.substring(1), result);
			}
			break;
		default:
			sanitize(left, right, open, sane + input.charAt(0), input.substring(1), result);
			break;
	}
}