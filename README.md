# Space Clicker

Idle clicker spatial en JavaScript vanilla. Le joueur mine des cristaux sur une planète animée, construit des installations automatiques, achète des améliorations et colonise de nouvelles planètes via un système de prestige.

---

## Lancer le projet

```bash
npm install
npm start
```

Le serveur démarre sur `http://localhost:3000`. Express sert à la fois l'API REST et le frontend statique depuis le même port.

Pour repartir d'une base de données vierge :

```bash
npm run fresh
```

---

## Fonctionnalités

- Planète animée par spritesheet canvas - 8 planètes débloquées par prestige
- 8 bâtiments avec coût exponentiel, achat en ×1 / ×10 / ×100 / MAX
- 19 améliorations (clic, par bâtiment, globales)
- 4 types de bonus cosmiques cliquables (astéroïde, tempête solaire, quasar, trou noir)
- Prestige : réinitialise les bâtiments et améliorations contre un multiplicateur ×1.5 permanent
- Gains hors-ligne calculés au chargement (plafond 8 h)
- 25 succès avec notifications
- Sauvegarde distante via JWT + SQLite, auto-save toutes les 30 secondes
- Classement des 10 meilleurs joueurs

---

### Modules frontend

| Fichier             | Rôle |
| `main.js`           | Point d'entrée - lie les événements et initialise les systèmes |
| `game-state.js`     | État runtime partagé (`gameState`, `activeBonuses`) |
| `game-rules.js`     | Logique de calcul : CPS, clic, prestige, merge, callbacks |
| `game-loop.js`      | `setInterval` 100 ms - tick de production et expiration des bonus |
| `shop.js`           | Achat de bâtiments et d'améliorations |
| `bonuses.js`        | Spawn, animation et collecte des bonus cosmiques |
| `ui.js`             | Rendu DOM - affichage des compteurs, boutique, tooltips |
| `buildings-zone.js` | Zone centrale - bandes de bâtiments animées |
| `achievements.js`   | Définition et vérification des 25 succès |
| `api.js`            | Couche `fetch` - auth, save, leaderboard |
| `data/buildings.js` | Définitions statiques des 8 bâtiments |
| `data/upgrades.js`  | Définitions statiques des 19 améliorations |
| `data/planets.js`   | Séquence des 8 planètes et leurs seuils de prestige |

---

## Modèle de données

### État de jeu (`gameState`)

```json
{
  "crystals": 0,
  "totalCrystalsEver": 0,
  "crystalsThisPrestige": 0,
  "crystalsPerClick": 1,
  "crystalsPerSecond": 0,
  "totalClicks": 0,
  "prestigeCount": 0,
  "prestigeMultiplier": 1.0,
  "buildings": {
    "drone":    { "count": 0, "baseCps": 0.1,  "baseCost": 15,    "name": "Drone explorateur" },
    "mine":     { "count": 0, "baseCps": 1,    "baseCost": 80,    "name": "Mine de cristaux"  },
    "..."
  },
  "upgrades": {
    "click1": false,
    "drone1": false,
    "..."
  },
  "achievements": { "unlocked": ["premier_clic", "..."] },
  "lastSaved": 1715000000000
}
```

`gameState` est sérialisé en JSON et stocké tel quel dans la colonne `game_data` de SQLite. Les bonus actifs (`activeBonuses`) sont volontairement pas sauvegarder, ils disparaissent à la fermeture du jeu.

### Schéma SQLite

```sql
-- Comptes utilisateurs
CREATE TABLE users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  username      TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL
);

-- Une ligne par joueur, écrasée à chaque sauvegarde (UPSERT)
CREATE TABLE saves (
  user_id    INTEGER PRIMARY KEY REFERENCES users(id),
  game_data  TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Score historique : seul le maximum est conservé
CREATE TABLE leaderboard (
  user_id            INTEGER PRIMARY KEY REFERENCES users(id),
  username           TEXT NOT NULL,
  total_crystals_ever INTEGER NOT NULL DEFAULT 0,
  updated_at         TEXT NOT NULL
);
```

---

## Formules de jeu

### Coût d'un bâtiment

```
coût(n) = ⌈ baseCost × 1.15^count ⌉
```

Chaque achat augmente `count`, ce qui rend le prochain achat 15 % plus cher.

**Coût d'un achat groupé de `q` unités :**

```
coûtGroupé = Σ  ⌈ baseCost × 1.15^(count + i) ⌉   pour i ∈ [0, q[
```

### Production par seconde (CPS)

```
CPS = ( Σ_b [ count_b × baseCps_b × mult_upgrades_b ] )
      × mult_upgrades_global
      × prestigeMultiplier
      × mult_bonus_cps_actifs
```

