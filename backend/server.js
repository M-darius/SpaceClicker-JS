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

// Le frontend est servi par Express pour éviter les problèmes de modules ES en file://.
app.use(express.static(frontendPath));
app.get("/", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

app.use((req, res) => {
  res.status(404).json({ message: "Route introuvable." });
});

// On initialise la base de données avant d'accepter les connexions.
initDb().then(() => {
  app.listen(port, () => {
    console.log(`✅ Space Clicker API en ligne sur http://localhost:${port}`);
  });
}).catch((err) => {
  console.error("❌ Impossible d'initialiser la base de données :", err);
  process.exit(1);
});
