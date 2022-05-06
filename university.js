const UNIS = [ "ZB Institute of Technology", "Summit University", "Rothman University"];
const CS_COURSES = [ "Algorithms", "Networks", "Data Structures", "Computer Science"];
const BA_COURSES = [ "Leadership", "Management"];

/** @param {NS} ns */
export async function main(ns) {
	var options = ns.flags([["course", "CS"], ["focus", false]]);
	for (var uni of UNIS) {
		var courses;
		switch (options.course) {
			case "CS":
			courses = CS_COURSES;
			break;
			case "BA":
			courses = BA_COURSES;
			break;
		}
		for (var course of courses) {
			if (ns.universityCourse(uni, course, options.focus)) return;
		}
	}
}