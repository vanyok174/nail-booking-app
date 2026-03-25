import { Router } from 'express';
import { db } from '../db/schema.js';
import { v4 as uuid } from 'uuid';

const router = Router();

router.get('/', (_, res) => {
  const masters = db.prepare('SELECT * FROM masters ORDER BY created_at DESC').all();
  res.json(masters);
});

router.get('/:id', (req, res) => {
  const master = db.prepare('SELECT * FROM masters WHERE id = ?').get(req.params.id);
  if (!master) {
    return res.status(404).json({ error: 'Master not found' });
  }
  res.json(master);
});

router.post('/', (req, res) => {
  const { name, photo, description, experience_years, works_count } = req.body;
  const id = uuid();
  
  db.prepare(`
    INSERT INTO masters (id, name, photo, description, experience_years, works_count)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, name, photo || null, description || null, experience_years || 0, works_count || 0);
  
  const master = db.prepare('SELECT * FROM masters WHERE id = ?').get(id);
  res.status(201).json(master);
});

router.put('/:id', (req, res) => {
  const { name, photo, description, experience_years, works_count } = req.body;
  
  const result = db.prepare(`
    UPDATE masters 
    SET name = ?, photo = ?, description = ?, experience_years = ?, works_count = ?
    WHERE id = ?
  `).run(name, photo || null, description || null, experience_years || 0, works_count || 0, req.params.id);
  
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Master not found' });
  }
  
  const master = db.prepare('SELECT * FROM masters WHERE id = ?').get(req.params.id);
  res.json(master);
});

router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM masters WHERE id = ?').run(req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Master not found' });
  }
  res.status(204).send();
});

export default router;
