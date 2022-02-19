/** @param {NS} ns **/
export async function main(ns) {
	var obstacles = JSON.parse(ns.args[0]);
	var rows = obstacles.length;
	var columns = obstacles[0].length;

	ns.tprintf("Solution: %d", gridPaths2(rows, columns, obstacles));
}

export function gridPaths2(rows, columns, obstacles) {
	if (rows < 1) return 0;
	if (columns < 1) return 0;
	if (rows == 1 && columns == 1) return 1;
	if (obstacles[obstacles.length-rows][obstacles[0].length-columns] == 1) return 0;
	return gridPaths2(rows - 1, columns, obstacles) + gridPaths2(rows, columns - 1, obstacles);
}