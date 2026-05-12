import { UPGRADE_DEFINITIONS } from "./data/upgrades.js";
import { gameState } from "./game-state.js";
import { getBuildingBulkCost, recalculateClickPower, recalculateCps } from "./game-rules.js";

let shopUpdateHandler = () => {};
let achievementHandler = () => {};

export function setShopCallbacks({ onUpdate, onAchievements } = {}) {
  shopUpdateHandler = onUpdate || shopUpdateHandler;
  achievementHandler = onAchievements || achievementHandler;
}

export function buyBuilding(buildingKey, qty = 1) {
  const building = gameState.buildings[buildingKey];
  if (!building || qty < 1) return false;

  const cost = getBuildingBulkCost(buildingKey, qty);
  if (gameState.crystals < cost) return false;

  gameState.crystals -= cost;
  building.count += qty;
  recalculateCps();
  achievementHandler();
  shopUpdateHandler();
  return true;
}

export function buyUpgrade(upgradeKey) {
  const upgrade = UPGRADE_DEFINITIONS[upgradeKey];
  if (!upgrade || gameState.upgrades[upgradeKey] || gameState.crystals < upgrade.cost) {
    return false;
  }

  gameState.crystals -= upgrade.cost;
  gameState.upgrades[upgradeKey] = true;
  recalculateClickPower();
  recalculateCps();
  achievementHandler();
  shopUpdateHandler();
  return true;
}
