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
      <div className="space-y-6 animate-fade-in">
        <button
          onClick={() => setSelectedMaster(null)}
          className="flex items-center gap-1 text-stone-500 text-sm hover:text-rose-500 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Все мастера
        </button>

        <div className="card p-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-100 to-amber-100 flex items-center justify-center text-2xl">
              👩‍🎨
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-stone-800">{selectedMaster.name}</h2>
              <p className="text-sm text-stone-500 mt-1">{selectedMaster.description}</p>
              <div className="flex gap-2 mt-2">
                <span className="chip chip-rose text-xs">{selectedMaster.experience_years} лет</span>
                <span className="chip chip-amber text-xs">{selectedMaster.works_count}+ работ</span>
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-4 pt-4 border-t border-stone-100">
            <button onClick={() => startEditMaster(selectedMaster)} className="btn-ghost text-sm">
              ✏️ Редактировать
            </button>
            <button onClick={() => handleDeleteMaster(selectedMaster.id)} className="text-red-400 text-sm hover:text-red-500">
              🗑 Удалить
            </button>
          </div>
        </div>

        {/* Services */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="section-title mb-0">Услуги</h3>
            <button onClick={() => setShowServiceForm(true)} className="btn-ghost text-sm">
              + Добавить
            </button>
          </div>

          {showServiceForm && (
            <form onSubmit={handleSaveService} className="card p-4 mb-4 space-y-3">
              <input
                type="text"
                value={serviceForm.name}
                onChange={e => setServiceForm({ ...serviceForm, name: e.target.value })}
                placeholder="Название услуги"
                className="input"
                required
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  value={serviceForm.price}
                  onChange={e => setServiceForm({ ...serviceForm, price: +e.target.value })}
                  placeholder="Цена ₽"
                  className="input flex-1"
                  required
                />
                <input
                  type="number"
                  value={serviceForm.duration_minutes}
                  onChange={e => setServiceForm({ ...serviceForm, duration_minutes: +e.target.value })}
                  placeholder="Минут"
                  className="input w-24"
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn-primary flex-1">
                  {editingService ? 'Сохранить' : 'Добавить'}
                </button>
                <button type="button" onClick={resetServiceForm} className="btn-secondary">
                  Отмена
                </button>
              </div>
            </form>
          )}

          <div className="space-y-2">
            {services.map(service => (
              <div key={service.id} className="card p-4 flex justify-between items-center">
                <div>
                  <p className="font-medium text-stone-800">{service.name}</p>
                  <p className="text-sm text-stone-400">{service.duration_minutes} мин</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold gradient-text">{service.price} ₽</span>
                  <button onClick={() => startEditService(service)} className="text-stone-400 hover:text-rose-500">✏️</button>
                  <button onClick={() => handleDeleteService(service.id)} className="text-stone-400 hover:text-red-500">🗑</button>
                </div>
              </div>
            ))}
            {services.length === 0 && !showServiceForm && (
              <p className="text-center text-stone-400 py-4">Нет услуг</p>
            )}
          </div>
        </div>

        {/* Portfolio */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="section-title mb-0">Портфолио</h3>
            <label className="btn-ghost text-sm cursor-pointer">
              + Загрузить
              <input type="file" accept="image/*" onChange={handleUploadPhoto} className="hidden" />
            </label>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {portfolio.map(photo => (
              <div key={photo.id} className="relative aspect-square rounded-xl overflow-hidden group">
                <img src={photo.image_path} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => handleDeletePhoto(photo.id)}
                  className="absolute top-2 right-2 w-7 h-7 bg-black/50 rounded-full text-white text-sm opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ×
                </button>
              </div>
            ))}
            {portfolio.length === 0 && (
              <p className="col-span-3 text-center text-stone-400 py-4">Нет фото</p>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="section-title mb-0">Мастера</h2>
        <button onClick={() => setShowForm(true)} className="btn-primary text-sm py-2">
          + Добавить
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSaveMaster} className="card p-4 space-y-3">
          <input
            type="text"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            placeholder="Имя мастера"
            className="input"
            required
          />
          <textarea
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            placeholder="Описание"
            className="input resize-none"
            rows={3}
          />
          <div className="flex gap-2">
            <input
              type="number"
              value={formData.experience_years}
              onChange={e => setFormData({ ...formData, experience_years: +e.target.value })}
              placeholder="Лет опыта"
              className="input flex-1"
            />
            <input
              type="number"
              value={formData.works_count}
              onChange={e => setFormData({ ...formData, works_count: +e.target.value })}
              placeholder="Кол-во работ"
              className="input flex-1"
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary flex-1">
              {editingMaster ? 'Сохранить' : 'Добавить'}
            </button>
            <button type="button" onClick={resetForm} className="btn-secondary">
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
            className="w-full card p-4 flex items-center gap-4 text-left"
          >
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-100 to-amber-100 flex items-center justify-center text-xl">
              👩‍🎨
            </div>
            <div className="flex-1">
              <p className="font-semibold text-stone-800">{master.name}</p>
              <p className="text-sm text-stone-500">
                {master.experience_years} лет • {master.works_count}+ работ
              </p>
            </div>
            <svg className="w-5 h-5 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ))}
        {masters.length === 0 && !showForm && (
          <div className="card p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-stone-100 flex items-center justify-center">
              <span className="text-2xl">👩‍🎨</span>
            </div>
            <p className="text-stone-500">Добавьте первого мастера</p>
          </div>
        )}
      </div>
    </div>
  )
}
