import { useState, useEffect } from 'react'
import { api } from '../../api/client'
import { Master, Service, PortfolioPhoto } from '../../api/types'

export default function AdminMasters() {
  const [masters, setMasters] = useState<Master[]>([])
  const [selectedMaster, setSelectedMaster] = useState<Master | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [portfolio, setPortfolio] = useState<PortfolioPhoto[]>([])
  const [showForm, setShowForm] = useState(false)
  const [showServiceForm, setShowServiceForm] = useState(false)
  const [editingMaster, setEditingMaster] = useState<Master | null>(null)
  const [editingService, setEditingService] = useState<Service | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    experience_years: 0,
    works_count: 0
  })

  const [serviceForm, setServiceForm] = useState({
    name: '',
    price: 0,
    duration_minutes: 60
  })

  useEffect(() => {
    loadMasters()
  }, [])

  useEffect(() => {
    if (selectedMaster) {
      loadServices(selectedMaster.id)
      loadPortfolio(selectedMaster.id)
    }
  }, [selectedMaster])

  async function loadMasters() {
    const data = await api.get<Master[]>('/masters')
    setMasters(data)
  }

  async function loadServices(masterId: string) {
    const data = await api.get<Service[]>(`/services?master_id=${masterId}`)
    setServices(data)
  }

  async function loadPortfolio(masterId: string) {
    const data = await api.get<PortfolioPhoto[]>(`/portfolio?master_id=${masterId}`)
    setPortfolio(data)
  }

  async function handleSaveMaster(e: React.FormEvent) {
    e.preventDefault()
    
    if (editingMaster) {
      await api.put(`/masters/${editingMaster.id}`, formData)
    } else {
      await api.post('/masters', formData)
    }
    
    resetForm()
    loadMasters()
  }

  async function handleDeleteMaster(id: string) {
    if (!confirm('Удалить мастера?')) return
    await api.delete(`/masters/${id}`)
    setSelectedMaster(null)
    loadMasters()
  }

  async function handleSaveService(e: React.FormEvent) {
    e.preventDefault()
    
    if (!selectedMaster) return
    
    if (editingService) {
      await api.put(`/services/${editingService.id}`, serviceForm)
    } else {
      await api.post('/services', {
        ...serviceForm,
        master_id: selectedMaster.id
      })
    }
    
    resetServiceForm()
    loadServices(selectedMaster.id)
  }

  async function handleDeleteService(id: string) {
    if (!confirm('Удалить услугу?')) return
    await api.delete(`/services/${id}`)
    if (selectedMaster) loadServices(selectedMaster.id)
  }

  async function handleUploadPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    if (!selectedMaster || !e.target.files?.[0]) return
    
    const formData = new FormData()
    formData.append('image', e.target.files[0])
    formData.append('master_id', selectedMaster.id)
    
    await api.postFormData('/portfolio', formData)
    loadPortfolio(selectedMaster.id)
    e.target.value = ''
  }

  async function handleDeletePhoto(id: string) {
    if (!confirm('Удалить фото?')) return
    await api.delete(`/portfolio/${id}`)
    if (selectedMaster) loadPortfolio(selectedMaster.id)
  }

  function resetForm() {
    setFormData({ name: '', description: '', experience_years: 0, works_count: 0 })
    setEditingMaster(null)
    setShowForm(false)
  }

  function resetServiceForm() {
    setServiceForm({ name: '', price: 0, duration_minutes: 60 })
    setEditingService(null)
    setShowServiceForm(false)
  }

  function startEditMaster(master: Master) {
    setFormData({
      name: master.name,
      description: master.description || '',
      experience_years: master.experience_years,
      works_count: master.works_count
    })
    setEditingMaster(master)
    setShowForm(true)
  }

  function startEditService(service: Service) {
    setServiceForm({
      name: service.name,
      price: service.price,
      duration_minutes: service.duration_minutes
    })
    setEditingService(service)
    setShowServiceForm(true)
  }

  if (selectedMaster) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setSelectedMaster(null)}
          className="text-tg-link text-sm"
        >
          ← Все мастера
        </button>

        <div className="bg-tg-secondary rounded-xl p-4">
          <h2 className="text-lg font-semibold">{selectedMaster.name}</h2>
          <p className="text-sm text-tg-hint mt-1">{selectedMaster.description}</p>
          <div className="flex gap-4 mt-2 text-sm text-tg-hint">
            <span>{selectedMaster.experience_years} лет опыта</span>
            <span>{selectedMaster.works_count}+ работ</span>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => startEditMaster(selectedMaster)}
              className="text-tg-link text-sm"
            >
              Редактировать
            </button>
            <button
              onClick={() => handleDeleteMaster(selectedMaster.id)}
              className="text-red-500 text-sm"
            >
              Удалить
            </button>
          </div>
        </div>

        {/* Services */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">Услуги</h3>
            <button
              onClick={() => setShowServiceForm(true)}
              className="text-tg-button text-sm"
            >
              + Добавить
            </button>
          </div>

          {showServiceForm && (
            <form onSubmit={handleSaveService} className="bg-tg-secondary rounded-xl p-4 mb-4 space-y-3">
              <input
                type="text"
                value={serviceForm.name}
                onChange={e => setServiceForm({ ...serviceForm, name: e.target.value })}
                placeholder="Название услуги"
                className="w-full p-3 rounded-lg bg-tg-bg"
                required
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  value={serviceForm.price}
                  onChange={e => setServiceForm({ ...serviceForm, price: +e.target.value })}
                  placeholder="Цена"
                  className="flex-1 p-3 rounded-lg bg-tg-bg"
                  required
                />
                <input
                  type="number"
                  value={serviceForm.duration_minutes}
                  onChange={e => setServiceForm({ ...serviceForm, duration_minutes: +e.target.value })}
                  placeholder="Минут"
                  className="w-24 p-3 rounded-lg bg-tg-bg"
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 bg-tg-button text-tg-button-text py-2 rounded-lg">
                  {editingService ? 'Сохранить' : 'Добавить'}
                </button>
                <button type="button" onClick={resetServiceForm} className="px-4 py-2 text-tg-hint">
                  Отмена
                </button>
              </div>
            </form>
          )}

          <div className="space-y-2">
            {services.map(service => (
              <div key={service.id} className="bg-tg-secondary rounded-lg p-3 flex justify-between items-center">
                <div>
                  <p className="font-medium">{service.name}</p>
                  <p className="text-sm text-tg-hint">{service.duration_minutes} мин</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold">{service.price} ₽</span>
                  <button onClick={() => startEditService(service)} className="text-tg-link text-sm">✏️</button>
                  <button onClick={() => handleDeleteService(service.id)} className="text-red-500 text-sm">🗑</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Portfolio */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">Портфолио</h3>
            <label className="text-tg-button text-sm cursor-pointer">
              + Загрузить
              <input type="file" accept="image/*" onChange={handleUploadPhoto} className="hidden" />
            </label>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {portfolio.map(photo => (
              <div key={photo.id} className="relative aspect-square">
                <img
                  src={photo.image_path}
                  alt=""
                  className="w-full h-full object-cover rounded-lg"
                />
                <button
                  onClick={() => handleDeletePhoto(photo.id)}
                  className="absolute top-1 right-1 w-6 h-6 bg-black/50 rounded-full text-white text-xs"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Мастера</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-tg-button text-tg-button-text px-4 py-2 rounded-lg text-sm"
        >
          + Добавить
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSaveMaster} className="bg-tg-secondary rounded-xl p-4 space-y-3">
          <input
            type="text"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            placeholder="Имя мастера"
            className="w-full p-3 rounded-lg bg-tg-bg"
            required
          />
          <textarea
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            placeholder="Описание"
            className="w-full p-3 rounded-lg bg-tg-bg resize-none"
            rows={3}
          />
          <div className="flex gap-2">
            <input
              type="number"
              value={formData.experience_years}
              onChange={e => setFormData({ ...formData, experience_years: +e.target.value })}
              placeholder="Лет опыта"
              className="flex-1 p-3 rounded-lg bg-tg-bg"
            />
            <input
              type="number"
              value={formData.works_count}
              onChange={e => setFormData({ ...formData, works_count: +e.target.value })}
              placeholder="Кол-во работ"
              className="flex-1 p-3 rounded-lg bg-tg-bg"
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="flex-1 bg-tg-button text-tg-button-text py-3 rounded-lg">
              {editingMaster ? 'Сохранить' : 'Добавить'}
            </button>
            <button type="button" onClick={resetForm} className="px-4 py-3 text-tg-hint">
              Отмена
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {masters.map(master => (
          <button
            key={master.id}
            onClick={() => setSelectedMaster(master)}
            className="w-full p-4 bg-tg-secondary rounded-xl flex items-center gap-4 text-left"
          >
            <div className="w-12 h-12 bg-tg-hint/20 rounded-full flex items-center justify-center text-xl">
              👩‍🎨
            </div>
            <div className="flex-1">
              <p className="font-medium">{master.name}</p>
              <p className="text-sm text-tg-hint">
                {master.experience_years} лет • {master.works_count}+ работ
              </p>
            </div>
            <span className="text-tg-hint">→</span>
          </button>
        ))}
      </div>
    </div>
  )
}
