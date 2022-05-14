/** @param {NS} ns */
export async function main(ns) {
	var number = +ns.args[0];
	// var bitstring = "" + ns.args[0];

	// ns.tprintf("Decoded value of %s is %d", bitstring, hammingDecode(bitstring));
	ns.tprintf("Encoded value of %d is %s", number, hammingEncode(number));
}

export function hammingEncode(number) {
	var data = number.toString(2);
	var result = ["0"];
	for (var ii = 1, dataIndex = 0; dataIndex < data.length; ii++) {
		if (isPowerOfTwo(ii)) {
			result.push("0");
		} else {
			result.push(data.charAt(dataIndex++));
		}
	}
	var parity = parityVector(result.join("")).toString(2);
	for (var ii = 1, parityIndex = parity.length - 1; parityIndex >= 0; ii++) {
		if (isPowerOfTwo(ii)) {
			result[ii] = parity.charAt(parityIndex--);
		}
	}
	if (oddParity(result)) {
		result[0] = "1";
	}
	return result.join("");
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

function oddParity(bitarray) {
	var parity = 0;
	for (var ii = 0; ii < bitarray.length; ii++) {
		if (bitarray[ii] == "1") {
			parity++;
		}
	}
	return 1 == (parity & 1);
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