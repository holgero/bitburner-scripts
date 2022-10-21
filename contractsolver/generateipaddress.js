/** @param {NS} ns **/
export async function main(ns) {
	var input = "" + ns.args[0];

	ns.tprintf("IP addresses from %s: %s", input, generateIpAddress(input));
}

export function generateIpAddress(input) {
	var result = [];
	for (var ii = 1; ii < 4; ii++) {
		for (var jj = ii + 1; jj < ii + 4; jj++) {
			for (var kk = jj + 1; kk < jj + 4; kk++) {
				if (kk >= input.length) {
					continue;
				}
				if (input.length - kk > 3) {
					continue;
				}
				var o1 = input.substring(0, ii);
				var o2 = input.substring(ii, jj);
				var o3 = input.substring(jj, kk);
				var o4 = input.substring(kk);
				// ns.tprintf("Checking octets: %s %s %s %s", o1, o2, o3, o4);
				if (isValidOctet(o1) && isValidOctet(o2) && isValidOctet(o3) && isValidOctet(o4)) {
					result.push(o1 + "." + o2 + "." + o3 + "." + o4);
				}
			}
		}
	}
	return result.toString();
}

function isValidOctet(octet) {
	if (octet != "0" && octet.charAt(0) == "0") {
		return false;
	}
	return 0 <= +octet && +octet < 256;
}