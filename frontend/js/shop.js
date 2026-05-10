import { gameState, getBuildingCost, recalculateClickPower, recalculateCps, UPGRADE_DEFINITIONS } from "./game.js";

let shopUpdateHandler = () => {};
let achievementHandler = () => {};

export function setShopCallbacks({ onUpdate, onAchievements } = {}) {
  shopUpdateHandler = onUpdate || shopUpdateHandler;
  achievementHandler = onAchievements || achievementHandler;
}

export function buyBuilding(buildingKey) {
  const building = gameState.buildings[buildingKey];
  if (!building) return false;

  // Le coût est lu au moment de l'achat pour suivre le scaling exponentiel.
  const cost = getBuildingCost(buildingKey);
  if (gameState.crystals < cost) return false;

  gameState.crystals -= cost;
  building.count += 1;
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
