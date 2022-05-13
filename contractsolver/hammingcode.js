/** @param {NS} ns */
export async function main(ns) {
	var bitstring = "" + ns.args[0];

	ns.tprintf("Decoded value of %s is %d", bitstring, hammingDecode(bitstring));
}

export function hammingDecode(bitstring) {
	var parityAddress = parityVector(bitstring);
	var result = "";
	for (var ii = 1; ii < bitstring.length; ii++) {
		if (!isPowerOfTwo(ii)) {
			if (ii == parityAddress) {
				switch (bitstring.charAt(ii)) {
					case "0": result += "1";
						break;
					case "1": result += "0";
						break;
				}
			} else {
				result += bitstring.charAt(ii);
			}
		}
	}

	return Number.parseInt(result, 2);
}

function parityVector(bitstring) {
	var generator = 0;
	for (var ii = 1; ii < bitstring.length; ii++) {
		if (bitstring.charAt(ii) == '1') {
			generator = generator ^ ii;
		}
	}
	return generator;
}

function isPowerOfTwo(number) {
	return Math.log2(number) % 1 === 0;
}