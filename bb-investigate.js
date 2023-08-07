import { CITIES } from "constants.js";

/** @param {NS} ns */
export async function main(ns) {
	const state = ns.fileExists("bb-cities.txt") ? JSON.parse(ns.read("bb-cities.txt")) : {};
	if (!state.cities) {
		state.cities = CITIES.map(a => {
			return {
				name: a,
				tendency: undefined,
				population: 0,
			};
		});
	}
	if (!state.current) {
		state.current = CITIES[0];
		ns.tprintf("Starting population investigation in %s", state.current);
		state.cities[0].population = ns.bladeburner.getCityEstimatedPopulation(CITIES[0]);
		if (state.current != ns.bladeburner.getCity()) {
			ns.bladeburner.switchCity(state.current);
		}
	} else {
		const last = state.cities.find(a => a.name == state.current);
		const population = ns.bladeburner.getCityEstimatedPopulation(last.name);
		if (population > last.population + 1000) {
			last.tendency = "up";
		} else if (population < last.population - 1000) {
			last.tendency = "down";
		} else {
			last.tendency = "constant";
		}
		last.population = population;
		if (last.tendency != "up") {
			const next = state.cities.find(a => !a.tendency);
			if (next) {
				state.current = next.name;
				ns.tprintf("Starting population investigation in %s", state.current);
				next.population = ns.bladeburner.getCityEstimatedPopulation(next.name);
				if (next.name != ns.bladeburner.getCity()) {
					ns.bladeburner.switchCity(next.name);
				}
			} else {
				ns.tprintf("Finished population investigation");
				state.lastExecution = Date.now();
				state.current = undefined;
			}
		}
	}
	ns.write("bb-cities.txt", JSON.stringify(state), "w");
	executeInvestigation(ns);
}

/** @param {NS} ns */
function executeInvestigation(ns) {
	var current = ns.bladeburner.getCurrentAction();
	if (current.type == "General" && current.name == "Field Analysis") {
		ns.printf("Investigation is already running");
		return;
	}
	ns.bladeburner.startAction("General", "Field Analysis");
}
