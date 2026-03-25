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
    <div className="space-y-6 animate-fade-in">
      <h2 className="section-title">Аналитика</h2>

      {/* Filters */}
      <div className="space-y-3">
        <div className="card p-4">
          <label className="text-sm text-stone-500 mb-2 block">Мастер</label>
          <select
            value={selectedMaster}
            onChange={e => setSelectedMaster(e.target.value)}
            className="input"
          >
            <option value="">Все мастера</option>
            {masters.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          {(['7d', '30d', 'month', 'custom'] as PeriodPreset[]).map(preset => (
            <button
              key={preset}
              onClick={() => setPeriodPreset(preset)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                periodPreset === preset
                  ? 'bg-gradient-to-r from-rose-400 to-rose-300 text-white shadow-lg shadow-rose-200'
                  : 'bg-white border border-stone-100 text-stone-600'
              }`}
            >
              {preset === '7d' && '7 дней'}
              {preset === '30d' && '30 дней'}
              {preset === 'month' && 'Месяц'}
              {preset === 'custom' && 'Период'}
            </button>
          ))}
        </div>

        {periodPreset === 'custom' && (
          <div className="flex gap-2">
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="input flex-1"
            />
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="input flex-1"
            />
          </div>
        )}
      </div>

      {summary && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <span className="text-emerald-500">✓</span>
                </div>
                <span className="text-sm text-stone-500">Выполнено</span>
              </div>
              <p className="text-3xl font-bold text-stone-800">{summary.totals.completed_count}</p>
            </div>
            
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                  <span className="text-red-400">✕</span>
                </div>
                <span className="text-sm text-stone-500">Отменено</span>
              </div>
              <p className="text-3xl font-bold text-stone-800">{summary.totals.cancelled_count}</p>
            </div>
            
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center">
                  <span className="text-sky-500">📅</span>
                </div>
                <span className="text-sm text-stone-500">Активные</span>
              </div>
              <p className="text-3xl font-bold text-stone-800">{summary.totals.booked_count}</p>
            </div>
            
            <div className="card p-4 bg-gradient-to-br from-rose-50 to-amber-50 border-rose-100">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
                  <span>💰</span>
                </div>
                <span className="text-sm text-stone-500">Выручка</span>
              </div>
              <p className="text-2xl font-bold gradient-text">{summary.totals.total_revenue.toLocaleString()} ₽</p>
            </div>
          </div>

          {/* Chart */}
          {chartData.length > 0 && (
            <div className="card p-4">
              <h3 className="font-semibold text-stone-800 mb-4">Записи по дням</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData}>
                  <XAxis 
                    dataKey="label" 
                    tick={{ fontSize: 10, fill: '#78716c' }} 
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 10, fill: '#78716c' }} 
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '12px', 
                      border: '1px solid #f5f5f4',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                  />
                  <Bar dataKey="completed" stackId="a" fill="#86efac" radius={[0, 0, 0, 0]} name="Выполнено" />
                  <Bar dataKey="booked" stackId="a" fill="#93c5fd" radius={[0, 0, 0, 0]} name="Забронировано" />
                  <Bar dataKey="cancelled" stackId="a" fill="#fda4af" radius={[4, 4, 0, 0]} name="Отменено" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* By Master */}
          {summary.by_master.length > 0 && (
            <div className="card p-4">
              <h3 className="font-semibold text-stone-800 mb-4">По мастерам</h3>
              <div className="space-y-3">
                {summary.by_master.map(master => {
                  const total = master.completed_count + master.booked_count + master.cancelled_count
                  const occupancy = master.total_slots > 0 
                    ? Math.round((total / master.total_slots) * 100) 
                    : 0

                  return (
                    <div key={master.master_id} className="card-flat p-4">
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-100 to-amber-100 flex items-center justify-center">
                            👩‍🎨
                          </div>
                          <span className="font-medium text-stone-800">{master.master_name}</span>
                        </div>
                        <span className="chip chip-rose text-xs">{occupancy}%</span>
                      </div>
                      
                      <div className="flex gap-4 text-sm mb-3">
                        <span className="text-emerald-600">✓ {master.completed_count}</span>
                        <span className="text-sky-500">📅 {master.booked_count}</span>
                        <span className="text-red-400">✕ {master.cancelled_count}</span>
                      </div>
                      
                      <div className="flex justify-between items-center pt-3 border-t border-stone-100">
                        <span className="text-sm text-stone-500">Выручка</span>
                        <span className="font-bold gradient-text">{master.total_revenue.toLocaleString()} ₽</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}

      {!summary && (
        <div className="card p-8 text-center">
          <p className="text-stone-500">Нет данных за выбранный период</p>
        </div>
      )}
    </div>
  )
}
