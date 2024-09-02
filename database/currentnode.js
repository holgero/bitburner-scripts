/** @param {NS} ns **/
export async function main(ns) {
	const database = JSON.parse(ns.read("database.txt"));
	getMissingInfo(ns, database);
	ns.write("database.txt", JSON.stringify(database), "w");
}

/** @param {NS} ns **/
function getMissingInfo(ns, database) {
	const current = database.ownedSourceFiles.find(a =>
		a.n == ns.getResetInfo().currentNode);
	if (current) {
		database.currentNode = current;
	} else {
		current = { n: 1, lvl: 0 }
	}
}