- `mult_upgrades_b` : produit des multiplicateurs des améliorations propres au bâtiment `b`
- `mult_upgrades_global` : produit des améliorations globales (`globalBoost1`, `globalBoost2`)
- `mult_bonus_cps_actifs` : produit des bonus CPS temporaires en cours

Le game loop tourne à **10 ticks/s** (`setInterval` 100 ms). À chaque tick :

```
cristaux_produits = CPS / 10
```

### Puissance de clic

```
puissanceClic = mult_upgrades_clic × prestigeMultiplier × mult_bonus_clic_actifs
```

### Multiplicateur de prestige

```
prestigeMultiplier = 1.5^prestigeCount
```

Chaque colonisation multiplie définitivement toute la production et le clic par 1.5.

### Gains hors-ligne

```
durée = min( (maintenant − lastSaved) / 1000,  28 800 )   [en secondes]
gainé = ⌊ durée × CPS_sauvegardé ⌋
```

Seuil minimal de 30 secondes. Plafond de 8 heures. Il faut avoir créer et être connecter à un compte.

### Tirage des bonus cosmiques

Les 4 types de bonus ont un poids (`weight`). Le tirage est proportionnel :

| Bonus              | Poids |
| Astéroïde          | 40 |
| Tempête solaire    | 35 |
| Quasar             | 20 |
| Trou Noir          | 5 |

```
r = random × Σ weights
tirage = premier type tel que r − weight_type ≤ 0
```

---

## API

Toutes les routes retournent du JSON.

```
POST /api/auth/register    { username, password }   → { token, username }
POST /api/auth/login       { username, password }   → { token, username }
GET  /api/save             Authorization: Bearer <token>
POST /api/save             Authorization: Bearer <token>  { gameState }
GET  /api/leaderboard      → [ { username, total_crystals_ever } ]
GET  /api/health           → { status: "ok" }
```

- Token JWT signé, durée de vie 7 jours, stocké dans `localStorage`
- Mots de passe hachés avec bcrypt (10 rounds)
- Le score du classement conserve le maximum historique (jamais décroissant)

---

## Choix techniques

| Choix                                               | Justification |
| Vanilla JS ES modules, pas de bundler               | Simplicité maximale, lisibilité directe du code source, pas de configuration |
| `sql.js` (SQLite compilé en WASM)                   | Pas de dépendance native - compatible Render sans couche de compilation |
| Un seul port (Express sert aussi le frontend)       | Pas de problème CORS en production, déploiement simplifié |
| `gameState` sérialisé en JSON brut                  | Merge côté client, pas de schéma à maintenir côté serveur |
| Gains hors-ligne calculés côté client               | Évite une logique serveur complexe ; la sauvegarde contient `lastSaved` et `crystalsPerSecond` |
| CSS custom properties pour les bonus                | Chaque bonus injecte sa couleur via `--co-color` / `--co-glow`, réutilisé dans 5 règles |
| Callbacks (`setGameCallbacks`) plutôt qu'events DOM | Groupage entre la logique de jeu et l'UI sans dépendance sur le DOM |

---

## Limites connues

- **SQLite éphémère sur Render (plan gratuit)** : la base est recréée à chaque redéploiement, toutes les sauvegardes sont perdues.
- **Pas de validation côté serveur du `gameState`** : un joueur peut envoyer un état arbitraire. Le score du classement peut être falsifié.
- **Un seul bonus en vol simultané** : `currentObject` bloque l'apparition d'un deuxième bonus tant que le premier n'a pas disparu.
- **Classement non temps réel** : il faut cliquer sur le bouton de rafraîchissement.
- **Pas de mode mobile** : l'interface est conçue sur pc, sur mobile il y a des problèmes de rafréchissement de la page et d'image qui ne charge pas.

---

## Variables d'environnement

Créez un `.env` à la racine :

```env
PORT=3000
JWT_SECRET=une-cle-longue-et-secrete
DATABASE_PATH=./backend/space-clicker.db
CORS_ORIGIN=http://localhost:3000
```

Sans `.env`, le projet fonctionne avec une clé JWT par défaut (`dev-secret-space-clicker`) et une base SQLite locale. Si le projet était en productinil ne faudrait pas utiliser la clé par défaut.

---

## Stack

**Frontend** - HTML / CSS / JS vanilla, modules ES6, canvas 2D, Google Fonts.

**Backend** - Node.js, Express, `sql.js` (SQLite en pure JS), `bcryptjs`, `jsonwebtoken`, `dotenv`.

**Asset** - pour la plupart des visuelles l'IA leonardo.ai a été utilisée.
---

## Déploiement sur Render

Déployez la racine du projet avec la commande de démarrage `npm start`. Définissez `JWT_SECRET` et `PORT` dans les variables d'environnement Render. La base SQLite est éphémère sur le plan gratuit.
