const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { getDb } = require("../db");

const router = express.Router();
const SALT_ROUNDS = 10;

function signToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username },
    process.env.JWT_SECRET || "dev-secret-space-clicker",
    { expiresIn: "7d" }
  );
}

function cleanUsername(username) {
  return String(username || "").trim().slice(0, 24);
}

router.post("/register", async (req, res) => {
  try {
    const db = getDb();
    const username = cleanUsername(req.body.username);
    const password = String(req.body.password || "");

    if (username.length < 3 || password.length < 6) {
      return res.status(400).json({ message: "Nom d'utilisateur ou mot de passe trop court." });
    }

    const existingUser = db.prepare("SELECT id FROM users WHERE username = ?").get(username);
    if (existingUser) {
      return res.status(409).json({ message: "Ce nom d'utilisateur existe déjà." });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const result = db
      .prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)")
      .run(username, passwordHash);

    const user = { id: result.lastInsertRowid, username };
    return res.status(201).json({ token: signToken(user), username });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Impossible de créer le compte." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const db = getDb();
    const username = cleanUsername(req.body.username);
    const password = String(req.body.password || "");
    const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username);

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ message: "Identifiants invalides." });
    }

    return res.json({ token: signToken(user), username: user.username });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Impossible de se connecter." });
  }
});

module.exports = router;
