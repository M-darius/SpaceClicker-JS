const path = require("path");
const fs = require("fs");
const initSqlJs = require("sql.js");

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, "space-clicker.db");

let db = null;

// Initialise la base de données SQLite via sql.js (pure JS, compatible Render sans compilation native).
// Le chemin du fichier est configurable via DATABASE_PATH ; par défaut dans le dossier backend/.
async function initDb() {
  // Le fichier WASM doit être localisé explicitement pour fonctionner sur Render.
  const wasmPath = path.join(require.resolve("sql.js"), "..", "sql-wasm.wasm");
  const SQL = await initSqlJs({
    locateFile: () => wasmPath
  });

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

  persist();
  return db;
}

// Sérialise la base en mémoire et l'écrit sur disque.
// Sur Render (plan gratuit), ce fichier est perdu à chaque redéploiement.
function persist() {
  if (!db) return;
  const data = db.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
}

// Wrapper autour de sql.js qui imite l'API synchrone de better-sqlite3 (prepare/get/all/run).
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
    exec(sql) {
      db.run(sql);
      persist();
    },
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
