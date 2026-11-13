"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const cheerio_1 = __importDefault(require("cheerio"));
const db_1 = __importDefault(require("./db"));
// Define the pages to scrape. Identifier is a slug used in API.
const pages = [
    { url: 'https://example.com/page1', identifier: 'page1' },
    { url: 'https://example.com/page2', identifier: 'page2' },
    { url: 'https://example.com/page3', identifier: 'page3' },
    { url: 'https://example.com/page4', identifier: 'page4' },
    { url: 'https://example.com/page5', identifier: 'page5' },
];
function insertPage(url, identifier) {
    const stmt = db_1.default.prepare('INSERT OR IGNORE INTO pages (url, identifier) VALUES (?, ?)');
    const info = stmt.run(url, identifier);
    // If row already existed, fetch its id
    if (info.changes === 0) {
        const row = db_1.default.prepare('SELECT id FROM pages WHERE identifier = ?').get(identifier);
        return row.id;
    }
    return info.lastInsertRowid;
}
function insertHeading(pageId, level, text) {
    db_1.default.prepare('INSERT INTO headings (page_id, level, text) VALUES (?, ?, ?)').run(pageId, level, text);
}
function insertParagraph(pageId, text) {
    db_1.default.prepare('INSERT INTO paragraphs (page_id, text) VALUES (?, ?)').run(pageId, text);
}
function insertList(pageId, ordered, items) {
    db_1.default.prepare('INSERT INTO lists (page_id, ordered, items) VALUES (?, ?, ?)')
        .run(pageId, ordered ? 1 : 0, JSON.stringify(items));
}
function insertImage(pageId, src, alt) {
    db_1.default.prepare('INSERT INTO images (page_id, src, alt) VALUES (?, ?, ?)').run(pageId, src, alt);
}
async function scrapePage(page) {
    const response = await axios_1.default.get(page.url);
    const $ = cheerio_1.default.load(response.data);
    const pageId = insertPage(page.url, page.identifier);
    // Headings h1-h6
    for (let level = 1; level <= 6; level++) {
        $(`h${level}`).each((_, el) => {
            const text = $(el).text().trim();
            if (text)
                insertHeading(pageId, level, text);
        });
    }
    // Paragraphs
    $('p').each((_, el) => {
        const text = $(el).text().trim();
        if (text)
            insertParagraph(pageId, text);
    });
    // Ordered lists
    $('ol').each((_, el) => {
        const items = [];
        $(el).find('li').each((_, li) => {
            const txt = $(li).text().trim();
            if (txt)
                items.push(txt);
        });
        if (items.length)
            insertList(pageId, true, items);
    });
    // Unordered lists
    $('ul').each((_, el) => {
        const items = [];
        $(el).find('li').each((_, li) => {
            const txt = $(li).text().trim();
            if (txt)
                items.push(txt);
        });
        if (items.length)
            insertList(pageId, false, items);
    });
    // Images
    $('img').each((_, el) => {
        const src = $(el).attr('src') || '';
        const alt = $(el).attr('alt') || '';
        if (src)
            insertImage(pageId, src, alt);
    });
}
async function runScraper() {
    for (const page of pages) {
        try {
            await scrapePage(page);
            console.log(`Scraped ${page.identifier}`);
        }
        catch (err) {
            console.error(`Failed to scrape ${page.url}:`, err);
        }
    }
    console.log('Scraping completed');
}
runScraper();
