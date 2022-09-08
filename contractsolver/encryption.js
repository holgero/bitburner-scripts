/** @param {NS} ns */
export async function main(ns) {
	var input = ns.args[0];
	var cipher = ns.args[1];

	ns.tprintf("Vignere encryption of '%s' with '%s' is '%s'.", input, cipher,
		vignereEncryption(input, cipher));
}

const CODE_TABLE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function caesarEncryption(input, cipher) {
	var result = "";
	for (var ii = 0; ii < input.length; ii++) {
		var next = input.charAt(ii);
		if (next == " ") {
			result += " ";
			continue;
		}
		const index = CODE_TABLE.indexOf(next);
		result += CODE_TABLE.charAt((index - cipher + 26) % 26);
	}
	return result;
}

export function vignereEncryption(input, cipher) {
	var result = "";
	for (var ii = 0; ii < input.length; ii++) {
		const index = CODE_TABLE.indexOf(input.charAt(ii));
		const shift = - CODE_TABLE.indexOf(cipher.charAt(ii % cipher.length));
		result += CODE_TABLE.charAt((index - shift + 26) % 26);
	}
	return result;
}