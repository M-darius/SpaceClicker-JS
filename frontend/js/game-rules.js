import { BUILDING_DEFINITIONS } from "./data/buildings.js";
import { UPGRADE_DEFINITIONS } from "./data/upgrades.js";
import { PLANETS } from "./data/planets.js";
import { gameState, activeBonuses, createDefaultGameState, cloneBuildings, defaultUpgrades } from "./game-state.js";

let tickHandler = () => {};
let achievementHandler = () => {};

export function setGameCallbacks({ onTick, onAchievements } = {}) {
  if (onTick) tickHandler = onTick;
  if (onAchievements) achievementHandler = onAchievements;
}

export function fireTick() { tickHandler(); }
export function fireAchievements() { achievementHandler(); }

export function cleanExpiredBonuses() {
  const now = Date.now();
  const valid = activeBonuses.filter(b => b.expiresAt > now);
  if (valid.length === activeBonuses.length) return false;
  activeBonuses.splice(0, activeBonuses.length, ...valid);
  return true;
}

export function addActiveBonus(id, target, multiplier, durationMs) {
  activeBonuses.push({ id, target, multiplier, expiresAt: Date.now() + durationMs });
  if (target === 'cps')   recalculateCps();
  if (target === 'click') recalculateClickPower();
  tickHandler();
}

export function computeOfflineGains(savedState) {
  if (!savedState?.lastSaved || !(savedState.crystalsPerSecond > 0)) return null;
  const MAX_SECS = 8 * 3600;
  const elapsed = Math.min((Date.now() - savedState.lastSaved) / 1000, MAX_SECS);
  if (elapsed < 30) return null;
  const gained = Math.floor(savedState.crystalsPerSecond * elapsed);
  return { elapsed, gained, cps: savedState.crystalsPerSecond };
}

export function getCurrentPlanet() {
  const idx = Math.min(gameState.prestigeCount, PLANETS.length - 1);
  return PLANETS[idx];
}

export function getNextPlanet() {
  return PLANETS[gameState.prestigeCount + 1] ?? null;
}

export function getCurrentThreshold() {
  return getCurrentPlanet().threshold;
}

export function getBuildingBulkCost(buildingKey, qty) {
  const building = gameState.buildings[buildingKey];
  let total = 0;
  for (let i = 0; i < qty; i++) {
    total += Math.ceil(building.baseCost * Math.pow(1.15, building.count + i));
  }
  return total;
}

export function getMaxBuyableCount(buildingKey) {
  const building = gameState.buildings[buildingKey];
  let qty = 0;
  let spent = 0;
  while (qty < 10_000) {
    const next = Math.ceil(building.baseCost * Math.pow(1.15, building.count + qty));
    if (spent + next > gameState.crystals) break;
    spent += next;
    qty++;
  }
  return qty;
}

export function recalculateCps() {
  let total = 0;
  let globalMultiplier = 1;

  Object.entries(UPGRADE_DEFINITIONS).forEach(([key, upgrade]) => {
    if (upgrade.applies === "global" && gameState.upgrades[key]) {
      globalMultiplier *= upgrade.multiplier;
    }
  });

  Object.entries(gameState.buildings).forEach(([key, building]) => {
    let buildingCps = building.count * building.baseCps;
    Object.entries(UPGRADE_DEFINITIONS).forEach(([upgradeKey, upgrade]) => {
      if (upgrade.applies === key && gameState.upgrades[upgradeKey]) {
        buildingCps *= upgrade.multiplier;
      }
    });
    total += buildingCps;
  });

  const now = Date.now();
  const cpsBonusMult = activeBonuses
    .filter(b => b.target === 'cps' && b.expiresAt > now)
    .reduce((acc, b) => acc * b.multiplier, 1);
  gameState.crystalsPerSecond = total * globalMultiplier * gameState.prestigeMultiplier * cpsBonusMult;
}

export function recalculateClickPower() {
  let clickMultiplier = 1;
  Object.entries(UPGRADE_DEFINITIONS).forEach(([key, upgrade]) => {
    if (upgrade.applies === "click" && gameState.upgrades[key]) {
      clickMultiplier *= upgrade.multiplier;
    }
  });
  const now = Date.now();
  const clickBonusMult = activeBonuses
    .filter(b => b.target === 'click' && b.expiresAt > now)
    .reduce((acc, b) => acc * b.multiplier, 1);
  gameState.crystalsPerClick = clickMultiplier * gameState.prestigeMultiplier * clickBonusMult;
}

export function canPrestige() {
  return gameState.crystalsThisPrestige >= getCurrentThreshold();
}

export function performPrestige() {
  if (!canPrestige()) return false;
  gameState.crystals = 0;
  gameState.crystalsThisPrestige = 0;
  gameState.prestigeCount += 1;
  gameState.prestigeMultiplier *= 1.5;
  gameState.buildings = cloneBuildings();
  gameState.upgrades = defaultUpgrades();
  recalculateClickPower();
  recalculateCps();
  achievementHandler();
  tickHandler();
  return true;
}

export function resetGame() {
  const fresh = createDefaultGameState();
  Object.assign(gameState, fresh);
  recalculateClickPower();
  recalculateCps();
  tickHandler();
}

export function mergeLoadedState(loadedState) {
  const freshState = createDefaultGameState();
  const loadedBuildings = loadedState.buildings || {};
  const buildings = Object.fromEntries(
    Object.entries(freshState.buildings).map(([key, building]) => [
      key,
      { ...building, ...(loadedBuildings[key] || {}) }
    ])
  );

  const merged = {
    ...freshState,
    ...loadedState,
    buildings,
    upgrades: { ...freshState.upgrades, ...(loadedState.upgrades || {}) },
    achievements: { unlocked: [...new Set(loadedState.achievements?.unlocked || [])] }
  };

  Object.assign(gameState, merged);
  recalculateClickPower();
  recalculateCps();
  tickHandler();
}

export function mineCrystal() {
  const amount = gameState.crystalsPerClick;
  gameState.crystals += amount;
  gameState.totalCrystalsEver += amount;
  gameState.crystalsThisPrestige += amount;
  gameState.totalClicks += 1;
  achievementHandler();
  tickHandler();
  return amount;
}
