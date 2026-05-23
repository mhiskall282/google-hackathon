import React, { useState } from 'react'
import { X, Play, Cpu, AlertTriangle, Plus, Sliders, MapPin } from 'lucide-react'
import { useAlertStore } from '@/store/useAlertStore'
import { useMapStore } from '@/store/useMapStore'
import { incomingAlertsStream, HOUSTON_COORDS } from '@/services/mockData'
import { AlertSeverity, Alert } from '@/types'

interface AdminControlsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminControls({ isOpen, onClose }: AdminControlsProps) {
  const { addAlert } = useAlertStore()
  const { triggerFlyTo } = useMapStore()

  // Form states for custom alert creation
  const [customTitle, setCustomTitle] = useState('')
  const [customDesc, setCustomDesc] = useState('')
  const [customSeverity, setCustomSeverity] = useState<AlertSeverity>('warning')
  const [customLat, setCustomLat] = useState('29.7604')
  const [customLng, setCustomLng] = useState('-95.3698')

  // AI thinking delay setting state (linked dynamically to chat speed simulator)
  const [aiDelay, setAiDelay] = useState(1500)
  const [aiTemp, setAiTemp] = useState(0.7)

  if (!isOpen) return null

  // Inject a pre-set crisis alert from the incoming alerts database
  const handleInjectPreset = (alertId: string) => {
    const alertItem = incomingAlertsStream.find((a) => a.id === alertId)
    if (alertItem) {
      addAlert(alertItem)
      triggerFlyTo([alertItem.lat, alertItem.lng], 13.5)
    }
  }

  // Pre-fill coordinates helpers for user convenience
  const handlePreFillCoords = (locKey: keyof typeof HOUSTON_COORDS) => {
    const coords = HOUSTON_COORDS[locKey]
    if (coords) {
      setCustomLat(coords[0].toFixed(4))
      setCustomLng(coords[1].toFixed(4))
    }
  }

  // Deploy custom user alert
  const handleDeployCustomAlert = (e: React.FormEvent) => {
    e.preventDefault()
    if (!customTitle.trim() || !customDesc.trim()) return

    const latVal = parseFloat(customLat)
    const lngVal = parseFloat(customLng)
    if (isNaN(latVal) || isNaN(lngVal)) return

    const newAlert: Alert = {
      id: `custom-alert-${Date.now()}`,
      title: customTitle,
      description: customDesc,
      severity: customSeverity,
      lat: latVal,
      lng: lngVal,
      timestamp: 'Manual Deploy',
      verified: true,
      category: 'general'
    }

    addAlert(newAlert)
    triggerFlyTo([latVal, lngVal], 13.5)
    
    // Clear form inputs
    setCustomTitle('')
    setCustomDesc('')
  }

