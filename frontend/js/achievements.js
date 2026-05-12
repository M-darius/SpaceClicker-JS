import { gameState } from "./game-state.js";

export const ACHIEVEMENTS = [
  // Clics
  { id: "premier_clic",    label: "Premier pas",       description: "Effectuer le premier minage.",       icon: "👆", condition: (s) => s.totalClicks >= 1 },
  { id: "cliqueur",        label: "Cliqueur",          description: "Effectuer 100 clics.",               icon: "⚡", condition: (s) => s.totalClicks >= 100 },
  { id: "maniaque",        label: "Maniaque",          description: "Effectuer 1 000 clics.",             icon: "🔥", condition: (s) => s.totalClicks >= 1_000 },
  { id: "obsede",          label: "Obsédé",            description: "Effectuer 10 000 clics.",            icon: "💀", condition: (s) => s.totalClicks >= 10_000 },

  // Cristaux accumulés (total cumulé toutes planètes)
  { id: "cristaux_1k",     label: "Éclat brillant",    description: "Accumuler 1 000 cristaux.",          icon: "💎", condition: (s) => s.totalCrystalsEver >= 1_000 },
  { id: "cristaux_100k",   label: "Coffre stellaire",  description: "Accumuler 100 000 cristaux.",        icon: "✨", condition: (s) => s.totalCrystalsEver >= 100_000 },
  { id: "cristaux_10m",    label: "Million cosmique",  description: "Accumuler 10 000 000 cristaux.",     icon: "🌠", condition: (s) => s.totalCrystalsEver >= 10_000_000 },
  { id: "cristaux_1b",     label: "Milliardaire",      description: "Accumuler 1 milliard de cristaux.",  icon: "🏆", condition: (s) => s.totalCrystalsEver >= 1_000_000_000 },

  // Bâtiments
  { id: "premier_drone",   label: "Premier contact",    description: "Déployer un drone explorateur.",     icon: "🚁", condition: (s) => s.buildings.drone.count >= 1 },
  { id: "flotte_drones",   label: "Flotte de drones",   description: "Posséder 10 drones explorateurs.",   icon: "🤖", condition: (s) => s.buildings.drone.count >= 10 },
  { id: "premiere_mine",   label: "Premier filon",      description: "Construire une mine de cristaux.",   icon: "⛏️", condition: (s) => s.buildings.mine.count >= 1 },
  { id: "station_orb",     label: "Vue du ciel",        description: "Construire une station orbitale.",   icon: "🛸", condition: (s) => s.buildings.orbital.count >= 1 },
  { id: "reacteur",        label: "Cœur de la planète", description: "Construire un réacteur planétaire.", icon: "⚡", condition: (s) => s.buildings.reactor.count >= 1 },
  { id: "empire",          label: "Empire spatial",     description: "Posséder un bâtiment de chaque type.", icon: "👑", condition: (s) => Object.values(s.buildings).every((b) => b.count >= 1) },

  // Upgrades & CPS
  { id: "premier_upgrade", label: "Technologie",       description: "Acheter une amélioration.",          icon: "🔬", condition: (s) => Object.values(s.upgrades).some(Boolean) },
  { id: "cps_10",          label: "Flux constant",     description: "Atteindre 10 cristaux/seconde.",     icon: "📈", condition: (s) => s.crystalsPerSecond >= 10 },
  { id: "cps_1000",        label: "Réacteur actif",    description: "Atteindre 1 000 cristaux/seconde.",  icon: "🧪", condition: (s) => s.crystalsPerSecond >= 1_000 },
  { id: "cps_1m",          label: "Singularité",       description: "Atteindre 1 000 000 cristaux/sec.", icon: "💫", condition: (s) => s.crystalsPerSecond >= 1_000_000 },

  // Planètes colonisées
  { id: "planete_1",       label: "Pionnier",           description: "Coloniser Proxima b.",               icon: "🔵", condition: (s) => s.prestigeCount >= 1 },
  { id: "planete_2",       label: "Explorateur",        description: "Coloniser Gliese 667C.",             icon: "🟠", condition: (s) => s.prestigeCount >= 2 },
  { id: "planete_3",       label: "Conquérant",         description: "Coloniser HD 40307g.",               icon: "🟣", condition: (s) => s.prestigeCount >= 3 },
  { id: "planete_4",       label: "Amiral",             description: "Coloniser Tau Ceti e.",              icon: "🟡", condition: (s) => s.prestigeCount >= 4 },
  { id: "planete_5",       label: "Vétéran galactique", description: "Coloniser Wolf 1061c.",              icon: "⚫", condition: (s) => s.prestigeCount >= 5 },
  { id: "planete_6",       label: "Seigneur du cosmos", description: "Coloniser Trappist-1d.",             icon: "🔴", condition: (s) => s.prestigeCount >= 6 },
  { id: "planete_7",       label: "Maître de l'univers",description: "Coloniser 55 Cancri e.",             icon: "💎", condition: (s) => s.prestigeCount >= 7 }
];

let unlockHandler = () => {};

export function setAchievementCallback(onUnlock) {
  unlockHandler = onUnlock || unlockHandler;
}

export function checkAchievements() {
  ACHIEVEMENTS.forEach((achievement) => {
    const alreadyUnlocked = gameState.achievements.unlocked.includes(achievement.id);
    if (!alreadyUnlocked && achievement.condition(gameState)) {
      gameState.achievements.unlocked.push(achievement.id);
      unlockHandler(achievement);
    }
  });
}
