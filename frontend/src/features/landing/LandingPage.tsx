import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Cpu, 
  Map, 
  Globe, 
  Activity, 
  Terminal, 
  ArrowRight, 
  Check 
} from 'lucide-react'

// Web Audio API Synthesizer Boot sound sweep
const playBootSound = () => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    // Sweep oscillator
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(740, ctx.currentTime + 1.6);
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(180, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(2400, ctx.currentTime + 1.6);
    
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.4);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.6);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 1.6);
    
    // High confirmation beep at completion
    setTimeout(() => {
      try {
        const pingCtx = new AudioContextClass();
        const pingOsc = pingCtx.createOscillator();
        const pingGain = pingCtx.createGain();
        
        pingOsc.connect(pingGain);
        pingGain.connect(pingCtx.destination);
        
        pingOsc.frequency.setValueAtTime(1080, pingCtx.currentTime);
        pingGain.gain.setValueAtTime(0.08, pingCtx.currentTime);
        pingGain.gain.exponentialRampToValueAtTime(0.0001, pingCtx.currentTime + 0.6);
        
        pingOsc.start(pingCtx.currentTime);
        pingOsc.stop(pingCtx.currentTime + 0.6);
      } catch { /* ignore */ }
    }, 1500);

  } catch {
    // Audio blocked
  }
}

interface LandingPageProps {
  onEnter: () => void;
}

