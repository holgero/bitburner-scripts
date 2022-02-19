/** @param {NS} ns **/
export async function main(ns) {
	var matrix = JSON.parse(ns.args[0]);
	ns.tprintf("Input matrix: %s", JSON.stringify(matrix));
	var result = spiralizeMatrix(matrix);
	ns.tprintf("Solution: %s", result);
}

export function spiralizeMatrix(matrix) {
	var result = [];
	var mini = 0, minj = 0, maxi = matrix.length, maxj = matrix[0].length;
	while (mini < maxi && minj < maxj) {
		var i = mini++;
		var j;
		for (j = minj; j < maxj; j++) {
			result.push(matrix[i][j]);
		}
		j = --maxj;
		if (j < minj) break;
		for (i = mini; i < maxi; i++) {
			result.push(matrix[i][j]);
		}
		i = --maxi;
		if (i < mini) break;
		for (j = maxj - 1; j >= minj; j--) {
			result.push(matrix[i][j]);
		}
		j = minj++;
		if (j >= maxj) break;
		for (i = maxi - 1; i >= mini; i--) {
			result.push(matrix[i][j]);
		}
	}
	return result;
}