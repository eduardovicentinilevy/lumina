const fs = require("node:fs");
const path = require("node:path");
const Database = require("better-sqlite3");

const DB_PATH =
  process.env.DATABASE_PATH || path.join(__dirname, "..", "..", "data", "lumina.db");

// A pasta de dados não é versionada no git (fica vazia), então garantimos
// que ela exista antes de abrir o ficheiro — evita falhar num clone novo
// ou num container onde a pasta ainda não foi criada.
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

module.exports = db;
