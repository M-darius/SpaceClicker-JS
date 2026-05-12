import { gameState } from "./game-state.js";
import { cleanExpiredBonuses, recalculateCps, recalculateClickPower, fireTick, fireAchievements } from "./game-rules.js";

let loopId = null;

export function startGameLoop() {
  if (loopId) clearInterval(loopId);
  loopId = setInterval(() => {
    if (cleanExpiredBonuses()) {
      recalculateCps();
      recalculateClickPower();
    }
    const produced = gameState.crystalsPerSecond / 10;
    gameState.crystals += produced;
    gameState.totalCrystalsEver += produced;
    gameState.crystalsThisPrestige += produced;
    fireAchievements();
    fireTick();
  }, 100);
}
