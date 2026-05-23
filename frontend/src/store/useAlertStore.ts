import { create } from 'zustand'
import type { Alert, AlertSeverity } from '@/types'

interface AlertState {
  alerts: Alert[];
  activeFilter: AlertSeverity | 'all';
  selectedAlertId: string | null;
  isAudioMuted: boolean;

  setAlerts: (alerts: Alert[]) => void;
  addAlert: (alert: Alert) => void;
  setFilter: (filter: AlertSeverity | 'all') => void;
  setSelectedAlertId: (id: string | null) => void;
  toggleAudioMute: () => void;
}

export const useAlertStore = create<AlertState>((set) => ({
  alerts: [],
  activeFilter: 'all',
  selectedAlertId: null,
  isAudioMuted: false,

  setAlerts: (alerts) => set({ alerts }),
  addAlert: (alert) => set((state) => {
    // Avoid duplicates
    if (state.alerts.some((a) => a.id === alert.id)) return state;
    return { alerts: [alert, ...state.alerts] }; // Add to top (newest first)
  }),
  setFilter: (filter) => set({ activeFilter: filter }),
  setSelectedAlertId: (id) => set({ selectedAlertId: id }),
  toggleAudioMute: () => set((state) => ({ isAudioMuted: !state.isAudioMuted })),
}))
