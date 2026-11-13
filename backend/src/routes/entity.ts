import { Router, Request, Response } from 'express';
import db from '../db';

const router = Router();

router.get('/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string, 10);
  // Try each table
  const heading = db.prepare('SELECT level, text FROM headings WHERE id = ?').get(id);
  if (heading) {
    return res.json({ type: 'heading', ...heading });
  }
  const paragraph = db.prepare('SELECT text FROM paragraphs WHERE id = ?').get(id);
  if (paragraph) {
    return res.json({ type: 'paragraph', ...paragraph });
  }
  const list = db.prepare('SELECT ordered, items FROM lists WHERE id = ?').get(id) as any;
  if (list) {
    return res.json({ type: 'list', ordered: !!list.ordered, items: JSON.parse(list.items) });
  }
  const image = db.prepare('SELECT src, alt FROM images WHERE id = ?').get(id);
  if (image) {
    return res.json({ type: 'image', ...image });
  }
  res.status(404).json({ error: 'Entity not found' });
});

export default router;
