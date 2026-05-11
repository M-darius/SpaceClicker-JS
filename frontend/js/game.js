// Progression narrative : tu atterris sur une planète, tu l'exploites de fond en comble, puis tu colonises la suivante.
export const BUILDING_DEFINITIONS = {
  drone:    { count: 0, baseCps: 100000,     baseCost: 15,            name: "Drone explorateur",         icon: "🚁" },
  mine:     { count: 0, baseCps: 0.5,     baseCost: 200,           name: "Mine de cristaux",          icon: "⛏️" },
  refinery: { count: 0, baseCps: 3,       baseCost: 2_000,         name: "Raffinerie",                icon: "🏭" },
  lab:      { count: 0, baseCps: 10,      baseCost: 16_000,        name: "Laboratoire",               icon: "🔬" },
  geotherm: { count: 0, baseCps: 40,      baseCost: 100_000,       name: "Forage géothermique",       icon: "🌋" },
  orbital:  { count: 0, baseCps: 500,     baseCost: 1_000_000,     name: "Station orbitale",          icon: "🛸" },
  reactor:  { count: 0, baseCps: 5_000,   baseCost: 50_000_000,    name: "Réacteur planétaire",       icon: "⚡" },
  megastr:  { count: 0, baseCps: 100_000, baseCost: 5_000_000_000, name: "Réseau de méga-structures", icon: "🌐" }
};

export const UPGRADE_DEFINITIONS = {
  // ── Améliorations de clic (3 paliers) ──────────────────────────────────────
  click1: { name: "Pioche renforcée",       cost: 100,           description: "×2 cristaux par clic.",  icon: "⛏️", applies: "click",    multiplier: 2  },
  click2: { name: "Laser de minage",        cost: 5_000,         description: "×4 cristaux par clic.",  icon: "🔦", applies: "click",    multiplier: 4  },
  click3: { name: "Foreuse quantique",      cost: 500_000,       description: "×10 cristaux par clic.", icon: "💥", applies: "click",    multiplier: 10 },

  // ── Drones (2 paliers) ────────────────────────────────────────────────────
  drone1: { name: "Cartographie IA",        cost: 500,           description: "×2 production des drones.",           icon: "🗺️", applies: "drone",    multiplier: 2 },
  drone2: { name: "Essaim autonome",        cost: 20_000,        description: "×3 production des drones.",           icon: "🤖", applies: "drone",    multiplier: 3 },

  // ── Mines (2 paliers) ─────────────────────────────────────────────────────
  mine1:  { name: "Explosifs plasma",       cost: 5_000,         description: "×2 production des mines.",            icon: "💣", applies: "mine",     multiplier: 2 },
  mine2:  { name: "Tunneliers nanobots",    cost: 100_000,       description: "×3 production des mines.",            icon: "🦾", applies: "mine",     multiplier: 3 },

  // ── Raffineries (2 paliers) ───────────────────────────────────────────────
  ref1:   { name: "Filtres moléculaires",   cost: 50_000,        description: "×2 production des raffineries.",      icon: "⚗️", applies: "refinery", multiplier: 2 },
  ref2:   { name: "Purification quantique", cost: 800_000,       description: "×3 production des raffineries.",      icon: "🧪", applies: "refinery", multiplier: 3 },

  // ── Laboratoires (2 paliers) ──────────────────────────────────────────────
  lab1:   { name: "IA de recherche",        cost: 500_000,       description: "×2 production des laboratoires.",     icon: "🧠", applies: "lab",      multiplier: 2 },
  lab2:   { name: "Simulation quantique",   cost: 8_000_000,     description: "×3 production des laboratoires.",     icon: "⚛️", applies: "lab",      multiplier: 3 },

  // ── Forages géothermiques (2 paliers) ─────────────────────────────────────
  geo1:   { name: "Sondes de profondeur",   cost: 5_000_000,     description: "×3 production des forages.",          icon: "🔩", applies: "geotherm", multiplier: 3 },
  geo2:   { name: "Noyau artificiel",       cost: 80_000_000,    description: "×5 production des forages.",          icon: "🌍", applies: "geotherm", multiplier: 5 },

  // ── Stations orbitales (2 paliers) ────────────────────────────────────────
  orb1:   { name: "Télescopes mineurs",     cost: 100_000_000,   description: "×3 production des stations.",         icon: "🔭", applies: "orbital",  multiplier: 3 },
  orb2:   { name: "Réseau de satellites",   cost: 2_000_000_000, description: "×5 production des stations.",         icon: "📡", applies: "orbital",  multiplier: 5 },

  // ── Multiplicateur global CPS ─────────────────────────────────────────────
  globalBoost1: { name: "Cristaux éthérés",   cost: 1_000_000,   description: "×1.5 sur toute la production.", icon: "✨", applies: "global", multiplier: 1.5 },
  globalBoost2: { name: "Résonance cosmique", cost: 500_000_000, description: "×2 sur toute la production.",   icon: "🌌", applies: "global", multiplier: 2   }
};

