"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const staticData_1 = __importDefault(require("../src/routes/staticData"));
const entity_1 = __importDefault(require("../src/routes/entity"));
const db_1 = require("../src/db");
// Set up a test app
const app = (0, express_1.default)();
app.use('/static-data', staticData_1.default);
app.use('/entity', entity_1.default);
beforeAll(() => {
    // Ensure clean DB for tests
    db_1.db.exec('DROP TABLE IF EXISTS pages; DROP TABLE IF EXISTS headings; DROP TABLE IF EXISTS paragraphs; DROP TABLE IF EXISTS lists; DROP TABLE IF EXISTS images;');
    // Reinitialize schema
    const init = require('../src/db').initSchema;
    init();
    // Insert a sample page with known data
    const pageId = db_1.db.prepare('INSERT INTO pages (url, identifier) VALUES (?, ?)').run('http://example.com', 'sample').lastInsertRowid;
    db_1.db.prepare('INSERT INTO headings (page_id, level, text) VALUES (?, ?, ?)').run(pageId, 1, 'Sample Heading');
    db_1.db.prepare('INSERT INTO paragraphs (page_id, text) VALUES (?, ?)').run(pageId, 'Sample paragraph.');
});
describe('GET /static-data/:page', () => {
    it('should return JSON with content for existing page', async () => {
        const res = await (0, supertest_1.default)(app).get('/static-data/sample');
        expect(res.status).toBe(200);
        expect(res.body.identifier).toBe('sample');
        expect(res.body.headings).toEqual([{ level: 1, text: 'Sample Heading' }]);
        expect(res.body.paragraphs).toEqual([{ text: 'Sample paragraph.' }]);
    });
    it('should return 404 for unknown page', async () => {
        const res = await (0, supertest_1.default)(app).get('/static-data/unknown');
        expect(res.status).toBe(404);
    });
});
