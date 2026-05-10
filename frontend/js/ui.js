import { ACHIEVEMENTS } from "./achievements.js";
import { BUILDING_DEFINITIONS, gameState, getBuildingCost, getCurrentPlanet, getCurrentThreshold, getNextPlanet, UPGRADE_DEFINITIONS } from "./game.js";

const els = {};

export function initUI() {
  [
    "crystalCount", "crystalCountStat", "cpsValue", "perClickValue", "totalCrystals", "totalClicks",
    "prestigeCount", "prestigeMultiplier", "prestigeProgress", "prestigeLabel", "prestigeButton",
    "buildingsList", "upgradesList", "achievementsGrid", "notifications", "authPanel", "authStatus",
    "usernameInput", "passwordInput", "saveStatus", "leaderboardList", "authToggle", "logoutButton",
    "planetName", "planetDesc"
  ].forEach((id) => {
    els[id] = document.getElementById(id);
  });

  initPlanetCanvas();
  renderShop();
  renderAchievements();
  updateUI();
}

export function formatNumber(value) {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)} Md`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)} M`;
  if (value >= 10_000) return Math.floor(value).toLocaleString("fr-FR");
  if (value >= 100) return Math.floor(value).toLocaleString("fr-FR");
  return value.toFixed(value < 10 ? 1 : 0).replace(".0", "");
}

export function renderShop() {
  els.buildingsList.innerHTML = Object.entries(BUILDING_DEFINITIONS).map(([key, building]) => `
    <button class="shop-card" data-building="${key}">
      <span class="shop-icon">${building.icon}</span>
      <span class="shop-info">
        <strong>${building.name}</strong>
        <small><span data-building-cost="${key}"></span> 💎 · +${building.baseCps}/s</small>
      </span>
      <span class="owned" data-building-count="${key}">0</span>
    </button>
  `).join("");

  // Upgrades groupées par catégorie pour plus de lisibilité.
  const categories = [
    { label: "⛏️ Améliorations du clic",    filter: (u) => u.applies === "click" },
    { label: "🏗️ Améliorations de bâtiments", filter: (u) => !["click", "global"].includes(u.applies) },
    { label: "🌐 Multiplicateurs globaux",   filter: (u) => u.applies === "global" }
  ];

  els.upgradesList.innerHTML = categories.map(({ label, filter }) => {
    const entries = Object.entries(UPGRADE_DEFINITIONS).filter(([, u]) => filter(u));
    if (!entries.length) return "";
    return `
      <p class="upgrade-category">${label}</p>
      ${entries.map(([key, upgrade]) => `
        <button class="shop-card upgrade-card" data-upgrade="${key}">
          <span class="shop-icon">${upgrade.icon}</span>
          <span class="shop-info">
            <strong>${upgrade.name}</strong>
            <small>${upgrade.description}</small>
          </span>
          <span class="owned">${formatNumber(upgrade.cost)} 💎</span>
        </button>
      `).join("")}
    `;
  }).join("");
}

export function renderAchievements() {
  els.achievementsGrid.innerHTML = ACHIEVEMENTS.map((achievement) => `
    <div class="achievement locked" data-achievement="${achievement.id}" title="${achievement.description}">
      <span>${achievement.icon}</span>
      <strong>${achievement.label}</strong>
    </div>
  `).join("");
}

// ── Animation Canvas pour les spritesheets de planètes ───────────────────────
let planetCanvas = null;
let planetCtx = null;
let currentPlanetImage = "";
let spriteImage = null;
let spriteFrame = 0;
let spriteAnimId = null;
let spriteLastTime = 0;

function initPlanetCanvas() {
  planetCanvas = document.getElementById("planetCanvas");
  if (planetCanvas) {
    planetCtx = planetCanvas.getContext("2d");
    // Taille de rendu = taille CSS du bouton, via CSS on laisse la canvas scaler.
    planetCanvas.width = 200;
    planetCanvas.height = 200;
  }
}

function drawFrame(planet, img) {
  if (!planetCtx || !img) return;
  const sprite = planet.sprite || { columns: 1, rows: 1, frameMs: 120 };
  const totalFrames = sprite.columns * sprite.rows;
  const col = spriteFrame % sprite.columns;
  const row = Math.floor(spriteFrame / sprite.columns);
  const frameW = img.naturalWidth / sprite.columns;
  const frameH = img.naturalHeight / sprite.rows;
  planetCtx.clearRect(0, 0, 200, 200);
  planetCtx.drawImage(img, col * frameW, row * frameH, frameW, frameH, 0, 0, 200, 200);
}

function startPlanetSprite(planet) {
  // Rien à faire si même planète déjà chargée.
  if (currentPlanetImage === planet.img && spriteImage) return;

  // Arrêt de la boucle précédente.
  if (spriteAnimId) {
    cancelAnimationFrame(spriteAnimId);
    spriteAnimId = null;
  }

  currentPlanetImage = planet.img;
  spriteFrame = 0;
  spriteLastTime = 0;
  spriteImage = null;

  if (!planetCtx) initPlanetCanvas();
  if (!planetCtx) return;

  const img = new Image();
  img.src = planet.img;

  img.onload = () => {
    spriteImage = img;
    const sprite = planet.sprite || { columns: 1, rows: 1, frameMs: 120 };
    const totalFrames = sprite.columns * sprite.rows;

    // Premier rendu immédiat.
    drawFrame(planet, img);

    if (totalFrames <= 1) return; // GIF ou image statique : pas de boucle.

    function loop(timestamp) {
      if (!spriteImage) return;
      if (timestamp - spriteLastTime >= sprite.frameMs) {
        spriteFrame = (spriteFrame + 1) % totalFrames;
        drawFrame(planet, spriteImage);
        spriteLastTime = timestamp;
      }
      spriteAnimId = requestAnimationFrame(loop);
    }

    spriteAnimId = requestAnimationFrame(loop);
  };

  img.onerror = () => {
    // Fallback : cercle coloré si l'image ne charge pas.
    if (!planetCtx) return;
    planetCtx.clearRect(0, 0, 200, 200);
    planetCtx.fillStyle = "#1a2a4a";
    planetCtx.beginPath();
    planetCtx.arc(100, 100, 100, 0, Math.PI * 2);
    planetCtx.fill();
  };
}

