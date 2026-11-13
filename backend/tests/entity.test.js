"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const entity_1 = __importDefault(require("../src/routes/entity"));
const db_1 = require("../src/db");
const app = (0, express_1.default)();
app.use('/entity', entity_1.default);
beforeAll(() => {
    db_1.db.exec('DROP TABLE IF EXISTS pages; DROP TABLE IF EXISTS headings; DROP TABLE IF EXISTS paragraphs; DROP TABLE IF EXISTS lists; DROP TABLE IF EXISTS images;');
    const init = require('../src/db').initSchema;
    init();
    // Insert a heading entity
    const pageId = db_1.db.prepare('INSERT INTO pages (url, identifier) VALUES (?, ?)').run('url', 'page').lastInsertRowid;
    const info = db_1.db.prepare('INSERT INTO headings (page_id, level, text) VALUES (?, ?, ?)').run(pageId, 2, 'Test Heading');
    db_1.db.prepare('INSERT INTO paragraphs (page_id, text) VALUES (?, ?)').run(pageId, 'Para');
    // store ids for later use
    global.headingId = info.lastInsertRowid;
});
describe('GET /entity/:id', () => {
    it('should return heading entity', async () => {
        const res = await (0, supertest_1.default)(app).get(`/entity/${global.headingId}`);
        expect(res.status).toBe(200);
        expect(res.body.type).toBe('heading');
        expect(res.body.level).toBe(2);
        expect(res.body.text).toBe('Test Heading');
    });
    it('should return 404 for non‑existent id', async () => {
        const res = await (0, supertest_1.default)(app).get('/entity/99999');
        expect(res.status).toBe(404);
    });
});
