import { useState, useEffect } from 'react'
import { format, addDays, startOfDay } from 'date-fns'
import { ru } from 'date-fns/locale'
import { api } from '../../api/client'
import { Master, Slot, Service } from '../../api/types'

const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00'
]

export default function AdminSlots() {
  const [masters, setMasters] = useState<Master[]>([])
  const [selectedMaster, setSelectedMaster] = useState<string>('')
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'))
  const [slots, setSlots] = useState<Slot[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadMasters()
  }, [])

  useEffect(() => {
    if (selectedMaster) {
      loadSlots()
      loadServices()
    }
  }, [selectedMaster, selectedDate])

  async function loadMasters() {
    const data = await api.get<Master[]>('/masters')
    setMasters(data)
    if (data.length > 0) {
      setSelectedMaster(data[0].id)
    }
  }

  async function loadSlots() {
    const data = await api.get<Slot[]>(`/slots?master_id=${selectedMaster}&date=${selectedDate}`)
    setSlots(data)
  }

  async function loadServices() {
    const data = await api.get<Service[]>(`/services?master_id=${selectedMaster}`)
    setServices(data)
  }

  async function createSlot(time: string) {
    setLoading(true)
    try {
      await api.post('/slots', {
        master_id: selectedMaster,
        date: selectedDate,
        time
      })
      loadSlots()
    } finally {
      setLoading(false)
    }
  }

  async function createAllSlots() {
    setLoading(true)
    try {
      await api.post('/slots/bulk', {
        master_id: selectedMaster,
        date: selectedDate,
        times: TIME_SLOTS
      })
      loadSlots()
    } finally {
      setLoading(false)
    }
  }

  async function freeSlot(slotId: string) {
    await api.put(`/slots/${slotId}/free`)
    loadSlots()
  }

  async function cancelSlot(slotId: string) {
    await api.put(`/slots/${slotId}/cancel`)
    loadSlots()
  }

  async function completeSlot(slotId: string) {
    await api.put(`/slots/${slotId}/complete`)
    loadSlots()
  }

  async function deleteSlot(slotId: string) {
    await api.delete(`/slots/${slotId}`)
    loadSlots()
  }

  const existingSlots = new Map(slots.map(s => [s.time, s]))

  const dateOptions = Array.from({ length: 21 }, (_, i) => {
    const date = addDays(startOfDay(new Date()), i - 7)
    return {
      value: format(date, 'yyyy-MM-dd'),
      label: format(date, 'd', { locale: ru }),
      dayName: format(date, 'EEE', { locale: ru }),
      isToday: i === 7
    }
  })

  function getStatusStyle(status: string) {
    switch (status) {
      case 'free': return 'chip-green'
      case 'booked': return 'chip-blue'
      case 'completed': return 'chip-gray'
      case 'cancelled': return 'chip-rose'
      default: return 'chip-gray'
    }
  }

  function getStatusLabel(status: string) {
    switch (status) {
      case 'free': return 'Свободно'
      case 'booked': return 'Забронировано'
      case 'completed': return 'Выполнено'
      case 'cancelled': return 'Отменено'
      default: return status
    }
  }

  function getServiceName(serviceId: string | null) {
    if (!serviceId) return '—'
    const service = services.find(s => s.id === serviceId)
    return service?.name || '—'
  }

  const currentMaster = masters.find(m => m.id === selectedMaster)

  return (
    <div className="space-y-4 animate-fade-in">
      <h2 className="section-title">Управление слотами</h2>

      {/* Master Select */}
      <div className="card p-4">
        <label className="text-sm text-stone-500 mb-2 block">Мастер</label>
        <select
          value={selectedMaster}
          onChange={e => setSelectedMaster(e.target.value)}
          className="input"
        >
          <option value="">Выберите мастера</option>
          {masters.map(m => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      </div>

      {/* Date Selector */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 -mx-1 px-1">
        {dateOptions.map(opt => (
          <button
            key={opt.value}
            onClick={() => setSelectedDate(opt.value)}
            className={`flex-shrink-0 w-12 py-2 rounded-xl text-center transition-all ${
              selectedDate === opt.value
                ? 'bg-gradient-to-br from-rose-400 to-rose-300 text-white shadow-lg shadow-rose-200'
                : opt.isToday 
                  ? 'card border-rose-200' 
                  : 'bg-white border border-stone-100'
            }`}
          >
            <p className={`text-xs uppercase ${selectedDate === opt.value ? 'text-white/80' : 'text-stone-400'}`}>
              {opt.dayName}
            </p>
            <p className={`text-lg font-bold ${selectedDate === opt.value ? '' : 'text-stone-800'}`}>
              {opt.label}
            </p>
          </button>
        ))}
      </div>

      {selectedMaster && (
        <>
          <div className="flex justify-between items-center">
            <p className="text-sm text-stone-600">
              {format(new Date(selectedDate), 'd MMMM, EEEE', { locale: ru })}
            </p>
            <button
              onClick={createAllSlots}
              disabled={loading}
              className="btn-ghost text-sm"
            >
              + Все слоты
            </button>
          </div>

          <div className="space-y-2">
            {TIME_SLOTS.map(time => {
              const slot = existingSlots.get(time)

              if (!slot) {
                return (
                  <div key={time} className="card p-3 flex items-center gap-3">
                    <span className="w-14 font-mono text-stone-400">{time}</span>
                    <span className="flex-1 text-stone-300 text-sm">Не создан</span>
                    <button
                      onClick={() => createSlot(time)}
                      className="btn-ghost text-sm py-1"
                    >
                      + Создать
                    </button>
                  </div>
                )
              }

              return (
                <div key={time} className="card p-3 space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="w-14 font-mono font-medium text-stone-800">{time}</span>
                    <span className={`chip text-xs ${getStatusStyle(slot.status)}`}>
                      {getStatusLabel(slot.status)}
                    </span>
                    {slot.client_name && (
                      <span className="text-sm text-stone-600">{slot.client_name}</span>
                    )}
                  </div>

                  {slot.status === 'booked' && (
                    <div className="pl-14 text-sm text-stone-500 space-y-0.5">
                      <p>📋 {getServiceName(slot.service_id)}</p>
                      {slot.price_at_booking && <p>💰 {slot.price_at_booking} ₽</p>}
                    </div>
                  )}

                  <div className="pl-14 flex gap-2 flex-wrap">
                    {slot.status === 'free' && (
                      <button onClick={() => deleteSlot(slot.id)} className="text-red-400 text-xs hover:text-red-500">
                        Удалить
                      </button>
                    )}
                    {slot.status === 'booked' && (
                      <>
                        <button onClick={() => completeSlot(slot.id)} className="text-emerald-500 text-xs hover:text-emerald-600">
                          ✓ Выполнено
                        </button>
                        <button onClick={() => cancelSlot(slot.id)} className="text-amber-500 text-xs hover:text-amber-600">
                          ✕ Отменить
                        </button>
                      </>
                    )}
                    {(slot.status === 'cancelled' || slot.status === 'completed') && (
                      <button onClick={() => freeSlot(slot.id)} className="text-rose-400 text-xs hover:text-rose-500">
                        ↻ Освободить
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {!selectedMaster && masters.length === 0 && (
        <div className="card p-8 text-center">
          <p className="text-stone-500">Сначала добавьте мастера</p>
        </div>
      )}
    </div>
  )
}
