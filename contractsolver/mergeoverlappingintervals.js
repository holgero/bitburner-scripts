/** @param {NS} ns **/
export async function main(ns) {
	var intervals = JSON.parse(ns.args[0]);
	ns.tprintf("Intervals to merge: %s", JSON.stringify(intervals));
	var result = mergeOverlappingIntervals(intervals);
	ns.tprintf("Result: %s", JSON.stringify(result));
}

export function mergeOverlappingIntervals(intervals) {
	if (intervals.length < 2) {
		return intervals;
	}
	var toMerge = intervals.pop();
	var merged = false;
	for (var ii = 0; ii < intervals.length; ii++) {
		if (toMerge[0] <= intervals[ii][1] && toMerge[1] >= intervals[ii][0]) {
			intervals[ii][0] = Math.min(intervals[ii][0], toMerge[0]);
			intervals[ii][1] = Math.max(intervals[ii][1], toMerge[1]);
			merged = true;
		}
	}
	if (merged) {
		return mergeOverlappingIntervals(intervals);
	} else {
		var result = mergeOverlappingIntervals(intervals);
		result.push(toMerge);
		result.sort(function (a, b) { return a[0] - b[0]; });
		return result;
	}
}