/** @param {NS} ns **/
export async function main(ns) {
	const database = JSON.parse(ns.read("database.txt"));
	database.ownedSourceFiles = ns.singularity.getOwnedSourceFiles();
	ns.write("database.txt", JSON.stringify(database), "w");
}