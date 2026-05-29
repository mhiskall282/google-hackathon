import { useState } from 'react'
import { AlertCircle, Map, MessageSquare } from 'lucide-react'
import { AlertFeed } from '../alerts/AlertFeed'
import { MapView } from '../map-view/MapView'
import { AgentChat } from '../agent-chat/AgentChat'

export function DashboardLayout() {
  const [activeTab, setActiveTab] = useState<'alerts' | 'map' | 'chat'>('map')

  return (
    <div className="flex-1 flex flex-col lg:flex-row w-full h-[calc(100vh-64px)] overflow-hidden bg-terminal-black">
      {/* Left Panel - Autonomous Alerts Feed (18% width on desktop) */}
      <section 
        id="tour-alerts"
        aria-label="Alerts feed sidebar"
        className={`w-full lg:w-[18%] lg:min-w-[240px] h-full lg:h-full border-r border-terminal-border flex flex-col overflow-hidden bg-terminal-dark/40 ${
          activeTab === 'alerts' ? 'flex' : 'hidden lg:flex'
        }`}
      >
        <AlertFeed />
      </section>

      {/* Center Panel - Geographic Operations Map (60% standard scale) */}
      <main 
        id="tour-map"
        aria-label="Operational map visualization"
        className={`w-full lg:flex-1 h-full lg:h-full relative overflow-hidden bg-slate-950 ${
          activeTab === 'map' ? 'block' : 'hidden lg:block'
        }`}
      >
        <MapView />
      </main>

      {/* Right Panel - AI Coordination Panel (25% width on desktop) */}
      <section 
        id="tour-chat"
        aria-label="AI coordinator chat panel"
        className={`w-full lg:w-[25%] lg:min-w-[320px] h-full lg:h-full border-l border-terminal-border flex flex-col overflow-hidden bg-terminal-dark/40 ${
          activeTab === 'chat' ? 'flex' : 'hidden lg:flex'
        }`}
      >
        <AgentChat />
      </section>

      {/* Mobile Navigation Tab Bar (Glassmorphic) */}
      <nav className="lg:hidden h-16 border-t border-terminal-border bg-terminal-dark/85 backdrop-blur-md flex items-center justify-around shrink-0 z-50 px-2 scanlines-overlay">
        <button
          type="button"
          onClick={() => setActiveTab('alerts')}
          className={`flex flex-col items-center justify-center gap-1 flex-1 h-full font-mono text-[9px] uppercase tracking-wider transition-all duration-200 ${
            activeTab === 'alerts'
              ? 'text-emergency-critical font-black scale-105'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <AlertCircle className="h-4.5 w-4.5" />
          <span>Alerts</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('map')}
          className={`flex flex-col items-center justify-center gap-1 flex-1 h-full font-mono text-[9px] uppercase tracking-wider transition-all duration-200 ${
            activeTab === 'map'
              ? 'text-emergency-info font-black scale-105'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Map className="h-4.5 w-4.5" />
          <span>Map</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('chat')}
          className={`flex flex-col items-center justify-center gap-1 flex-1 h-full font-mono text-[9px] uppercase tracking-wider transition-all duration-200 ${
            activeTab === 'chat'
              ? 'text-emergency-ok font-black scale-105'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <MessageSquare className="h-4.5 w-4.5" />
          <span>AI Copilot</span>
        </button>
      </nav>
    </div>
  )
}
