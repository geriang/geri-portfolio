"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importDefault(require("../db"));
const router = (0, express_1.Router)();
router.get('/:page', (req, res) => {
    const identifier = req.params.page;
    const pageRow = db_1.default.prepare('SELECT id FROM pages WHERE identifier = ?').get(identifier);
    if (!pageRow) {
        return res.status(404).json({ error: 'Page not found' });
    }
    const pageId = pageRow.id;
    const headings = db_1.default.prepare('SELECT level, text FROM headings WHERE page_id = ?').all(pageId);
    const paragraphs = db_1.default.prepare('SELECT text FROM paragraphs WHERE page_id = ?').all(pageId);
    const lists = db_1.default.prepare('SELECT ordered, items FROM lists WHERE page_id = ?').all(pageId).map((row) => ({ ordered: !!row.ordered, items: JSON.parse(row.items) }));
    const images = db_1.default.prepare('SELECT src, alt FROM images WHERE page_id = ?').all(pageId);
    res.json({ identifier, headings, paragraphs, lists, images });
});
exports.default = router;
