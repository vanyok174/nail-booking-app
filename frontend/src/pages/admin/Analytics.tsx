import { useState, useEffect } from 'react'
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns'
import { ru } from 'date-fns/locale'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { api } from '../../api/client'
import { Master, AnalyticsSummary, DailyAnalytics } from '../../api/types'

type PeriodPreset = '7d' | '30d' | 'month' | 'custom'

export default function Analytics() {
  const [masters, setMasters] = useState<Master[]>([])
  const [selectedMaster, setSelectedMaster] = useState<string>('')
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>('30d')
  const [startDate, setStartDate] = useState<string>(format(subDays(new Date(), 30), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'))
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null)
  const [dailyData, setDailyData] = useState<DailyAnalytics[]>([])

  useEffect(() => {
    loadMasters()
  }, [])

  useEffect(() => {
    if (startDate && endDate) {
      loadAnalytics()
    }
  }, [startDate, endDate, selectedMaster])

  useEffect(() => {
    const now = new Date()
    switch (periodPreset) {
      case '7d':
        setStartDate(format(subDays(now, 7), 'yyyy-MM-dd'))
        setEndDate(format(now, 'yyyy-MM-dd'))
        break
      case '30d':
        setStartDate(format(subDays(now, 30), 'yyyy-MM-dd'))
        setEndDate(format(now, 'yyyy-MM-dd'))
        break
      case 'month':
        setStartDate(format(startOfMonth(now), 'yyyy-MM-dd'))
        setEndDate(format(endOfMonth(now), 'yyyy-MM-dd'))
        break
    }
  }, [periodPreset])

  async function loadMasters() {
    const data = await api.get<Master[]>('/masters')
    setMasters(data)
  }

  async function loadAnalytics() {
    const masterFilter = selectedMaster ? `&master_id=${selectedMaster}` : ''
    
    const [summaryData, daily] = await Promise.all([
      api.get<AnalyticsSummary>(`/analytics/summary?start_date=${startDate}&end_date=${endDate}${masterFilter}`),
      api.get<DailyAnalytics[]>(`/analytics/daily?start_date=${startDate}&end_date=${endDate}${masterFilter}`)
    ])
    
    setSummary(summaryData)
    setDailyData(daily)
  }

  const chartData = dailyData.reduce((acc, item) => {
    const existing = acc.find(d => d.date === item.date)
    if (existing) {
      existing.booked += item.booked_count
      existing.completed += item.completed_count
      existing.cancelled += item.cancelled_count
      existing.revenue += item.revenue
    } else {
      acc.push({
        date: item.date,
        label: format(new Date(item.date), 'd MMM', { locale: ru }),
        booked: item.booked_count,
        completed: item.completed_count,
        cancelled: item.cancelled_count,
        revenue: item.revenue
      })
    }
    return acc
  }, [] as { date: string; label: string; booked: number; completed: number; cancelled: number; revenue: number }[])

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Аналитика</h2>

      {/* Filters */}
      <div className="space-y-3">
        <select
          value={selectedMaster}
          onChange={e => setSelectedMaster(e.target.value)}
          className="w-full p-3 bg-tg-secondary rounded-lg"
        >
          <option value="">Все мастера</option>
          {masters.map(m => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>

        <div className="flex gap-2">
          {(['7d', '30d', 'month', 'custom'] as PeriodPreset[]).map(preset => (
            <button
              key={preset}
              onClick={() => setPeriodPreset(preset)}
              className={`px-3 py-2 rounded-lg text-sm ${
                periodPreset === preset
                  ? 'bg-tg-button text-tg-button-text'
                  : 'bg-tg-secondary'
              }`}
            >
              {preset === '7d' && '7 дней'}
              {preset === '30d' && '30 дней'}
              {preset === 'month' && 'Месяц'}
              {preset === 'custom' && 'Свой'}
            </button>
          ))}
        </div>

        {periodPreset === 'custom' && (
          <div className="flex gap-2">
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="flex-1 p-3 bg-tg-secondary rounded-lg"
            />
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="flex-1 p-3 bg-tg-secondary rounded-lg"
            />
          </div>
        )}
      </div>

      {summary && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-tg-secondary rounded-xl p-4">
              <p className="text-sm text-tg-hint">Выполнено</p>
              <p className="text-2xl font-bold text-green-600">{summary.totals.completed_count}</p>
            </div>
            <div className="bg-tg-secondary rounded-xl p-4">
              <p className="text-sm text-tg-hint">Отменено</p>
              <p className="text-2xl font-bold text-red-500">{summary.totals.cancelled_count}</p>
            </div>
            <div className="bg-tg-secondary rounded-xl p-4">
              <p className="text-sm text-tg-hint">Забронировано</p>
              <p className="text-2xl font-bold text-blue-500">{summary.totals.booked_count}</p>
            </div>
            <div className="bg-tg-secondary rounded-xl p-4">
              <p className="text-sm text-tg-hint">Выручка</p>
              <p className="text-2xl font-bold">{summary.totals.total_revenue.toLocaleString()} ₽</p>
            </div>
          </div>

          {/* Chart */}
          {chartData.length > 0 && (
            <div className="bg-tg-secondary rounded-xl p-4">
              <h3 className="font-semibold mb-4">Записи по дням</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData}>
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="completed" stackId="a" fill="#22c55e" name="Выполнено" />
                  <Bar dataKey="booked" stackId="a" fill="#3b82f6" name="Забронировано" />
                  <Bar dataKey="cancelled" stackId="a" fill="#ef4444" name="Отменено" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* By Master */}
          {summary.by_master.length > 1 && (
            <div className="bg-tg-secondary rounded-xl p-4">
              <h3 className="font-semibold mb-4">По мастерам</h3>
              <div className="space-y-3">
                {summary.by_master.map(master => {
                  const total = master.completed_count + master.booked_count + master.cancelled_count
                  const occupancy = master.total_slots > 0 
                    ? Math.round((total / master.total_slots) * 100) 
                    : 0

                  return (
                    <div key={master.master_id} className="bg-tg-bg rounded-lg p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">{master.master_name}</span>
                        <span className="text-sm text-tg-hint">{occupancy}% загрузка</span>
                      </div>
                      <div className="flex gap-4 text-sm">
                        <span className="text-green-600">{master.completed_count} выполн.</span>
                        <span className="text-blue-500">{master.booked_count} забр.</span>
                        <span className="text-red-500">{master.cancelled_count} отм.</span>
                      </div>
                      <p className="text-sm mt-1">
                        Выручка: <span className="font-semibold">{master.total_revenue.toLocaleString()} ₽</span>
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
