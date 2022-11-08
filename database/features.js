import * as c from "constants.js";

/** @param {NS} ns **/
export async function main(ns) {
	const database = JSON.parse(ns.read("database.txt"));
	getMissingInfo(ns, database);
	ns.write("database.txt", JSON.stringify(database), "w");
}

/** @param {NS} ns **/
function getMissingInfo(ns, database) {
	for (var featureName of Object.keys(c.FEATURES)) {
		// ns.tprintf("Check feature %s", featureName);
		const feature = c.FEATURES[featureName];
		if (haveSourceFile(database.ownedSourceFiles, feature.sourceFile) ||
			amOnBitnode(ns, feature.sourceFile)) {
			// ns.tprintf("Yes");
			if (database.features) {
				database.features.push(featureName);
			} else {
				database.features = [featureName];
			}
		}
	}
}

function haveSourceFile(ownedSourceFiles, sourceFile) {
	return ownedSourceFiles.find(a => a.n == sourceFile);
}

/** @param {NS} ns **/
function amOnBitnode(ns, sourceFile) {
	return ns.getPlayer().bitNodeN == sourceFile;
}