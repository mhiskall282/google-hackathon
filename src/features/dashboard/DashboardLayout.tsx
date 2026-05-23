import React from 'react'
import { AlertFeed } from '../alerts/AlertFeed'
import { MapView } from '../map-view/MapView'
import { AgentChat } from '../agent-chat/AgentChat'

export function DashboardLayout() {
  return (
    <div className="flex-1 flex flex-col lg:flex-row w-full h-[calc(100vh-64px)] overflow-hidden bg-terminal-black">
      {/* Left Panel - Autonomous Alerts Feed (18% width on desktop) */}
      <section 
        aria-label="Alerts feed sidebar"
        className="w-full lg:w-[18%] min-w-[240px] h-[25vh] lg:h-full border-b lg:border-b-0 lg:border-r border-terminal-border flex flex-col overflow-hidden bg-terminal-dark/40"
      >
        <AlertFeed />
      </section>

      {/* Center Panel - Geographic Operations Map (60% standard scale) */}
      <main 
        aria-label="Operational map visualization"
        className="flex-1 h-[45vh] lg:h-full relative overflow-hidden bg-slate-950"
      >
        <MapView />
      </main>

      {/* Right Panel - AI Coordination Panel (25% width on desktop) */}
      <section 
        aria-label="AI coordinator chat panel"
        className="w-full lg:w-[25%] min-w-[320px] h-[30vh] lg:h-full border-t lg:border-t-0 lg:border-l border-terminal-border flex flex-col overflow-hidden bg-terminal-dark/40"
      >
        <AgentChat />
      </section>
    </div>
  )
}
