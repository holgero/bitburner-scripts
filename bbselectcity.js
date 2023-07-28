import { CITIES } from "constants.js";

/** @param {NS} ns */
export async function main(ns) {
	const actionDb = { cities: [] };
	var maxPopulation = 0;
	var bestCity = ns.bladeburner.getCity();
	for (var city of CITIES) {
		var population = ns.bladeburner.getCityEstimatedPopulation(city);
		actionDb.cities.push({ name: city, population: population });
		if (population > maxPopulation) {
			maxPopulation = population;
			bestCity = city;
		}
	}

	if (ns.bladeburner.getCity() != bestCity) {
		ns.bladeburner.switchCity(bestCity);
	}

	actionDb.current = bestCity;
	ns.write("actiondb.txt", JSON.stringify(actionDb), "w");
}