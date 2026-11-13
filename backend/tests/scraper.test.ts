import db, { initSchema } from '../src/db';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

beforeAll(() => {
  // Clean DB
  db.exec('DROP TABLE IF EXISTS pages; DROP TABLE IF EXISTS headings; DROP TABLE IF EXISTS paragraphs; DROP TABLE IF EXISTS lists; DROP TABLE IF EXISTS images;');
  initSchema();
});

test('scraper inserts heading and paragraph', async () => {
  const html = `<h1>Test Heading</h1><p>Test paragraph.</p>`;
  // Mock all axios.get calls to return the same HTML
  mockedAxios.get.mockResolvedValue({ data: html } as any);

  // Import scraper after mocking is set up
  await import('../src/scraper');

  // Give the async scraper time to finish (it runs for 5 pages)
  await new Promise((r) => setTimeout(r, 200));

  const heading = db.prepare('SELECT * FROM headings WHERE text = ?').get('Test Heading');
  const paragraph = db.prepare('SELECT * FROM paragraphs WHERE text = ?').get('Test paragraph.');
  expect(heading).toBeDefined();
  expect(paragraph).toBeDefined();
});
