import { getAvailableMoney, getEstimation, runAndWait } from "/helpers.js";


import * as c from "constants.js";
const MEMBER_PREFIX = "member-";

/** @param {NS} ns */
export async function main(ns) {
	const options = ns.flags([["spend", false]]);
	if (ns.getPlayer().bitNodeN != 2 && ns.heart.break() > -54000) {
		ns.printf("Cannot do gangs on bitnodes other than 2 with a karma of %s", ns.heart.break());
		return;
	}
	if (ns.singularity.checkFactionInvitations().includes(c.NITESEC)) {
		ns.singularity.joinFaction(c.NITESEC);
	}
	if (!ns.getPlayer().factions.includes(c.NITESEC)) {
		ns.printf("Need to be in %s first", c.NITESEC);
		return;
	}
	if (!ns.gang.inGang()) {
		if (ns.gang.createGang(c.NITESEC)) {
			ns.tprintf("Created gang with %s", c.NITESEC);
			await runAndWait(ns, "database/create.js");
		} else {
			ns.tprintf("Failed to create gang with %s", c.NITESEC);
			return;
		}
	}
	recruitMembers(ns);
	ascendMembers(ns);
	if (options.spend) {
		ns.tprintf("Spending available money on gang");
		equipMembers(ns, 1);
		return;
	}
	equipMembers(ns, 0.1);
	await setMemberTasks(ns);
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
function equipMembers(ns, fraction) {
	var moneyToSpend = fraction * getAvailableMoney(ns);
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
async function setMemberTasks(ns) {
	var preferMoney;
	const estimation = await getEstimation(ns);
	if (estimation.augmentationCount > estimation.affordableAugmentationCount) {
		preferMoney = true;
	} else {
		preferMoney = false;
	}
	const money = getAvailableMoney(ns);
	if (money < 1e9) {
		preferMoney = true;
	}
	if (ns.getPlayer().bitNodeN == 8) {
		// in bitnode 8 there is no way to earn money other than on the stock market
		preferMoney = false;
	}

	for (var name of ns.gang.getMemberNames()) {
		const hackingLevel = ns.gang.getMemberInformation(name).hack;
		if (hackingLevel < 50) {
			ns.gang.setMemberTask(name, "Train Hacking");
		} else if (hackingLevel < 75) {
			ns.gang.setMemberTask(name, "Ransomware");
		} else if (hackingLevel < 320) {
			ns.gang.setMemberTask(name, "Phishing");
		} else if (hackingLevel < 700) {
			ns.gang.setMemberTask(name, "Identity Theft");
		} else if (hackingLevel < 1500) {
			ns.gang.setMemberTask(name, "Fraud & Counterfeiting");
		} else if (hackingLevel < 6000 || preferMoney) {
			ns.gang.setMemberTask(name, "Money Laundering");
		} else {
			ns.gang.setMemberTask(name, "Cyberterrorism");
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