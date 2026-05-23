import { useEffect, useState } from 'react'
import { AlertCircle, ShieldCheck, ShieldAlert, Eye, BookOpen } from 'lucide-react'
import { useAlertStore } from '@/store/useAlertStore'
import { useMapStore } from '@/store/useMapStore'
import { initialAlerts, incomingAlertsStream } from '@/services/mockData'
import type { AlertSeverity, Alert } from '@/types'
import { SOPManual } from '../qa/SOPManual'


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
  const [activeTab, setActiveTab] = useState<'alerts' | 'manual'>('alerts')
  const [feedSource, setFeedSource] = useState<'houston' | 'global'>('houston')
  
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

  // Load alerts depending on feedSource
  useEffect(() => {
    if (feedSource === 'global') {
      console.log('📡 Fetching global live disaster coordinates...');
      // Fly to global view to see world-wide events
      triggerFlyTo([20, 0], 2.5);
      
      // Fetch from Node server
      fetch('http://localhost:4000/api/alerts/live')
        .then((res) => {
          if (!res.ok) throw new Error('API failed');
          return res.json();
        })
        .then((data) => {
          setAlerts(data);
        })
        .catch((err) => {
          console.warn('⚠️ Server offline, fetching direct from public USGS and GDACS feeds:', err);
          // Resilience fallback: direct fetch from USGS & GDACS APIs directly in browser
          Promise.allSettled([
            fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson').then((r) => r.json()),
            fetch('https://www.gdacs.org/xml/gdacs.geojson').then((r) => r.json())
          ]).then(([usgsResult, gdacsResult]) => {
            const list: Alert[] = [];
            
            if (usgsResult.status === 'fulfilled' && usgsResult.value?.features) {
              const mapped: Alert[] = usgsResult.value.features.slice(0, 10).map((f: any) => ({
                id: `usgs-fallback-${f.id}`,
                title: `USGS: M ${f.properties.mag} Earthquake`,
                description: f.properties.place || 'Seismic event detected',
                severity: f.properties.mag >= 6.0 ? 'critical' : f.properties.mag >= 5.0 ? 'warning' : 'info',
                lat: f.geometry.coordinates[1],
                lng: f.geometry.coordinates[0],
                timestamp: new Date(f.properties.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                verified: true,
                category: 'general'
              }));
              list.push(...mapped);
            }
            
            if (gdacsResult.status === 'fulfilled' && gdacsResult.value?.features) {
              const mapped: Alert[] = gdacsResult.value.features.slice(0, 10).map((f: any) => {
                const props = f.properties;
                const geom = f.geometry;
                let severity: AlertSeverity = 'info';
                if (props.alertlevel === 'red') severity = 'critical';
                else if (props.alertlevel === 'orange') severity = 'warning';
                
                return {
                  id: `gdacs-fallback-${props.eventid || Math.random()}`,
                  title: props.eventname ? `GDACS: ${props.eventname}` : 'Global Disaster Alert',
                  description: props.description || `Active event type: ${props.eventtype} with severity ${props.alertlevel}`,
                  severity,
                  lat: geom.coordinates[1],
                  lng: geom.coordinates[0],
                  timestamp: props.todate || 'Active Now',
                  verified: true,
                  category: 'general'
                };
              });
              list.push(...mapped);
            }
            
            setAlerts(list);
          }).catch((fallbackErr) => {
            console.error('❌ Failed both fallback feeds:', fallbackErr);
          });
        });
    } else {
      setAlerts(initialAlerts);
      // Center back to Houston focus area
      triggerFlyTo([29.7604, -95.3698], 11);
    }
  }, [feedSource, setAlerts, triggerFlyTo]);

  // Simulate real-time alerts streaming: stream in alert-5, 6, 7 every 15 seconds (Houston only)
  useEffect(() => {
    if (feedSource !== 'houston') return;
    
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
  }, [addAlert, isAudioMuted, feedSource])

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
      {/* Sidebar Tabs */}
      <div className="flex border-b border-terminal-border bg-slate-950/20 shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab('alerts')}
          className={`flex-1 py-3 px-2 flex items-center justify-center gap-1.5 border-b-2 font-mono text-[9px] font-bold tracking-wider transition-all duration-200 ${
            activeTab === 'alerts'
              ? 'border-emergency-critical text-slate-100 bg-slate-900/40 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-950/40'
          }`}
        >
          <AlertCircle className={`h-3.5 w-3.5 ${activeTab === 'alerts' ? 'text-emergency-critical animate-pulse' : 'text-slate-500'}`} />
          ALERTS ({filteredAlerts.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('manual')}
          className={`flex-1 py-3 px-2 flex items-center justify-center gap-1.5 border-b-2 font-mono text-[9px] font-bold tracking-wider transition-all duration-200 ${
            activeTab === 'manual'
              ? 'border-emergency-info text-slate-100 bg-slate-900/40 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-950/40'
          }`}
        >
          <BookOpen className={`h-3.5 w-3.5 ${activeTab === 'manual' ? 'text-emergency-info animate-pulse' : 'text-slate-500'}`} />
          SOP MANUAL
        </button>
      </div>

      {/* Conditionally Render Panel */}
      {activeTab === 'alerts' ? (
        <>
          {/* Live Global Feed Toggle */}
          <div className="p-2 bg-slate-900/40 border-b border-terminal-border flex items-center justify-between gap-1.5 shrink-0">
            <span className="text-[8px] font-mono font-bold tracking-wider text-slate-400 uppercase">
              FEED TARGET
            </span>
            <div className="flex bg-slate-950 border border-terminal-border/60 rounded overflow-hidden">
              <button
                type="button"
                onClick={() => setFeedSource('houston')}
                className={`text-[8px] font-mono uppercase px-2 py-0.5 transition-all cursor-pointer ${
                  feedSource === 'houston'
                    ? 'bg-emergency-critical/20 text-emergency-critical font-bold'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Houston
              </button>
              <button
                type="button"
                onClick={() => setFeedSource('global')}
                className={`text-[8px] font-mono uppercase px-2 py-0.5 transition-all cursor-pointer ${
                  feedSource === 'global'
                    ? 'bg-emergency-info/20 text-emergency-info font-bold'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Global Live
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="p-2 bg-slate-950/60 border-b border-terminal-border flex items-center gap-1 overflow-x-auto shrink-0">
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
        </>
      ) : (
        <SOPManual />
      )}
    </div>
  )
}

