/** @param {NS} ns */
export async function main(ns) {
	var input = ns.args[0];

	// ns.tprintf("RLE compression of '%s' is '%s'.", input, rleCompression(input));
	ns.tprintf("LZ decompression of '%s' is '%s'.", input, lzDecompression(input));
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

export function lzDecompression(input) {
	var result = "";
	for (var ii = 0; ii < input.length;) {
		const verbLen = +input.charAt(ii++);
		result += input.substring(ii, ii + verbLen);
		ii += verbLen;
		if (ii > input.length) break;
		const copyLen = +input.charAt(ii++);
		if (copyLen > 0) {
			const lookBack = input.charAt(ii++);
			var copyFrom = result.length - lookBack;
			for (var jj = 0; jj < copyLen; jj++) {
				result += result.charAt(copyFrom++);
			}
		}
	}
	return result;
}