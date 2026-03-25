import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDb } from './db/schema.js';
import mastersRouter from './routes/masters.js';
import servicesRouter from './routes/services.js';
import slotsRouter from './routes/slots.js';
import portfolioRouter from './routes/portfolio.js';
import analyticsRouter from './routes/analytics.js';
import adminsRouter from './routes/admins.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

initDb();

app.use('/api/masters', mastersRouter);
app.use('/api/services', servicesRouter);
app.use('/api/slots', slotsRouter);
app.use('/api/portfolio', portfolioRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/admins', adminsRouter);

app.get('/api/health', (_, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
