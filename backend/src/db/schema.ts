import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '../../data/nail_booking.db');

export const db = new Database(dbPath);

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS masters (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      photo TEXT,
      description TEXT,
      experience_years INTEGER DEFAULT 0,
      works_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS services (
      id TEXT PRIMARY KEY,
      master_id TEXT NOT NULL,
      name TEXT NOT NULL,
      price INTEGER NOT NULL,
      duration_minutes INTEGER DEFAULT 60,
      FOREIGN KEY (master_id) REFERENCES masters(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS slots (
      id TEXT PRIMARY KEY,
      master_id TEXT NOT NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      status TEXT DEFAULT 'free' CHECK(status IN ('free', 'booked', 'cancelled', 'completed')),
      client_telegram_id TEXT,
      client_name TEXT,
      service_id TEXT,
      price_at_booking INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (master_id) REFERENCES masters(id) ON DELETE CASCADE,
      FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS portfolio (
      id TEXT PRIMARY KEY,
      master_id TEXT NOT NULL,
      image_path TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (master_id) REFERENCES masters(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS admins (
      telegram_id TEXT PRIMARY KEY
    );

    CREATE INDEX IF NOT EXISTS idx_slots_master_date ON slots(master_id, date);
    CREATE INDEX IF NOT EXISTS idx_slots_status ON slots(status);
    CREATE INDEX IF NOT EXISTS idx_services_master ON services(master_id);
  `);

  console.log('Database initialized');
}
