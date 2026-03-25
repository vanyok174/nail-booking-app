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

const icons = {
  booking: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  ),
  masters: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  ),
  slots: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  analytics: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  ),
}

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
      tg.setHeaderColor('#faf9f7')
      tg.setBackgroundColor('#faf9f7')
      
      const user = tg.initDataUnsafe?.user
      if (user) {
        setTelegramUser({ id: user.id, first_name: user.first_name })
        checkAdmin(user.id)
      }
    }
    
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
    { id: 'analytics', label: 'Статистика', adminOnly: true },
  ]

  const visibleTabs = tabs.filter(t => !t.adminOnly || isAdmin)

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="sticky top-0 z-20 glass border-b border-stone-200/50">
        <div className="px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold gradient-text">
                Nail Studio
              </h1>
              {telegramUser && (
                <p className="text-sm text-stone-500 mt-0.5">
                  {telegramUser.first_name}
                  {isAdmin && (
                    <span className="ml-2 chip chip-rose text-xs py-0.5">Админ</span>
                  )}
                </p>
              )}
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-200 to-amber-200 flex items-center justify-center">
              <span className="text-lg">💅</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-5 py-6 animate-fade-in">
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

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 glass border-t border-stone-200/50 z-20">
        <div className="flex justify-around items-center py-2 px-4 max-w-md mx-auto">
          {visibleTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex flex-col items-center py-2 px-4 rounded-xl transition-all duration-200 ${
                activeTab === tab.id
                  ? 'text-rose-500 bg-rose-50'
                  : 'text-stone-400 hover:text-stone-600'
              }`}
            >
              {icons[tab.id]}
              <span className="text-xs mt-1 font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
