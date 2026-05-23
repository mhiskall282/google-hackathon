import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Radio, ShieldCheck, Cpu } from 'lucide-react'

// Web Audio API Synthesizer Boot sound sweep
const playBootSound = () => {
  try {
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
      } catch (err) {}
    }, 1500);

  } catch (e) {
    // Audio blocked
  }
}

interface LandingPageProps {
  onEnter: () => void;
}

export function LandingPage({ onEnter }: LandingPageProps) {
  const [booting, setBooting] = useState(false)
  const [bootProgress, setBootProgress] = useState<string[]>([])
  
  const bootLogs = [
    'ESTABLISHING SYSTEM SECURE PROTOCOLS...',
    'INGESTING NOAA WEATHER DATA & ELENA storm TELEMETRY...',
    'RESOLVING HARRIS COUNTY EMERGENCY COORDINATES INDEX...',
    'ALLOCATING ZUSTAND MEMORY STORES...',
    'INTEGRATING LEAFLET GEOGRAPHIC OPERATIONS VIEWER...',
    'BOOTING AI AGENT REASONING ENGINE...',
    'ESTABLISHING COMMAND CENTER ENCRYPTED CHANNEL...',
    'BEACON PROTOCOL V1.2 ONLINE.'
  ]

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
        }, 600)
      }
    }, 200)
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-terminal-black flex flex-col items-center justify-center font-sans scanlines-overlay">
      {/* Moving Tech Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_95%,rgba(34,197,94,0.015)_95%),linear-gradient(90deg,rgba(18,16,16,0)_95%,rgba(34,197,94,0.015)_95%)] bg-[size:40px_40px] pointer-events-none opacity-40" />

      <AnimatePresence mode="wait">
        {!booting ? (
          <motion.div 
            key="welcome"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.6 }}
            className="z-10 max-w-2xl px-6 text-center space-y-8"
          >
            {/* Top Indicator */}
            <div className="flex items-center justify-center gap-2 font-mono text-[9px] text-emergency-info tracking-[0.25em] uppercase border border-emergency-info/30 bg-emergency-info/5 px-3 py-1.5 rounded-full w-fit mx-auto animate-pulse">
              <Radio className="h-3 w-3 text-emergency-info" />
              <span>DIAGNOSTIC LINK SECURED</span>
            </div>

            {/* Core Header */}
            <div className="space-y-3">
              <h1 className="font-display font-black text-4xl sm:text-5xl md:text-6xl text-slate-100 tracking-wider m-0 leading-none">
                BEACON
              </h1>
              <p className="font-mono text-slate-400 text-xs tracking-[0.3em] uppercase block">
                Algorithmic Crisis Command Core
              </p>
            </div>

            {/* Simulated Specs Block */}
            <div className="grid grid-cols-3 gap-4 border border-terminal-border/80 rounded bg-terminal-dark/60 p-4 font-mono text-[10px]">
              <div className="text-left space-y-1.5">
                <span className="text-slate-500 block uppercase">SYSTEM STATE</span>
                <span className="text-emergency-ok font-bold uppercase flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" />
                  STANDBY
                </span>
              </div>
              <div className="text-left space-y-1.5 border-x border-terminal-border/80 px-4">
                <span className="text-slate-500 block uppercase">SECTOR CODE</span>
                <span className="text-slate-200 font-bold">HOU-TX-ELENA</span>
              </div>
              <div className="text-left space-y-1.5 pl-2">
                <span className="text-slate-500 block uppercase">AI INTERLINK</span>
                <span className="text-emergency-info font-bold uppercase flex items-center gap-1">
                  <Cpu className="h-3 w-3 animate-pulse" />
                  READY
                </span>
              </div>
            </div>

            {/* Action Launch Button */}
            <div className="pt-4">
              <button
                type="button"
                onClick={handleBoot}
                className="relative group h-14 w-64 border border-emergency-info text-emergency-info hover:text-terminal-black font-mono font-bold tracking-widest text-xs uppercase rounded bg-emergency-info/5 hover:bg-emergency-info transition-all duration-300 shadow-lg hover:shadow-emergency-info/30"
              >
                {/* Blinking brackets on hover */}
                <span className="absolute left-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">&lt;</span>
                <span>Initialize Command Core</span>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">&gt;</span>
              </button>
            </div>
            
            <p className="font-mono text-[8px] text-slate-500 tracking-wider">
              AUTHORIZED PERSONNEL ONLY // CLASSIFIED OPERATIONS telemetry SYNC
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="boot"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="z-10 w-full max-w-lg px-8 py-6 rounded border border-terminal-border bg-slate-950/90 font-mono text-[10px] text-emerald-400 space-y-2 select-none shadow-2xl"
          >
            {/* Terminal Top */}
            <div className="flex items-center gap-1.5 pb-3 border-b border-terminal-border mb-3">
              <span className="h-2 w-2 rounded-full bg-emergency-critical"></span>
              <span className="h-2 w-2 rounded-full bg-emergency-warning"></span>
              <span className="h-2 w-2 rounded-full bg-emergency-ok"></span>
              <span className="text-[9px] text-slate-500 ml-2">beacon_boot_sys.log</span>
            </div>

            {/* Dynamic Logs Printing */}
            <div className="space-y-1.5 min-h-[160px]">
              {bootProgress.map((log, index) => (
                <div key={index} className="flex gap-2">
                  <span className="text-emerald-500 font-bold">[ OK ]</span>
                  <p className="text-slate-300 leading-snug">{log}</p>
                </div>
              ))}
              
              {/* Blinking cursor */}
              {bootProgress.length < bootLogs.length && (
                <div className="flex gap-2">
                  <span className="text-emerald-500 font-bold">&gt;</span>
                  <span className="inline-block w-1.5 h-3.5 bg-emerald-400 animate-pulse" />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