// Séquence de planètes à coloniser — seuil croissant et thème différent à chaque fois.
export const PLANETS = [
  { name: "Kepler-22b",  icon: "🟤", threshold: 100_000,       img: "assets/planets/MarronPlanet.png", description: "Une planète rocheuse hostile.",      sprite: { columns: 50, rows: 4,  frameMs: 90 } },
  { name: "Proxima b",   icon: "🔵", threshold: 500_000,       img: "assets/planets/BleuPlanet.png",   description: "Un monde océanique mystérieux.",     sprite: { columns: 50, rows: 4,  frameMs: 90 } },
  { name: "Gliese 667C", icon: "🟠", threshold: 1_000_000,     img: "assets/planets/OrangePlanet.png", description: "Une géante gazeuse chaude.",          sprite: { columns: 50, rows: 4,  frameMs: 90 } },
  { name: "HD 40307g",   icon: "🟣", threshold: 5_000_000,     img: "assets/planets/VioletPlanet.png", description: "Une super-Terre violacée.",           sprite: { columns: 50, rows: 4,  frameMs: 90 } },
  { name: "Tau Ceti e",  icon: "🟡", threshold: 20_000_000,    img: "assets/planets/JaunePlanet.png",  description: "Un monde doré baigné de lumière.",   sprite: { columns: 50, rows: 4,  frameMs: 90  } },
  { name: "Wolf 1061c",  icon: "⚪", threshold: 100_000_000,   img: "assets/planets/WhitePlanet.png",  description: "Une planète sombre et glacée.",      sprite: { columns: 50, rows: 4,  frameMs: 90  } },
  { name: "Trappist-1d", icon: "🔴", threshold: 500_000_000,   img: "assets/planets/RougePlanet.png",  description: "Un monde volcanique en fusion.",     sprite: { columns: 50, rows: 4,  frameMs: 90  } },
  { name: "55 Cancri e", icon: "🩵", threshold: 2_000_000_000, img: "assets/planets/CyanPlanet.png",   description: "Une planète faite de diamant pur.",  sprite: { columns: 80, rows: 6, frameMs: 55  } }
];

export const gameState = createDefaultGameState();

let tickHandler = () => {};
let achievementHandler = () => {};
let loopId = null;

function cloneBuildings() {
  return Object.fromEntries(
    Object.entries(BUILDING_DEFINITIONS).map(([key, b]) => [key, { ...b }])
  );
}

function defaultUpgrades() {
  return Object.fromEntries(Object.keys(UPGRADE_DEFINITIONS).map((k) => [k, false]));
}

export function createDefaultGameState() {
  return {
    crystals: 0,
    totalCrystalsEver: 0,
    crystalsThisPrestige: 0,
    crystalsPerClick: 1,
    crystalsPerSecond: 0,
    totalClicks: 0,
    prestigeCount: 0,       // nombre de planètes colonisées
    prestigeMultiplier: 1,
    buildings: cloneBuildings(),
    upgrades: defaultUpgrades(),
    achievements: { unlocked: [] }
  };
}

// Retourne la planète actuelle selon le nombre de prestiges effectués.
export function getCurrentPlanet() {
  const idx = Math.min(gameState.prestigeCount, PLANETS.length - 1);
  return PLANETS[idx];
}

