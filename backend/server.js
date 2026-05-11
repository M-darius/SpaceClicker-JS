require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const { initDb } = require("./db");

const authRoutes = require("./routes/auth");
const saveRoutes = require("./routes/save");
const leaderboardRoutes = require("./routes/leaderboard");

const app = express();
const port = process.env.PORT || 3000;
const frontendPath = path.join(__dirname, "..", "frontend");

app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : true,
  credentials: true
}));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (req, res) => {
  res.json({ ok: true, name: "Space Clicker API" });
});

app.use("/api/auth", authRoutes);
app.use("/api/save", saveRoutes);
app.use("/api/leaderboard", leaderboardRoutes);

// Routes API introuvables → JSON 404
app.use("/api", (req, res) => {
  res.status(404).json({ message: "Route introuvable." });
});

// Le frontend est servi directement par Express.
// En production (Render), le port est fourni par la variable d'environnement PORT.
app.use(express.static(frontendPath));

// Toutes les routes non-API renvoient index.html (fallback SPA).
app.get("*", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

// La base de données est initialisée avant l'écoute des connexions.
// Sur Render (plan gratuit), le système de fichiers est éphémère :
// la BDD SQLite est recréée à chaque redéploiement.
initDb().then(() => {
  app.listen(port, () => {
    console.log(`✅ Space Clicker en ligne sur le port ${port}`);
  });
}).catch((err) => {
  console.error("❌ Impossible d'initialiser la base de données :", err);
  process.exit(1);
});
