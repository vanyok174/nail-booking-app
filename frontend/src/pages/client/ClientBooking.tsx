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
      label: format(date, 'd MMMM, EEEE', { locale: ru })
    }
  })

  if (bookingSuccess) {
    return (
      <div className="text-center py-8">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-xl font-semibold mb-2">Вы записаны!</h2>
        <p className="text-tg-hint mb-4">
          {selectedMaster?.name} • {selectedService?.name}
        </p>
        <p className="text-tg-hint mb-6">
          {selectedDate && format(new Date(selectedDate), 'd MMMM', { locale: ru })} в {selectedSlot?.time}
        </p>
        <button
          onClick={resetBooking}
          className="bg-tg-button text-tg-button-text px-6 py-3 rounded-lg font-medium"
        >
          Новая запись
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Step 1: Select Master */}
      {step === 'master' && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Выберите мастера</h2>
          {masters.length === 0 ? (
            <p className="text-tg-hint">Нет доступных мастеров</p>
          ) : (
            <div className="space-y-3">
              {masters.map(master => (
                <button
                  key={master.id}
                  onClick={() => {
                    setSelectedMaster(master)
                    setStep('service')
                  }}
                  className="w-full p-4 bg-tg-secondary rounded-xl flex items-center gap-4 text-left"
                >
                  <div className="w-14 h-14 bg-tg-hint/20 rounded-full flex items-center justify-center text-2xl overflow-hidden">
                    {master.photo ? (
                      <img src={master.photo} alt={master.name} className="w-full h-full object-cover" />
                    ) : (
                      '👩‍🎨'
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{master.name}</p>
                    <p className="text-sm text-tg-hint">
                      {master.experience_years} лет опыта • {master.works_count}+ работ
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Select Service */}
      {step === 'service' && selectedMaster && (
        <div>
          <button
            onClick={() => setStep('master')}
            className="text-tg-link text-sm mb-4"
          >
            ← Назад
          </button>
          <h2 className="text-lg font-semibold mb-4">Выберите услугу</h2>
          {services.length === 0 ? (
            <p className="text-tg-hint">Нет доступных услуг</p>
          ) : (
            <div className="space-y-2">
              {services.map(service => (
                <button
                  key={service.id}
                  onClick={() => {
                    setSelectedService(service)
                    setStep('date')
                  }}
                  className="w-full p-4 bg-tg-secondary rounded-xl flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium">{service.name}</p>
                    <p className="text-sm text-tg-hint">{service.duration_minutes} мин</p>
                  </div>
                  <p className="font-semibold text-tg-button">{service.price} ₽</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 3: Select Date */}
      {step === 'date' && (
        <div>
          <button
            onClick={() => setStep('service')}
            className="text-tg-link text-sm mb-4"
          >
            ← Назад
          </button>
          <h2 className="text-lg font-semibold mb-4">Выберите дату</h2>
          <div className="space-y-2">
            {dateOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => {
                  setSelectedDate(opt.value)
                  setStep('time')
                }}
                className="w-full p-4 bg-tg-secondary rounded-xl text-left"
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 4: Select Time */}
      {step === 'time' && (
        <div>
          <button
            onClick={() => setStep('date')}
            className="text-tg-link text-sm mb-4"
          >
            ← Назад
          </button>
          <h2 className="text-lg font-semibold mb-4">
            Выберите время ({selectedDate && format(new Date(selectedDate), 'd MMMM', { locale: ru })})
          </h2>
          {slots.length === 0 ? (
            <p className="text-tg-hint">Нет свободных слотов на эту дату</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {slots.map(slot => (
                <button
                  key={slot.id}
                  onClick={() => {
                    setSelectedSlot(slot)
                    setStep('confirm')
                  }}
                  className="p-3 bg-tg-secondary rounded-lg text-center font-medium hover:bg-tg-button hover:text-tg-button-text transition-colors"
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
          <button
            onClick={() => setStep('time')}
            className="text-tg-link text-sm mb-4"
          >
            ← Назад
          </button>
          <h2 className="text-lg font-semibold mb-4">Подтверждение записи</h2>
          
          <div className="bg-tg-secondary rounded-xl p-4 space-y-3 mb-6">
            <div className="flex justify-between">
              <span className="text-tg-hint">Мастер</span>
              <span className="font-medium">{selectedMaster.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-tg-hint">Услуга</span>
              <span className="font-medium">{selectedService.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-tg-hint">Дата</span>
              <span className="font-medium">
                {format(new Date(selectedDate), 'd MMMM yyyy', { locale: ru })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-tg-hint">Время</span>
              <span className="font-medium">{selectedSlot.time}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-tg-hint/20">
              <span className="text-tg-hint">Стоимость</span>
              <span className="font-semibold text-lg">{selectedService.price} ₽</span>
            </div>
          </div>

          <button
            onClick={handleBook}
            disabled={loading}
            className="w-full bg-tg-button text-tg-button-text py-4 rounded-xl font-semibold disabled:opacity-50"
          >
            {loading ? 'Записываем...' : 'Записаться'}
          </button>
        </div>
      )}
    </div>
  )
}
