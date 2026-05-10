const path = require("path");
const fs = require("fs");
const initSqlJs = require("sql.js");

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, "space-clicker.db");

let db = null;

// Charge ou crée la base de données SQLite via sql.js (100% JavaScript, pas de compilation).
async function initDb() {
  const SQL = await initSqlJs();

  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS saves (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      game_data TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id)
    );

    CREATE TABLE IF NOT EXISTS leaderboard (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      username TEXT NOT NULL,
      total_crystals_ever REAL NOT NULL DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id)
    );
  `);

  // Sauvegarde sur disque après chaque écriture.
  persist();
  return db;
}

// Écrit le fichier .db sur disque pour persister les données entre les redémarrages.
function persist() {
  if (!db) return;
  const data = db.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
}

// Wrapper autour de sql.js pour imiter l'API de better-sqlite3 (prepare/get/all/run).
function getDb() {
  if (!db) throw new Error("Base de données non initialisée.");
  return {
    prepare(sql) {
      return {
        get(...params) {
          const stmt = db.prepare(sql);
          stmt.bind(params);
          if (stmt.step()) {
            const row = stmt.getAsObject();
            stmt.free();
            return row;
          }
          stmt.free();
          return undefined;
        },
        all(...params) {
          const stmt = db.prepare(sql);
          stmt.bind(params);
          const rows = [];
          while (stmt.step()) rows.push(stmt.getAsObject());
          stmt.free();
          return rows;
        },
        run(...params) {
          db.run(sql, params);
          const info = db.exec("SELECT last_insert_rowid() as id, changes() as changes");
          persist();
          if (info.length > 0) {
            return {
              lastInsertRowid: info[0].values[0][0],
              changes: info[0].values[0][1]
            };
          }
          return { lastInsertRowid: null, changes: 0 };
        }
      };
    },
    // Exécute plusieurs instructions SQL d'un coup (sans paramètres).
    exec(sql) {
      db.run(sql);
      persist();
    },
    // Simule les transactions better-sqlite3 : exécute la fonction puis persiste.
    transaction(fn) {
      return function(...args) {
        const result = fn(...args);
        persist();
        return result;
      };
    }
  };
}

module.exports = { initDb, getDb };
