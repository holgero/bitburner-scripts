/** @param {NS} ns */
export async function main(ns) {
	var nodes = +ns.args[0];
	var edges = JSON.parse(ns.args[1]);

	ns.tprintf("Two coloring of %d nodes with edges %s is: %s",
		nodes, JSON.stringify(edges), JSON.stringify(graphColoring(nodes, edges)));
}

export function graphColoring(nodes, edges) {
	const result = [];
	result.length = nodes;
	result.fill(-1, 0, nodes);
	// ns.tprintf("array: %s", JSON.stringify(result));
	for (var ii = 0; ii < result.length; ii++) {
		if (result[ii] == -1) {
			result[ii] = 0;
			// ns.tprintf("array: %s", JSON.stringify(result));
			if (!checkEdges(result, edges)) {
				return [];
			}
			if (!checkEdges(result, edges)) {
				return [];
			}
		}
	}
	// ns.tprintf("array: %s", JSON.stringify(result));
	return result;
}

function checkEdges(result, edges) {
	var repeat = false;
	for (var edge of edges) {
		// ns.tprintf("edge: %s", JSON.stringify(edge));
		switch (result[edge[0]]) {
			case -1:
				switch (result[edge[1]]) {
					case 0:
						result[edge[0]] = 1;
						repeat = true;
						break;
					case 1:
						result[edge[0]] = 0;
						repeat = true;
						break;
				}
				break;
			case 0:
				if (result[edge[1]] != 0) {
					result[edge[1]] = 1;
				} else {
					return false;
				}
				break;
			case 1:
				if (result[edge[1]] != 1) {
					result[edge[1]] = 0;
				} else {
					return false;
				}
		}
		// ns.tprintf("array: %s", JSON.stringify(result));
	}
	if (repeat) return checkEdges(result, edges);
	return true;
}