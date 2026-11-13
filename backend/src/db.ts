import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.resolve(__dirname, '..', '..', 'data', 'portfolio.db');

// Ensure data directory exists
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

export const db = new Database(dbPath);

// Initialize schema if not exists
export function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS pages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      url TEXT NOT NULL,
      identifier TEXT NOT NULL UNIQUE
    );
    CREATE TABLE IF NOT EXISTS headings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      page_id INTEGER,
      level INTEGER,
      text TEXT,
      FOREIGN KEY(page_id) REFERENCES pages(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS paragraphs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      page_id INTEGER,
      text TEXT,
      FOREIGN KEY(page_id) REFERENCES pages(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS lists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      page_id INTEGER,
      ordered INTEGER,
      items TEXT, -- JSON array of strings
      FOREIGN KEY(page_id) REFERENCES pages(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      page_id INTEGER,
      src TEXT,
      alt TEXT,
      FOREIGN KEY(page_id) REFERENCES pages(id) ON DELETE CASCADE
    );
  `);
}

// Call init on module load
initSchema();

export default db;
