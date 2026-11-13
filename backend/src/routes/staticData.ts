import { Router, Request, Response } from 'express';
import db from '../db';

const router = Router();

router.get('/:page', (req: Request, res: Response) => {
  const identifier = req.params.page;
  const pageRow = db.prepare('SELECT id FROM pages WHERE identifier = ?').get(identifier) as any;
  if (!pageRow) {
    return res.status(404).json({ error: 'Page not found' });
  }
  const pageId = pageRow.id;
  const headings = db.prepare('SELECT level, text FROM headings WHERE page_id = ?').all(pageId);
  const paragraphs = db.prepare('SELECT text FROM paragraphs WHERE page_id = ?').all(pageId);
  const lists = db.prepare('SELECT ordered, items FROM lists WHERE page_id = ?').all(pageId).map((row: any) => ({ ordered: !!row.ordered, items: JSON.parse(row.items) }));
  const images = db.prepare('SELECT src, alt FROM images WHERE page_id = ?').all(pageId);
  res.json({ identifier, headings, paragraphs, lists, images });
});

export default router;
