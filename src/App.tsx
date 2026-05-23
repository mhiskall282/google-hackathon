import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Header } from '@/components/shared/Header'
import { DashboardLayout } from '@/features/dashboard/DashboardLayout'

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
  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex flex-col h-screen w-screen overflow-hidden bg-terminal-black">
        {/* Top Header Panel */}
        <Header />

        {/* Dynamic Multi-Panel Workspace */}
        <DashboardLayout />
      </div>
    </QueryClientProvider>
  )
}

export default App
