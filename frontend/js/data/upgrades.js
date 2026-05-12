export const UPGRADE_DEFINITIONS = {
  // ── Améliorations de clic (3 paliers) ──────────────────────────────────────
  click1: { name: "Pioche renforcée",       cost: 100,           description: "×2 cristaux par clic.",  icon: "assets/batiment/sprite_pioche.png",          applies: "click",    multiplier: 2  },
  click2: { name: "Laser de minage",        cost: 2_500,         description: "×4 cristaux par clic.",  icon: "assets/batiment/sprite_spaceDrill.png",       applies: "click",    multiplier: 4  },
  click3: { name: "Foreuse quantique",      cost: 200_000,       description: "×10 cristaux par clic.", icon: "assets/batiment/sprite_ForeuseQuantique.png", applies: "click",    multiplier: 10 },

  // ── Drones (2 paliers) ────────────────────────────────────────────────────
  drone1: { name: "Cartographie IA",        cost: 500,           description: "×2 production des drones.",           icon: "assets/batiment/sprite_Cartographie.png", applies: "drone",    multiplier: 2 },
  drone2: { name: "Essaim autonome",        cost: 10_000,        description: "×3 production des drones.",           icon: "assets/batiment/sprite_Essaim.png",        applies: "drone",    multiplier: 3 },

  // ── Mines (2 paliers) ─────────────────────────────────────────────────────
  mine1:  { name: "Explosifs plasma",       cost: 2_000,         description: "×2 production des mines.",            icon: "assets/batiment/sprite_Explosifs.png",     applies: "mine",     multiplier: 2 },
  mine2:  { name: "Tunneliers nanobots",    cost: 50_000,        description: "×3 production des mines.",            icon: "assets/batiment/sprite_Tunneliers.png",    applies: "mine",     multiplier: 3 },

  // ── Raffineries (2 paliers) ───────────────────────────────────────────────
  ref1:   { name: "Filtres moléculaires",   cost: 20_000,        description: "×2 production des raffineries.",      icon: "assets/batiment/sprite_moleculaires.png",  applies: "refinery", multiplier: 2 },
  ref2:   { name: "Purification quantique", cost: 300_000,       description: "×3 production des raffineries.",      icon: "assets/batiment/sprite_Purification.png",  applies: "refinery", multiplier: 3 },

  // ── Laboratoires (2 paliers) ──────────────────────────────────────────────
  lab1:   { name: "IA de recherche",        cost: 200_000,       description: "×2 production des laboratoires.",     icon: "assets/batiment/sprite_IA.png",            applies: "lab",      multiplier: 2 },
  lab2:   { name: "Simulation quantique",   cost: 3_000_000,     description: "×3 production des laboratoires.",     icon: "assets/batiment/sprite_quantique.png",     applies: "lab",      multiplier: 3 },

  // ── Forages géothermiques (2 paliers) ─────────────────────────────────────
  geo1:   { name: "Sondes de profondeur",   cost: 2_000_000,     description: "×3 production des forages.",          icon: "assets/batiment/sprite_Sonde.png",         applies: "geotherm", multiplier: 3 },
  geo2:   { name: "Noyau artificiel",       cost: 30_000_000,    description: "×5 production des forages.",          icon: "assets/batiment/sprite_Noyau.png",         applies: "geotherm", multiplier: 5 },

  // ── Stations orbitales (2 paliers) ────────────────────────────────────────
  orb1:   { name: "Télescopes mineurs",     cost: 40_000_000,    description: "×3 production des stations.",         icon: "assets/batiment/sprite_Telescopes.png",    applies: "orbital",  multiplier: 3 },
  orb2:   { name: "Réseau de satellites",   cost: 800_000_000,   description: "×5 production des stations.",         icon: "assets/batiment/sprite_Reseau.png",        applies: "orbital",  multiplier: 5 },

  // ── Multiplicateur global CPS ─────────────────────────────────────────────
  globalBoost1: { name: "Cristaux éthérés",   cost: 400_000,     description: "×1.5 sur toute la production.", icon: "assets/batiment/sprite_Cristaux.png", applies: "global", multiplier: 1.5 },
  globalBoost2: { name: "Résonance cosmique", cost: 200_000_000, description: "×2 sur toute la production.",   icon: "assets/batiment/sprite_cosmique.png", applies: "global", multiplier: 2   }
};
