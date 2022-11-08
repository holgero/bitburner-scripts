/** @param {NS} ns **/
export async function main(ns) {
	const database = JSON.parse(ns.read("database.txt"));
	getMissingInfo(ns, database);
	await ns.write("database.txt", JSON.stringify(database), "w");
}

/** @param {NS} ns **/
function getMissingInfo(ns, database) {
	if (ns.getPlayer().bitNodeN == 5 || database.ownedSourceFiles.map(a=>a.n).includes(5)) {
		database.bitnodemultipliers = ns.getBitNodeMultipliers();
	}
}