import request from 'supertest';
import express from 'express';
import entityRouter from '../src/routes/entity';
import db from '../src/db';
import { initSchema } from '../src/db';

const app = express();
app.use('/entity', entityRouter);

beforeAll(() => {
  db.exec('DROP TABLE IF EXISTS pages; DROP TABLE IF EXISTS headings; DROP TABLE IF EXISTS paragraphs; DROP TABLE IF EXISTS lists; DROP TABLE IF EXISTS images;');
  initSchema();

  // Insert a heading entity
  const pageId = db.prepare('INSERT INTO pages (url, identifier) VALUES (?, ?)').run('url', 'page').lastInsertRowid as number;
  const info = db.prepare('INSERT INTO headings (page_id, level, text) VALUES (?, ?, ?)').run(pageId, 2, 'Test Heading');
  db.prepare('INSERT INTO paragraphs (page_id, text) VALUES (?, ?)').run(pageId, 'Para');
  // store ids for later use
  (global as any).headingId = info.lastInsertRowid;
});

describe('GET /entity/:id', () => {
  it('should return heading entity', async () => {
    const res = await request(app).get(`/entity/${(global as any).headingId}`);
    expect(res.status).toBe(200);
    expect(res.body.type).toBe('heading');
    expect(res.body.level).toBe(2);
    expect(res.body.text).toBe('Test Heading');
  });

  it('should return 404 for non‑existent id', async () => {
    const res = await request(app).get('/entity/99999');
    expect(res.status).toBe(404);
  });
});
