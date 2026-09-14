import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useGamificationStore } from '@/store/gamificationStore'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { MobileNav } from './MobileNav'
import { breadcrumbFor } from './navigation'
import { AssistantChat } from '@/components/assistant/AssistantChat'
import { AssistantLauncher } from '@/components/assistant/AssistantLauncher'
import { useIsMobile } from '@/hooks/useIsMobile'

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [assistantOpen, setAssistantOpen] = useState(false)
  const isMobile = useIsMobile()
  const closeAssistant = () => {
    setAssistantOpen(false)
    window.setTimeout(() => {
      const selector = isMobile ? '[aria-label="Open navigation"]' : '[aria-label="Open Ask ApplyWell"]'
      document.querySelector<HTMLElement>(selector)?.focus()
    })
  }
  const { pathname } = useLocation()
  const { root, leaf } = breadcrumbFor(pathname)

  const loadGamification = useGamificationStore((s) => s.load)
  const loaded = useGamificationStore((s) => s.loaded)

  useEffect(() => {
    if (!loaded) loadGamification()
  }, [loaded, loadGamification])

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar collapsed={collapsed} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar root={root} leaf={leaf} onToggleSidebar={() => setCollapsed((c) => !c)} />
        {/* pb-20 on mobile reserves space above the Speed Dial FAB */}
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <Outlet />
        </main>
      </div>
      <div className="md:hidden">
        <MobileNav onOpenAssistant={() => setAssistantOpen(true)} />
      </div>
      {!assistantOpen && <AssistantLauncher onOpen={() => setAssistantOpen(true)} />}
      {assistantOpen && <AssistantChat mobile={isMobile} onClose={closeAssistant} />}
    </div>
  )
}
