# Space Clicker

Idle clicker spatial en JavaScript vanilla. Le joueur mine des cristaux sur une planète animée, construit des installations automatiques, achète des améliorations et colonise de nouvelles planètes via un système de prestige.

## Lancer le projet

```bash
npm install
npm start
```

Le serveur démarre sur `http://localhost:3000`. Express sert à la fois l'API et le frontend depuis le même port.

## Variables d'environnement

Créez un `.env` à la racine du projet :

```env
PORT=3000
JWT_SECRET=une-cle-longue-et-secrete
DATABASE_PATH=./backend/space-clicker.db
CORS_ORIGIN=http://localhost:3000
```

Sans `.env`, le projet fonctionne avec une clé JWT par défaut (`dev-secret-space-clicker`) et une base SQLite dans `backend/space-clicker.db`. Ne pas laisser la clé par défaut en production.

## Fonctionnalités

- Planètes animées par spritesheet canvas — 8 planètes débloquées par prestige
- 8 bâtiments avec coût exponentiel (`baseCost × 1.15^count`), achat en ×1 / ×10 / ×100 / MAX
- Tooltips de production en temps réel sur chaque bâtiment
- Sprites orbitaux sur la planète au fil des améliorations de clic
- Prestige : réinitialise les bâtiments et upgrades contre un multiplicateur ×1.5 permanent
- Gains hors-ligne calculés au chargement (max 8h)
- 25 succès avec notifications
- Sauvegarde distante via JWT + SQLite, auto-save toutes les 30 secondes
- Classement des 10 meilleurs joueurs (pour tester créer à chaque fois un nouveau joueur)

## API

```
POST /api/auth/register    { username, password }
POST /api/auth/login       { username, password }
GET  /api/save             Authorization: Bearer <token>
POST /api/save             Authorization: Bearer <token>  { gameState }
GET  /api/leaderboard
GET  /api/health
```

## Stack

**Frontend** — HTML/CSS/JS vanilla, modules ES6, canvas 2D, Google Fonts (Exo 2 + Space Mono). Pas de bundler, pas de framework.

**Backend** — Node.js, Express, `sql.js` (SQLite en pure JS, compatible Render sans compilation native), `bcryptjs`, `jsonwebtoken`.

## Déploiement sur Render

Déployez la racine du projet avec la commande de démarrage `npm start`. Définissez `JWT_SECRET` et `PORT` dans les variables d'environnement Render. La base SQLite est éphémère sur le plan gratuit (recréée à chaque redéploiement).
