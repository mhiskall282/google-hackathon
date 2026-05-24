import { useState, useRef, useEffect, memo, startTransition } from 'react'
import { Send, Bot, User, Cpu, ChevronRight, ChevronDown, CheckCircle2, RotateCcw, AlertTriangle } from 'lucide-react'
import { useChatStore } from '@/store/useChatStore'
import type { Message, ToolCallStep } from '@/types'

// Simple helper to parse Markdown-like syntax (**bold**, `code`, and lists) into safe HTML/React
const FormatMessageContent = memo(function FormatMessageContent({ text }: { text: string }) {
  const lines = text.split('\n')
  return (
    <div className="space-y-1.5 font-sans">
      {lines.map((line, idx) => {
        // Bullet list rendering
        if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
          const content = line.trim().substring(2);
          return (
            <ul key={idx} className="list-disc list-inside ml-2 text-slate-300">
              <li>{parseFormat(content)}</li>
            </ul>
          )
        }
        
        // Header bold rendering
        if (line.trim().startsWith('**') && line.trim().endsWith('**') && !line.trim().includes(':', 3)) {
          return (
            <h4 key={idx} className="text-xs font-bold text-slate-100 font-display mt-2 uppercase tracking-wide">
              {line.replace(/\*\*/g, '')}
            </h4>
          )
        }

        return (
          <p key={idx} className="text-slate-300 leading-relaxed text-[11px] whitespace-pre-wrap">
            {parseFormat(line)}
          </p>
        )
      })}
    </div>
  )
})

function parseFormat(content: string) {
  // Simple regex parser for bold (**) and inline code (`)
  const parts = content.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index} className="text-slate-100 font-semibold">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={index} className="px-1 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono text-emergency-info">{part.slice(1, -1)}</code>;
    }
    return part;
  });
}

