import React, { useEffect } from 'react'
import { AlertCircle, ShieldCheck, ShieldAlert, VolumeX, Eye } from 'lucide-react'
import { useAlertStore } from '@/store/useAlertStore'
import { useMapStore } from '@/store/useMapStore'
import { initialAlerts, incomingAlertsStream } from '@/services/mockData'
import { AlertSeverity } from '@/types'

// Web Audio API Synthesizer sound generator
const triggerBeepNode = (freq: number, duration: number, isMuted: boolean) => {
  if (isMuted) return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch (error) {
    // Silent fail if browser blocks autoplay
  }
}

export function AlertFeed() {
  const { 
    alerts, 
    activeFilter, 
    selectedAlertId, 
    isAudioMuted, 
    setAlerts, 
    addAlert,
    setSelectedAlertId, 
    setFilter 
  } = useAlertStore()
  
  const { triggerFlyTo, setSelectedAlertId: setSelectedMapAlertId } = useMapStore()

  // Initialize initial alerts
  useEffect(() => {
    setAlerts(initialAlerts)
  }, [setAlerts])

  // Simulate real-time alerts streaming: stream in alert-5, 6, 7 every 12 seconds
  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (index < incomingAlertsStream.length) {
        const nextAlert = incomingAlertsStream[index]
        addAlert(nextAlert)
        
        // Play distinct high beep for critical, lower double-beep for warning
        if (nextAlert.severity === 'critical') {
          triggerBeepNode(880, 0.45, isAudioMuted)
        } else {
          triggerBeepNode(580, 0.25, isAudioMuted)
        }
        
        index++;
      } else {
        clearInterval(interval)
      }
    }, 15000)

    return () => clearInterval(interval)
  }, [addAlert, isAudioMuted])

  const filteredAlerts = alerts.filter((alert) => {
    if (activeFilter === 'all') return true;
    return alert.severity === activeFilter;
  })

  const handleSelectAlert = (alertId: string, lat: number, lng: number) => {
    setSelectedAlertId(alertId)
    setSelectedMapAlertId(alertId)
    triggerBeepNode(440, 0.1, isAudioMuted) // Feedback click sound
    triggerFlyTo([lat, lng], 13) // Zoom and pan map
  }

  // Visual helper for severity borders
  const getSeverityClasses = (severity: AlertSeverity) => {
    switch (severity) {
      case 'critical':
        return {
          border: 'border-l-4 border-l-emergency-critical border-terminal-border',
          text: 'text-emergency-critical',
          bg: 'bg-emergency-critical/5'
        }
      case 'warning':
        return {
          border: 'border-l-4 border-l-emergency-warning border-terminal-border',
          text: 'text-emergency-warning',
          bg: 'bg-emergency-warning/5'
        }
      case 'unverified':
        return {
          border: 'border-l-4 border-l-emergency-unverified border-terminal-border',
          text: 'text-emergency-unverified',
          bg: 'bg-emergency-unverified/5'
        }
      default:
        return {
          border: 'border-l-4 border-l-emergency-info border-terminal-border',
          text: 'text-emergency-info',
          bg: 'bg-emergency-info/5'
        }
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden select-none">
      {/* Title */}
      <div className="p-4 border-b border-terminal-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4.5 w-4.5 text-emergency-critical animate-pulse" />
          <h2 className="text-xs font-mono font-bold tracking-widest text-slate-100 uppercase">
            ALERTS TIMELINE
          </h2>
        </div>
        <span className="text-[10px] font-mono bg-slate-900 border border-slate-700/60 px-1.5 py-0.5 rounded text-slate-400">
          {filteredAlerts.length} Active
        </span>
      </div>

      {/* Filters */}
      <div className="p-2 bg-slate-950/60 border-b border-terminal-border flex items-center gap-1 overflow-x-auto">
        {(['all', 'critical', 'warning', 'unverified'] as const).map((filterVal) => (
          <button
            key={filterVal}
            type="button"
            onClick={() => setFilter(filterVal)}
            className={`text-[9px] font-mono uppercase px-2 py-1 rounded border transition-all duration-150 shrink-0 ${
              activeFilter === filterVal
                ? 'bg-slate-800 border-slate-600 text-slate-100'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            {filterVal}
          </button>
        ))}
      </div>

      {/* Feed List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3.5">
        {filteredAlerts.length === 0 ? (
          <div className="text-center font-mono text-[10px] text-slate-500 py-10">
            NO ACTIVE ALERTS REPORTED
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const styles = getSeverityClasses(alert.severity)
            const isSelected = selectedAlertId === alert.id

            return (
              <div
                key={alert.id}
                onClick={() => handleSelectAlert(alert.id, alert.lat, alert.lng)}
                className={`glass-panel border rounded p-3 transition-all duration-200 cursor-pointer ${styles.border} ${styles.bg} ${
                  isSelected 
                    ? 'ring-1 ring-emergency-info/60 border-slate-600 shadow-lg shadow-black/40 scale-[0.98]' 
                    : 'hover:border-slate-700 hover:bg-slate-900/10'
                }`}
              >
                {/* Card Header */}
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-[10px] font-mono font-bold tracking-wide uppercase ${styles.text}`}>
                    {alert.severity}
                  </span>
                  <span className="text-[9px] font-mono text-slate-500">
                    {alert.timestamp}
                  </span>
                </div>

                {/* Card Title */}
                <h3 className="text-xs font-display font-semibold text-slate-100 mb-1 leading-snug">
                  {alert.title}
                </h3>

                {/* Card Desc */}
                <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed mb-2.5">
                  {alert.description}
                </p>

                {/* Card Footer badges */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {alert.verified ? (
                      <span className="flex items-center gap-1 text-[8px] font-mono text-emergency-ok uppercase border border-emergency-ok/30 px-1 py-0.5 rounded bg-emergency-ok/5">
                        <ShieldCheck className="h-2.5 w-2.5" />
                        Verified
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[8px] font-mono text-emergency-unverified uppercase border border-emergency-unverified/30 px-1 py-0.5 rounded bg-emergency-unverified/5 animate-pulse">
                        <ShieldAlert className="h-2.5 w-2.5 animate-bounce" />
                        Unverified
                      </span>
                    )}
                  </div>

                  <span className="flex items-center gap-1 text-[8px] font-mono text-slate-400 hover:text-slate-200 transition-colors">
                    <Eye className="h-2.5 w-2.5" />
                    Locate
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
