"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importDefault(require("../db"));
const router = (0, express_1.Router)();
router.get('/:id', (req, res) => {
    const id = parseInt(req.params.id, 10);
    // Try each table
    const heading = db_1.default.prepare('SELECT level, text FROM headings WHERE id = ?').get(id);
    if (heading) {
        return res.json({ type: 'heading', ...heading });
    }
    const paragraph = db_1.default.prepare('SELECT text FROM paragraphs WHERE id = ?').get(id);
    if (paragraph) {
        return res.json({ type: 'paragraph', ...paragraph });
    }
    const list = db_1.default.prepare('SELECT ordered, items FROM lists WHERE id = ?').get(id);
    if (list) {
        return res.json({ type: 'list', ordered: !!list.ordered, items: JSON.parse(list.items) });
    }
    const image = db_1.default.prepare('SELECT src, alt FROM images WHERE id = ?').get(id);
    if (image) {
        return res.json({ type: 'image', ...image });
    }
    res.status(404).json({ error: 'Entity not found' });
});
exports.default = router;
