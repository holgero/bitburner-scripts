/** @param {NS} ns */
export async function main(ns) {
	var input = ns.args[0];

	// ns.tprintf("RLE compression of '%s' is '%s'.", input, rleCompression(input));
	// ns.tprintf("LZ decompression of '%s' is '%s'.", input, lzDecompression(input));
	ns.tprintf("LZ compression of '%s' is '%s'.", input, lzCompression(input));
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


export function lzCompression(input) {
	var chunks = [];
	if (input.length) {
		var chunk = { verb: "", copy: "", offset: 0 };
		chunks.push(chunk);
		chunk.verb += input.charAt(0);
		for (var ii = 1; ii < input.length; ii++) {
			var previous = input.substring(0, ii);
			var next = input.charAt(ii);
			if (tryAppend(chunk, previous, next)) {
				continue;
			}
			if (chunk.copy.length > 0) {
				chunk = { verb: "", copy: "", offset: 0 };
				chunks.push(chunk);
				if (tryAppend(chunk, previous, next)) {
					continue;
				}
			}
			chunk.verb += next;
		}
	}
	var result = "";
	for (var ii = 0; ii < chunks.length; ii++) {
		var chunk = chunks[ii];
		var nextChunk = undefined;
		if (ii < chunks.length - 1) {
			nextChunk = chunks[ii + 1];
		}
		result += flushChunk(chunk, nextChunk);
	}
	return result;
}

function flushChunk(chunk, nextChunk) {
	var result = "";
	while (chunk.verb.length > 9) {
		result += "9";
		result += chunk.verb.substring(0, 9);
		chunk.verb = chunk.verb.substring(9);
		result += "0";
	}
	if (chunk.verb.length == 9 || (chunk.verb.length == 8 && chunk.copy.length % 9 == 2) ||
		chunk.copy.length % 9 > 2 || chunk.copy.length % 9 == 0) {
		// all is fine, do nothing
	} else if (chunk.copy.length % 9 == 1) {
		chunk.verb += chunk.copy.charAt(0);
		chunk.copy = chunk.copy.substring(1);
	} else if (chunk.verb.length < 8 && !nextChunk) {
		chunk.verb += chunk.copy.substring(0, 2);
		chunk.copy = chunk.copy.substring(2);
	} else {
		var sum = nextChunk.verb.length + chunk.verb.length + chunk.copy.length;
		if (sum < 9 || sum % 9 == 0 || chunk.verb.length == 0) {
			chunk.verb += chunk.copy.substring(0,2);
			chunk.copy = chunk.copy.substring(2);
		}
	}
	if (chunk.copy.length == 0 && nextChunk) {
		nextChunk.verb = chunk.verb + nextChunk.verb;
		return result;
	}
	result += ("" + chunk.verb.length);
	result += chunk.verb;
	while (chunk.copy.length>0) {
		var toFlush = Math.min(9, chunk.copy.length);
		result += ("" + toFlush);
		result += ("" + chunk.offset);
		chunk.copy = chunk.copy.substring(toFlush);
		if (chunk.copy.length) {
			result += "0";
		}
	}
	return result;
}

function tryAppend(chunk, previous, next) {
	var foundIdx = previous.lastIndexOf(chunk.copy + next);
	if (foundIdx >= 0) {
		var offset = previous.length - foundIdx - chunk.copy.length;
		if (offset < 10) {
			chunk.copy += next;
			chunk.offset = offset;
			return true;
		}
	}
	return false;
}