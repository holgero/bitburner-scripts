import { getAvailableMoney } from "./helpers.js";

const UNIS = ["ZB Institute of Technology", "Summit University", "Rothman University"];
const CS_COURSES = ["Algorithms", "Networks", "Data Structures", "Study Computer Science"];
const CHEAP_CS_COURSES = ["Study Computer Science"];
const BA_COURSES = ["Leadership", "Management"];

/** @param {NS} ns */
export async function main(ns) {
	const options = ns.flags([["course", "CS"], ["focus", "false"], ["negative", false]]);
	var courses;
	var classType;
	switch (options.course) {
		case "CS":
			if (getAvailableMoney(ns) > 1e9 || options.negative) {
				classType = "Algorithms";
				courses = CS_COURSES;
			} else {
				classType = "STUDYCOMPUTERSCIENCE";
				courses = CHEAP_CS_COURSES;
			}
			break;
		case "BA":
			courses = BA_COURSES;
			break;
	}
	const current = ns.singularity.getCurrentWork();
	if (current != null && current.type == "CLASS" && current.classType == classType) {
		ns.printf("Already %s", current.classType);
		return;
	} else {
		ns.tprintf("%s", JSON.stringify(current));
	}
	for (var uni of UNIS) {
		for (var course of courses) {
			if (ns.singularity.universityCourse(uni, course)) {
				return;
			}
		}
	}
}