import { BUILDING_DEFINITIONS, gameState } from "./game.js";

// Correspondance bâtiment → image de fond + sprite
const BUILDING_ASSETS = {
  drone:    { bg: "assets/batiment/bg_drone.jpg",    sprite: "assets/batiment/sprite_drone.png" },
  mine:     { bg: "assets/batiment/bg_mine.jpg",     sprite: null },
  refinery: { bg: "assets/batiment/bg_refinery.jpg", sprite: null },
  lab:      { bg: "assets/batiment/bg_lab.jpg",      sprite: null },
  geotherm: { bg: "assets/batiment/bg_geotherm.jpg", sprite: null },
  orbital:  { bg: "assets/batiment/bg_orbital.jpg",  sprite: null },
  reactor:  { bg: "assets/batiment/bg_reactor.jpg",  sprite: null },
  megastr:  { bg: "assets/batiment/bg_megastr.jpg",  sprite: null },
};

// Nombre max de sprites affichés par bande (pour ne pas surcharger)
const MAX_SPRITES = 10;

let zoneEl = null;

export function initBuildingsZone() {
  zoneEl = document.getElementById("buildingsZone");
}

export function updateBuildingsZone() {
  if (!zoneEl) return;

  // Bâtiments possédés, dans l'ordre de définition
  const ownedBuildings = Object.entries(gameState.buildings)
    .filter(([, b]) => b.count > 0);

  if (ownedBuildings.length === 0) {
    zoneEl.innerHTML = `
      <div class="buildings-empty">
        <span>Achetez votre premier bâtiment pour commencer l'exploitation ! 🚀</span>
      </div>`;
    return;
  }

  // Pour chaque bâtiment possédé, créer ou mettre à jour sa bande
  ownedBuildings.forEach(([key, building]) => {
    let strip = zoneEl.querySelector(`[data-strip="${key}"]`);

    if (!strip) {
      // Créer la bande
      strip = document.createElement("div");
      strip.className = "building-strip";
      strip.dataset.strip = key;

      const assets = BUILDING_ASSETS[key] || {};
      const bgUrl = assets.bg || "";
      const spriteUrl = assets.sprite || "";

      strip.innerHTML = `
        <div class="building-strip-bg" style="background-image: url('${bgUrl}')"></div>
        <span class="building-strip-label">${building.icon} ${building.name}</span>
        <span class="building-strip-count" data-strip-count="${key}">×${building.count}</span>
        <div class="building-sprites" data-strip-sprites="${key}"></div>
      `;

      // Insérer dans le bon ordre (selon BUILDING_DEFINITIONS)
      const allKeys = Object.keys(BUILDING_DEFINITIONS);
      const keyIndex = allKeys.indexOf(key);
      const existingStrips = [...zoneEl.querySelectorAll("[data-strip]")];
      const insertBefore = existingStrips.find(el => allKeys.indexOf(el.dataset.strip) > keyIndex);
      if (insertBefore) {
        zoneEl.insertBefore(strip, insertBefore);
      } else {
        zoneEl.appendChild(strip);
      }
    }

    // Mettre à jour le compteur
    const countEl = strip.querySelector(`[data-strip-count="${key}"]`);
    if (countEl) countEl.textContent = `×${building.count}`;

    // Mettre à jour les sprites
    const spritesEl = strip.querySelector(`[data-strip-sprites="${key}"]`);
    if (spritesEl) {
      const assets = BUILDING_ASSETS[key] || {};
      const spriteUrl = assets.sprite;
      const displayCount = Math.min(building.count, MAX_SPRITES);
      const currentCount = spritesEl.children.length;

      if (displayCount > currentCount && spriteUrl) {
        // Ajouter les sprites manquants
        for (let i = currentCount; i < displayCount; i++) {
          const img = document.createElement("img");
          img.className = "building-sprite";
          img.src = spriteUrl;
          img.alt = building.name;
          spritesEl.appendChild(img);
        }
      } else if (!spriteUrl && spritesEl.children.length < displayCount) {
        // Fallback emoji si pas de sprite image disponible
        for (let i = spritesEl.children.length; i < displayCount; i++) {
          const span = document.createElement("span");
          span.className = "building-sprite";
          span.textContent = building.icon;
          span.style.cssText = "font-size:2rem; width:auto; height:auto; filter:none;";
          spritesEl.appendChild(span);
        }
      }
    }
  });

  // Supprimer les bandes de bâtiments qui n'ont plus 0 unités
  zoneEl.querySelectorAll("[data-strip]").forEach(strip => {
    const key = strip.dataset.strip;
    if (!gameState.buildings[key] || gameState.buildings[key].count === 0) {
      strip.remove();
    }
  });

  // Cacher le message vide s'il reste
  const emptyEl = zoneEl.querySelector(".buildings-empty");
  if (emptyEl) emptyEl.remove();
}
