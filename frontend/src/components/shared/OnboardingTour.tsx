import { useState, useEffect, memo } from 'react'
import { HelpCircle, ChevronRight, ChevronLeft, X } from 'lucide-react'

interface TourStep {
  title: string;
  description: string;
  targetId?: string;
  panelName?: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    title: "SYSTEM STATUS: INITIALIZED COMMAND GRID",
    description: "Welcome to BEACON — the Real-Time Tactical Disaster Telemetry Hub. This platform aggregates critical incident telemetry, logistics registers, and AI-assisted dispatch SOPs during active crisis operations in the Houston Metro sector. Let's take a quick walk through your command deck.",
    panelName: "COMMAND ROOT"
  },
  {
    title: "⚡ ACTIVE DISASTER INCIDENT STREAM",
    description: "This side-feed aggregates real-time alerts parsed directly from global UN GDACS and USGS feeds. Bounded controls allow you to filter entries by severity (Critical, Warning, Unverified) or execute keyword search strings to pinpoint hazards.",
    targetId: "tour-alert-feed",
    panelName: "TELEMETRY SIDEBAR"
  },
  {
    title: "🗺️ TACTICAL GIS GEOGRAPHIC OVERLAYS",
    description: "The primary map visualizes emergency shelters, passable transit bypass paths, and supply depots. Features canvas-optimized vector paths and overlay toggles for rotating weather radar precipitation bands. Click markers to query coordinates, capacities, or dispatch tickets.",
    targetId: "tour-map-view",
    panelName: "CARTOGRAPHY DECK"
  },
  {
    title: "🤖 GEMINI AI COORDINATION COPILOT",
    description: "Powered by Gemini 2.5 Flash, the copilot possesses direct database tool access. Enter custom natural queries (e.g., 'Which shelters are full?') or click pre-compiled SOP (Standard Operating Procedure) chips to auto-generate bypass routes and coordinate fleets.",
    targetId: "tour-agent-chat",
    panelName: "AI COGNITIVE CORE"
  },
  {
    title: "📡 UTC CLOCK & WARNING SIRENS",
    description: "The right-hand header panel contains the UTC ticker, confirming live WebSocket synchronization is active. Toggle the warning alert sound synthesizer using the Speaker node, or click the slider to open the system control panel.",
    targetId: "tour-header-controls",
    panelName: "TELEMETRY SYNC CONTROL"
  }
];

interface OnboardingTourProps {
  onClose?: () => void;
}

