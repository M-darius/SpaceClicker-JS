// Barrel de compatibilité - peut être supprimé une fois tous les imports mis à jour.
export { BUILDING_DEFINITIONS } from "./data/buildings.js";
export { UPGRADE_DEFINITIONS } from "./data/upgrades.js";
export { PLANETS } from "./data/planets.js";
export { gameState, activeBonuses, createDefaultGameState, cloneBuildings, defaultUpgrades } from "./game-state.js";
export { cleanExpiredBonuses, addActiveBonus, computeOfflineGains, getCurrentPlanet, getNextPlanet, getCurrentThreshold, getBuildingCost, getBuildingBulkCost, getMaxBuyableCount, recalculateCps, recalculateClickPower, canPrestige, performPrestige, resetGame, mergeLoadedState, mineCrystal, setGameCallbacks, fireTick, fireAchievements } from "./game-rules.js";
export { startGameLoop } from "./game-loop.js";
