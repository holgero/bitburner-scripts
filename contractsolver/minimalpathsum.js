/** @param {NS} ns **/
export async function main(ns) {
	var triangle = JSON.parse(ns.args[0]);

	ns.tprintf("Triangle: %s", JSON.stringify(triangle));
	ns.tprintf("Minimal path sum: %d", minimalPathSum(triangle, 0, 0));
}

export function minimalPathSum(triangle, i, j) {
	if (i >= triangle.length) {
		return 0;
	}
	return triangle[i][j] +
		Math.min(minimalPathSum(triangle, i+1, j), minimalPathSum(triangle, i+1, j+1));
}