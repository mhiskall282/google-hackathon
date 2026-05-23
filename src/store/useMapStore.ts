import { create } from 'zustand'

interface MapState {
  center: [number, number];
  zoom: number;
  selectedShelterId: string | null;
  selectedAlertId: string | null;
  selectedRoadId: string | null;
  selectedAssetId: string | null;
  visibleLayers: {
    shelters: boolean;
    roads: boolean;
    assets: boolean;
    alerts: boolean;
  };
  flyToFn: ((center: [number, number], zoom?: number) => void) | null;
  
  setCenter: (center: [number, number]) => void;
  setZoom: (zoom: number) => void;
  setSelectedShelterId: (id: string | null) => void;
  setSelectedAlertId: (id: string | null) => void;
  setSelectedRoadId: (id: string | null) => void;
  setSelectedAssetId: (id: string | null) => void;
  toggleLayer: (layer: 'shelters' | 'roads' | 'assets' | 'alerts') => void;
  setFlyToFn: (fn: (center: [number, number], zoom?: number) => void) => void;
  triggerFlyTo: (center: [number, number], zoom?: number) => void;
}

export const useMapStore = create<MapState>((set, get) => ({
  center: [29.7604, -95.3698], // Houston default coordinates
  zoom: 11,
  selectedShelterId: null,
  selectedAlertId: null,
  selectedRoadId: null,
  selectedAssetId: null,
  visibleLayers: {
    shelters: true,
    roads: true,
    assets: true,
    alerts: true,
  },
  flyToFn: null,

  setCenter: (center) => set({ center }),
  setZoom: (zoom) => set({ zoom }),
  setSelectedShelterId: (id) => set({ selectedShelterId: id, selectedAlertId: null, selectedRoadId: null, selectedAssetId: null }),
  setSelectedAlertId: (id) => set({ selectedAlertId: id, selectedShelterId: null, selectedRoadId: null, selectedAssetId: null }),
  setSelectedRoadId: (id) => set({ selectedRoadId: id, selectedShelterId: null, selectedAlertId: null, selectedAssetId: null }),
  setSelectedAssetId: (id) => set({ selectedAssetId: id, selectedShelterId: null, selectedAlertId: null, selectedRoadId: null }),
  
  toggleLayer: (layer) => set((state) => ({
    visibleLayers: {
      ...state.visibleLayers,
      [layer]: !state.visibleLayers[layer],
    }
  })),
  
  setFlyToFn: (fn) => set({ flyToFn: fn }),
  triggerFlyTo: (center, zoom) => {
    const fn = get().flyToFn;
    if (fn) {
      fn(center, zoom || get().zoom);
    }
    set({ center, ...(zoom ? { zoom } : {}) });
  }
}))
