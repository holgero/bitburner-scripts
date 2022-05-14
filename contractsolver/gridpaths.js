/** @param {NS} ns **/
export async function main(ns) {
	var rows = ns.args[0];
	var columns = ns.args[1];

	ns.tprintf("Solution: %d", gridPaths(rows, columns));
}

export function gridPaths(rows, columns) {
	if (rows <= 1) return 1;
	if (columns <= 1) return 1;
	return gridPaths(rows - 1, columns) + gridPaths(rows, columns - 1);
}

export function gridPaths2(rows, columns, obstacles) {
        if (rows < 1) return 0;
        if (columns < 1) return 0;
        if (rows == 1 && columns == 1) return 1;
        if (obstacles[obstacles.length-rows][obstacles[0].length-columns] == 1) return 0;
        return gridPaths2(rows - 1, columns, obstacles) + gridPaths2(rows, columns - 1, obstacles);
}