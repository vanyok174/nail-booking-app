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

  const dateOptions = Array.from({ length: 30 }, (_, i) => {
    const date = addDays(startOfDay(new Date()), i - 7)
    return {
      value: format(date, 'yyyy-MM-dd'),
      label: format(date, 'd MMM', { locale: ru })
    }
  })

  function getStatusColor(status: string) {
    switch (status) {
      case 'free': return 'bg-green-500'
      case 'booked': return 'bg-blue-500'
      case 'completed': return 'bg-gray-400'
      case 'cancelled': return 'bg-red-400'
      default: return 'bg-gray-200'
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

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Управление слотами</h2>

      {/* Filters */}
      <div className="space-y-3">
        <select
          value={selectedMaster}
          onChange={e => setSelectedMaster(e.target.value)}
          className="w-full p-3 bg-tg-secondary rounded-lg"
        >
          <option value="">Выберите мастера</option>
          {masters.map(m => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {dateOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => setSelectedDate(opt.value)}
              className={`px-3 py-2 rounded-lg text-sm whitespace-nowrap ${
                selectedDate === opt.value
                  ? 'bg-tg-button text-tg-button-text'
                  : 'bg-tg-secondary'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {selectedMaster && (
        <>
          <div className="flex justify-between items-center">
            <p className="text-sm text-tg-hint">
              {format(new Date(selectedDate), 'd MMMM yyyy, EEEE', { locale: ru })}
            </p>
            <button
              onClick={createAllSlots}
              disabled={loading}
              className="text-tg-button text-sm"
            >
              Создать все слоты
            </button>
          </div>

          <div className="space-y-2">
            {TIME_SLOTS.map(time => {
              const slot = existingSlots.get(time)

              if (!slot) {
                return (
                  <div key={time} className="flex items-center gap-3 p-3 bg-tg-secondary rounded-lg">
                    <span className="w-14 font-mono">{time}</span>
                    <span className="flex-1 text-tg-hint">Слот не создан</span>
                    <button
                      onClick={() => createSlot(time)}
                      className="text-tg-button text-sm"
                    >
                      + Создать
                    </button>
                  </div>
                )
              }

              return (
                <div key={time} className="p-3 bg-tg-secondary rounded-lg space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="w-14 font-mono">{time}</span>
                    <span className={`px-2 py-0.5 rounded text-xs text-white ${getStatusColor(slot.status)}`}>
                      {getStatusLabel(slot.status)}
                    </span>
                    {slot.client_name && (
                      <span className="text-sm">{slot.client_name}</span>
                    )}
                  </div>

                  {slot.status === 'booked' && (
                    <div className="pl-14 text-sm text-tg-hint">
                      <p>Услуга: {getServiceName(slot.service_id)}</p>
                      {slot.price_at_booking && <p>Цена: {slot.price_at_booking} ₽</p>}
                    </div>
                  )}

                  <div className="pl-14 flex gap-2">
                    {slot.status === 'free' && (
                      <button onClick={() => deleteSlot(slot.id)} className="text-red-500 text-xs">
                        Удалить
                      </button>
                    )}
                    {slot.status === 'booked' && (
                      <>
                        <button onClick={() => completeSlot(slot.id)} className="text-green-600 text-xs">
                          Выполнено
                        </button>
                        <button onClick={() => cancelSlot(slot.id)} className="text-orange-500 text-xs">
                          Отменить
                        </button>
                      </>
                    )}
                    {(slot.status === 'cancelled' || slot.status === 'completed') && (
                      <button onClick={() => freeSlot(slot.id)} className="text-tg-link text-xs">
                        Освободить
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
