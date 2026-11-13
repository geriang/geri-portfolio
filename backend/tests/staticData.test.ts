import request from 'supertest';
import express from 'express';
import staticDataRouter from '../src/routes/staticData';
import entityRouter from '../src/routes/entity';
import db from '../src/db';
import { initSchema } from '../src/db';

// Set up a test app
const app = express();
app.use('/static-data', staticDataRouter);
app.use('/entity', entityRouter);

beforeAll(() => {
  // Ensure clean DB for tests
  db.exec('DROP TABLE IF EXISTS pages; DROP TABLE IF EXISTS headings; DROP TABLE IF EXISTS paragraphs; DROP TABLE IF EXISTS lists; DROP TABLE IF EXISTS images;');
  // Reinitialize schema
  initSchema();

  // Insert a sample page with known data
  const pageId = db.prepare('INSERT INTO pages (url, identifier) VALUES (?, ?)').run('http://example.com', 'sample').lastInsertRowid as number;
  db.prepare('INSERT INTO headings (page_id, level, text) VALUES (?, ?, ?)').run(pageId, 1, 'Sample Heading');
  db.prepare('INSERT INTO paragraphs (page_id, text) VALUES (?, ?)').run(pageId, 'Sample paragraph.');
});

describe('GET /static-data/:page', () => {
  it('should return JSON with content for existing page', async () => {
    const res = await request(app).get('/static-data/sample');
    expect(res.status).toBe(200);
    expect(res.body.identifier).toBe('sample');
    expect(res.body.headings).toEqual([{ level: 1, text: 'Sample Heading' }]);
    expect(res.body.paragraphs).toEqual([{ text: 'Sample paragraph.' }]);
  });

  it('should return 404 for unknown page', async () => {
    const res = await request(app).get('/static-data/unknown');
    expect(res.status).toBe(404);
  });
});
