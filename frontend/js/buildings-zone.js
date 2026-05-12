import { BUILDING_DEFINITIONS } from "./data/buildings.js";
import { UPGRADE_DEFINITIONS } from "./data/upgrades.js";
import { gameState } from "./game-state.js";
import { formatNumber } from "./ui.js";

const BUILDING_ASSETS = {
  drone:    { bg: "assets/batiment/bg_drone.jpg",    sprite: "assets/batiment/sprite_drone.png"     },
  mine:     { bg: "assets/batiment/bg_mine.jpg",     sprite: "assets/batiment/sprite_mine.png"      },
  refinery: { bg: "assets/batiment/bg_refinery.jpg", sprite: "assets/batiment/sprite_rafinerie.png" },
  lab:      { bg: "assets/batiment/bg_lab.jpg",      sprite: "assets/batiment/sprite_labo.png"      },
  geotherm: { bg: "assets/batiment/bg_geotherm.jpg", sprite: "assets/batiment/sprite_forage.png"    },
  orbital:  { bg: "assets/batiment/bg_orbital.jpg",  sprite: "assets/batiment/sprite_station.png"   },
  reactor:  { bg: "assets/batiment/bg_reactor.jpg",  sprite: "assets/batiment/sprite_reactor.png"   },
  megastr:  { bg: "assets/batiment/bg_megastr.jpg",  sprite: "assets/batiment/sprite_structure.png" },
};

const BUILDING_COLORS = {
  drone:    '#00E5FF',
  mine:     '#F5A623',
  refinery: '#FF7A00',
  lab:      '#7C3AED',
  geotherm: '#EF476F',
  orbital:  '#00CFFF',
  reactor:  '#2DD4BF',
  megastr:  '#FFD700',
};

const SCROLL_SPEEDS = {
  drone: '4s', mine: '14s', refinery: '8s', lab: '10s',
  geotherm: '12s', orbital: '5s', reactor: '6s', megastr: '18s',
};

const SPRITE_WIDTH        = 80;
const SPRITE_GAP          = 10;
const SPRITE_SIDE_PADDING = 20;

let zoneEl = null;

export function initBuildingsZone() {
  zoneEl = document.getElementById("buildingsZone");
}

function getSpriteCapacity(strip) {
  const available = strip.clientWidth - SPRITE_SIDE_PADDING * 2;
  if (available <= 0) return 1;
  return Math.max(1, Math.floor((available + SPRITE_GAP) / (SPRITE_WIDTH + SPRITE_GAP)));
}

function getBuildingCpsContribution(key) {
  const building = gameState.buildings[key];
  if (building.count === 0) return 0;
  let buildingMult = 1, globalMult = 1;
  Object.entries(UPGRADE_DEFINITIONS).forEach(([k, upg]) => {
    if (!gameState.upgrades[k]) return;
    if (upg.applies === key)      buildingMult *= upg.multiplier;
    if (upg.applies === 'global') globalMult   *= upg.multiplier;
  });
  return building.count * building.baseCps * buildingMult * globalMult * gameState.prestigeMultiplier;
}

export function updateBuildingsZone() {
  if (!zoneEl) return;

  const ownedBuildings = Object.entries(gameState.buildings).filter(([, b]) => b.count > 0);

  if (ownedBuildings.length === 0) {
    zoneEl.innerHTML = `
      <div class="buildings-empty">
        <div class="empty-icon">🏗️</div>
        <p class="empty-title">Aucune installation</p>
        <p class="empty-hint">Achetez un bâtiment dans la boutique →</p>
      </div>`;
    return;
  }

  ownedBuildings.forEach(([key, building]) => {
    let strip = zoneEl.querySelector(`[data-strip="${key}"]`);

    if (!strip) {
      strip = document.createElement("div");
      strip.className = "building-strip";
      strip.dataset.strip = key;
      strip.style.setProperty("--strip-color",  BUILDING_COLORS[key]  || "#00E5FF");
      strip.style.setProperty("--scroll-speed", SCROLL_SPEEDS[key]    || "10s");

      const { bg = "", sprite = "" } = BUILDING_ASSETS[key] || {};
      strip.innerHTML = `
        <div class="building-strip-bg" style="background-image: url('${bg}')"></div>
        <div class="strip-header">
          <span class="strip-name">${building.name}</span>
          <span class="strip-badge">
            <span class="strip-count" data-strip-count="${key}">×${building.count}</span>
            <span class="strip-cps"   data-strip-cps="${key}"></span>
          </span>
        </div>
        <div class="building-sprites" data-strip-sprites="${key}"></div>
      `;

      const allKeys      = Object.keys(BUILDING_DEFINITIONS);
      const keyIndex     = allKeys.indexOf(key);
      const existing     = [...zoneEl.querySelectorAll("[data-strip]")];
      const insertBefore = existing.find(el => allKeys.indexOf(el.dataset.strip) > keyIndex);
      insertBefore ? zoneEl.insertBefore(strip, insertBefore) : zoneEl.appendChild(strip);
    }

    const countEl = strip.querySelector(`[data-strip-count="${key}"]`);
    if (countEl) countEl.textContent = `×${building.count}`;

    const cpsEl = strip.querySelector(`[data-strip-cps="${key}"]`);
    if (cpsEl) {
      const cps = getBuildingCpsContribution(key);
      cpsEl.textContent = cps > 0 ? `${formatNumber(cps)}/s` : "";
    }

    const spritesEl = strip.querySelector(`[data-strip-sprites="${key}"]`);
    if (spritesEl) {
      const { sprite: spriteUrl } = BUILDING_ASSETS[key] || {};
      const displayCount = Math.min(building.count, getSpriteCapacity(strip));

      while (spritesEl.children.length > displayCount) spritesEl.lastElementChild.remove();

      if (displayCount > spritesEl.children.length && spriteUrl) {
        for (let i = spritesEl.children.length; i < displayCount; i++) {
          const img = document.createElement("img");
          img.className = "building-sprite";
          img.src       = spriteUrl;
          img.alt       = building.name;
          spritesEl.appendChild(img);
        }
      }
    }
  });

  zoneEl.querySelectorAll("[data-strip]").forEach(strip => {
    const key = strip.dataset.strip;
    if (!gameState.buildings[key]?.count) strip.remove();
  });

  const emptyEl = zoneEl.querySelector(".buildings-empty");
  if (emptyEl) emptyEl.remove();
}
