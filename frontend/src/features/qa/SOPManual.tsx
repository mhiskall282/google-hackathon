import React, { useState } from 'react'
import { BookOpen, ChevronRight, ChevronDown, MessageSquare, ShieldAlert, Cpu } from 'lucide-react'
import { useChatStore } from '@/store/useChatStore'
import { simulateChatStream } from '@/services/mockData'

interface SOPItem {
  id: string;
  question: string;
  answer: string;
  triggerQuery: string;
  category: 'shelter' | 'road' | 'supply';
}

const sopItems: SOPItem[] = [
  {
    id: 'sop-1',
    question: 'How do we resolve George R. Brown (GRB) capacity overloads?',
    answer: 'If GRB occupancy exceeds 95% (currently 99%), divert inbound evacuees immediately. Toyota Center is the closest designated redirection point (currently at 40% occupancy). Route evacuees via the passable I-45 corridor.',
    triggerQuery: 'Analyze shelters capacity overflow and redirect evacuees from GRB center',
    category: 'shelter'
  },
  {
    id: 'sop-2',
    question: 'What bypass routes avoid flooded I-10 East sectors?',
    answer: 'Flood gates on I-10 East are closed due to San Jacinto River breaches. Responders traveling from East Distribution Hub to NRG Center must use the local high-water bypass, then join I-45 South Freeway, which remains open.',
    triggerQuery: 'Get road status and find bypass routes from East Distribution Hub to NRG Stadium avoiding flooded I-10 East',
    category: 'road'
  },
  {
    id: 'sop-3',
    question: 'What is the action plan for low medical stock caches?',
    answer: 'When a cache (like Medical Cache South) drops below 15% (currently 10%), query shelter stocks. Toyota Center has 250 kits (High status). Issue dispatch ticket DISP-8924 to redirect 100 kits using light utility trucks.',
    triggerQuery: 'Query south medical supply caches and deploy kits from Toyota Center surplus',
    category: 'supply'
  }
]

export function SOPManual() {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  
  const { 
    addMessage, 
    updateLastMessageContent, 
    setIsStreaming, 
    clearReasoningSteps, 
    clearToolCalls, 
    addReasoningStep, 
    addToolCall 
  } = useChatStore()

  const handleAskCopilot = (question: string) => {
    // 1. Add User Message
    addMessage({
      id: `msg-${Date.now()}`,
      role: 'user',
      content: question,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    })

    setIsStreaming(true)
    clearReasoningSteps()
    clearToolCalls()

    // 2. Add Assistant Message placeholder
    const assistantPlaceholderId = `msg-placeholder-${Date.now()}`
    addMessage({
      id: assistantPlaceholderId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isStreaming: true
    })

    // 3. Trigger simulation stream
    simulateChatStream(
      question,
      (chunk, reasoning, tools) => {
        updateLastMessageContent(chunk)
        clearReasoningSteps()
        reasoning.forEach((r) => addReasoningStep(r))
        clearToolCalls()
        tools.forEach((t) => addToolCall(t))
      },
      (finalMessage) => {
        setIsStreaming(false)
        useChatStore.setState((state) => ({
          messages: state.messages.map((m) =>
            m.id === assistantPlaceholderId ? { ...finalMessage, isStreaming: false } : m
          )
        }))
        clearReasoningSteps()
        clearToolCalls()
      }
    )
  }

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden select-none">
      {/* Title Header */}
      <div className="p-4 border-b border-terminal-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4.5 w-4.5 text-emergency-info animate-pulse" />
          <h2 className="text-xs font-mono font-bold tracking-widest text-slate-100 uppercase">
            OPERATIONS MANUAL
          </h2>
        </div>
      </div>

      {/* Manual FAQ accordion cards */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        <div className="p-2 border border-terminal-border bg-slate-950/40 rounded font-mono text-[9px] text-slate-400 mb-2 leading-relaxed">
          <div className="flex items-center gap-1.5 text-emergency-info font-bold uppercase mb-1">
            <Cpu className="h-3.5 w-3.5" />
            <span>OPERATIONAL SOP INDEX</span>
          </div>
          Select any standard operating procedure below to review redirection rules, or ask the AI copilot for routing calculations.
        </div>

        {sopItems.map((item) => {
          const isExpanded = expandedId === item.id
          
          return (
            <div 
              key={item.id}
              className={`glass-panel border rounded transition-all duration-200 ${
                isExpanded ? 'border-slate-700 bg-slate-900/10' : 'hover:border-slate-800'
              }`}
            >
              {/* Question Trigger Bar */}
              <button
                type="button"
                onClick={() => toggleExpand(item.id)}
                className="w-full text-left px-3 py-2.5 flex items-start justify-between gap-2"
              >
                <span className="text-[10px] font-display font-semibold text-slate-200 leading-snug">
                  {item.question}
                </span>
                <span className="shrink-0 mt-0.5 text-slate-500 hover:text-slate-300">
                  {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                </span>
              </button>

              {/* Expandable answer details */}
              {isExpanded && (
                <div className="px-3 pb-3 pt-1.5 border-t border-terminal-border/40 font-sans space-y-3.5 text-[10px]">
                  <p className="text-slate-300 leading-relaxed">
                    {item.answer}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-900">
                    <span className="flex items-center gap-1 text-[8px] font-mono text-slate-500 uppercase">
                      <ShieldAlert className="h-3 w-3 text-slate-500" />
                      Classified SOP
                    </span>

                    <button
                      type="button"
                      onClick={() => handleAskCopilot(item.triggerQuery)}
                      className="flex items-center gap-1 text-[8px] font-mono text-emergency-info hover:text-slate-100 hover:bg-emergency-info/10 border border-emergency-info/40 px-2 py-1 rounded transition-colors"
                    >
                      <MessageSquare className="h-3 w-3" />
                      Ask Copilot
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
