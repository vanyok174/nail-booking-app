export interface Master {
  id: string
  name: string
  photo: string | null
  description: string | null
  experience_years: number
  works_count: number
  created_at: string
}

export interface Service {
  id: string
  master_id: string
  name: string
  price: number
  duration_minutes: number
}

export interface Slot {
  id: string
  master_id: string
  date: string
  time: string
  status: 'free' | 'booked' | 'cancelled' | 'completed'
  client_telegram_id: string | null
  client_name: string | null
  service_id: string | null
  price_at_booking: number | null
  created_at: string
  updated_at: string
}

export interface PortfolioPhoto {
  id: string
  master_id: string
  image_path: string
  created_at: string
}

export interface AnalyticsSummary {
  period: {
    start_date: string
    end_date: string
  }
  by_master: {
    master_id: string
    master_name: string
    total_slots: number
    booked_count: number
    completed_count: number
    cancelled_count: number
    total_revenue: number
  }[]
  totals: {
    total_slots: number
    booked_count: number
    completed_count: number
    cancelled_count: number
    total_revenue: number
  }
}

export interface DailyAnalytics {
  date: string
  master_id: string
  master_name: string
  total_slots: number
  booked_count: number
  completed_count: number
  cancelled_count: number
  revenue: number
}
