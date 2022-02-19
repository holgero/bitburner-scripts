/** @param {NS} ns **/
export async function main(ns) {
	var content = ns.read("count.txt");
	if (content == "") {
		content = 0;
	} else {
		content++;
	}
	ns.tprint(content);
	ns.write("count.txt", content, "w");
}