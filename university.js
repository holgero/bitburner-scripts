import { getAvailableMoney } from "./helpers.js";

const UNIS = ["ZB Institute of Technology", "Summit University", "Rothman University"];
const CS_COURSES = ["Algorithms", "Networks", "Data Structures", "Study Computer Science"];
const CHEAP_CS_COURSES = ["Study Computer Science"];
const BA_COURSES = ["Leadership", "Management"];

/** @param {NS} ns */
export async function main(ns) {
	const options = ns.flags([["course", "CS"], ["focus", "false"], ["negative", false]]);
	const focus = JSON.parse(options.focus);
	var courses;
	var classType;
	switch (options.course) {
		case "CS":
			classType = "STUDYCOMPUTERSCIENCE";
			if (getAvailableMoney(ns) > 1e9 || options.negative) {
				courses = CS_COURSES;
			} else {
				courses = CHEAP_CS_COURSES;
			}
			break;
		case "BA":
			courses = BA_COURSES;
			break;
	}
	for (var uni of UNIS) {
		for (var course of courses) {
			// {"type":"CLASS","cyclesWorked":226,"classType":"STUDYCOMPUTERSCIENCE","location":"Rothman University"}
			const current = ns.singularity.getCurrentWork();
			if (current != null && current.type == "CLASS" && current.classType == classType) {
				ns.printf("Already %s", current.classType);
				return;
			}
			if (ns.singularity.universityCourse(uni, course, focus)) {
				return;
			}
		}
	}
}