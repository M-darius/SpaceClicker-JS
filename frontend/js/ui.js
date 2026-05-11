import { ACHIEVEMENTS } from "./achievements.js";
import { BUILDING_DEFINITIONS, gameState, getBuildingCost, getCurrentPlanet, getCurrentThreshold, getNextPlanet, UPGRADE_DEFINITIONS } from "./game.js";

const els = {};

export function initUI() {
  [
    "crystalCount", "crystalCountStat", "cpsValue", "perClickValue", "totalCrystals", "totalClicks",
    "prestigeCount", "prestigeMultiplier", "prestigeProgress", "prestigeLabel", "prestigeButton",
    "buildingsList", "upgradesList", "achievementsGrid", "notifications", "authPanel", "authStatus",
    "usernameInput", "passwordInput", "saveStatus", "authToggle", "logoutButton",
    "planetName", "planetDesc"
  ].forEach((id) => {
    els[id] = document.getElementById(id);
  });

  initPlanetCanvas();
  initOrbitCanvas();
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

function buildingIconHTML(icon) {
  if (icon.startsWith("assets/")) {
    return `<img class="shop-icon-img" src="${icon}" alt="" />`;
  }
  return `<span class="shop-icon">${icon}</span>`;
}

const BUILDING_BG = {
  drone:    "assets/batiment/bg_drone.jpg",
  mine:     "assets/batiment/bg_mine.jpg",
  refinery: "assets/batiment/bg_refinery.jpg",
  lab:      "assets/batiment/bg_lab.jpg",
  geotherm: "assets/batiment/bg_geotherm.jpg",
  orbital:  "assets/batiment/bg_orbital.jpg",
  reactor:  "assets/batiment/bg_reactor.jpg",
  megastr:  "assets/batiment/bg_megastr.jpg",
};

export function renderShop() {
  els.buildingsList.innerHTML = Object.entries(BUILDING_DEFINITIONS).map(([key, building]) => {
    const bg = BUILDING_BG[key] ? `style="background-image: url('${BUILDING_BG[key]}')"` : "";
    return `
    <button class="shop-card shop-card--building" data-building="${key}" ${bg}>
      ${buildingIconHTML(building.icon)}
      <span class="shop-info">
        <strong>${building.name}</strong>
        <small><span data-building-cost="${key}"></span> 💎 · +${building.baseCps}/s</small>
      </span>
      <span class="owned" data-building-count="${key}">0</span>
    </button>
  `}).join("");

  const categories = [
    { label: "⛏️ Améliorations du clic",     filter: (u) => u.applies === "click" },
    { label: "🏗️ Améliorations de bâtiments", filter: (u) => !["click", "global"].includes(u.applies) },
    { label: "🌐 Multiplicateurs globaux",    filter: (u) => u.applies === "global" }
  ];

  els.upgradesList.innerHTML = categories.map(({ label, filter }) => {
    const entries = Object.entries(UPGRADE_DEFINITIONS).filter(([, u]) => filter(u));
    if (!entries.length) return "";
    return `
      <p class="upgrade-category">${label}</p>
      ${entries.map(([key, upgrade]) => `
        <button class="shop-card upgrade-card" data-upgrade="${key}">
          ${buildingIconHTML(upgrade.icon)}
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

// ── Spritesheet planète ───────────────────────────────────────────────────────
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
    planetCanvas.width = 200;
    planetCanvas.height = 200;
  }
}

function drawFrame(planet, img) {
  if (!planetCtx || !img) return;
  const sprite = planet.sprite || { columns: 1, rows: 1, frameMs: 120 };
  const col = spriteFrame % sprite.columns;
  const row = Math.floor(spriteFrame / sprite.columns);
  const frameW = img.naturalWidth / sprite.columns;
  const frameH = img.naturalHeight / sprite.rows;
  planetCtx.clearRect(0, 0, 200, 200);
  planetCtx.drawImage(img, col * frameW, row * frameH, frameW, frameH, 0, 0, 200, 200);
}

function startPlanetSprite(planet) {
  if (currentPlanetImage === planet.img && spriteImage) return;
  if (spriteAnimId) { cancelAnimationFrame(spriteAnimId); spriteAnimId = null; }
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
    drawFrame(planet, img);
    if (totalFrames <= 1) return;
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
    if (!planetCtx) return;
    planetCtx.clearRect(0, 0, 200, 200);
    planetCtx.fillStyle = "#1a2a4a";
    planetCtx.beginPath();
    planetCtx.arc(100, 100, 100, 0, Math.PI * 2);
    planetCtx.fill();
  };
}

// ── Effets orbitaux ───────────────────────────────────────────────────────────
// click1 (pioche)        → sprite pioche orbite lentement, avec traînée lumineuse
// click2 (laser drill)   → sprite space drill orbite + rayon cyan pulsé vers la planète
// click3 (foreuse quant) → sprite foreuse quantique × 3 orbitent + rayons violet/magenta

const CLICK_ORBIT_DEFS = [
  { key: "click1", src: "assets/batiment/sprite_pioche.png",           radius: 100, speed:  0.4,  size: 32, count: 1 },
  { key: "click2", src: "assets/batiment/sprite_spaceDrill.png",       radius: 122, speed: -0.3,  size: 34, count: 1 },
  { key: "click3", src: "assets/batiment/sprite_ForeuseQuantique.png", radius: 148, speed:  0.22, size: 30, count: 3 },
];

const orbitImgCache = {};

function preloadOrbitSprites() {
  CLICK_ORBIT_DEFS.forEach(def => {
    if (orbitImgCache[def.key]) return;
    const img = new Image();
    img.src = def.src;
    orbitImgCache[def.key] = img; // on stocke même si pas encore chargée, onload géré par le browser
  });
}

let orbitCanvas = null;
let orbitCtx = null;
let orbitAnimId = null;

const PLANET_RADIUS = 80;
const CX = 170;
const CY = 170;

function initOrbitCanvas() {
  orbitCanvas = document.getElementById("orbitCanvas");
  if (!orbitCanvas) return;
  orbitCtx = orbitCanvas.getContext("2d");
  orbitCanvas.width = 340;
  orbitCanvas.height = 340;
}

// Dessine un sprite qui orbite, avec légère rotation face au mouvement
function drawOrbitSprite(img, x, y, angle, size) {
  if (!img || !img.complete || !img.naturalWidth) return;
  orbitCtx.save();
  orbitCtx.translate(x, y);
  orbitCtx.rotate(angle + Math.PI / 2); // tourne pour pointer dans le sens de l'orbite
  orbitCtx.imageSmoothingEnabled = false;
  orbitCtx.drawImage(img, -size / 2, -size / 2, size, size);
  orbitCtx.restore();
}

// Rayon laser du point (sx,sy) vers la surface de la planète
function drawBeam(sx, sy, color1, color2, pulse) {
  const dx = CX - sx, dy = CY - sy;
  const dist = Math.hypot(dx, dy);
  const nx = dx / dist, ny = dy / dist;
  const hitX = CX - nx * PLANET_RADIUS;
  const hitY = CY - ny * PLANET_RADIUS;

  const grad = orbitCtx.createLinearGradient(sx, sy, hitX, hitY);
  grad.addColorStop(0,    `rgba(${color1}, 0)`);
  grad.addColorStop(0.15, `rgba(${color1}, ${pulse * 0.9})`);
  grad.addColorStop(0.8,  `rgba(${color1}, ${pulse})`);
  grad.addColorStop(1,    `rgba(${color2}, ${pulse * 0.7})`);

  orbitCtx.save();
  orbitCtx.shadowColor = `rgba(${color1}, 0.85)`;
  orbitCtx.shadowBlur = 16 * pulse;

  // Rayon principal
  orbitCtx.beginPath();
  orbitCtx.moveTo(sx, sy);
  orbitCtx.lineTo(hitX, hitY);
  orbitCtx.strokeStyle = grad;
  orbitCtx.lineWidth = 2.5 * pulse;
  orbitCtx.stroke();

  // Halo large
  const gradW = orbitCtx.createLinearGradient(sx, sy, hitX, hitY);
  gradW.addColorStop(0,   `rgba(${color1}, 0)`);
  gradW.addColorStop(0.4, `rgba(${color1}, ${pulse * 0.18})`);
  gradW.addColorStop(1,   `rgba(${color1}, 0)`);
  orbitCtx.beginPath();
  orbitCtx.moveTo(sx, sy);
  orbitCtx.lineTo(hitX, hitY);
  orbitCtx.strokeStyle = gradW;
  orbitCtx.lineWidth = 10 * pulse;
  orbitCtx.stroke();

  // Impact
  const ig = orbitCtx.createRadialGradient(hitX, hitY, 0, hitX, hitY, 14 * pulse);
  ig.addColorStop(0,   `rgba(255, 255, 255, ${pulse * 0.9})`);
  ig.addColorStop(0.4, `rgba(${color1}, ${pulse * 0.8})`);
  ig.addColorStop(1,   `rgba(${color1}, 0)`);
  orbitCtx.beginPath();
  orbitCtx.arc(hitX, hitY, 14 * pulse, 0, Math.PI * 2);
  orbitCtx.fillStyle = ig;
  orbitCtx.fill();

  orbitCtx.restore();
}

function drawOrbitEffects(t) {
  if (!orbitCtx) return;
  orbitCtx.clearRect(0, 0, 400, 400);

  CLICK_ORBIT_DEFS.forEach(def => {
    if (!gameState.upgrades[def.key]) return;
    const img = orbitImgCache[def.key];
    const n = def.count;

    for (let i = 0; i < n; i++) {
      const angle = (t * def.speed) + (i / n) * Math.PI * 2;
      const x = CX + Math.cos(angle) * def.radius;
      const y = CY + Math.sin(angle) * def.radius;

      // Rayon laser entre le sprite et la planète
      if (def.key === "click2") {
        const pulse = 0.4 + 0.6 * Math.pow(Math.abs(Math.sin(t * 2.1)), 0.4);
        drawBeam(x, y, "0, 220, 255", "255, 255, 255", pulse);
      }
      if (def.key === "click3") {
        const pulse = 0.3 + 0.7 * Math.pow(Math.abs(Math.sin(t * 3.5 + i * 2.1)), 0.3);
        drawBeam(x, y, "180, 0, 255", "255, 180, 255", pulse);
      }

      // Halo de lueur sous le sprite
      if (def.key === "click1") {
        const glowGrad = orbitCtx.createRadialGradient(x, y, 0, x, y, def.size * 0.8);
        glowGrad.addColorStop(0, `rgba(255, 200, 80, 0.35)`);
        glowGrad.addColorStop(1, `rgba(255, 150, 0, 0)`);
        orbitCtx.beginPath();
        orbitCtx.arc(x, y, def.size * 0.8, 0, Math.PI * 2);
        orbitCtx.fillStyle = glowGrad;
        orbitCtx.fill();
      }

      // Sprite pixel art
      drawOrbitSprite(img, x, y, angle, def.size);
    }
  });
}

function startOrbitLoop() {
  if (orbitAnimId) return;
  function loop(timestamp) {
    drawOrbitEffects(timestamp * 0.001);
    orbitAnimId = requestAnimationFrame(loop);
  }
  orbitAnimId = requestAnimationFrame(loop);
}

export function updateOrbitIcons() {
  if (!orbitCtx) initOrbitCanvas();
  if (!orbitCtx) return;
  const anyUnlocked = gameState.upgrades.click1 || gameState.upgrades.click2 || gameState.upgrades.click3;
  if (anyUnlocked) {
    preloadOrbitSprites();
    startOrbitLoop();
    if (orbitCanvas) orbitCanvas.style.display = "block";
  } else {
    if (orbitAnimId) { cancelAnimationFrame(orbitAnimId); orbitAnimId = null; }
    if (orbitCtx) orbitCtx.clearRect(0, 0, 400, 400);
    if (orbitCanvas) orbitCanvas.style.display = "none";
  }
}

// ── UI principale ─────────────────────────────────────────────────────────────
export function updateUI() {
  els.crystalCount.textContent = formatNumber(gameState.crystals);
  if (els.crystalCountStat) els.crystalCountStat.textContent = formatNumber(gameState.crystals);
  els.cpsValue.textContent = formatNumber(gameState.crystalsPerSecond);
  els.perClickValue.textContent = formatNumber(gameState.crystalsPerClick);
  els.totalCrystals.textContent = formatNumber(gameState.totalCrystalsEver);
  els.totalClicks.textContent = formatNumber(gameState.totalClicks);
  els.prestigeCount.textContent = formatNumber(gameState.prestigeCount);
  els.prestigeMultiplier.textContent = `x${gameState.prestigeMultiplier.toFixed(2)}`;

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
  updateOrbitIcons();
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
  const el = document.getElementById("leaderboardList");
  if (!el) return;
  el.innerHTML = rows.length
    ? rows.map((row) => `<li><span>#${row.rank} ${row.username}</span><strong>${formatNumber(row.totalCrystalsEver)} 💎</strong></li>`).join("")
    : "<li>Aucun score pour le moment.</li>";
}
