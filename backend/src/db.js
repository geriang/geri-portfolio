"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
exports.initSchema = initSchema;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const dbPath = path_1.default.resolve(__dirname, '..', '..', 'data', 'portfolio.db');
// Ensure data directory exists
fs_1.default.mkdirSync(path_1.default.dirname(dbPath), { recursive: true });
exports.db = new better_sqlite3_1.default(dbPath);
// Initialize schema if not exists
function initSchema() {
    exports.db.exec(`
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
exports.default = exports.db;
