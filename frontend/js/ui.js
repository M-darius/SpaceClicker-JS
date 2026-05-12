import { ACHIEVEMENTS } from "./achievements.js";
import { BUILDING_DEFINITIONS, gameState, getBuildingBulkCost, getBuildingCost, getCurrentPlanet, getCurrentThreshold, getMaxBuyableCount, getNextPlanet, UPGRADE_DEFINITIONS } from "./game.js";

const CRYSTAL_IMG = `<img class="crystal-icon" src="assets/batiment/Crystals.png" alt="💎">`;

function formatTime(seconds) {
  if (!isFinite(seconds) || seconds > 86400 * 365) return "∞";
  if (seconds < 60)    return `${Math.ceil(seconds)}s`;
  if (seconds < 3600)  return `${Math.floor(seconds / 60)}m ${Math.floor(seconds % 60)}s`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  return `${Math.floor(seconds / 86400)}j`;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ── Tooltip production ───────────────────────────────────────────────────────
let currentTooltipCard = null; // { type: 'building'|'upgrade', key }

function getBuildingBreakdown(key) {
  const building = gameState.buildings[key];
  const def = BUILDING_DEFINITIONS[key];
  let buildingMult = 1, globalMult = 1;
  Object.entries(UPGRADE_DEFINITIONS).forEach(([k, upg]) => {
    if (!gameState.upgrades[k]) return;
    if (upg.applies === key)      buildingMult *= upg.multiplier;
    if (upg.applies === 'global') globalMult   *= upg.multiplier;
  });
  const totalMult  = buildingMult * globalMult * gameState.prestigeMultiplier;
  const cpsPerUnit = def.baseCps * totalMult;
  const totalCps   = building.count * cpsPerUnit;
  const pct = gameState.crystalsPerSecond > 0
    ? (totalCps / gameState.crystalsPerSecond) * 100 : 0;
  return { count: building.count, cpsPerUnit, totalCps, pct, totalMult, buildingMult };
}

function buildBuildingTooltipHTML(key) {
  const def = BUILDING_DEFINITIONS[key];
  const bd  = getBuildingBreakdown(key);
  const costx10 = getBuildingBulkCost(key, 10);

  const rows = [['Possédés', `${bd.count}`]];
  if (bd.count > 0) rows.push(['Production', `${formatNumber(bd.totalCps)}/s`]);
  rows.push(['Par unité', `${formatNumber(bd.cpsPerUnit)}/s`]);
  if (bd.totalMult > 1) {
    const m = bd.totalMult;
    rows.push(['Multiplicateur', `×${Number.isInteger(m) ? m : m.toFixed(1)}`]);
  }
  let pctBar = '';
  if (bd.count > 0 && gameState.crystalsPerSecond > 0) {
    rows.push(['Part de la prod.', `${bd.pct.toFixed(1)}%`]);
    pctBar = `<div class="tt-bar-wrap"><div class="tt-bar" style="width:${Math.min(100, bd.pct).toFixed(1)}%"></div></div>`;
  }
  rows.push([`Coût ×10`, formatNumber(costx10)]);

  const rowsHTML = rows.map(([l, v]) =>
    `<div class="tt-row"><span class="tt-label">${l}</span><span class="tt-value">${v}</span></div>`
  ).join('');
  return `<div class="tt-title">${def.name}</div>${rowsHTML}${pctBar}`;
}

const UPGRADE_TARGET_NAMES = {
  click: 'Clics', global: 'Toute la production',
  drone: 'Drones', mine: 'Mines', refinery: 'Raffineries',
  lab: 'Laboratoires', geotherm: 'Forages géothermiques', orbital: 'Stations orbitales'
};

function buildUpgradeTooltipHTML(key) {
  const upg   = UPGRADE_DEFINITIONS[key];
  const bought = gameState.upgrades[key];
  const rows = [
    ['Cible',  UPGRADE_TARGET_NAMES[upg.applies] || upg.applies],
    ['Effet',  `×${upg.multiplier} production`],
    ['Coût',   bought ? 'Acquis ✓' : formatNumber(upg.cost)],
  ];
  const rowsHTML = rows.map(([l, v], i) =>
    `<div class="tt-row"><span class="tt-label">${l}</span><span class="tt-value ${i === 2 && bought ? 'tt-success' : ''}">${v}</span></div>`
  ).join('');
  return `<div class="tt-title">${upg.name}</div>${rowsHTML}`;
}

function positionTooltip(tooltip, cardRect) {
  const w = 256;
  let left = cardRect.left - w - 10;
  let top  = cardRect.top;
  if (left < 4) { left = 4; top = cardRect.bottom + 8; }
  const h = tooltip.offsetHeight;
  if (top + h > window.innerHeight - 8) top = window.innerHeight - h - 8;
  top = Math.max(8, top);
  tooltip.style.left = `${left}px`;
  tooltip.style.top  = `${top}px`;
}

function initShopTooltip() {
  const tooltip = document.getElementById('shopTooltip');
  if (!tooltip) return;

  function show(card) {
    currentTooltipCard = card.dataset.building
      ? { type: 'building', key: card.dataset.building }
      : { type: 'upgrade',  key: card.dataset.upgrade  };
    tooltip.innerHTML = currentTooltipCard.type === 'building'
      ? buildBuildingTooltipHTML(currentTooltipCard.key)
      : buildUpgradeTooltipHTML(currentTooltipCard.key);
    tooltip.classList.add('visible');
    requestAnimationFrame(() => positionTooltip(tooltip, card.getBoundingClientRect()));
  }

  function hide(e) {
    const card = e.target.closest('[data-building],[data-upgrade]');
    if (card && card.contains(e.relatedTarget)) return;
    currentTooltipCard = null;
    tooltip.classList.remove('visible');
  }

  ['buildingsList', 'upgradesList'].forEach(id => {
    const list = document.getElementById(id);
    if (!list) return;
    list.addEventListener('mouseover', e => {
      const card = e.target.closest('[data-building],[data-upgrade]');
      if (card) show(card);
    });
    list.addEventListener('mouseout', hide);
  });
}

let buyMode = 1;
export function getBuyMode() { return buyMode; }
export function setBuyMode(mode) {
  buyMode = mode;
  document.querySelectorAll(".bulk-btn").forEach(b => {
    b.classList.toggle("active", String(b.dataset.qty) === String(mode));
  });
  updateShopState();
}

const els = {};

export function initUI() {
  [
    "crystalCount", "crystalCountStat", "cpsDisplay", "cpsValue", "perClickValue", "totalCrystals", "totalClicks",
    "prestigeCount", "prestigeMultiplier", "prestigeProgress", "prestigeLabel", "prestigeButton",
    "prestigePercent", "prestigeEta", "destPlanetIcon", "destPlanetName",
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
  initShopTooltip();
  updateUI();
}

export function formatNumber(value) {
  if (!isFinite(value) || value < 0) return "0";
  const tiers = [
    [1e18, "Qa"], [1e15, "Qd"], [1e12, "B"],
    [1e9, "Md"],  [1e6, "M"],   [1e3, "K"],
  ];
  for (const [threshold, suffix] of tiers) {
    if (value >= threshold) {
      const n = value / threshold;
      return `${n >= 100 ? n.toFixed(1) : n.toFixed(2)} ${suffix}`;
    }
  }
  return value < 10 ? value.toFixed(1).replace(".0", "") : Math.floor(value).toString();
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
        <small><span data-building-cost="${key}"></span> ${CRYSTAL_IMG} · +<span class="base-cps">${formatNumber(building.baseCps)}/s</span></small>
      </span>
      <span class="owned">
        <span data-building-count="${key}">0</span>
        <span class="buy-qty" data-building-qty="${key}"></span>
      </span>
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
          <span class="owned">${formatNumber(upgrade.cost)} ${CRYSTAL_IMG}</span>
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
  img.src = `${planet.img}?t=${Date.now()}`;
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
  if (els.cpsDisplay) els.cpsDisplay.textContent = formatNumber(gameState.crystalsPerSecond);
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
  els.prestigeProgress.classList.toggle("complete", progress >= 100);

  if (els.prestigePercent) els.prestigePercent.textContent = `${progress.toFixed(1)}%`;

  if (els.prestigeEta) {
    const remaining = threshold - gameState.crystalsThisPrestige;
    const eta = gameState.crystalsPerSecond > 0 ? remaining / gameState.crystalsPerSecond : Infinity;
    els.prestigeEta.textContent = progress >= 100 ? "PRÊT" : `~${formatTime(eta)}`;
    els.prestigeEta.classList.toggle("ready", progress >= 100);
  }

  if (next) {
    if (els.destPlanetIcon) els.destPlanetIcon.innerHTML = `<img src="${next.iconImg}" alt="${next.name}" class="dest-planet-img">`;
    if (els.destPlanetName) els.destPlanetName.textContent = next.name;
    els.prestigeLabel.innerHTML = `${formatNumber(gameState.crystalsThisPrestige)} / ${formatNumber(threshold)} ${CRYSTAL_IMG}`;
    els.prestigeButton.textContent = `Coloniser ${next.name} ${next.icon}`;
  } else {
    if (els.destPlanetIcon) els.destPlanetIcon.innerHTML = "🏆";
    if (els.destPlanetName) els.destPlanetName.textContent = "Maîtres de l'Univers";
    els.prestigeLabel.innerHTML = `${formatNumber(gameState.crystalsThisPrestige)} / ${formatNumber(threshold)} ${CRYSTAL_IMG}`;
    els.prestigeButton.textContent = "Dernier saut 🚀";
  }

  els.prestigeButton.hidden = gameState.crystalsThisPrestige < threshold;
  updateShopState();
  updateAchievementsState();
  updateOrbitIcons();
}

export function updateShopState() {
  // Refresh tooltip content in real-time while hovering
  if (currentTooltipCard) {
    const tooltip = document.getElementById('shopTooltip');
    if (tooltip?.classList.contains('visible')) {
      tooltip.innerHTML = currentTooltipCard.type === 'building'
        ? buildBuildingTooltipHTML(currentTooltipCard.key)
        : buildUpgradeTooltipHTML(currentTooltipCard.key);
    }
  }

  Object.keys(gameState.buildings).forEach((key) => {
    const button = document.querySelector(`[data-building="${key}"]`);
    if (!button) return;

    const rawQty = buyMode === "max" ? getMaxBuyableCount(key) : buyMode;
    const displayQty = rawQty > 0 ? rawQty : 1;
    const cost = getBuildingBulkCost(key, displayQty);
    const canAfford = buyMode === "max" ? rawQty > 0 : gameState.crystals >= cost;

    document.querySelector(`[data-building-cost="${key}"]`).textContent = formatNumber(cost);
    document.querySelector(`[data-building-count="${key}"]`).textContent = gameState.buildings[key].count;

    const qtySpan = document.querySelector(`[data-building-qty="${key}"]`);
    if (qtySpan) qtySpan.textContent = displayQty > 1 ? `+${displayQty}` : "";

    button.disabled = !canAfford;
    button.classList.toggle("can-afford", canAfford);
  });

  Object.keys(UPGRADE_DEFINITIONS).forEach((key) => {
    const button = document.querySelector(`[data-upgrade="${key}"]`);
    if (!button) return;
    const bought = gameState.upgrades[key];
    const canAfford = !bought && gameState.crystals >= UPGRADE_DEFINITIONS[key].cost;
    button.disabled = bought || !canAfford;
    button.classList.toggle("purchased", bought);
    button.classList.toggle("can-afford", canAfford);
    const ownedSpan = button.querySelector(".owned");
    if (ownedSpan) {
      ownedSpan.innerHTML = bought
        ? "✓"
        : `${formatNumber(UPGRADE_DEFINITIONS[key].cost)} ${CRYSTAL_IMG}`;
    }
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
  particle.innerHTML = `+${formatNumber(amount)} ${CRYSTAL_IMG}`;
  particle.style.left = `${x}px`;
  particle.style.top = `${y}px`;
  document.body.appendChild(particle);
  window.setTimeout(() => particle.remove(), 900);
}

export function showPlanetRipple() {
  const wrap = document.querySelector(".planet-wrap");
  if (!wrap) return;
  for (const cls of ["click-ripple", "click-ripple-outer"]) {
    const ring = document.createElement("div");
    ring.className = cls;
    wrap.appendChild(ring);
    ring.addEventListener("animationend", () => ring.remove(), { once: true });
  }
}

export function showOfflineModal({ elapsed, gained, cps }) {
  const existing = document.getElementById('offlineModal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'offlineModal';
  modal.className = 'offline-modal';
  modal.innerHTML = `
    <div class="offline-box">
      <div class="offline-header">
        <span class="offline-icon">🌙</span>
        <div>
          <div class="offline-title">Bon retour</div>
          <div class="offline-sub">Vos installations ont tourné pendant ${formatTime(elapsed)}</div>
        </div>
      </div>
      <div class="offline-stats">
        <div class="offline-row">
          <span class="offline-label">Production/s au départ</span>
          <span class="offline-value">${formatNumber(cps)} ${CRYSTAL_IMG}</span>
        </div>
        <div class="offline-row">
          <span class="offline-label">Durée d'absence</span>
          <span class="offline-value">${formatTime(elapsed)}</span>
        </div>
        <div class="offline-row offline-row--highlight">
          <span class="offline-label">Cristaux récupérés</span>
          <span class="offline-value offline-gained">+${formatNumber(gained)} ${CRYSTAL_IMG}</span>
        </div>
      </div>
      <button class="offline-close">Récupérer les cristaux</button>
    </div>
  `;

  document.body.appendChild(modal);
  const close = () => modal.remove();
  modal.querySelector('.offline-close').addEventListener('click', close);
  modal.addEventListener('click', e => { if (e.target === modal) close(); });
  const onKey = e => { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', onKey); } };
  document.addEventListener('keydown', onKey);
  setTimeout(close, 12_000);
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
    ? rows.map((row) => `<li><span>#${row.rank} ${escapeHtml(row.username)}</span><strong>${formatNumber(row.totalCrystalsEver)} ${CRYSTAL_IMG}</strong></li>`).join("")
    : "<li>Aucun score pour le moment.</li>";
}