  return (
    <div className="absolute inset-0 z-[1000] flex justify-end select-none pointer-events-none">
      {/* Dim backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/45 backdrop-blur-xs pointer-events-auto cursor-pointer"
      />

      {/* Slide-out drawer panel */}
      <div className="relative w-80 h-full border-l border-terminal-border bg-slate-950/95 glass-panel-heavy p-5 flex flex-col justify-between overflow-y-auto pointer-events-auto shadow-2xl">
        <div className="space-y-6">
          {/* Drawer Header */}
          <div className="flex items-center justify-between border-b border-terminal-border pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="h-4.5 w-4.5 text-emergency-info animate-pulse" />
              <h2 className="text-xs font-mono font-bold tracking-widest text-slate-100 uppercase">
                ADMIN CORE CONTROLS
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close admin control panel"
              className="text-slate-500 hover:text-slate-300 transition-colors p-1 rounded"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Section 1: Crisis Injector Presets */}
          <div className="space-y-3.5">
            <span className="block text-[8px] font-mono font-bold tracking-widest text-slate-500 uppercase">
              CRISIS INJECTION PIPELINE
            </span>
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => handleInjectPreset('alert-5')}
                className="w-full flex items-center justify-between border border-emergency-critical/40 hover:border-emergency-critical px-3 py-2 rounded bg-emergency-critical/5 hover:bg-emergency-critical/15 text-left font-mono text-[9px] text-slate-200 transition-all"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-emergency-critical animate-bounce" />
                  <span>INJECT: Toyota Center Gas Leak</span>
                </div>
                <Play className="h-3 w-3 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => handleInjectPreset('alert-6')}
                className="w-full flex items-center justify-between border border-emergency-warning/40 hover:border-emergency-warning px-3 py-2 rounded bg-emergency-warning/5 hover:bg-emergency-warning/15 text-left font-mono text-[9px] text-slate-200 transition-all"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-emergency-warning" />
                  <span>INJECT: Water Cache North Failure</span>
                </div>
                <Play className="h-3 w-3 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => handleInjectPreset('alert-7')}
                className="w-full flex items-center justify-between border border-emergency-info/40 hover:border-emergency-info px-3 py-2 rounded bg-emergency-info/5 hover:bg-emergency-info/15 text-left font-mono text-[9px] text-slate-200 transition-all"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-emergency-info" />
                  <span>INJECT: HBU Gymnasium Overflow</span>
                </div>
                <Play className="h-3 w-3 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Section 2: Create Custom Alert Form */}
          <div className="space-y-3.5 border-t border-terminal-border/40 pt-4">
            <span className="block text-[8px] font-mono font-bold tracking-widest text-slate-500 uppercase">
              CREATE CUSTOM INCIDENT
            </span>
            <form onSubmit={handleDeployCustomAlert} className="space-y-3">
              <div>
                <label className="block text-[8px] font-mono text-slate-400 uppercase mb-1">Incident Title</label>
                <input
                  type="text"
                  required
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="e.g. Flood gage sensor error"
                  className="w-full bg-slate-950 border border-terminal-border rounded px-2 py-1 text-[10px] text-slate-200 font-mono focus:outline-none focus:border-emergency-info/60"
                />
              </div>

              <div>
                <label className="block text-[8px] font-mono text-slate-400 uppercase mb-1">Description</label>
                <textarea
                  required
                  value={customDesc}
                  onChange={(e) => setCustomDesc(e.target.value)}
                  placeholder="Details of emergency..."
                  rows={2}
                  className="w-full bg-slate-950 border border-terminal-border rounded px-2 py-1 text-[10px] text-slate-200 font-mono focus:outline-none focus:border-emergency-info/60 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[8px] font-mono text-slate-400 uppercase mb-1">Latitude</label>
                  <input
                    type="text"
                    required
                    value={customLat}
                    onChange={(e) => setCustomLat(e.target.value)}
                    className="w-full bg-slate-950 border border-terminal-border rounded px-2 py-1 text-[10px] text-slate-200 font-mono focus:outline-none focus:border-emergency-info/60"
                  />
                </div>
                <div>
                  <label className="block text-[8px] font-mono text-slate-400 uppercase mb-1">Longitude</label>
                  <input
                    type="text"
                    required
                    value={customLng}
                    onChange={(e) => setCustomLng(e.target.value)}
                    className="w-full bg-slate-950 border border-terminal-border rounded px-2 py-1 text-[10px] text-slate-200 font-mono focus:outline-none focus:border-emergency-info/60"
                  />
                </div>
              </div>

              {/* Coordinates pre-fill chips */}
              <div className="flex items-center gap-1 overflow-x-auto py-0.5 scrollbar-none">
                <button
                  type="button"
                  onClick={() => handlePreFillCoords('nrg')}
                  className="flex items-center gap-0.5 text-[8px] font-mono border border-terminal-border px-1.5 py-0.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                >
                  <MapPin className="h-2 w-2" /> NRG
                </button>
                <button
                  type="button"
                  onClick={() => handlePreFillCoords('grb')}
                  className="flex items-center gap-0.5 text-[8px] font-mono border border-terminal-border px-1.5 py-0.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                >
                  <MapPin className="h-2 w-2" /> GRB
                </button>
                <button
                  type="button"
                  onClick={() => handlePreFillCoords('dist_east')}
                  className="flex items-center gap-0.5 text-[8px] font-mono border border-terminal-border px-1.5 py-0.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                >
                  <MapPin className="h-2 w-2" /> EastHub
                </button>
              </div>

              <div>
                <label className="block text-[8px] font-mono text-slate-400 uppercase mb-1">Severity</label>
                <div className="grid grid-cols-4 gap-1">
                  {(['critical', 'warning', 'unverified', 'info'] as const).map((sev) => (
                    <button
                      key={sev}
                      type="button"
                      onClick={() => setCustomSeverity(sev)}
                      className={`text-[8px] font-mono uppercase py-1 rounded border transition-all ${
                        customSeverity === sev
                          ? sev === 'critical' ? 'bg-emergency-critical/15 border-emergency-critical text-emergency-critical' :
                            sev === 'warning' ? 'bg-emergency-warning/15 border-emergency-warning text-emergency-warning' :
                            sev === 'unverified' ? 'bg-emergency-unverified/15 border-emergency-unverified text-emergency-unverified' :
                            'bg-emergency-info/15 border-emergency-info text-emergency-info'
                          : 'border-terminal-border text-slate-400 hover:text-slate-300'
                      }`}
                    >
                      {sev.substring(0, 4)}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-1.5 border border-emergency-info bg-emergency-info/10 text-emergency-info hover:bg-emergency-info hover:text-terminal-black font-mono font-bold tracking-widest text-[9px] uppercase py-2 rounded transition-all duration-200"
              >
                <Plus className="h-3.5 w-3.5" />
                Deploy Incident Metrics
              </button>
            </form>
          </div>

          {/* Section 3: AI Parameter Tuning */}
          <div className="space-y-3.5 border-t border-terminal-border/40 pt-4">
            <span className="block text-[8px] font-mono font-bold tracking-widest text-slate-500 uppercase">
              AI MODEL PARAMETERS
            </span>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-[8px] font-mono text-slate-400 uppercase mb-1">
                  <span>Simulation Thinking Delay</span>
                  <span className="text-slate-200 font-bold">{aiDelay}ms</span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="4000"
                  step="250"
                  value={aiDelay}
                  onChange={(e) => setAiDelay(parseInt(e.target.value))}
                  className="w-full accent-emergency-info bg-slate-900 border-none cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[8px] font-mono text-slate-400 uppercase mb-1">
                  <span>LLM Temperature</span>
                  <span className="text-slate-200 font-bold">{aiTemp.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.1"
                  value={aiTemp}
                  onChange={(e) => setAiTemp(parseFloat(e.target.value))}
                  className="w-full accent-emergency-info bg-slate-900 border-none cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: System Readout diagnostic */}
        <div className="border-t border-terminal-border/40 pt-4 mt-6">
          <span className="block text-[8px] font-mono font-bold tracking-widest text-slate-500 uppercase mb-2">
            TELEMETRY DIAGNOSTICS
          </span>
          <div className="bg-slate-950/80 p-2.5 rounded border border-terminal-border/60 font-mono text-[8px] text-slate-400 space-y-1">
            <div className="flex justify-between">
              <span>Cache Latency:</span>
              <span className="text-slate-300 font-bold">42ms (Sync)</span>
            </div>
            <div className="flex justify-between">
              <span>Memory Buff:</span>
              <span className="text-slate-300 font-bold">12.4 MB (Active)</span>
            </div>
            <div className="flex justify-between">
              <span>SSE Channels:</span>
              <span className="text-emergency-ok font-bold uppercase flex items-center gap-0.5">
                <Cpu className="h-2 w-2" /> connected
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
