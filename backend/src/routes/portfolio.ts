import { Router, Request } from 'express';
import { db } from '../db/schema.js';
import { v4 as uuid } from 'uuid';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '../../uploads/portfolio');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_, __, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuid()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

const router = Router();

router.get('/', (req, res) => {
  const { master_id } = req.query;
  
  if (master_id) {
    const photos = db.prepare('SELECT * FROM portfolio WHERE master_id = ? ORDER BY created_at DESC').all(master_id);
    return res.json(photos);
  }
  
  const photos = db.prepare('SELECT * FROM portfolio ORDER BY created_at DESC').all();
  res.json(photos);
});

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

router.post('/', upload.single('image'), (req: MulterRequest, res) => {
  const { master_id } = req.body;
  
  if (!master_id) {
    return res.status(400).json({ error: 'master_id is required' });
  }
  
  if (!req.file) {
    return res.status(400).json({ error: 'Image file is required' });
  }
  
  const id = uuid();
  const imagePath = `/uploads/portfolio/${req.file.filename}`;
  
  db.prepare(`
    INSERT INTO portfolio (id, master_id, image_path)
    VALUES (?, ?, ?)
  `).run(id, master_id, imagePath);
  
  const photo = db.prepare('SELECT * FROM portfolio WHERE id = ?').get(id);
  res.status(201).json(photo);
});

router.delete('/:id', (req, res) => {
  const photo = db.prepare('SELECT * FROM portfolio WHERE id = ?').get(req.params.id) as { image_path: string } | undefined;
  
  if (!photo) {
    return res.status(404).json({ error: 'Photo not found' });
  }
  
  const filePath = path.join(__dirname, '../..', photo.image_path);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
  
  db.prepare('DELETE FROM portfolio WHERE id = ?').run(req.params.id);
  res.status(204).send();
});

export default router;