const ChatMessageItem = memo(function ChatMessageItem({ msg }: { msg: Message }) {
  const [showReasoning, setShowReasoning] = useState(false)
  const toggleReasoning = () => {
    startTransition(() => setShowReasoning(!showReasoning))
  }
  
  const isAssistant = msg.role === 'assistant'
  const isSystem = msg.role === 'system'
  
  if (isSystem) {
    return (
      <div className="p-3 rounded border border-terminal-border bg-slate-950/50 flex gap-2">
        <Cpu className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
        <div className="flex-1">
          <FormatMessageContent text={msg.content} />
        </div>
      </div>
    )
  }

  return (
    <div className={`flex gap-3 max-w-[88%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
      {/* Avatar Icon */}
      <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 border ${
        msg.role === 'user'
          ? 'bg-slate-900 border-slate-700 text-slate-300'
          : 'bg-emergency-info/10 border-emergency-info/40 text-emergency-info'
      }`}>
        {msg.role === 'user' ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
      </div>

      {/* Chat bubble body */}
      <div className="space-y-1">
        <div className={`rounded-lg p-3 glass-panel ${
          msg.role === 'user'
            ? 'bg-slate-900/60 border-slate-700/60'
            : 'bg-terminal-dark/50'
        }`}>
          <FormatMessageContent text={msg.content} />
          
          {/* Dynamic Typing blinking cursor */}
          {msg.isStreaming && msg.content === '' && (
            <div className="flex items-center gap-1 py-1">
              <span className="h-1.5 w-1.5 bg-emergency-info rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="h-1.5 w-1.5 bg-emergency-info rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="h-1.5 w-1.5 bg-emergency-info rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          )}
        </div>

        {/* Show completed reasoning processes */}
        {isAssistant && msg.reasoningSteps && msg.reasoningSteps.length > 0 && (
          <div className="border border-terminal-border/60 rounded bg-slate-950/40 mt-1.5 overflow-hidden">
            <button
              type="button"
              onClick={toggleReasoning}
              className="w-full flex items-center justify-between px-2.5 py-1.5 text-[9px] font-mono text-slate-400 hover:text-slate-200 transition-colors uppercase bg-slate-950/60"
            >
              <span>Reasoning Process</span>
              {showReasoning ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </button>
            {showReasoning && (
              <div className="p-2.5 space-y-1 border-t border-terminal-border/40 font-mono text-[9px] text-slate-400 bg-slate-950/80">
                {msg.reasoningSteps.map((step, idx) => (
                  <div key={idx} className="flex gap-1.5">
                    <span className="text-emergency-info font-bold">&gt;</span>
                    <p className="leading-snug">{step}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Show tool calls */}
        {isAssistant && msg.toolCalls && msg.toolCalls.length > 0 && (
          <div className="space-y-1 mt-1.5">
            {msg.toolCalls.map((tool) => (
              <div key={tool.id} className="flex items-center justify-between border border-terminal-border/80 px-2 py-1 rounded bg-slate-950/60 text-[9px] font-mono">
                <div className="flex items-center gap-1.5 text-slate-300">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emergency-ok" />
                  <span>tool::{tool.name}</span>
                </div>
                <span className="text-[8px] border border-emergency-ok/40 text-emergency-ok px-1 py-0.2 rounded bg-emergency-ok/5">
                  OK
                </span>
              </div>
            ))}
          </div>
        )}
        
        {/* Meta details time */}
        <div className="text-[8px] font-mono text-slate-500 text-right px-1 pt-0.5">
          {msg.timestamp}
        </div>
      </div>
    </div>
  )
})

export function AgentChat() {
  const {
    messages,
    isStreaming,
    activeReasoningSteps,
    activeToolCalls,
    addMessage,
    updateLastMessageContent,
    setIsStreaming,
    addReasoningStep,
    clearReasoningSteps,
    addToolCall,
    clearToolCalls,
    resetChat
  } = useChatStore()

  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, activeReasoningSteps, activeToolCalls])

  // Setup onboarding greeting
  useEffect(() => {
    if (messages.length === 0) {
      addMessage({
        id: 'welcome',
        role: 'system',
        content: '**Beacon Emergency AI Copilot Initialized**\nMonitoring Houston, TX (Hurricane Elena 24h Post-Landfall).\n\nUse command chips below or type messages to query coordination tools.',
        timestamp: 'SYSTEM'
      })
    }
  }, [messages.length, addMessage])

  const triggerChatResponse = (text: string) => {
    if (!text.trim() || isStreaming) return

    // 1. Add User Message
    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    addMessage(userMsg)
    setInput('')
    setIsStreaming(true)
    clearReasoningSteps()
    clearToolCalls()

    // 2. Add Assistant Message placeholder that will be updated during stream
    const assistantPlaceholderId = `msg-placeholder-${Date.now()}`
    const assistantMsgPlaceholder: Message = {
      id: assistantPlaceholderId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isStreaming: true
    }
    addMessage(assistantMsgPlaceholder)

    const chatHistory = messages
      .filter((m) => m.id !== 'welcome')
      .map((m) => ({
        role: m.role,
        content: m.content
      }));

    // 3. Trigger Real SSE stream fetch from backend Express server
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
    fetch(`${API_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: text,
        history: chatHistory
      })
    })
      .then(async (response) => {
        if (!response.ok) throw new Error('Failed to connect to AI Copilot API');
        
        const reader = response.body?.getReader();
        const decoder = new TextDecoder('utf-8');
        if (!reader) throw new Error('Stream reader not available');

        let partialText = '';
        const reasoningAccumulator: string[] = [];
        let toolCallsAccumulator: ToolCallStep[] = [];

        const readStream = async (): Promise<void> => {
          const { done, value } = await reader.read();
          if (done) {
            setIsStreaming(false);
            useChatStore.setState((state) => ({
              messages: state.messages.map((m) =>
                m.id === assistantPlaceholderId 
                  ? { 
                      id: assistantPlaceholderId,
                      role: 'assistant',
                      content: partialText,
                      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                      reasoningSteps: reasoningAccumulator,
                      toolCalls: toolCallsAccumulator,
                      isStreaming: false
                    } 
                  : m
              )
            }));
            clearReasoningSteps();
            clearToolCalls();
            return;
          }

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.substring(6));
                
                if (data.type === 'REASONING') {
                  reasoningAccumulator.push(data.payload);
                  addReasoningStep(data.payload);
                } else if (data.type === 'TOOL_CALL') {
                  const call: ToolCallStep = data.payload;
                  toolCallsAccumulator = toolCallsAccumulator.filter((t) => t.name !== call.name);
                  toolCallsAccumulator.push(call);
                  
                  clearToolCalls();
                  toolCallsAccumulator.forEach((t) => addToolCall(t));
                } else if (data.type === 'TEXT') {
                  partialText += data.payload;
                  updateLastMessageContent(partialText);
                }
              } catch {
                // Ignore incomplete JSON chunks during streaming
              }
            }
          }

          await readStream();
        };

        await readStream();
      })
      .catch((err) => {
        console.error('❌ Copilot error:', err);
        setIsStreaming(false);
        useChatStore.setState((state) => ({
          messages: state.messages.map((m) =>
            m.id === assistantPlaceholderId 
              ? { 
                  id: assistantPlaceholderId,
                  role: 'assistant',
                  content: `⚠️ Failed to fetch response from AI Copilot: ${err.message}`,
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  isStreaming: false
                } 
              : m
          )
        }));
        clearReasoningSteps();
        clearToolCalls();
      });
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    triggerChatResponse(input)
  }

  const handleChipClick = (topic: string) => {
    triggerChatResponse(topic)
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden select-none">
      {/* Title */}
      <div className="p-4 border-b border-terminal-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="h-4.5 w-4.5 text-emergency-info animate-pulse" />
          <h2 className="text-xs font-mono font-bold tracking-widest text-slate-100 uppercase">
            AI COORDINATION
          </h2>
        </div>
        <button
          type="button"
          onClick={resetChat}
          aria-label="Reset chat logs"
          className="text-slate-500 hover:text-slate-300 transition-colors p-1 rounded"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <ChatMessageItem key={msg.id} msg={msg} />
        ))}

        {/* Live Active Streaming Telemetry (when agent is currently executing reasoning steps) */}
        {isStreaming && (activeReasoningSteps.length > 0 || activeToolCalls.length > 0) && (
          <div className="p-3 border border-emergency-info/30 rounded bg-emergency-info/5 space-y-2 select-none">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[9px] font-mono font-bold text-emergency-info uppercase tracking-wider">
                <Cpu className="h-3.5 w-3.5 animate-spin" />
                Copilot Thinking Thread
              </span>
              <span className="text-[8px] font-mono text-slate-500 animate-pulse">
                Active Execution
              </span>
            </div>

            {/* In-progress reasoning timeline */}
            {activeReasoningSteps.length > 0 && (
              <div className="space-y-1 max-h-32 overflow-y-auto font-mono text-[9px] text-slate-400 bg-slate-950/40 p-2 rounded border border-terminal-border/40">
                {activeReasoningSteps.map((step, idx) => (
                  <div key={idx} className="flex gap-1">
                    <span className="text-emergency-info">&gt;</span>
                    <span className="leading-snug">{step}</span>
                  </div>
                ))}
              </div>
            )}

            {/* In-progress tool call indicator */}
            {activeToolCalls.length > 0 && (
              <div className="space-y-1 bg-slate-950/40 p-2 rounded border border-terminal-border/40">
                {activeToolCalls.map((tool) => (
                  <div key={tool.id} className="flex items-center justify-between text-[8px] font-mono">
                    <span className="text-slate-300">Executing: tool::{tool.name}</span>
                    <span className="flex items-center gap-1 text-emergency-warning animate-pulse">
                      <AlertTriangle className="h-2.5 w-2.5" />
                      running...
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div ref={scrollRef} />
      </div>

      {/* Suggestion Chips */}
      <div className="px-4 py-2 border-t border-terminal-border bg-slate-950/30 flex items-center gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-none">
        <button
          type="button"
          onClick={() => handleChipClick('Analyze shelters capacity overflow')}
          disabled={isStreaming}
          className="text-[9px] font-mono border border-terminal-border hover:border-emergency-info/60 px-2 py-1.5 rounded bg-slate-900/60 text-slate-300 hover:text-slate-100 disabled:opacity-40 transition-colors"
        >
          /shelters-utilization
        </button>
        <button
          type="button"
          onClick={() => handleChipClick('Get road status and bypass routes')}
          disabled={isStreaming}
          className="text-[9px] font-mono border border-terminal-border hover:border-emergency-info/60 px-2 py-1.5 rounded bg-slate-900/60 text-slate-300 hover:text-slate-100 disabled:opacity-40 transition-colors"
        >
          /route-blockages
        </button>
        <button
          type="button"
          onClick={() => handleChipClick('Query south medical supply caches')}
          disabled={isStreaming}
          className="text-[9px] font-mono border border-terminal-border hover:border-emergency-info/60 px-2 py-1.5 rounded bg-slate-900/60 text-slate-300 hover:text-slate-100 disabled:opacity-40 transition-colors"
        >
          /supply-caches
        </button>
      </div>

      {/* Inputs Form */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-terminal-border bg-terminal-dark flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isStreaming}
          placeholder="Command copilot..."
          className="flex-1 min-w-0 bg-slate-950 border border-terminal-border rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emergency-info/80 font-mono disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!input.trim() || isStreaming}
          aria-label="Send message to coordinator"
          className="h-8 w-8 flex items-center justify-center rounded border border-emergency-info/60 bg-emergency-info/10 text-emergency-info hover:bg-emergency-info/20 disabled:opacity-40 transition-all shrink-0"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </form>
    </div>
  )
}
