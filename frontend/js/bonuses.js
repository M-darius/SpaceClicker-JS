import { gameState, addActiveBonus } from "./game.js";
import { formatNumber } from "./ui.js";

const CONFIRM_MS = 6_000;

const BONUS_TYPES = [
  {
    id: "asteroid",
    label: "Astéroïde",
    icon: `<img src="assets/bonus/sprite_Astéroide.png" class="co-sprite" alt="">`,
    color: "#F5A623",
    glowColor: "rgba(245, 166, 35, 0.55)",
    target: "click",
    multiplier: 5,
    durationMs: 30_000,
    weight: 40,
    description: "×5 puissance de clic",
    detail: "Chaque clic rapporte 5× plus de cristaux pendant 30 secondes."
  },
  {
    id: "solar_storm",
    label: "Tempête solaire",
    icon: `<img src="assets/bonus/sprite_TempeteSolaire.png" class="co-sprite" alt="">`,
    color: "#FF6B35",
    glowColor: "rgba(255, 107, 53, 0.55)",
    target: "cps",
    multiplier: 3,
    durationMs: 30_000,
    weight: 35,
    description: "×3 production",
    detail: "Toute la production de cristaux est multipliée par 3 pendant 30 secondes."
  },
  {
    id: "quasar",
    label: "Quasar",
    icon: `<img src="assets/bonus/sprite_Quasar.png" class="co-sprite" alt="">`,
    color: "#00E5FF",
    glowColor: "rgba(0, 229, 255, 0.55)",
    target: "instant",
    multiplier: 600,
    durationMs: 0,
    weight: 20,
    description: "10 min de production",
    detail: "Génère instantanément l'équivalent de 10 minutes de production."
  },
  {
    id: "black_hole",
    label: "Trou Noir",
    icon: `<img src="assets/bonus/sprite_TrouNoir.png" class="co-sprite" alt="">`,
    color: "#9F5FFF",
    glowColor: "rgba(159, 95, 255, 0.65)",
    target: "cps",
    multiplier: 8,
    durationMs: 15_000,
    weight: 5,
    description: "×8 production",
    detail: "Distorsion gravitationnelle : toute production ×8 pendant 15 secondes."
  }
];

let spawnTimer = null;
let currentObject = null;

function weightedRandom(types) {
  const total = types.reduce((s, t) => s + t.weight, 0);
  let r = Math.random() * total;
  for (const t of types) {
    r -= t.weight;
    if (r <= 0) return t;
  }
  return types[0];
}

function scheduleNext() {
  const delay = 60_000 + Math.random() * 120_000;
  spawnTimer = setTimeout(() => { spawnObject(); scheduleNext(); }, delay);
}

export function initBonusSystem() {
  const firstDelay = 30_000 + Math.random() * 60_000;
  spawnTimer = setTimeout(() => { spawnObject(); scheduleNext(); }, firstDelay);
}

function getSpawnConfig(typeId) {
  const w = window.innerWidth;
  const h = window.innerHeight;

  switch (typeId) {
    case "asteroid": {
      // Haut-droite → bas-gauche en diagonal, rotation
      const startX = w * 0.45 + Math.random() * w * 0.45;
      const ms = 4_000 + Math.random() * 2_500;
      return {
        x: startX, y: -110,
        animClass: "co-fly-asteroid",
        ms,
        vars: {
          "--co-end-x": `${-(startX + 350)}px`,
          "--co-end-y": `${h + 200}px`,
          "--co-rot":   `${360 + Math.random() * 360}deg`,
          "--co-duration": `${ms}ms`
        }
      };
    }
    case "solar_storm": {
      // Depuis droite, arc descendant puis remontant
      const startY = h * 0.08 + Math.random() * h * 0.25;
      const ms = 10_000 + Math.random() * 4_000;
      const arcDip = 50 + Math.random() * 80;
      return {
        x: w + 120, y: startY,
        animClass: "co-fly-solar",
        ms,
        vars: {
          "--co-end-x":   `${-(w + 250)}px`,
          "--co-arc-y":   `${arcDip}px`,
          "--co-duration": `${ms}ms`
        }
      };
    }
    case "quasar": {
      // Bas-gauche → haut-droite en diagonale, scale pulse
      const startX = w * 0.03 + Math.random() * w * 0.12;
      const ms = 8_000 + Math.random() * 4_000;
      return {
        x: startX, y: h + 120,
        animClass: "co-fly-quasar",
        ms,
        vars: {
          "--co-end-x":    `${w - startX + 200}px`,
          "--co-end-y":    `${-(h + 200)}px`,
          "--co-duration": `${ms}ms`
        }
      };
    }
    case "black_hole": {
      // Gauche → droite très lentement, oscillation verticale
      const startY = h * 0.2 + Math.random() * h * 0.5;
      const ms = 16_000 + Math.random() * 6_000;
      const wobble = 25 + Math.random() * 35;
      return {
        x: -160, y: startY,
        animClass: "co-fly-blackhole",
        ms,
        vars: {
          "--co-end-x":    `${w + 300}px`,
          "--co-wobble":   `${wobble}px`,
          "--co-duration": `${ms}ms`
        }
      };
    }
    default: {
      const ms = 10_000;
      return { x: -140, y: h * 0.5, animClass: "co-fly-asteroid", ms, vars: { "--co-end-x": `${w + 200}px`, "--co-end-y": "0px", "--co-rot": "0deg", "--co-duration": `${ms}ms` } };
    }
  }
}

