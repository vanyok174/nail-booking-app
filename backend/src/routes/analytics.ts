import { Router } from 'express';
import { db } from '../db/schema.js';

const router = Router();

interface MasterStats {
  master_id: string;
  master_name: string;
  total_slots: number;
  booked_count: number;
  completed_count: number;
  cancelled_count: number;
  total_revenue: number;
}

interface DailyStats {
  date: string;
  master_id: string;
  master_name: string;
  total_slots: number;
  booked_count: number;
  completed_count: number;
  cancelled_count: number;
  revenue: number;
}

router.get('/summary', (req, res) => {
  const { start_date, end_date, master_id } = req.query;
  
  if (!start_date || !end_date) {
    return res.status(400).json({ error: 'start_date and end_date are required' });
  }
  
  let masterFilter = '';
  const params: string[] = [start_date as string, end_date as string];
  
  if (master_id) {
    masterFilter = ' AND s.master_id = ?';
    params.push(master_id as string);
  }
  
  const stats = db.prepare(`
    SELECT 
      m.id as master_id,
      m.name as master_name,
      COUNT(s.id) as total_slots,
      SUM(CASE WHEN s.status = 'booked' THEN 1 ELSE 0 END) as booked_count,
      SUM(CASE WHEN s.status = 'completed' THEN 1 ELSE 0 END) as completed_count,
      SUM(CASE WHEN s.status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_count,
      COALESCE(SUM(CASE WHEN s.status = 'completed' THEN s.price_at_booking ELSE 0 END), 0) as total_revenue
    FROM masters m
    LEFT JOIN slots s ON m.id = s.master_id AND s.date BETWEEN ? AND ?${masterFilter}
    GROUP BY m.id, m.name
  `).all(...params) as MasterStats[];
  
  const totals = {
    total_slots: 0,
    booked_count: 0,
    completed_count: 0,
    cancelled_count: 0,
    total_revenue: 0
  };
  
  for (const stat of stats) {
    totals.total_slots += stat.total_slots || 0;
    totals.booked_count += stat.booked_count || 0;
    totals.completed_count += stat.completed_count || 0;
    totals.cancelled_count += stat.cancelled_count || 0;
    totals.total_revenue += stat.total_revenue || 0;
  }
  
  res.json({
    period: { start_date, end_date },
    by_master: stats,
    totals
  });
});

router.get('/daily', (req, res) => {
  const { start_date, end_date, master_id } = req.query;
  
  if (!start_date || !end_date) {
    return res.status(400).json({ error: 'start_date and end_date are required' });
  }
  
  let masterFilter = '';
  const params: string[] = [start_date as string, end_date as string];
  
  if (master_id) {
    masterFilter = ' AND s.master_id = ?';
    params.push(master_id as string);
  }
  
  const daily = db.prepare(`
    SELECT 
      s.date,
      m.id as master_id,
      m.name as master_name,
      COUNT(s.id) as total_slots,
      SUM(CASE WHEN s.status = 'booked' THEN 1 ELSE 0 END) as booked_count,
      SUM(CASE WHEN s.status = 'completed' THEN 1 ELSE 0 END) as completed_count,
      SUM(CASE WHEN s.status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_count,
      COALESCE(SUM(CASE WHEN s.status = 'completed' THEN s.price_at_booking ELSE 0 END), 0) as revenue
    FROM slots s
    JOIN masters m ON s.master_id = m.id
    WHERE s.date BETWEEN ? AND ?${masterFilter}
    GROUP BY s.date, m.id, m.name
    ORDER BY s.date
  `).all(...params) as DailyStats[];
  
  res.json(daily);
});

router.get('/workload', (req, res) => {
  const { start_date, end_date } = req.query;
  
  if (!start_date || !end_date) {
    return res.status(400).json({ error: 'start_date and end_date are required' });
  }
  
  const workload = db.prepare(`
    SELECT 
      m.id as master_id,
      m.name as master_name,
      s.date,
      COUNT(s.id) as total_slots,
      SUM(CASE WHEN s.status != 'free' THEN 1 ELSE 0 END) as occupied_slots,
      ROUND(CAST(SUM(CASE WHEN s.status != 'free' THEN 1 ELSE 0 END) AS FLOAT) / COUNT(s.id) * 100, 1) as occupancy_rate
    FROM masters m
    LEFT JOIN slots s ON m.id = s.master_id AND s.date BETWEEN ? AND ?
    WHERE s.id IS NOT NULL
    GROUP BY m.id, m.name, s.date
    ORDER BY s.date, m.name
  `).all(start_date, end_date);
  
  res.json(workload);
});

export default router;
