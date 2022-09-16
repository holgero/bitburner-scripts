import { getAvailableMoney } from "./helpers.js";

const UNIS = ["ZB Institute of Technology", "Summit University", "Rothman University"];
const CS_COURSES = ["Algorithms", "Networks", "Data Structures", "Study Computer Science"];
const CHEAP_CS_COURSES = ["Study Computer Science"];
const BA_COURSES = ["Leadership", "Management"];

/** @param {NS} ns */
export async function main(ns) {
	const options = ns.flags([["course", "CS"], ["focus", "false"]]);
	const focus = JSON.parse(options.focus);
	var courses;
	switch (options.course) {
		case "CS":
			if (getAvailableMoney(ns) > 1e9) {
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
			if (ns.singularity.universityCourse(uni, course, focus)) return;
		}
	}
}