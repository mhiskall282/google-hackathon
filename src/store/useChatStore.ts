import { create } from 'zustand'
import { Message, ToolCallStep } from '@/types'

interface ChatState {
  messages: Message[];
  isStreaming: boolean;
  activeReasoningSteps: string[];
  activeToolCalls: ToolCallStep[];

  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateLastMessageContent: (content: string) => void;
  setIsStreaming: (isStreaming: boolean) => void;
  addReasoningStep: (step: string) => void;
  clearReasoningSteps: () => void;
  addToolCall: (tool: ToolCallStep) => void;
  updateToolCallStatus: (id: string, status: ToolCallStep['status'], output?: string) => void;
  clearToolCalls: () => void;
  resetChat: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isStreaming: false,
  activeReasoningSteps: [],
  activeToolCalls: [],

  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  updateLastMessageContent: (content) => set((state) => {
    const updatedMessages = [...state.messages];
    if (updatedMessages.length === 0) return state;
    const last = updatedMessages[updatedMessages.length - 1];
    updatedMessages[updatedMessages.length - 1] = { ...last, content };
    return { messages: updatedMessages };
  }),
  setIsStreaming: (isStreaming) => set({ isStreaming }),
  addReasoningStep: (step) => set((state) => ({
    activeReasoningSteps: [...state.activeReasoningSteps, step]
  })),
  clearReasoningSteps: () => set({ activeReasoningSteps: [] }),
  addToolCall: (tool) => set((state) => ({
    activeToolCalls: [...state.activeToolCalls, tool]
  })),
  updateToolCallStatus: (id, status, output) => set((state) => ({
    activeToolCalls: state.activeToolCalls.map((t) =>
      t.id === id ? { ...t, status, output } : t
    )
  })),
  clearToolCalls: () => set({ activeToolCalls: [] }),
  resetChat: () => set({ messages: [], activeReasoningSteps: [], activeToolCalls: [] }),
}))
