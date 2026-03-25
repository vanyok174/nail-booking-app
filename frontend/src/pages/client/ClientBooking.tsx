import { useState, useEffect } from 'react'
import { format, addDays, startOfDay } from 'date-fns'
import { ru } from 'date-fns/locale'
import { api } from '../../api/client'
import { Master, Service, Slot } from '../../api/types'

interface Props {
  telegramUser: { id: number; first_name: string } | null
}

export default function ClientBooking({ telegramUser }: Props) {
  const [masters, setMasters] = useState<Master[]>([])
  const [selectedMaster, setSelectedMaster] = useState<Master | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [slots, setSlots] = useState<Slot[]>([])
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [step, setStep] = useState<'master' | 'service' | 'date' | 'time' | 'confirm'>('master')
  const [loading, setLoading] = useState(false)
  const [bookingSuccess, setBookingSuccess] = useState(false)

  useEffect(() => {
    loadMasters()
  }, [])

  useEffect(() => {
    if (selectedMaster) {
      loadServices(selectedMaster.id)
    }
  }, [selectedMaster])

  useEffect(() => {
    if (selectedMaster && selectedDate) {
      loadSlots(selectedMaster.id, selectedDate)
    }
  }, [selectedMaster, selectedDate])

  async function loadMasters() {
    try {
      const data = await api.get<Master[]>('/masters')
      setMasters(data)
    } catch (err) {
      console.error('Failed to load masters:', err)
    }
  }

  async function loadServices(masterId: string) {
    try {
      const data = await api.get<Service[]>(`/services?master_id=${masterId}`)
      setServices(data)
    } catch (err) {
      console.error('Failed to load services:', err)
    }
  }

  async function loadSlots(masterId: string, date: string) {
    try {
      const data = await api.get<Slot[]>(`/slots?master_id=${masterId}&date=${date}&status=free`)
      setSlots(data)
    } catch (err) {
      console.error('Failed to load slots:', err)
    }
  }

  async function handleBook() {
    if (!selectedSlot || !selectedService || !telegramUser) return

    setLoading(true)
    try {
      await api.put(`/slots/${selectedSlot.id}/book`, {
        client_telegram_id: String(telegramUser.id),
        client_name: telegramUser.first_name,
        service_id: selectedService.id
      })
      setBookingSuccess(true)
    } catch (err) {
      console.error('Booking failed:', err)
      alert('Ошибка записи. Попробуйте ещё раз.')
    } finally {
      setLoading(false)
    }
  }

  function resetBooking() {
    setSelectedMaster(null)
    setSelectedService(null)
    setSelectedDate('')
    setSelectedSlot(null)
    setStep('master')
    setBookingSuccess(false)
  }

  const dateOptions = Array.from({ length: 14 }, (_, i) => {
    const date = addDays(startOfDay(new Date()), i)
    return {
      value: format(date, 'yyyy-MM-dd'),
      label: format(date, 'd', { locale: ru }),
      dayName: format(date, 'EEE', { locale: ru }),
      monthName: format(date, 'MMM', { locale: ru }),
      isToday: i === 0
    }
  })

  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-6">
      {['master', 'service', 'date', 'time', 'confirm'].map((s, i) => (
        <div key={s} className="flex items-center">
          <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
            step === s ? 'w-6 bg-gradient-to-r from-rose-400 to-rose-300' : 
            ['master', 'service', 'date', 'time', 'confirm'].indexOf(step) > i ? 'bg-rose-300' : 'bg-stone-200'
          }`} />
        </div>
      ))}
    </div>
  )

  const BackButton = ({ onClick }: { onClick: () => void }) => (
    <button onClick={onClick} className="flex items-center gap-1 text-stone-500 text-sm mb-4 hover:text-rose-500 transition-colors">
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
      Назад
    </button>
  )

  if (bookingSuccess) {
    return (
      <div className="text-center py-12 animate-fade-in">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center">
          <svg className="w-10 h-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-semibold text-stone-800 mb-2">Вы записаны!</h2>
        <p className="text-stone-500 mb-1">{selectedMaster?.name}</p>
        <p className="text-stone-600 font-medium mb-6">{selectedService?.name}</p>
        
        <div className="card p-5 mb-8 max-w-xs mx-auto">
          <div className="flex items-center justify-center gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-stone-800">
                {selectedDate && format(new Date(selectedDate), 'd')}
              </p>
              <p className="text-sm text-stone-500">
                {selectedDate && format(new Date(selectedDate), 'MMMM', { locale: ru })}
              </p>
            </div>
            <div className="w-px h-12 bg-stone-200" />
            <div className="text-center">
              <p className="text-3xl font-bold text-rose-500">{selectedSlot?.time}</p>
              <p className="text-sm text-stone-500">время</p>
            </div>
          </div>
        </div>

        <button onClick={resetBooking} className="btn-primary">
          Новая запись
        </button>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <StepIndicator />

      {/* Step 1: Select Master */}
      {step === 'master' && (
        <div>
          <h2 className="section-title">Выберите мастера</h2>
          {masters.length === 0 ? (
            <div className="card p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-stone-100 flex items-center justify-center">
                <span className="text-2xl">💅</span>
              </div>
              <p className="text-stone-500">Пока нет доступных мастеров</p>
            </div>
          ) : (
            <div className="space-y-3">
              {masters.map(master => (
                <button
                  key={master.id}
                  onClick={() => {
                    setSelectedMaster(master)
                    setStep('service')
                  }}
                  className="w-full card p-4 flex items-center gap-4 text-left"
                >
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-100 to-amber-100 flex items-center justify-center text-2xl overflow-hidden flex-shrink-0">
                    {master.photo ? (
                      <img src={master.photo} alt={master.name} className="w-full h-full object-cover" />
                    ) : (
                      '👩‍🎨'
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-stone-800">{master.name}</p>
                    <p className="text-sm text-stone-500 mt-1">
                      {master.experience_years} лет опыта
                    </p>
                    <div className="flex items-center gap-1 mt-2">
                      <span className="chip chip-amber text-xs py-0.5">{master.works_count}+ работ</span>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Select Service */}
      {step === 'service' && selectedMaster && (
        <div>
          <BackButton onClick={() => setStep('master')} />
          <h2 className="section-title">Выберите услугу</h2>
          
          <div className="card-flat p-3 mb-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-100 to-amber-100 flex items-center justify-center">
              👩‍🎨
            </div>
            <span className="font-medium text-stone-700">{selectedMaster.name}</span>
          </div>

          {services.length === 0 ? (
            <div className="card p-6 text-center">
              <p className="text-stone-500">Нет доступных услуг</p>
            </div>
          ) : (
            <div className="space-y-2">
              {services.map(service => (
                <button
                  key={service.id}
                  onClick={() => {
                    setSelectedService(service)
                    setStep('date')
                  }}
                  className="w-full card p-4 flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium text-stone-800">{service.name}</p>
                    <p className="text-sm text-stone-400 mt-0.5">{service.duration_minutes} мин</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold gradient-text">{service.price} ₽</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 3: Select Date */}
      {step === 'date' && (
        <div>
          <BackButton onClick={() => setStep('service')} />
          <h2 className="section-title">Выберите дату</h2>
          
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 -mx-1 px-1">
            {dateOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => {
                  setSelectedDate(opt.value)
                  setStep('time')
                }}
                className={`flex-shrink-0 w-16 py-3 rounded-2xl text-center transition-all ${
                  opt.isToday ? 'card border-rose-200' : 'card'
                }`}
              >
                <p className="text-xs text-stone-400 uppercase">{opt.dayName}</p>
                <p className="text-xl font-bold text-stone-800 my-1">{opt.label}</p>
                <p className="text-xs text-stone-400">{opt.monthName}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 4: Select Time */}
      {step === 'time' && (
        <div>
          <BackButton onClick={() => setStep('date')} />
          <h2 className="section-title">
            Выберите время
          </h2>
          
          <div className="card-flat p-3 mb-4">
            <p className="text-sm text-stone-600">
              📅 {selectedDate && format(new Date(selectedDate), 'd MMMM, EEEE', { locale: ru })}
            </p>
          </div>

          {slots.length === 0 ? (
            <div className="card p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-stone-100 flex items-center justify-center">
                <span className="text-2xl">😔</span>
              </div>
              <p className="text-stone-500">Нет свободных слотов</p>
              <button onClick={() => setStep('date')} className="btn-ghost mt-4">
                Выбрать другую дату
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {slots.map(slot => (
                <button
                  key={slot.id}
                  onClick={() => {
                    setSelectedSlot(slot)
                    setStep('confirm')
                  }}
                  className="card p-3 text-center font-medium text-stone-700 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all"
                >
                  {slot.time}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 5: Confirm */}
      {step === 'confirm' && selectedMaster && selectedService && selectedSlot && (
        <div>
          <BackButton onClick={() => setStep('time')} />
          <h2 className="section-title">Подтверждение</h2>
          
          <div className="card p-5 space-y-4 mb-6">
            <div className="flex items-center gap-4 pb-4 border-b border-stone-100">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-100 to-amber-100 flex items-center justify-center text-xl">
                👩‍🎨
              </div>
              <div>
                <p className="font-semibold text-stone-800">{selectedMaster.name}</p>
                <p className="text-sm text-stone-500">{selectedService.name}</p>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-stone-500">Дата</span>
              <span className="font-medium text-stone-800">
                {format(new Date(selectedDate), 'd MMMM yyyy', { locale: ru })}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-stone-500">Время</span>
              <span className="font-medium text-stone-800">{selectedSlot.time}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-stone-500">Длительность</span>
              <span className="font-medium text-stone-800">{selectedService.duration_minutes} мин</span>
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-stone-100">
              <span className="text-stone-600 font-medium">Итого</span>
              <span className="text-2xl font-bold gradient-text">{selectedService.price} ₽</span>
            </div>
          </div>

          <button
            onClick={handleBook}
            disabled={loading}
            className="btn-primary w-full disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Записываем...
              </span>
            ) : (
              'Записаться'
            )}
          </button>
        </div>
      )}
    </div>
  )
}
