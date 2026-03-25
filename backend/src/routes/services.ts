import { Router } from 'express';
import { db } from '../db/schema.js';
import { v4 as uuid } from 'uuid';

const router = Router();

router.get('/', (req, res) => {
  const { master_id } = req.query;
  
  if (master_id) {
    const services = db.prepare('SELECT * FROM services WHERE master_id = ?').all(master_id);
    return res.json(services);
  }
  
  const services = db.prepare('SELECT * FROM services').all();
  res.json(services);
});

router.get('/:id', (req, res) => {
  const service = db.prepare('SELECT * FROM services WHERE id = ?').get(req.params.id);
  if (!service) {
    return res.status(404).json({ error: 'Service not found' });
  }
  res.json(service);
});

router.post('/', (req, res) => {
  const { master_id, name, price, duration_minutes } = req.body;
  
  if (!master_id || !name || price === undefined) {
    return res.status(400).json({ error: 'master_id, name, and price are required' });
  }
  
  const id = uuid();
  
  db.prepare(`
    INSERT INTO services (id, master_id, name, price, duration_minutes)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, master_id, name, price, duration_minutes || 60);
  
  const service = db.prepare('SELECT * FROM services WHERE id = ?').get(id);
  res.status(201).json(service);
});

router.put('/:id', (req, res) => {
  const { name, price, duration_minutes } = req.body;
  
  const result = db.prepare(`
    UPDATE services 
    SET name = ?, price = ?, duration_minutes = ?
    WHERE id = ?
  `).run(name, price, duration_minutes || 60, req.params.id);
  
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Service not found' });
  }
  
  const service = db.prepare('SELECT * FROM services WHERE id = ?').get(req.params.id);
  res.json(service);
});

router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM services WHERE id = ?').run(req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Service not found' });
  }
  res.status(204).send();
});

export default router;