export const OnboardingTour = memo(function OnboardingTour({ onClose }: OnboardingTourProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [highlightRect, setHighlightRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null)

  // Web Audio feedback tone
  const playPing = (freq: number) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
    } catch { /* ignore */ }
  }

  // Trigger tour automatically on first visit
  useEffect(() => {
    const isCompleted = localStorage.getItem('beacon_onboarding_completed')
    if (!isCompleted) {
      setIsOpen(true)
    }
  }, [])

  // Recalculate target outline size when window resizes or step changes
  useEffect(() => {
    if (!isOpen) {
      setHighlightRect(null)
      return
    }

    const updateRect = () => {
      const stepData = TOUR_STEPS[currentStep]
      if (stepData && stepData.targetId) {
        const el = document.getElementById(stepData.targetId)
        if (el) {
          const rect = el.getBoundingClientRect()
          setHighlightRect({
            top: rect.top + window.scrollY,
            left: rect.left + window.scrollX,
            width: rect.width,
            height: rect.height
          })
          return;
        }
      }
      setHighlightRect(null)
    }

    updateRect()
    window.addEventListener('resize', updateRect)
    return () => window.removeEventListener('resize', updateRect)
  }, [currentStep, isOpen])

  const handleNext = () => {
    playPing(580)
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handleBack = () => {
    playPing(440)
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = () => {
    playPing(880)
    localStorage.setItem('beacon_onboarding_completed', 'true')
    setIsOpen(false)
    if (onClose) onClose()
  }

  const handleRestart = () => {
    playPing(520)
    setCurrentStep(0)
    setIsOpen(true)
  }

  if (!isOpen) {
    // Return a neat help button to re-trigger the tour from the dashboard
    return (
      <button
        type="button"
        onClick={handleRestart}
        title="Start Command Onboarding Tour"
        className="fixed bottom-4 left-4 z-40 h-8 px-2.5 rounded border border-mongodb-border bg-mongodb-dark/90 hover:bg-slate-900/90 text-[9px] font-mono font-bold tracking-widest text-mongodb-green flex items-center gap-1.5 shadow-[0_0_10px_rgba(0,237,100,0.15)] transition-all duration-200 uppercase"
      >
        <HelpCircle className="h-3.5 w-3.5" />
        <span>onboarding</span>
      </button>
    )
  }

  const step = TOUR_STEPS[currentStep]

  return (
    <>
      {/* 1. Translucent backdrop mask */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-[1px] z-[9990] transition-all duration-300 select-none" 
        onClick={handleComplete}
      />

      {/* 2. Highlight spotlight frame */}
      {highlightRect && (
        <div 
          className="fixed border-2 border-mongodb-green rounded shadow-[0_0_20px_rgba(0,237,100,0.4),inset_0_0_10px_rgba(0,237,100,0.15)] z-[9991] pointer-events-none transition-all duration-300"
          style={{
            top: highlightRect.top - 4,
            left: highlightRect.left - 4,
            width: highlightRect.width + 8,
            height: highlightRect.height + 8
          }}
        >
          {/* Glowing target crosshairs */}
          <span className="absolute -top-1.5 -left-1.5 h-3 w-3 border-t-2 border-l-2 border-mongodb-green" />
          <span className="absolute -top-1.5 -right-1.5 h-3 w-3 border-t-2 border-r-2 border-mongodb-green" />
          <span className="absolute -bottom-1.5 -left-1.5 h-3 w-3 border-b-2 border-l-2 border-mongodb-green" />
          <span className="absolute -bottom-1.5 -right-1.5 h-3 w-3 border-b-2 border-r-2 border-mongodb-green" />
        </div>
      )}

      {/* 3. Floating guided instruction card */}
      <div className="fixed inset-x-0 bottom-10 lg:bottom-16 flex justify-center z-[9995] select-none px-4">
        <div className="w-full max-w-[460px] border border-mongodb-border bg-mongodb-dark/95 backdrop-blur-md rounded shadow-[0_0_30px_rgba(0,237,100,0.25)] p-4 flex flex-col font-mono relative scanlines-overlay">
          
          {/* Header diagnostics metadata */}
          <div className="flex items-center justify-between border-b border-terminal-border/60 pb-2 mb-3 text-[8px] text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-mongodb-green animate-ping" />
              <span>SOP::ONBOARDING_GUIDE</span>
            </div>
            <span>PANEL: {step.panelName}</span>
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={handleComplete}
            className="absolute top-3 right-3 text-slate-500 hover:text-slate-300 transition-colors p-1"
          >
            <X className="h-3.5 w-3.5" />
          </button>

          {/* Card Copy */}
          <h2 className="text-xs font-black tracking-widest text-slate-100 uppercase mb-2 flex items-center gap-2">
            <span className="text-mongodb-green">[{currentStep + 1}/{TOUR_STEPS.length}]</span>
            {step.title}
          </h2>
          <p className="text-[10px] text-slate-300 leading-relaxed font-sans mb-4 min-h-[56px]">
            {step.description}
          </p>

          {/* Footer Controls */}
          <div className="flex items-center justify-between border-t border-terminal-border/60 pt-3">
            <button
              type="button"
              onClick={handleComplete}
              className="text-[9px] text-slate-500 hover:text-slate-300 transition-colors uppercase py-1"
            >
              Skip Tour
            </button>

            <div className="flex gap-2">
              {currentStep > 0 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-3 py-1.5 rounded border border-terminal-border bg-slate-900/60 hover:bg-slate-800 text-[9px] text-slate-300 flex items-center gap-1 transition-all duration-200 uppercase"
                >
                  <ChevronLeft className="h-3 w-3" />
                  Back
                </button>
              )}
              <button
                type="button"
                onClick={handleNext}
                className="px-3.5 py-1.5 rounded border border-mongodb-border bg-mongodb-green/10 hover:bg-mongodb-green/20 text-[9px] text-mongodb-green flex items-center gap-1 shadow-[0_0_10px_rgba(0,237,100,0.1)] transition-all duration-200 uppercase font-bold"
              >
                {currentStep === TOUR_STEPS.length - 1 ? "Initialize" : "Next"}
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
})
