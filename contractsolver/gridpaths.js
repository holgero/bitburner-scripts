/** @param {NS} ns **/
export async function main(ns) {
	var rows = ns.args[0];
	var columns = ns.args[1];

	ns.tprintf("Solution: %d", gridPaths(rows, columns));
}

function gridPaths(rows, columns) {
	if (rows <= 1) return 1;
	if (columns <= 1) return 1;
	return gridPaths(rows - 1, columns) + gridPaths(rows, columns - 1);
}