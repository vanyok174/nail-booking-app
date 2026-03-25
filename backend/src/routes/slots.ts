import { Router } from 'express';
import { db } from '../db/schema.js';
import { v4 as uuid } from 'uuid';

const router = Router();

interface Slot {
  id: string;
  master_id: string;
  date: string;
  time: string;
  status: string;
  client_telegram_id: string | null;
  client_name: string | null;
  service_id: string | null;
  price_at_booking: number | null;
}

router.get('/', (req, res) => {
  const { master_id, date, status } = req.query;
  
  let query = 'SELECT * FROM slots WHERE 1=1';
  const params: (string | undefined)[] = [];
  
  if (master_id) {
    query += ' AND master_id = ?';
    params.push(master_id as string);
  }
  if (date) {
    query += ' AND date = ?';
    params.push(date as string);
  }
  if (status) {
    query += ' AND status = ?';
    params.push(status as string);
  }
  
  query += ' ORDER BY date, time';
  
  const slots = db.prepare(query).all(...params);
  res.json(slots);
});

router.post('/', (req, res) => {
  const { master_id, date, time } = req.body;
  
  if (!master_id || !date || !time) {
    return res.status(400).json({ error: 'master_id, date, and time are required' });
  }
  
  const existing = db.prepare(
    'SELECT id FROM slots WHERE master_id = ? AND date = ? AND time = ?'
  ).get(master_id, date, time);
  
  if (existing) {
    return res.status(409).json({ error: 'Slot already exists' });
  }
  
  const id = uuid();
  
  db.prepare(`
    INSERT INTO slots (id, master_id, date, time, status)
    VALUES (?, ?, ?, ?, 'free')
  `).run(id, master_id, date, time);
  
  const slot = db.prepare('SELECT * FROM slots WHERE id = ?').get(id);
  res.status(201).json(slot);
});

router.post('/bulk', (req, res) => {
  const { master_id, date, times } = req.body;
  
  if (!master_id || !date || !Array.isArray(times)) {
    return res.status(400).json({ error: 'master_id, date, and times array are required' });
  }
  
  const insert = db.prepare(`
    INSERT OR IGNORE INTO slots (id, master_id, date, time, status)
    VALUES (?, ?, ?, ?, 'free')
  `);
  
  const created: Slot[] = [];
  
  for (const time of times) {
    const existing = db.prepare(
      'SELECT id FROM slots WHERE master_id = ? AND date = ? AND time = ?'
    ).get(master_id, date, time);
    
    if (!existing) {
      const id = uuid();
      insert.run(id, master_id, date, time);
      const slot = db.prepare('SELECT * FROM slots WHERE id = ?').get(id) as Slot;
      created.push(slot);
    }
  }
  
  res.status(201).json(created);
});

router.put('/:id/book', (req, res) => {
  const { client_telegram_id, client_name, service_id } = req.body;
  
  const slot = db.prepare('SELECT * FROM slots WHERE id = ?').get(req.params.id) as Slot | undefined;
  
  if (!slot) {
    return res.status(404).json({ error: 'Slot not found' });
  }
  
  if (slot.status !== 'free') {
    return res.status(409).json({ error: 'Slot is not available' });
  }
  
  let price = null;
  if (service_id) {
    const service = db.prepare('SELECT price FROM services WHERE id = ?').get(service_id) as { price: number } | undefined;
    price = service?.price || null;
  }
  
  db.prepare(`
    UPDATE slots 
    SET status = 'booked', client_telegram_id = ?, client_name = ?, service_id = ?, price_at_booking = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(client_telegram_id, client_name, service_id, price, req.params.id);
  
  const updated = db.prepare('SELECT * FROM slots WHERE id = ?').get(req.params.id);
  res.json(updated);
});

router.put('/:id/cancel', (req, res) => {
  const slot = db.prepare('SELECT * FROM slots WHERE id = ?').get(req.params.id) as Slot | undefined;
  
  if (!slot) {
    return res.status(404).json({ error: 'Slot not found' });
  }
  
  db.prepare(`
    UPDATE slots SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).run(req.params.id);
  
  const updated = db.prepare('SELECT * FROM slots WHERE id = ?').get(req.params.id);
  res.json(updated);
});

router.put('/:id/complete', (req, res) => {
  const slot = db.prepare('SELECT * FROM slots WHERE id = ?').get(req.params.id) as Slot | undefined;
  
  if (!slot) {
    return res.status(404).json({ error: 'Slot not found' });
  }
  
  db.prepare(`
    UPDATE slots SET status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).run(req.params.id);
  
  const updated = db.prepare('SELECT * FROM slots WHERE id = ?').get(req.params.id);
  res.json(updated);
});

router.put('/:id/free', (req, res) => {
  const slot = db.prepare('SELECT * FROM slots WHERE id = ?').get(req.params.id) as Slot | undefined;
  
  if (!slot) {
    return res.status(404).json({ error: 'Slot not found' });
  }
  
  db.prepare(`
    UPDATE slots 
    SET status = 'free', client_telegram_id = NULL, client_name = NULL, service_id = NULL, price_at_booking = NULL, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(req.params.id);
  
  const updated = db.prepare('SELECT * FROM slots WHERE id = ?').get(req.params.id);
  res.json(updated);
});

router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM slots WHERE id = ?').run(req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Slot not found' });
  }
  res.status(204).send();
});

export default router;
