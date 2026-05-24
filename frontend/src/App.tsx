import { useState, useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Header } from '@/components/shared/Header'
import { DashboardLayout } from '@/features/dashboard/DashboardLayout'
import { LandingPage } from '@/features/landing/LandingPage'
import { AdminControls } from '@/features/admin/AdminControls'
import { useWebSocket } from '@/hooks/useWebSocket'
import { GuidedTour } from '@/components/shared/GuidedTour'
import { useTourStore } from '@/store/tourStore'

// Initialize TanStack Query client for API caching and polling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
})

function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'dashboard'>('landing')
  const [isAdminOpen, setIsAdminOpen] = useState(false)

  // Activate WebSocket listener when dashboard view is active
  useWebSocket(currentView === 'dashboard')

  const { hasCompletedTour, startTour } = useTourStore()

  // Start the tour automatically on first visit to dashboard
  useEffect(() => {
    if (currentView === 'dashboard' && !hasCompletedTour) {
      // Small delay to allow the dashboard layout to mount fully
      const timer = setTimeout(() => {
        startTour()
      }, 800)
      return () => clearTimeout(timer)
    }
  }, [currentView, hasCompletedTour, startTour])

  return (
    <QueryClientProvider client={queryClient}>
      {currentView === 'landing' ? (
        /* Cyberpunk Introductory Landing Onboarding Gate */
        <LandingPage onEnter={() => setCurrentView('dashboard')} />
      ) : (
        /* Real-time Incident Command Telemetry Center Dashboard */
        <div className="flex flex-col h-screen w-screen overflow-hidden bg-terminal-black relative">
          {/* Top Header Control Panel */}
          <Header 
            onToggleAdmin={() => setIsAdminOpen(!isAdminOpen)} 
            isAdminOpen={isAdminOpen} 
          />

          {/* Interactive Multi-Panel Layout */}
          <DashboardLayout />

          {/* Sliding Diagnostics & Settings Control Drawer */}
          <AdminControls 
            isOpen={isAdminOpen} 
            onClose={() => setIsAdminOpen(false)} 
          />

          {/* Interactive Guided Tour Overlay */}
          <GuidedTour />
        </div>
      )}
    </QueryClientProvider>
  )
}

export default App
