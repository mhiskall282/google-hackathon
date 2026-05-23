import React, { useState, useEffect } from 'react'
import { Volume2, VolumeX, ShieldAlert, Radio, Activity } from 'lucide-react'
import { useAlertStore } from '@/store/useAlertStore'

export function Header() {
  const { isAudioMuted, toggleAudioMute, alerts } = useAlertStore()
  const [time, setTime] = useState(new Date())

  // Dynamic ticking UTC clock
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const activeAlertsCount = alerts.filter(a => a.severity === 'critical' || a.severity === 'warning').length
  const formatTime = (d: Date) => {
    return d.toISOString().replace('T', ' ').substring(0, 19) + ' UTC'
  }

  return (
    <header className="h-16 w-full border-b border-terminal-border bg-terminal-dark/85 backdrop-blur-md px-6 flex items-center justify-between z-50 select-none scanlines-overlay">
      {/* Left: Brand Identity */}
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center h-9 w-9 border border-emergency-info/60 rounded bg-emergency-info/5">
          <Activity className="h-5 w-5 text-emergency-info animate-pulse" />
          <div className="absolute inset-0 rounded border border-emergency-info/30 scale-110 animate-ping opacity-30" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display font-black tracking-wider text-lg uppercase text-slate-100 m-0 leading-none">
              BEACON
            </h1>
            <span className="text-[10px] font-mono px-1.5 py-0.5 border border-emergency-info/40 text-emergency-info rounded bg-emergency-info/10">
              V1.2
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-400 tracking-widest uppercase leading-none block mt-1">
            Tactical Disaster Response Coordination
          </span>
        </div>
      </div>

      {/* Center: Mission Scenario Ticker */}
      <div className="hidden md:flex items-center gap-6 font-mono text-xs border border-terminal-border/80 px-4 py-1.5 rounded bg-slate-950/40">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emergency-critical animate-pulse" />
          <span className="text-slate-400">OPERATION:</span>
          <span className="text-slate-200 font-bold">ELENA RESPONSE</span>
        </div>
        <div className="w-[1px] h-4 bg-terminal-border" />
        <div>
          <span className="text-slate-400">T-LANDFALL:</span>
          <span className="text-slate-200 font-bold ml-1">24.0H</span>
        </div>
        <div className="w-[1px] h-4 bg-terminal-border" />
        <div>
          <span className="text-slate-400">SECTOR:</span>
          <span className="text-emergency-warning font-bold ml-1">HOUSTON METRO</span>
        </div>
        <div className="w-[1px] h-4 bg-terminal-border" />
        <div className="flex items-center gap-1.5 text-emergency-critical font-bold">
          <ShieldAlert className="h-3.5 w-3.5" />
          <span>{activeAlertsCount} SEVERE INCIDENTS</span>
        </div>
      </div>

      {/* Right: Telemetry Time and Control System */}
      <div className="flex items-center gap-4">
        {/* UTC Clock */}
        <div className="text-right font-mono hidden sm:block">
          <div className="text-xs text-slate-100 tracking-wider font-semibold">
            {formatTime(time)}
          </div>
          <div className="text-[9px] text-slate-400 tracking-widest flex items-center justify-end gap-1.5">
            <Radio className="h-2.5 w-2.5 text-emergency-ok animate-ping" />
            LIVE TELEMETRY SYNC
          </div>
        </div>

        <div className="w-[1px] h-6 bg-terminal-border hidden sm:block" />

        {/* Audio Alert Toggle */}
        <button
          type="button"
          onClick={toggleAudioMute}
          aria-label={isAudioMuted ? "Unmute warning alert sounds" : "Mute warning alert sounds"}
          className={`h-9 w-9 flex items-center justify-center rounded border transition-all duration-200 ${
            isAudioMuted 
              ? 'border-emergency-warning/40 bg-emergency-warning/5 text-emergency-warning hover:bg-emergency-warning/10' 
              : 'border-terminal-border bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          {isAudioMuted ? (
            <VolumeX className="h-4.5 w-4.5" />
          ) : (
            <Volume2 className="h-4.5 w-4.5" />
          )}
        </button>
      </div>
    </header>
  )
}
