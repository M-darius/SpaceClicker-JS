import { checkAchievements, setAchievementCallback } from "./achievements.js";
import { fetchLeaderboard, getSession, loadSave, login, logout, register, saveGame } from "./api.js";
import { canPrestige, computeOfflineGains, gameState, getMaxBuyableCount, mergeLoadedState, mineCrystal, performPrestige, resetGame, setGameCallbacks, startGameLoop } from "./game.js";
import { buyBuilding, buyUpgrade, setShopCallbacks } from "./shop.js";
import { initBuildingsZone, updateBuildingsZone } from "./buildings-zone.js";
import {
  getBuyMode,
  getCredentials,
  initUI,
  renderLeaderboard,
  setAuthStatus,
  setBuyMode,
  setSaveStatus,
  showAchievementNotification,
  showClickParticle,
  showOfflineModal,
  showPlanetRipple,
  toggleAuthPanel,
  updateUI
} from "./ui.js";

async function persistGame(manual = false) {
  const { token } = getSession();
  if (!token) {
    if (manual) setSaveStatus("Connectez-vous pour sauvegarder.");
    return;
  }
  gameState.lastSaved = Date.now();
  try {
    const result = await saveGame(gameState);
    setSaveStatus(manual ? result.message : "Auto-save OK");
  } catch (error) {
    setSaveStatus(error.message);
  }
}

async function refreshLeaderboard() {
  try {
    renderLeaderboard(await fetchLeaderboard());
  } catch {
    renderLeaderboard([]);
  }
}

async function loadExistingSave() {
  const { token } = getSession();
  if (!token) return;
  try {
    const remoteSave = await loadSave();
    if (remoteSave?.gameState) {
      const offline = computeOfflineGains(remoteSave.gameState);
      mergeLoadedState(remoteSave.gameState);

      if (offline && offline.gained > 0) {
        gameState.crystals              += offline.gained;
        gameState.totalCrystalsEver     += offline.gained;
        gameState.crystalsThisPrestige  += offline.gained;
        updateUI();
        showOfflineModal(offline);
      } else {
        setSaveStatus("Sauvegarde chargée.");
      }
    } else {
      setSaveStatus("Nouvelle partie.");
    }
  } catch {
    setSaveStatus("Sauvegarde distante indisponible.");
  }
}

// ── Modal Statistiques ──────────────────────────────────────────────────────
function initStatsModal() {
  const modal   = document.getElementById("statsModal");
  const openBtn = document.getElementById("statsToggle");
  const closeBtn = document.getElementById("statsClose");
  const backdrop = modal.querySelector(".modal-backdrop");

  openBtn.addEventListener("click", () => {
    modal.hidden = false;
    refreshLeaderboard();
  });

  const closeModal = () => { modal.hidden = true; };
  closeBtn.addEventListener("click", closeModal);
  backdrop.addEventListener("click", closeModal);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });
}

function bindEvents() {
  document.getElementById("planetButton").addEventListener("click", (event) => {
    const amount = mineCrystal();
    showClickParticle(event.clientX, event.clientY, amount);
    showPlanetRipple();
  });

  document.querySelectorAll(".bulk-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const raw = btn.dataset.qty;
      setBuyMode(raw === "max" ? "max" : parseInt(raw, 10));
    });
  });

  document.getElementById("buildingsList").addEventListener("click", (event) => {
    const button = event.target.closest("[data-building]");
    if (!button) return;
    const mode = getBuyMode();
    const qty = mode === "max" ? getMaxBuyableCount(button.dataset.building) : mode;
    if (qty > 0) buyBuilding(button.dataset.building, qty);
  });

  document.getElementById("upgradesList").addEventListener("click", (event) => {
    const button = event.target.closest("[data-upgrade]");
    if (button) buyUpgrade(button.dataset.upgrade);
  });

  document.getElementById("prestigeButton").addEventListener("click", () => {
    if (canPrestige() && confirm("Coloniser une nouvelle planète et recommencer avec un bonus permanent ?")) {
      performPrestige();
      persistGame(true);
    }
  });

  document.getElementById("authToggle").addEventListener("click", () => toggleAuthPanel());

  document.getElementById("logoutButton").addEventListener("click", () => {
    const veil = document.createElement("div");
    veil.className = "reset-veil";
    document.body.appendChild(veil);

    setTimeout(() => {
      logout();
      resetGame();
      setAuthStatus(null);
      setSaveStatus("Déconnecté. Votre progression n'est plus sauvegardée.");
      updateBuildingsZone();
      veil.classList.add("veil-out");
      veil.addEventListener("animationend", () => veil.remove(), { once: true });
    }, 600);
  });

  document.getElementById("saveButton").addEventListener("click", () => persistGame(true));
  document.getElementById("leaderboardRefresh").addEventListener("click", refreshLeaderboard);

  document.getElementById("loginButton").addEventListener("click", async () => {
    const { username, password } = getCredentials();
    try {
      const session = await login(username, password);
      setAuthStatus(session.username);
      toggleAuthPanel(false);
      await loadExistingSave();
      await refreshLeaderboard();
    } catch (error) {
      setSaveStatus(error.message);
    }
  });

  document.getElementById("registerButton").addEventListener("click", async () => {
    const { username, password } = getCredentials();
    try {
      const session = await register(username, password);
      setAuthStatus(session.username);
      toggleAuthPanel(false);
      await persistGame(true);
      await refreshLeaderboard();
    } catch (error) {
      setSaveStatus(error.message);
    }
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  initUI();
  initBuildingsZone();
  initStatsModal();
  bindEvents();

  setAchievementCallback(showAchievementNotification);
  setGameCallbacks({
    onTick: () => { updateUI(); updateBuildingsZone(); },
    onAchievements: checkAchievements
  });
  setShopCallbacks({
    onUpdate: () => { updateUI(); updateBuildingsZone(); },
    onAchievements: checkAchievements
  });

  const session = getSession();
  setAuthStatus(session.username);
  await loadExistingSave();
  await refreshLeaderboard();
  startGameLoop();

  window.setInterval(() => persistGame(false), 30_000);
});
