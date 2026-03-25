import { Router } from 'express';
import { db } from '../db/schema.js';

const router = Router();

router.get('/', (_, res) => {
  const admins = db.prepare('SELECT telegram_id FROM admins').all();
  res.json(admins);
});

router.get('/check/:telegramId', (req, res) => {
  const admin = db.prepare('SELECT telegram_id FROM admins WHERE telegram_id = ?').get(req.params.telegramId);
  res.json({ isAdmin: !!admin });
});

router.post('/', (req, res) => {
  const { telegram_id } = req.body;
  
  if (!telegram_id) {
    return res.status(400).json({ error: 'telegram_id is required' });
  }
  
  try {
    db.prepare('INSERT INTO admins (telegram_id) VALUES (?)').run(String(telegram_id));
    res.status(201).json({ telegram_id });
  } catch {
    res.status(409).json({ error: 'Admin already exists' });
  }
});

router.delete('/:telegramId', (req, res) => {
  const result = db.prepare('DELETE FROM admins WHERE telegram_id = ?').run(req.params.telegramId);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Admin not found' });
  }
  res.status(204).send();
});

export default router;
