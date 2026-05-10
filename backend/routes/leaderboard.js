const express = require("express");
const { getDb } = require("../db");

const router = express.Router();

router.get("/", (req, res) => {
  const db = getDb();
  const rows = db.prepare(`
    SELECT username, total_crystals_ever, updated_at
    FROM leaderboard
    ORDER BY total_crystals_ever DESC
    LIMIT 10
  `).all();

  const leaderboard = rows.map((row, index) => ({
    rank: index + 1,
    username: row.username,
    totalCrystalsEver: row.total_crystals_ever,
    updatedAt: row.updated_at
  }));

  return res.json(leaderboard);
});

module.exports = router;
