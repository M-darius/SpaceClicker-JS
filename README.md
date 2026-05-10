# Space Clicker

Space Clicker est une première version jouable d'un idle/clicker spatial. Le joueur mine des cristaux, achète des bâtiments automatiques, débloque des améliorations, gagne des succès et peut sauvegarder sa progression avec un compte.

## Installation

```bash
npm install
npm start
```

L'API démarre par défaut sur `http://localhost:3000`.

Le serveur Express sert aussi le frontend. Après `npm start`, ouvrez `http://localhost:3000` pour jouer avec l'API et l'interface sur la même origine.

## Configuration

Créez un fichier `.env` à la racine si nécessaire :

```env
PORT=3000
JWT_SECRET=une-cle-longue-et-secrete
DATABASE_PATH=./backend/space-clicker.sqlite
CORS_ORIGIN=http://localhost:5173,http://localhost:8888
```

Sans `.env`, le projet fonctionne en mode développement avec une clé JWT par défaut et une base SQLite créée dans `backend/space-clicker.sqlite`.

## Fonctionnalités

- Clic sur une planète animée pour miner des cristaux.
- Production automatique par bâtiments avec coût exponentiel.
- Améliorations permanentes de session : foreuses, IA et moteur warp.
- Prestige disponible à partir de 1 000 000 cristaux cumulés.
- 15 succès avec badges et notifications animées.
- Authentification JWT avec mots de passe hashés par bcrypt.
- Sauvegarde distante via Express et SQLite, ou sauvegarde locale sans compte.
- Classement des 10 meilleurs joueurs par cristaux cumulés.

## API

- `POST /api/auth/register` avec `{ "username": "...", "password": "..." }`
- `POST /api/auth/login` avec `{ "username": "...", "password": "..." }`
- `GET /api/save` avec `Authorization: Bearer <token>`
- `POST /api/save` avec `Authorization: Bearer <token>` et `{ "gameState": { ... } }`
- `GET /api/leaderboard`

## Choix techniques

Le frontend utilise JavaScript vanilla en modules ES pour garder une séparation claire entre moteur de jeu, boutique, succès, interface et API. Le backend Express reste volontairement simple et adapté à Render. SQLite avec `better-sqlite3` convient bien à une première version persistante : installation légère, requêtes synchrones rapides et aucune infrastructure externe nécessaire.

Pour Netlify, déployez le dossier `frontend`. Pour Render, déployez la racine du projet avec la commande `npm start` et définissez `JWT_SECRET` dans les variables d'environnement. En déploiement séparé, exposez l'URL publique de l'API dans `window.SPACE_CLICKER_API_URL` avant le chargement de `js/main.js`.
