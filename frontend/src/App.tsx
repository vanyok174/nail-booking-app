import { useState, useEffect } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import ClientBooking from './pages/client/ClientBooking'
import AdminMasters from './pages/admin/AdminMasters'
import AdminSlots from './pages/admin/AdminSlots'
import Analytics from './pages/admin/Analytics'
import { api } from './api/client'

declare global {
  interface Window {
    Telegram: {
      WebApp: {
        initData: string
        initDataUnsafe: {
          user?: {
            id: number
            first_name: string
            last_name?: string
            username?: string
          }
        }
        ready: () => void
        expand: () => void
        setHeaderColor: (color: string) => void
        setBackgroundColor: (color: string) => void
        themeParams: Record<string, string>
      }
    }
  }
}

type Tab = 'booking' | 'masters' | 'slots' | 'analytics'

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('booking')
  const [isAdmin, setIsAdmin] = useState(false)
  const [telegramUser, setTelegramUser] = useState<{ id: number; first_name: string } | null>(null)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const tg = window.Telegram?.WebApp
    if (tg) {
      tg.ready()
      tg.expand()
      
      const user = tg.initDataUnsafe?.user
      if (user) {
        setTelegramUser({ id: user.id, first_name: user.first_name })
        checkAdmin(user.id)
      }
    }
    
    // For dev without Telegram
    if (!window.Telegram?.WebApp?.initDataUnsafe?.user) {
      const devUser = { id: 123456789, first_name: 'Dev User' }
      setTelegramUser(devUser)
      setIsAdmin(true)
    }
  }, [])

  useEffect(() => {
    const pathToTab: Record<string, Tab> = {
      '/': 'booking',
      '/booking': 'booking',
      '/masters': 'masters',
      '/slots': 'slots',
      '/analytics': 'analytics'
    }
    const tab = pathToTab[location.pathname]
    if (tab) setActiveTab(tab)
  }, [location])

  async function checkAdmin(telegramId: number) {
    try {
      const res = await api.get<{ isAdmin: boolean }>(`/admins/check/${telegramId}`)
      setIsAdmin(res.isAdmin)
    } catch {
      setIsAdmin(false)
    }
  }

  function handleTabChange(tab: Tab) {
    setActiveTab(tab)
    const tabToPath: Record<Tab, string> = {
      booking: '/',
      masters: '/masters',
      slots: '/slots',
      analytics: '/analytics'
    }
    navigate(tabToPath[tab])
  }

  const tabs: { id: Tab; label: string; adminOnly?: boolean }[] = [
    { id: 'booking', label: 'Запись' },
    { id: 'masters', label: 'Мастера', adminOnly: true },
    { id: 'slots', label: 'Слоты', adminOnly: true },
    { id: 'analytics', label: 'Аналитика', adminOnly: true },
  ]

  const visibleTabs = tabs.filter(t => !t.adminOnly || isAdmin)

  return (
    <div className="min-h-screen bg-tg-bg pb-20">
      <header className="sticky top-0 bg-tg-bg border-b border-tg-secondary px-4 py-3 z-10">
        <h1 className="text-lg font-semibold text-tg-text">
          Nail Booking
        </h1>
        {telegramUser && (
          <p className="text-sm text-tg-hint">
            {telegramUser.first_name} {isAdmin && '(Админ)'}
          </p>
        )}
      </header>

      <main className="p-4">
        <Routes>
          <Route path="/" element={<ClientBooking telegramUser={telegramUser} />} />
          <Route path="/booking" element={<ClientBooking telegramUser={telegramUser} />} />
          {isAdmin && (
            <>
              <Route path="/masters" element={<AdminMasters />} />
              <Route path="/slots" element={<AdminSlots />} />
              <Route path="/analytics" element={<Analytics />} />
            </>
          )}
        </Routes>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-tg-bg border-t border-tg-secondary">
        <div className="flex">
          {visibleTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-tg-button border-t-2 border-tg-button'
                  : 'text-tg-hint'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
