import { statsGainFactor } from "/helpers.js";

/** @param {NS} ns **/
export async function main(ns) {
  const options = ns.flags([["raw", false], ["multiplier", false]]);
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
  if (playerInfo.inBladeburner) {
    ns.tprintf("%30s: %s", "In bladeburner", "yes");
  }
  if (playerInfo.hasCorporation) {
    ns.tprintf("%30s: %s", "Has corporation", "yes");
  }
  ns.tprintf("%30s: %s", "Factions", playerInfo.factions.join(", "));
  ns.tprintf("%30s: %s", "Jobs", JSON.stringify(playerInfo.jobs));
  ns.tprintf("%30s: %s", "Work", JSON.stringify(ns.singularity.getCurrentWork()));
  
  if (options.multiplier) {
    ns.tprintf("%30s", "Multiplier");
    ns.tprintf("%30s: %s", "Hacking chance", playerInfo.mults.hacking_chance.toFixed(2));
    ns.tprintf("%30s: %s", "Hacking speed", playerInfo.mults.hacking_speed.toFixed(2));
    ns.tprintf("%30s: %s", "Hacking money", playerInfo.mults.hacking_money.toFixed(2));
    ns.tprintf("%30s: %s", "Hacking grow", playerInfo.mults.hacking_grow.toFixed(2));
    ns.tprintf("%30s: %s", "Hacking", playerInfo.mults.hacking.toFixed(2));
    ns.tprintf("%30s: %s", "Strength", playerInfo.mults.strength.toFixed(2));
    ns.tprintf("%30s: %s", "Defense", playerInfo.mults.defense.toFixed(2));
    ns.tprintf("%30s: %s", "Dexterity", playerInfo.mults.dexterity.toFixed(2));
    ns.tprintf("%30s: %s", "Agility", playerInfo.mults.agility.toFixed(2));
    ns.tprintf("%30s: %s", "Charisma", playerInfo.mults.charisma.toFixed(2));
    ns.tprintf("%30s: %s", "Hacking exp", playerInfo.mults.hacking_exp.toFixed(2));
    ns.tprintf("%30s: %s", "Strength exp", playerInfo.mults.strength_exp.toFixed(2));
    ns.tprintf("%30s: %s", "Defense exp", playerInfo.mults.defense_exp.toFixed(2));
    ns.tprintf("%30s: %s", "Dexterity exp", playerInfo.mults.dexterity_exp.toFixed(2));
    ns.tprintf("%30s: %s", "Agility exp", playerInfo.mults.agility_exp.toFixed(2));
    ns.tprintf("%30s: %s", "Charisma exp", playerInfo.mults.charisma_exp.toFixed(2));
    ns.tprintf("%30s: %s", "Company rep", playerInfo.mults.company_rep.toFixed(2));
    ns.tprintf("%30s: %s", "Faction rep", playerInfo.mults.faction_rep.toFixed(2));
    ns.tprintf("%30s: %s", "Crime money", playerInfo.mults.crime_money.toFixed(2));
    ns.tprintf("%30s: %s", "Crime success", playerInfo.mults.crime_success.toFixed(2));
    ns.tprintf("%30s: %s", "Hacknet node money", playerInfo.mults.hacknet_node_money.toFixed(2));
    ns.tprintf("%30s: %s", "Hacknet node purchase cost", playerInfo.mults.hacknet_node_purchase_cost.toFixed(2));
    ns.tprintf("%30s: %s", "Hacknet node ram cost", playerInfo.mults.hacknet_node_ram_cost.toFixed(2));
    ns.tprintf("%30s: %s", "Hacknet node core cost", playerInfo.mults.hacknet_node_core_cost.toFixed(2));
    ns.tprintf("%30s: %s", "Hacknet node level cost", playerInfo.mults.hacknet_node_level_cost.toFixed(2));
    ns.tprintf("%30s: %s", "Work money", playerInfo.mults.work_money.toFixed(2));
    ns.tprintf("%30s: %s", "Bladeburner max stamina", playerInfo.mults.bladeburner_max_stamina.toFixed(2));
    ns.tprintf("%30s: %s", "Bladeburner stamina gain", playerInfo.mults.bladeburner_stamina_gain.toFixed(2));
    ns.tprintf("%30s: %s", "Bladeburner analysis", playerInfo.mults.bladeburner_analysis.toFixed(2));
    ns.tprintf("%30s: %s", "Bladeburner success chance", playerInfo.mults.bladeburner_success_chance.toFixed(2));
  }
  ns.tprintf("%30s: %s", "Karma:", ns.heart.break());
  ns.tprintf("%30s: %f", "Stats gain factor", statsGainFactor(ns));
}