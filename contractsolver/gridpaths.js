/** @param {NS} ns **/
export async function main(ns) {
	var obstacles = JSON.parse(ns.args[0]);
	var rows = obstacles.length;
	var columns = obstacles[0].length;

	ns.tprintf("Solution: %s", shortestPath(rows, columns, obstacles));
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
	if (obstacles[obstacles.length - rows][obstacles[0].length - columns] == 1) return 0;
	return gridPaths2(rows - 1, columns, obstacles) + gridPaths2(rows, columns - 1, obstacles);
}

export function shortestPath(rows, columns, obstacles) {
	markCells(rows, columns, 0, obstacles);
	if (obstacles[obstacles.length - 1][obstacles[0].length - 1] >= 0) {
		// end cell is not marked => we didn't find a path there
		return "";
	}
	return constructPath(obstacles[obstacles.length - 1][obstacles[0].length - 1], 1, 1, obstacles);
}

function markCells(rows, columns, steps, obstacles) {
	if (rows > obstacles.length || rows <= 0) return;
	if (columns > obstacles[0].length || columns <= 0) return;
	steps--;
	var o = obstacles[obstacles.length - rows][obstacles[0].length - columns];
	if (o > 0) return;
	if (o < 0 && o >= steps) return;
	obstacles[obstacles.length - rows][obstacles[0].length - columns] = steps;
	if (rows == 1 && columns == 1) return;
	markCells(rows + 1, columns, steps, obstacles);
	markCells(rows - 1, columns, steps, obstacles);
	markCells(rows, columns + 1, steps, obstacles);
	markCells(rows, columns - 1, steps, obstacles);
}

function checkSteps(steps, row, column, obstacles) {
	return obstacles[obstacles.length - row][obstacles[0].length - column] == steps;
}

function constructPath(steps, row, column, obstacles) {
	if (steps == -1) {
		return "";
	}
	if (row > 1 && checkSteps(steps + 1, row - 1, column, obstacles)) {
		return constructPath(steps + 1, row - 1, column, obstacles) + "U";
	}
	if (row < obstacles.length && checkSteps(steps + 1, row + 1, column, obstacles)) {
		return constructPath(steps + 1, row + 1, column, obstacles) + "D";
	}
	if (column > 1 && checkSteps(steps + 1, row, column - 1, obstacles)) {
		return constructPath(steps + 1, row, column - 1, obstacles) + "L";
	}
	if (column < obstacles[0].length && checkSteps(steps + 1, row, column + 1, obstacles)) {
		return constructPath(steps + 1, row, column + 1, obstacles) + "R";
	}
	return undefined;
}