export function LandingPage({ onEnter }: LandingPageProps) {
  const [booting, setBooting] = useState(false)
  const [bootProgress, setBootProgress] = useState<string[]>([])
  const [activePlaygroundTab, setActivePlaygroundTab] = useState<'map' | 'copilot' | 'feeds'>('map')
  const [simulationStatus, setSimulationStatus] = useState<'idle' | 'running' | 'success'>('idle')
  const [liveLogIndex, setLiveLogIndex] = useState(0)

  const bootLogs = [
    'ESTABLISHING SYSTEM SECURE PROTOCOLS...',
    'CONNECTING TO SUPABASE DATABASE POOLER...',
    'FETCHING LIVE UN GDACS GLOBAL COORDINATES...',
    'FETCHING LIVE USGS SEISMIC ACTIVITY FEED...',
    'RESOLVING HARRIS COUNTY EMERGENCY CORRIDORS INDEX...',
    'ALLOCATING ZUSTAND CLIENT-SIDE MEMORY STORES...',
    'INTEGRATING LEAFLET GEOGRAPHIC VECTOR VIEWER...',
    'ESTABLISHING WEBSOCKET REAL-TIME BROADCAST GRID...',
    'BOOTING GEMINI COPILOT REASONING CORE...',
    'BEACON CRISIS CONSOLE PROTOCOL V2.0 ONLINE.'
  ]

  const liveFeedsMock = [
    { source: 'USGS', event: 'M 5.8 Earthquake', region: 'Honshu, Japan', coords: [36.2, 140.1], level: 'orange' },
    { source: 'GDACS', event: 'Tropical Cyclone Mawar', region: 'Pacific Ocean', coords: [13.5, 144.8], level: 'red' },
    { source: 'GDACS', event: 'Severe Flood Breaches', region: 'Bavaria, Germany', coords: [48.1, 11.5], level: 'orange' },
    { source: 'USGS', event: 'M 6.1 Seismic Impact', region: 'California Coast', coords: [34.0, -119.5], level: 'red' }
  ]

  useEffect(() => {
    if (activePlaygroundTab !== 'feeds') return
    const interval = setInterval(() => {
      setLiveLogIndex((prev) => (prev + 1) % liveFeedsMock.length)
    }, 3000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePlaygroundTab])

  const handleBoot = () => {
    if (booting) return
    setBooting(true)
    playBootSound()
    
    // Print simulated log items sequentially
    let logIndex = 0;
    const interval = setInterval(() => {
      if (logIndex < bootLogs.length) {
        setBootProgress((prev) => [...prev, bootLogs[logIndex]])
        logIndex++;
      } else {
        clearInterval(interval)
        setTimeout(() => {
          onEnter()
        }, 800)
      }
    }, 180)
  }

  const handleRunSimulation = () => {
    if (simulationStatus !== 'idle') return
    setSimulationStatus('running')
    setTimeout(() => {
      setSimulationStatus('success')
    }, 2000)
  }

  const scrollToCapabilities = () => {
    document.getElementById('capabilities')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="relative w-full h-screen overflow-y-auto bg-mongodb-dark text-mongodb-text font-sans scroll-smooth">
      {/* Background radial highlights in MongoDB green and slate */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-mongodb-green/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-mongodb-slate/15 rounded-full blur-[160px] pointer-events-none" />
      
      {/* Subtle lines grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.005)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.005)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none" />

      <AnimatePresence mode="wait">
        {!booting ? (
          <motion.div 
            key="landing-root"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col min-h-screen"
          >
            {/* Header Navigation */}
            <header className="border-b border-slate-800/80 bg-mongodb-dark/80 backdrop-blur-md sticky top-0 z-50 px-4 sm:px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="font-display font-black text-lg sm:text-xl tracking-wider text-white">
                  BEACON
                </span>
                <span className="flex items-center gap-1.5 text-[8px] font-mono font-bold tracking-widest text-mongodb-green uppercase border border-mongodb-green/30 bg-mongodb-green/5 px-2 py-0.5 rounded shrink-0">
                  <span className="h-1.5 w-1.5 rounded-full bg-mongodb-green animate-ping" />
                  Live Feed Connected
                </span>
              </div>
              <div className="flex items-center gap-3 sm:gap-6 text-xs font-mono">
                <a 
                  href="#capabilities" 
                  onClick={(e) => { e.preventDefault(); scrollToCapabilities(); }}
                  className="hidden md:inline text-slate-400 hover:text-white transition-colors"
                >
                  CAPABILITIES
                </a>
                <a 
                  href="#playground" 
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('playground')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="hidden md:inline text-slate-400 hover:text-white transition-colors"
                >
                  PLAYGROUND
                </a>
                <button
                  onClick={handleBoot}
                  className="bg-mongodb-green hover:bg-mongodb-green/90 text-mongodb-dark px-3 py-1.5 rounded font-bold text-xs tracking-wider transition-all whitespace-nowrap cursor-pointer"
                >
                  LAUNCH CONSOLE
                </button>
              </div>
            </header>

            {/* Hero Section */}
            <section className="px-6 py-20 md:py-28 max-w-5xl mx-auto text-center space-y-8 relative">
              <div className="inline-flex items-center gap-2 border border-mongodb-green/30 bg-mongodb-slate/20 px-3.5 py-1.5 rounded-full text-[10px] sm:text-xs font-mono text-mongodb-green animate-pulse mx-auto">
                <Activity className="h-3.5 w-3.5" />
                <span>REAL-TIME DISASTER COORDINATION NETWORK</span>
              </div>

              <h1 className="font-display font-black text-3xl sm:text-5xl md:text-7xl text-white leading-tight tracking-tight max-w-4xl mx-auto">
                Unified Crisis Intelligence <br />
                <span className="bg-gradient-to-r from-mongodb-green via-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                  For Emergency Logistics
                </span>
              </h1>

              <p className="text-slate-400 text-sm sm:text-base md:text-lg max-w-2xl mx-auto font-sans leading-relaxed">
                Beacon integrates global real-time event feeds (GDACS & USGS) and local tactical telemetry with automated SOP guidelines and a Gemini AI-powered reasoning engine to secure operational response environments.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
                <button
                  onClick={handleBoot}
                  className="w-full sm:w-auto h-12 px-8 rounded bg-mongodb-green hover:bg-mongodb-green/90 text-mongodb-dark font-mono font-bold tracking-widest text-xs uppercase transition-all shadow-lg shadow-mongodb-green/20 flex items-center justify-center gap-2 group cursor-pointer"
                >
                  Initialize Command Core
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>
                <button
                  onClick={scrollToCapabilities}
                  className="w-full sm:w-auto h-12 px-8 rounded border border-slate-700 hover:border-slate-500 bg-slate-900/30 hover:bg-slate-900/60 font-mono font-bold text-slate-300 text-xs tracking-widest uppercase transition-all cursor-pointer"
                >
                  Explore Capabilities
                </button>
              </div>
            </section>

            {/* Capabilities Grid */}
            <section id="capabilities" className="border-t border-slate-900 bg-mongodb-dark/40 px-6 py-20 scroll-mt-10">
              <div className="max-w-5xl mx-auto space-y-12">
                <div className="text-center space-y-3">
                  <span className="text-[10px] font-mono font-bold tracking-widest text-mongodb-green uppercase">
                    CAPABILITIES MATRIX
                  </span>
                  <h2 className="text-2xl sm:text-4xl font-display font-black text-white">
                    Engineered for high-intensity resilience.
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Card 1 */}
                  <div className="border border-slate-800/80 bg-mongodb-card/45 p-6 rounded-lg hover:border-mongodb-green/30 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-mongodb-green/5 rounded-full blur-2xl pointer-events-none group-hover:bg-mongodb-green/10" />
                    <div className="p-3 bg-mongodb-slate/30 border border-mongodb-green/20 rounded w-fit mb-4">
                      <Map className="h-5 w-5 text-mongodb-green" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Live GIS Tactical Overlays</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Leaflet-based vector layouts showing shelter capacities, transit segment corridors, supply depots, and real-time precipitation radars. Tracks statuses like blocked segments, low cache reserves, and full occupancies.
                    </p>
                  </div>

                  {/* Card 2 */}
                  <div className="border border-slate-800/80 bg-mongodb-card/45 p-6 rounded-lg hover:border-mongodb-green/30 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-400/5 rounded-full blur-2xl pointer-events-none group-hover:bg-cyan-400/10" />
                    <div className="p-3 bg-cyan-950/20 border border-cyan-400/20 rounded w-fit mb-4">
                      <Globe className="h-5 w-5 text-cyan-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Global Feeds Aggregation</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Real-time aggregation from the UN GDACS (tropical cyclones, floods, eruptions) and USGS (active earthquakes 4.5+). Features automatic browser-side fallbacks using promise orchestration in case of backend server drops.
                    </p>
                  </div>

                  {/* Card 3 */}
                  <div className="border border-slate-800/80 bg-mongodb-card/45 p-6 rounded-lg hover:border-mongodb-green/30 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-400/5 rounded-full blur-2xl pointer-events-none group-hover:bg-emerald-400/10" />
                    <div className="p-3 bg-emerald-950/20 border border-emerald-400/20 rounded w-fit mb-4">
                      <Cpu className="h-5 w-5 text-emerald-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Gemini AI Copilot & SOPs</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      A conversational assistant powered by Google Gemini Pro that reasons step-by-step, executes mock crisis tools, and formats actionable dispatch orders synced with interactive Standard Operating Procedure manuals.
                    </p>
                  </div>

                  {/* Card 4 */}
                  <div className="border border-slate-800/80 bg-mongodb-card/45 p-6 rounded-lg hover:border-mongodb-green/30 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-purple-500/10" />
                    <div className="p-3 bg-purple-950/20 border border-purple-400/20 rounded w-fit mb-4">
                      <Terminal className="h-5 w-5 text-purple-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">High-Resiliency Architecture</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Wired as a pnpm monorepo structure. Connects Supabase PostgreSQL for persistent database migrations, WebSockets for instant peer updates, and standalone fallback logic client-side.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Interactive capabilities Playground */}
            <section id="playground" className="border-t border-slate-900 px-6 py-20 bg-mongodb-dark/80 scroll-mt-10">
              <div className="max-w-5xl mx-auto space-y-12">
                <div className="text-center space-y-3">
                  <span className="text-[10px] font-mono font-bold tracking-widest text-mongodb-green uppercase">
                    INTERACTIVE BENCHMARK
                  </span>
                  <h2 className="text-2xl sm:text-4xl font-display font-black text-white">
                    Preview active telemetry subsystems.
                  </h2>
                  <p className="text-slate-400 text-xs max-w-xl mx-auto font-sans leading-relaxed">
                    Select a core system service below to view its live interface simulation and response profiles in real-time.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                  {/* Left Column: Tab Selectors */}
                  <div className="lg:col-span-4 flex flex-col gap-3 justify-center">
                    <button
                      type="button"
                      onClick={() => { setActivePlaygroundTab('map'); setSimulationStatus('idle'); }}
                      className={`text-left p-4 rounded border transition-all cursor-pointer ${
                        activePlaygroundTab === 'map'
                          ? 'border-mongodb-green/30 bg-mongodb-slate/15 text-white'
                          : 'border-slate-800/80 bg-mongodb-card/30 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Map className="h-4 w-4 text-mongodb-green" />
                        <span className="text-xs font-bold font-mono">MAP INTERACTIVE LAYERS</span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-normal">
                        Simulate routing bypass operations for rescue vehicles avoiding flooded sectors.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => { setActivePlaygroundTab('copilot'); setSimulationStatus('idle'); }}
                      className={`text-left p-4 rounded border transition-all cursor-pointer ${
                        activePlaygroundTab === 'copilot'
                          ? 'border-mongodb-green/30 bg-mongodb-slate/15 text-white'
                          : 'border-slate-800/80 bg-mongodb-card/30 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Cpu className="h-4 w-4 text-emerald-400" />
                        <span className="text-xs font-bold font-mono">GEMINI COPILOT SYNTAX</span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-normal">
                        Inspect multi-agent reasoning logs and autonomous tool calls output during crisis triage.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => { setActivePlaygroundTab('feeds'); setSimulationStatus('idle'); }}
                      className={`text-left p-4 rounded border transition-all cursor-pointer ${
                        activePlaygroundTab === 'feeds'
                          ? 'border-mongodb-green/30 bg-mongodb-slate/15 text-white'
                          : 'border-slate-800/80 bg-mongodb-card/30 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Globe className="h-4 w-4 text-cyan-400" />
                        <span className="text-xs font-bold font-mono">GLOBAL FEEDS BROADCAST</span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-normal">
                        Stream live telemetry updates from UN GDACS and USGS seismic registers.
                      </p>
                    </button>
                  </div>

                  {/* Right Column: Interactive Terminal Preview Screen */}
                  <div className="lg:col-span-8 border border-slate-800/80 bg-slate-950/70 rounded-lg p-5 flex flex-col justify-between font-mono text-[11px] leading-relaxed shadow-2xl relative min-h-[300px]">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-mongodb-green/5 rounded-full blur-3xl pointer-events-none" />

                    {/* Window Controls */}
                    <div className="flex items-center justify-between pb-3.5 border-b border-slate-900 mb-4 shrink-0">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-slate-800"></span>
                        <span className="h-2 w-2 rounded-full bg-slate-800"></span>
                        <span className="h-2 w-2 rounded-full bg-slate-800"></span>
                        <span className="text-[9px] text-slate-500 ml-2 uppercase tracking-wider">
                          subsystem_diagnostic_console
                        </span>
                      </div>
                      <span className="text-[9px] text-mongodb-green uppercase border border-mongodb-green/30 bg-mongodb-green/5 px-1.5 py-0.2 rounded font-bold">
                        ACTIVE
                      </span>
                    </div>

                    {/* Content Renderer */}
                    <div className="flex-1 flex flex-col justify-center">
                      {activePlaygroundTab === 'map' && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-3 text-slate-300">
                            <div className="border border-slate-800/80 bg-mongodb-card/30 p-3 rounded">
                              <span className="text-[9px] text-slate-500 block">SHELTER G.R.B.</span>
                              <span className="text-emergency-critical font-bold">99% CAPACITY</span>
                            </div>
                            <div className="border border-slate-800/80 bg-mongodb-card/30 p-3 rounded">
                              <span className="text-[9px] text-slate-500 block">TOYOTA CENTER</span>
                              <span className="text-mongodb-green font-bold">40% EMPTY SURPLUS</span>
                            </div>
                            <div className="border border-slate-800/80 bg-mongodb-card/30 p-3 rounded">
                              <span className="text-[9px] text-slate-500 block">I-10 EAST CHANNEL</span>
                              <span className="text-emergency-critical font-bold">BLOCKED / breach</span>
                            </div>
                            <div className="border border-slate-800/80 bg-mongodb-card/30 p-3 rounded">
                              <span className="text-[9px] text-slate-500 block">I-45 SOUTH CORRIDOR</span>
                              <span className="text-mongodb-green font-bold">PASSABLE</span>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row gap-3 justify-between sm:items-center bg-mongodb-slate/10 border border-mongodb-green/20 p-3.5 rounded">
                            <span className="text-slate-300">Reroute overflow via I-45 corridor:</span>
                            <button
                              type="button"
                              onClick={handleRunSimulation}
                              className={`px-3 py-1 rounded font-bold transition-all uppercase tracking-wider text-[9px] cursor-pointer ${
                                simulationStatus === 'success' 
                                  ? 'bg-mongodb-green text-mongodb-dark' 
                                  : simulationStatus === 'running'
                                  ? 'bg-slate-800 text-slate-400'
                                  : 'bg-mongodb-forest text-white hover:bg-mongodb-forest/85'
                              }`}
                            >
                              {simulationStatus === 'success' && 'ROUTE INSTALLED'}
                              {simulationStatus === 'running' && 'CALCULATING PATH...'}
                              {simulationStatus === 'idle' && 'EXECUTE REROUTE'}
                            </button>
                          </div>

                          {simulationStatus === 'success' && (
                            <div className="text-mongodb-green flex items-center gap-1.5 text-[10px] animate-pulse">
                              <Check className="h-3 w-3" />
                              <span>SUCCEEDED: Toyota Center reserved 300 spaces. Transit ticket active on I-45.</span>
                            </div>
                          )}
                        </div>
                      )}

                      {activePlaygroundTab === 'copilot' && (
                        <div className="space-y-2">
                          <div className="text-slate-400 flex gap-2">
                            <span className="text-mongodb-green font-bold">[gemini_copilot]</span>
                            <span className="text-slate-500">&gt; Querying alternative shelters under 60% occupancy...</span>
                          </div>
                          <div className="text-slate-400 flex gap-2">
                            <span className="text-mongodb-green font-bold">[gemini_copilot]</span>
                            <span className="text-slate-500">&gt; Found Toyota Center (40%). Evaluating I-10 East bypass...</span>
                          </div>
                          <div className="text-slate-400 flex gap-2">
                            <span className="text-mongodb-green font-bold">[gemini_copilot]</span>
                            <span className="text-emerald-400">&gt; Running Tool Call: calculate_route_optimization(from: GRB, to: Toyota)</span>
                          </div>
                          <div className="text-slate-300 bg-mongodb-card/30 p-2.5 border border-slate-900 rounded max-w-lg mt-2 text-[10px]">
                            <span className="text-mongodb-green font-bold block mb-1">PROPOSED DISPATCH DIRECTION:</span>
                            "Divert incoming emergency fleets from GRB Center to Toyota Center via I-45 South (status: passable). Travel time: 6 mins."
                          </div>
                        </div>
                      )}

                      {activePlaygroundTab === 'feeds' && (
                        <div className="space-y-3.5">
                          <div className="flex justify-between items-center text-slate-500 pb-1.5 border-b border-slate-900/60">
                            <span>STREAM FEED EVENT INGESTION LOG</span>
                            <span className="animate-pulse flex items-center gap-1 text-mongodb-green">
                              <span className="h-1 w-1 rounded-full bg-mongodb-green"></span>
                              POLLING
                            </span>
                          </div>
                          
                          <div className="bg-mongodb-card/30 p-3.5 border border-slate-900 rounded space-y-1.5 text-slate-300">
                            <div className="flex justify-between">
                              <span className="text-slate-500">Source:</span>
                              <span className="text-mongodb-green font-bold">{liveFeedsMock[liveLogIndex].source}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Incident:</span>
                              <span className="text-white font-bold">{liveFeedsMock[liveLogIndex].event}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Region:</span>
                              <span>{liveFeedsMock[liveLogIndex].region}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Coordinates:</span>
                              <span>[{liveFeedsMock[liveLogIndex].coords.join(', ')}]</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Alert Severity:</span>
                              <span className={liveFeedsMock[liveLogIndex].level === 'red' ? 'text-emergency-critical' : 'text-emergency-warning'}>
                                {liveFeedsMock[liveLogIndex].level.toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <span className="text-[10px] text-slate-500 italic text-right block">Updates every 3 seconds</span>
                        </div>
                      )}
                    </div>

                    <div className="text-[8px] text-slate-500 border-t border-slate-900 pt-3 flex justify-between shrink-0">
                      <span>SECURE DIALECT V2 // LATENCY: 24MS</span>
                      <span>BUFFER HEALTH: 100%</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Launch Block CTA */}
            <section className="border-t border-slate-900 px-6 py-24 text-center space-y-6 bg-mongodb-dark relative">
              <div className="absolute inset-0 bg-mongodb-slate/5 blur-3xl pointer-events-none" />
              <h2 className="text-2xl sm:text-4xl font-display font-black text-white max-w-xl mx-auto">
                Ready to deploy tactical response coordination?
              </h2>
              <p className="text-slate-400 text-xs max-w-md mx-auto">
                Initialize the real-time GIS map, WebSocket stream aggregations, and Gemini dispatch controls in a single unified dashboard interface.
              </p>
              <div className="pt-4">
                <button
                  type="button"
                  onClick={handleBoot}
                  className="px-10 py-4 border border-mongodb-green text-mongodb-green hover:text-mongodb-dark font-mono font-bold tracking-widest text-xs uppercase rounded bg-mongodb-green/5 hover:bg-mongodb-green transition-all duration-300 shadow-lg hover:shadow-mongodb-green/20 cursor-pointer"
                >
                  Boot Operations Command Core
                </button>
              </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-slate-900 bg-slate-950 py-10 px-6 text-center font-mono text-[9px] text-slate-500 shrink-0">
              <p className="tracking-widest uppercase">
                BEACON Algorithmic Crisis Command Core v2.0 // DEPLOYED IN HARSH ENVIRONMENTS
              </p>
              <p className="text-slate-600 mt-1">
                Real-Time Feeds aggregated from UN GDACS and USGS Seismic Center. Powered by Gemini Pro.
              </p>
            </footer>
          </motion.div>
        ) : (
          <div className="fixed inset-0 w-full h-screen flex items-center justify-center bg-mongodb-dark/95 z-50">
            <motion.div
              key="booting-loader"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-lg px-8 py-6 rounded border border-mongodb-border bg-mongodb-card/90 font-mono text-[10px] text-mongodb-green space-y-2 select-none shadow-2xl"
            >
              {/* Terminal Top */}
              <div className="flex items-center gap-1.5 pb-3 border-b border-slate-900 mb-3">
                <span className="h-2 w-2 rounded-full bg-slate-800"></span>
                <span className="h-2 w-2 rounded-full bg-slate-800"></span>
                <span className="h-2 w-2 rounded-full bg-slate-800"></span>
                <span className="text-[9px] text-slate-500 ml-2">beacon_bootloader.log</span>
              </div>

              {/* Dynamic Logs Printing */}
              <div className="space-y-1.5 min-h-[200px]">
                {bootProgress.map((log, index) => (
                  <div key={index} className="flex gap-2">
                    <span className="text-mongodb-green font-bold">[ OK ]</span>
                    <p className="text-slate-300 leading-snug">{log}</p>
                  </div>
                ))}
                
                {/* Blinking cursor */}
                {bootProgress.length < bootLogs.length && (
                  <div className="flex gap-2">
                    <span className="text-mongodb-green font-bold">&gt;</span>
                    <span className="inline-block w-1.5 h-3.5 bg-mongodb-green animate-pulse" />
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
