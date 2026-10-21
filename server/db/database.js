const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbDirectory = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dbDirectory)) {
  fs.mkdirSync(dbDirectory, { recursive: true });
}

const dbPath = process.env.DB_PATH || path.join(dbDirectory, 'kudos.db');
const db = new Database(dbPath);

// Enable WAL mode & foreign keys for high reliability & performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initializeDatabase() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schemaSql);
}

// Run schema initialization
initializeDatabase();

module.exports = db;
