const express = require("express");
const jwt = require("jsonwebtoken");
const { getDb } = require("../db");

const router = express.Router();

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Token manquant." });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || "dev-secret-space-clicker");
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Session invalide ou expirée." });
  }
}

router.get("/", authMiddleware, (req, res) => {
  const db = getDb();
  const save = db.prepare("SELECT game_data, updated_at FROM saves WHERE user_id = ?").get(req.user.id);

  if (!save) {
    return res.json({ gameState: null, updatedAt: null });
  }

  try {
    return res.json({ gameState: JSON.parse(save.game_data), updatedAt: save.updated_at });
  } catch (error) {
    return res.status(500).json({ message: "Sauvegarde corrompue." });
  }
});

router.post("/", authMiddleware, (req, res) => {
  const db = getDb();
  const gameState = req.body.gameState;

  if (!gameState || typeof gameState !== "object") {
    return res.status(400).json({ message: "Données de sauvegarde invalides." });
  }

  const totalCrystalsEver = Number(gameState.totalCrystalsEver || 0);
  const serializedSave = JSON.stringify(gameState);

  const transaction = db.transaction(() => {
    db.prepare(`
      INSERT INTO saves (user_id, game_data, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id) DO UPDATE SET
        game_data = excluded.game_data,
        updated_at = CURRENT_TIMESTAMP
    `).run(req.user.id, serializedSave);

    db.prepare(`
      INSERT INTO leaderboard (user_id, username, total_crystals_ever, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id) DO UPDATE SET
        username = excluded.username,
        total_crystals_ever = MAX(leaderboard.total_crystals_ever, excluded.total_crystals_ever),
        updated_at = CURRENT_TIMESTAMP
    `).run(req.user.id, req.user.username, totalCrystalsEver);
  });

  transaction();
  return res.json({ message: "Sauvegarde effectuée.", totalCrystalsEver });
});

module.exports = router;
