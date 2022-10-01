import { getAvailableMoney } from "/helpers.js";


import * as c from "constants.js";
const MEMBER_PREFIX = "member-";

/** @param {NS} ns */
export async function main(ns) {
	if (ns.getPlayer().bitNodeN != 2 && ns.heart.break() > -54000) {
		ns.printf("Cannot do gangs on bitnodes other than 2 with a karma of %s", ns.heart.break());
		return;
	}
	if (!ns.getPlayer().factions.includes(c.NITESEC)) {
		ns.printf("Need to be in %s first", c.NITESEC);
		return;
	}
	if (!ns.gang.inGang()) {
		if (ns.gang.createGang(c.NITESEC)) {
			ns.tprintf("Created gang with %s", c.NITESEC);
		} else {
			ns.tprintf("Failed to create gang with %s", c.NITESEC);
			return;
		}
	}
	recruitMembers(ns);
	ascendMembers(ns);
	equipMembers(ns);
	setMemberTasks(ns);
	await ns.sleep(1000);
	await balanceWantedLevel(ns);
	ns.printf("Gang info: %s", JSON.stringify(ns.gang.getGangInformation()));
}

/** @param {NS} ns */
function recruitMembers(ns) {
	while (ns.gang.canRecruitMember()) {
		const name = MEMBER_PREFIX + ns.gang.getMemberNames().length;
		if (ns.gang.recruitMember(name)) {
			ns.tprintf("Recruited %s", name);
		} else {
			ns.tprintf("Failed to recruit %s", name);
			return;
		}
	}
}

/** @param {NS} ns */
function ascendMembers(ns) {
	if (ns.gang.getGangInformation().wantedPenalty < 0.9) {
		return;
	}
	for (var name of ns.gang.getMemberNames()) {
		const memberInfo = ns.gang.getMemberInformation(name);
		if (memberInfo.hack_exp > Math.max(5000, 2500 + memberInfo.hack_asc_points)) {
			if (ns.gang.ascendMember(name)) {
				return;
			}
		}
	}
}

/** @param {NS} ns */
function equipMembers(ns) {
	var moneyToSpend = 0.1 * getAvailableMoney(ns);
	const equipments = ns.gang.getEquipmentNames().
		filter(a => ns.gang.getEquipmentStats(a).hack && ns.gang.getEquipmentCost(a) < moneyToSpend).
		sort((a, b) => ns.gang.getEquipmentCost(a) - ns.gang.getEquipmentCost(b)).reverse();
	for (var equipment of equipments) {
		for (var name of ns.gang.getMemberNames()) {
			if (moneyToSpend > 0) {
				if (ns.gang.purchaseEquipment(name, equipment)) {
					moneyToSpend -= ns.gang.getEquipmentCost(equipment);
				}
			}
		}
	}
}

/** @param {NS} ns */
function setMemberTasks(ns) {
	for (var name of ns.gang.getMemberNames()) {
		const hackingLevel = ns.gang.getMemberInformation(name).hack;
		if (hackingLevel < 50) {
			ns.gang.setMemberTask(name, "Train Hacking");
		} else if (hackingLevel < 75) {
			ns.gang.setMemberTask(name, "Ransomware");
		} else if (hackingLevel < 320) {
			ns.gang.setMemberTask(name, "Phishing");
		} else if (hackingLevel < 1200) {
			ns.gang.setMemberTask(name, "Identity Theft");
		} else if (hackingLevel < 1250) {
			ns.gang.setMemberTask(name, "Fraud & Counterfeiting");
		} else {
			ns.gang.setMemberTask(name, "Money Laundering");
		}
	}
}

/** @param {NS} ns */
async function balanceWantedLevel(ns) {
	for (var name of ns.gang.getMemberNames()) {
		if (ns.gang.getMemberInformation(name).hack < 50) {
			continue;
		}
		await ns.sleep(1000);
		const info = ns.gang.getGangInformation();
		if (info.wantedLevel < 2.0) {
			continue;
		}
		if (info.wantedPenalty < 0.8) {
			ns.gang.setMemberTask(name, "Ethical Hacking");
			continue;
		}
		if (info.wantedPenalty < 0.9 && info.wantedLevelGainRate > 0) {
			ns.gang.setMemberTask(name, "Ethical Hacking");
		}
	}
}