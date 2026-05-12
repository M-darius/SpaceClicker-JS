import { BUILDING_DEFINITIONS } from "./data/buildings.js";
import { UPGRADE_DEFINITIONS } from "./data/upgrades.js";

export function cloneBuildings() {
  return Object.fromEntries(
    Object.entries(BUILDING_DEFINITIONS).map(([key, b]) => [key, { ...b }])
  );
}

export function defaultUpgrades() {
  return Object.fromEntries(Object.keys(UPGRADE_DEFINITIONS).map((k) => [k, false]));
}

export function createDefaultGameState() {
  return {
    crystals: 0,
    totalCrystalsEver: 0,
    crystalsThisPrestige: 0,
    crystalsPerClick: 1,
    crystalsPerSecond: 0,
    totalClicks: 0,
    prestigeCount: 0,
    prestigeMultiplier: 1,
    buildings: cloneBuildings(),
    upgrades: defaultUpgrades(),
    achievements: { unlocked: [] },
    lastSaved: null
  };
}

export const gameState = createDefaultGameState();
export const activeBonuses = [];
