import { runAndWait } from "helpers.js";

/** @param {NS} ns **/
export async function main(ns) {
	await runAndWait(ns, "create-database1.js");
	await runAndWait(ns, "create-database2.js");
	await runAndWait(ns, "create-database3.js");
	await runAndWait(ns, "create-database4.js");
	await runAndWait(ns, "create-database5.js");
	await runAndWait(ns, "create-database6.js");
}