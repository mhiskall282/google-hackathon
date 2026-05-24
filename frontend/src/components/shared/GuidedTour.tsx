import { useEffect, useState, startTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronRight, ChevronLeft, Flag } from 'lucide-react'
import { useTourStore, TOUR_STEPS } from '../../store/tourStore'
import { createPortal } from 'react-dom'

export function GuidedTour() {
  const { isActive, currentStepIndex, nextStep, prevStep, skipTour, endTour } = useTourStore()
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  
  const currentStep = TOUR_STEPS[currentStepIndex]

  const handleNext = () => startTransition(() => nextStep())
  const handlePrev = () => startTransition(() => prevStep())
  const handleSkip = () => startTransition(() => skipTour())
  const handleEnd = () => startTransition(() => endTour())

  useEffect(() => {
    if (!isActive || !currentStep) return

    // 1. Initial scroll to the target element when the step changes
    const el = document.getElementById(currentStep.targetId)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }

    // 2. Function to just update the rectangle bounds
    const updatePosition = () => {
      const targetEl = document.getElementById(currentStep.targetId)
      if (targetEl) {
        setTargetRect(targetEl.getBoundingClientRect())
      } else {
        setTargetRect(null)
      }
    }

    // Wait for the smooth scroll to finish before calculating the first bounds
    const timeoutId = setTimeout(updatePosition, 300)

    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true) // Update mask when user scrolls

    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [isActive, currentStepIndex, currentStep])

  if (!isActive || !currentStep) return null

  // Calculate tooltip position based on the target element
  const getTooltipPosition = () => {
    if (!targetRect) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }

    const padding = 20
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
    let position = currentStep.position || 'bottom'

    // Override left/right to bottom on mobile to prevent clipping
    if (isMobile && (position === 'left' || position === 'right')) {
      position = 'bottom'
    }

    const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1000
    const tooltipWidth = Math.min(320, windowWidth - 32)
    let top = 0
    let left = 0
    let transform = ''

    switch (position) {
      case 'bottom':
        top = targetRect.bottom + padding
        left = targetRect.left + targetRect.width / 2
        transform = 'translate(-50%, 0)'
        break
      case 'top':
        top = targetRect.top - padding
        left = targetRect.left + targetRect.width / 2
        transform = 'translate(-50%, -100%)'
        break
      case 'left':
        top = targetRect.top + targetRect.height / 2
        left = targetRect.left - padding
        transform = 'translate(-100%, -50%)'
        break
      case 'right':
        top = targetRect.top + targetRect.height / 2
        left = targetRect.right + padding
        transform = 'translate(0, -50%)'
        break
      case 'center':
        top = targetRect.top + targetRect.height / 2
        left = targetRect.left + targetRect.width / 2
        transform = 'translate(-50%, -50%)'
        break
      default:
        top = targetRect.bottom + padding
        left = targetRect.left + targetRect.width / 2
        transform = 'translate(-50%, 0)'
        break
    }

    // Horizontal boundary clamping for center-aligned components (top/bottom/center)
    if (transform.includes('-50%, 0') || transform.includes('-50%, -100%') || transform.includes('-50%, -50%')) {
      const minLeft = (tooltipWidth / 2) + 16
      const maxLeft = windowWidth - (tooltipWidth / 2) - 16
      left = Math.max(minLeft, Math.min(left, maxLeft))
    }

    return { top, left, transform }
  }

  // Calculate coordinates for the "hole" in the overlay
  const holeStyles = targetRect ? {
    top: targetRect.top - 8,
    left: targetRect.left - 8,
    width: targetRect.width + 16,
    height: targetRect.height + 16,
  } : { top: 0, left: 0, width: 0, height: 0 }

  const isLastStep = currentStepIndex === TOUR_STEPS.length - 1

  return createPortal(
    <div className="fixed inset-0 z-[100] pointer-events-auto">
      {/* Dark semi-transparent overlay */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
        style={{
          clipPath: targetRect ? `polygon(
            0% 0%, 0% 100%, 100% 100%, 100% 0%, 0% 0%,
            ${holeStyles.left}px ${holeStyles.top}px,
            ${holeStyles.left + holeStyles.width}px ${holeStyles.top}px,
            ${holeStyles.left + holeStyles.width}px ${holeStyles.top + holeStyles.height}px,
            ${holeStyles.left}px ${holeStyles.top + holeStyles.height}px,
            ${holeStyles.left}px ${holeStyles.top}px
          )` : 'none',
          transition: 'clip-path 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      />

      {/* Target Highlight Ring */}
      {targetRect && (
        <motion.div
          layout
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute rounded-lg border-2 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.3)] pointer-events-none"
          style={{
            top: holeStyles.top,
            left: holeStyles.left,
            width: holeStyles.width,
            height: holeStyles.height,
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        />
      )}

      {/* Tooltip Card */}
      <AnimatePresence mode="wait">
        {targetRect && (
          <motion.div
            key={currentStep.targetId}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="absolute z-[101] w-[320px] max-w-[calc(100vw-32px)] bg-slate-900 border border-slate-700/50 rounded-xl shadow-2xl overflow-hidden"
            style={getTooltipPosition()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/80">
              <div className="flex items-center gap-2">
                <Flag className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-slate-200">
                  {currentStep.title}
                </h3>
              </div>
              <button 
                onClick={handleSkip}
                className="text-slate-500 hover:text-slate-300 transition-colors"
                aria-label="Skip tour"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-4">
              <p className="text-sm text-slate-400 leading-relaxed">
                {currentStep.description}
              </p>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-4 border-t border-slate-800 bg-slate-900/50">
              <div className="text-xs font-mono text-slate-500">
                {currentStepIndex + 1} / {TOUR_STEPS.length}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrev}
                  disabled={currentStepIndex === 0}
                  className="p-1.5 rounded bg-slate-800 text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={isLastStep ? handleEnd : handleNext}
                  className="px-3 py-1.5 rounded bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 font-medium text-sm transition-colors flex items-center gap-1"
                >
                  {isLastStep ? 'Finish' : 'Next'}
                  {!isLastStep && <ChevronRight className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>,
    document.body
  )
}