function spawnObject() {
  if (currentObject) return;

  const type   = weightedRandom(BONUS_TYPES);
  const config = getSpawnConfig(type.id);

  const obj = document.createElement("div");
  obj.className = `cosmic-object co--${type.id}`;
  obj.style.setProperty("--co-color", type.color);
  obj.style.setProperty("--co-glow",  type.glowColor);
  Object.entries(config.vars).forEach(([k, v]) => obj.style.setProperty(k, v));
  obj.style.left = `${config.x}px`;
  obj.style.top  = `${config.y}px`;

  obj.innerHTML = `
    <div class="co-body">
      <span class="co-icon">${type.icon}</span>
      <span class="co-label">${type.label}</span>
      <span class="co-desc">${type.description}</span>
    </div>
  `;

  document.body.appendChild(obj);
  currentObject = obj;

  requestAnimationFrame(() => obj.classList.add(config.animClass));

  const onTransitEnd = () => {
    if (obj.parentNode) obj.remove();
    if (currentObject === obj) currentObject = null;
  };
  obj.addEventListener("animationend", onTransitEnd, { once: true });

  obj.addEventListener("click", (e) => {
    e.stopPropagation();
    obj.removeEventListener("animationend", onTransitEnd);
    freezeObject(obj);
    showConfirmPopup(type, obj);
  }, { once: true });
}

function freezeObject(obj) {
  const rect = obj.getBoundingClientRect();
  [...obj.classList]
    .filter(c => c.startsWith("co-fly-"))
    .forEach(c => obj.classList.remove(c));
  obj.style.left      = `${rect.left}px`;
  obj.style.top       = `${rect.top}px`;
  obj.style.transform = "none";
  obj.style.animation = "none";
  void obj.offsetHeight;
}

function dismissObject(obj) {
  obj.classList.add("co-exit-quiet");
  setTimeout(() => {
    if (obj.parentNode) obj.remove();
    if (currentObject === obj) currentObject = null;
  }, 500);
}

function burstObject(obj) {
  obj.classList.add("co-burst");
  setTimeout(() => {
    if (obj.parentNode) obj.remove();
    if (currentObject === obj) currentObject = null;
  }, 520);
}

function closePopup(popup, cb) {
  popup.classList.remove("co-popup--visible");
  setTimeout(() => { popup.remove(); cb?.(); }, 280);
}

function showConfirmPopup(type, obj) {
  const popup = document.createElement("div");
  popup.className = "co-popup";
  popup.style.setProperty("--co-color", type.color);
  popup.style.setProperty("--co-glow",  type.glowColor);

  const durText = type.durationMs > 0
    ? `Durée : ${type.durationMs / 1000}s`
    : "Effet instantané";

  popup.innerHTML = `
    <div class="co-popup-icon">${type.icon}</div>
    <div class="co-popup-title">${type.label}</div>
    <div class="co-popup-detail">${type.detail}</div>
    <div class="co-popup-dur">${durText}</div>
    <div class="co-popup-timer"><div class="co-popup-timer-fill"></div></div>
    <div class="co-popup-actions">
      <button class="co-popup-collect">Collecter</button>
      <button class="co-popup-pass">Passer</button>
    </div>
  `;

  // Positionne le popup au-dessus de l'objet, ajuste si hors écran
  const objRect = obj.getBoundingClientRect();
  const PW = 230, PH = 210;
  let left = objRect.left + objRect.width / 2 - PW / 2;
  let top  = objRect.top - PH - 14;
  left = Math.max(8, Math.min(left, window.innerWidth - PW - 8));
  if (top < 8) top = objRect.bottom + 14;
  popup.style.left = `${left}px`;
  popup.style.top  = `${top}px`;

  document.body.appendChild(popup);
  requestAnimationFrame(() => popup.classList.add("co-popup--visible"));

  // Lance le timer visuel
  const fill = popup.querySelector(".co-popup-timer-fill");
  fill.style.setProperty("--confirm-ms", `${CONFIRM_MS}ms`);
  requestAnimationFrame(() => fill.classList.add("co-popup-timer-fill--running"));

  const autoTimeout = setTimeout(() => {
    closePopup(popup, () => dismissObject(obj));
  }, CONFIRM_MS);

  popup.querySelector(".co-popup-collect").addEventListener("click", () => {
    clearTimeout(autoTimeout);
    closePopup(popup, () => {
      burstObject(obj);
      collectBonus(type);
    });
  });

  popup.querySelector(".co-popup-pass").addEventListener("click", () => {
    clearTimeout(autoTimeout);
    closePopup(popup, () => dismissObject(obj));
  });
}

function collectBonus(type) {
  if (type.target === "instant") {
    const gained = Math.floor(gameState.crystalsPerSecond * type.multiplier);
    gameState.crystals             += gained;
    gameState.totalCrystalsEver    += gained;
    gameState.crystalsThisPrestige += gained;
    showBonusNotif(type, `+${formatNumber(gained)} cristaux`);
  } else {
    addActiveBonus(type.id, type.target, type.multiplier, type.durationMs);
    showBonusNotif(type, `${type.description} pendant ${type.durationMs / 1000}s`);
  }
}

function showBonusNotif(type, detail) {
  const container = document.getElementById("notifications");
  if (!container) return;
  const notif = document.createElement("div");
  notif.className = "bonus-notif";
  notif.style.setProperty("--co-color", type.color);
  notif.innerHTML = `
    <span class="bonus-notif-icon">${type.icon}</span>
    <div><strong>${type.label}</strong><small>${detail}</small></div>
  `;
  container.appendChild(notif);
  setTimeout(() => notif.remove(), 4_200);
}