export function updateUI() {
  els.crystalCount.textContent = formatNumber(gameState.crystals);
  if (els.crystalCountStat) els.crystalCountStat.textContent = formatNumber(gameState.crystals);
  els.cpsValue.textContent = formatNumber(gameState.crystalsPerSecond);
  els.perClickValue.textContent = formatNumber(gameState.crystalsPerClick);
  els.totalCrystals.textContent = formatNumber(gameState.totalCrystalsEver);
  els.totalClicks.textContent = formatNumber(gameState.totalClicks);
  els.prestigeCount.textContent = formatNumber(gameState.prestigeCount);
  els.prestigeMultiplier.textContent = `x${gameState.prestigeMultiplier.toFixed(2)}`;

  // Planète actuelle et barre de progression vers la prochaine.
  const planet = getCurrentPlanet();
  const threshold = getCurrentThreshold();
  const next = getNextPlanet();

  if (els.planetName) els.planetName.textContent = planet.name;
  if (els.planetDesc) els.planetDesc.textContent = planet.description;
  startPlanetSprite(planet);

  const progress = Math.min(100, (gameState.crystalsThisPrestige / threshold) * 100);
  els.prestigeProgress.style.width = `${progress}%`;

  if (next) {
    els.prestigeLabel.textContent = `${formatNumber(gameState.crystalsThisPrestige)} / ${formatNumber(threshold)} 💎 → ${next.icon} ${next.name}`;
    els.prestigeButton.textContent = `Coloniser ${next.name} ${next.icon}`;
  } else {
    els.prestigeLabel.textContent = `${formatNumber(gameState.crystalsThisPrestige)} / ${formatNumber(threshold)} 💎`;
    els.prestigeButton.textContent = `Coloniser une nouvelle planète 🚀`;
  }

  els.prestigeButton.hidden = gameState.crystalsThisPrestige < threshold;

  updateShopState();
  updateAchievementsState();
}

export function updateShopState() {
  Object.keys(gameState.buildings).forEach((key) => {
    const cost = getBuildingCost(key);
    const button = document.querySelector(`[data-building="${key}"]`);
    if (!button) return;
    document.querySelector(`[data-building-cost="${key}"]`).textContent = formatNumber(cost);
    document.querySelector(`[data-building-count="${key}"]`).textContent = gameState.buildings[key].count;
    button.disabled = gameState.crystals < cost;
  });

  Object.keys(UPGRADE_DEFINITIONS).forEach((key) => {
    const button = document.querySelector(`[data-upgrade="${key}"]`);
    if (!button) return;
    const bought = gameState.upgrades[key];
    button.disabled = bought || gameState.crystals < UPGRADE_DEFINITIONS[key].cost;
    button.classList.toggle("purchased", bought);
  });
}

export function updateAchievementsState() {
  ACHIEVEMENTS.forEach((achievement) => {
    const badge = document.querySelector(`[data-achievement="${achievement.id}"]`);
    if (!badge) return;
    badge.classList.toggle("locked", !gameState.achievements.unlocked.includes(achievement.id));
  });
}

export function showAchievementNotification(achievement) {
  const notification = document.createElement("div");
  notification.className = "notification";
  notification.innerHTML = `<span>${achievement.icon}</span><strong>${achievement.label}</strong><small>${achievement.description}</small>`;
  els.notifications.appendChild(notification);
  window.setTimeout(() => notification.remove(), 4200);
  updateAchievementsState();
}

export function showClickParticle(x, y, amount) {
  const particle = document.createElement("span");
  particle.className = "click-particle";
  particle.textContent = `+${formatNumber(amount)} 💎`;
  particle.style.left = `${x}px`;
  particle.style.top = `${y}px`;
  document.body.appendChild(particle);
  window.setTimeout(() => particle.remove(), 900);
}

export function setAuthStatus(username) {
  const loggedIn = !!username;
  els.authStatus.textContent = loggedIn ? `Connecté : ${username}` : "Mode local";
  els.authToggle.hidden = loggedIn;
  els.logoutButton.hidden = !loggedIn;
  if (loggedIn) toggleAuthPanel(false);
}

export function setSaveStatus(message) {
  els.saveStatus.textContent = message;
}

export function getCredentials() {
  return {
    username: els.usernameInput.value.trim(),
    password: els.passwordInput.value
  };
}

export function toggleAuthPanel(force) {
  els.authPanel.classList.toggle("open", force ?? !els.authPanel.classList.contains("open"));
}

export function renderLeaderboard(rows) {
  els.leaderboardList.innerHTML = rows.length
    ? rows.map((row) => `<li><span>#${row.rank} ${row.username}</span><strong>${formatNumber(row.totalCrystalsEver)} 💎</strong></li>`).join("")
    : "<li>Aucun score pour le moment.</li>";
}
