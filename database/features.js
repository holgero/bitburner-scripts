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
		if (haveSourceFile(database.ownedSourceFiles, feature.sourceFile, feature.level) ||
			amOnBitnode(ns, feature.sourceFile)) {
			// ns.tprintf("Yes");
			database.features[featureName] = "true";
		} else if (feature.sourceFile == c.BLADEBURNER_NODES[0]) {
			if (haveSourceFile(database.ownedSourceFiles, c.BLADEBURNER_NODES[1]) ||
				amOnBitnode(ns, c.BLADEBURNER_NODES[1])) {
				// ns.tprintf("Yes");
				database.features[featureName] = "true";
			}
		}
	}
}

function haveSourceFile(ownedSourceFiles, sourceFile, level = 1) {
	return ownedSourceFiles.find(a => a.n == sourceFile && a.lvl >= level);
}

/** @param {NS} ns **/
function amOnBitnode(ns, sourceFile) {
	return ns.getPlayer().bitNodeN == sourceFile;
}