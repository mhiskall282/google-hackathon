import { AlertFeed } from '../alerts/AlertFeed'
import { MapView } from '../map-view/MapView'
import { AgentChat } from '../agent-chat/AgentChat'

export function DashboardLayout() {
  return (
    <div className="flex-1 flex flex-col lg:flex-row w-full min-h-[calc(100vh-64px)] lg:h-[calc(100vh-64px)] bg-terminal-black">
      {/* Left Panel - Autonomous Alerts Feed (18% width on desktop) */}
      <section 
        id="tour-alerts"
        aria-label="Alerts feed sidebar"
        className="w-full lg:w-[18%] lg:min-w-[240px] min-h-[300px] lg:h-full border-b lg:border-b-0 lg:border-r border-terminal-border flex flex-col overflow-hidden bg-terminal-dark/40"
      >
        <AlertFeed />
      </section>

      {/* Center Panel - Geographic Operations Map (60% standard scale) */}
      <main 
        id="tour-map"
        aria-label="Operational map visualization"
        className="w-full lg:flex-1 min-h-[400px] lg:h-full relative overflow-hidden bg-slate-950"
      >
        <MapView />
      </main>

      {/* Right Panel - AI Coordination Panel (25% width on desktop) */}
      <section 
        id="tour-chat"
        aria-label="AI coordinator chat panel"
        className="w-full lg:w-[25%] lg:min-w-[320px] min-h-[400px] lg:h-full border-t lg:border-t-0 lg:border-l border-terminal-border flex flex-col overflow-hidden bg-terminal-dark/40"
      >
        <AgentChat />
      </section>
    </div>
  )
}
