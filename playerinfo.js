import { statsGainFactor } from "/helpers.js";

/** @param {NS} ns **/
export async function main(ns) {
  const options = ns.flags([["raw", false]], [["multiplier", false]]);
  const playerInfo = ns.getPlayer();
  if (options.raw) {
    ns.tprintf("%s", JSON.stringify(playerInfo));
    return;
  }
  ns.tprintf("%30s: %s", "People killed", playerInfo.numPeopleKilled);
  ns.tprintf("%30s: %s", "City", playerInfo.city);
  ns.tprintf("%30s: %s", "Bit node number", playerInfo.bitNodeN);
  ns.tprintf("%30s: %s", "Total play time", playerInfo.totalPlaytime);
  ns.tprintf("%30s: %s", "Play time since Aug", playerInfo.playtimeSinceLastAug);
  ns.tprintf("%30s: %s", "Play time since bitnode", playerInfo.playtimeSinceLastBitnode);
  if (playerInfo.tor) {
    ns.tprintf("%30s: %s", "Tor router", "yes");
  }
  if (playerInfo.tor) {
    ns.tprintf("%30s: %s", "In bladeburner", "yes");
  }
  if (playerInfo.tor) {
    ns.tprintf("%30s: %s", "Has corporation", "yes");
  }
  ns.tprintf("%30s: %s", "Factions", playerInfo.factions.join(", "));
  ns.tprintf("%30s: %s", "Jobs", JSON.stringify(playerInfo.jobs));
  if (options.multiplier) {
    ns.tprintf("%30s", "Multiplier");
    ns.tprintf("%30s: %s", "Hacking chance", playerInfo.mults.hacking_chance);
    ns.tprintf("%30s: %s", "Hacking speed", playerInfo.mults.hacking_speed);
  }
  ns.tprintf("%30s: %s", "Karma:", ns.heart.break());
  ns.tprintf("%30s: %f", "Stats gain factor", statsGainFactor(ns));
}