// Retourne la prochaine planète à coloniser (null si c'est la dernière).
export function getNextPlanet() {
  return PLANETS[gameState.prestigeCount + 1] ?? null;
}

// Seuil de la planète courante.
export function getCurrentThreshold() {
  return getCurrentPlanet().threshold;
}

export function setGameCallbacks({ onTick, onAchievements } = {}) {
  tickHandler = onTick || tickHandler;
  achievementHandler = onAchievements || achievementHandler;
}

export function startGameLoop() {
  if (loopId) clearInterval(loopId);
  loopId = setInterval(() => {
    const produced = gameState.crystalsPerSecond / 10;
    gameState.crystals += produced;
    gameState.totalCrystalsEver += produced;
    gameState.crystalsThisPrestige += produced;
    achievementHandler();
    tickHandler();
  }, 100);
}

export function mineCrystal() {
  const amount = gameState.crystalsPerClick;
  gameState.crystals += amount;
  gameState.totalCrystalsEver += amount;
  gameState.crystalsThisPrestige += amount;
  gameState.totalClicks += 1;
  achievementHandler();
  tickHandler();
  return amount;
}

export function getBuildingCost(buildingKey) {
  const building = gameState.buildings[buildingKey];
  return Math.ceil(building.baseCost * Math.pow(1.15, building.count));
}

export function recalculateCps() {
  let total = 0;
  let globalMultiplier = 1;

  // Multiplicateurs globaux d'abord.
  Object.entries(UPGRADE_DEFINITIONS).forEach(([key, upgrade]) => {
    if (upgrade.applies === "global" && gameState.upgrades[key]) {
      globalMultiplier *= upgrade.multiplier;
    }
  });

  // CPS par bâtiment avec leurs upgrades spécifiques.
  Object.entries(gameState.buildings).forEach(([key, building]) => {
    let buildingCps = building.count * building.baseCps;
    Object.entries(UPGRADE_DEFINITIONS).forEach(([upgradeKey, upgrade]) => {
      if (upgrade.applies === key && gameState.upgrades[upgradeKey]) {
        buildingCps *= upgrade.multiplier;
      }
    });
    total += buildingCps;
  });

  gameState.crystalsPerSecond = total * globalMultiplier * gameState.prestigeMultiplier;
}

export function recalculateClickPower() {
  // Cumul de tous les multiplicateurs de clic achetés.
  let clickMultiplier = 1;
  Object.entries(UPGRADE_DEFINITIONS).forEach(([key, upgrade]) => {
    if (upgrade.applies === "click" && gameState.upgrades[key]) {
      clickMultiplier *= upgrade.multiplier;
    }
  });
  gameState.crystalsPerClick = clickMultiplier * gameState.prestigeMultiplier;
}

export function canPrestige() {
  return gameState.crystalsThisPrestige >= getCurrentThreshold();
}

export function performPrestige() {
  if (!canPrestige()) return false;

  gameState.crystals = 0;
  gameState.crystalsThisPrestige = 0;
  gameState.prestigeCount += 1;
  gameState.prestigeMultiplier *= 1.5;
  gameState.buildings = cloneBuildings();
  gameState.upgrades = defaultUpgrades();
  recalculateClickPower();
  recalculateCps();
  achievementHandler();
  tickHandler();
  return true;
}

export function resetGame() {
  const fresh = createDefaultGameState();
  Object.assign(gameState, fresh);
  recalculateClickPower();
  recalculateCps();
  tickHandler();
}

export function mergeLoadedState(loadedState) {
  const freshState = createDefaultGameState();
  const loadedBuildings = loadedState.buildings || {};
  const buildings = Object.fromEntries(
    Object.entries(freshState.buildings).map(([key, building]) => [
      key,
      { ...building, ...(loadedBuildings[key] || {}) }
    ])
  );

  const merged = {
    ...freshState,
    ...loadedState,
    buildings,
    upgrades: { ...freshState.upgrades, ...(loadedState.upgrades || {}) },
    achievements: { unlocked: [...new Set(loadedState.achievements?.unlocked || [])] }
  };

  Object.assign(gameState, merged);
  recalculateClickPower();
  recalculateCps();
  tickHandler();
}
