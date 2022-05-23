/** @param {NS} ns */
export async function main(ns) {
	var input = ns.args[0];

	ns.tprintf("RLE compression of '%s' is '%s'.", input, rleCompression(input));
}

export function rleCompression(input) {
	var firstChar = input.charAt(0);
	for (var ii = 1; ii < input.length && ii < 9; ii++) {
		if (input.charAt(ii) != firstChar) {
			return ii + firstChar + rleCompression(input.slice(ii));
		}
	}
	if (input.length < 10) {
		return input.length + firstChar;
	}
	return "9" + firstChar + rleCompression(input.slice(9));
}