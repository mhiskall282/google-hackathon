# Beacon Technical Architecture & Developer Guide

Welcome to the technical architecture guide for **Beacon**—the real-time operations center dashboard for tactical disaster coordination. This guide describes the system architecture, state flow patterns, map overlays, and strict coding conventions of the project.

---

## 🗺️ Tech Stack Overview

The frontend is an isolated, production-grade Vite workspace located under the [frontend/](file:///c:/Users/user/Desktop/google-hackathon/frontend) directory, leveraging:
1. **Vite + React (v18)**: Rapid-feedback building and hot module replacement.
2. **Leaflet & React Leaflet (v4)**: High-performance, GPU-accelerated spatial mapping using canvas overlays.
3. **Zustand (v4)**: Lightweight, atomic state containers separating state from UI components.
4. **Tailwind CSS (v4)**: Styled with modern color tokens (OKLCH scale) and glassmorphic tactical grids.
5. **Web Audio API**: Browser-native sound synthesis (beeps, alarm frequencies, filters) avoiding asset loading locks.

---

## 🗄️ State Architecture & State Stores

State in Beacon is segregated into three dedicated, single-purpose stores under [frontend/src/store/](file:///c:/Users/user/Desktop/google-hackathon/frontend/src/store/):

### 1. Map Navigation State (`useMapStore.ts`)
Tracks camera center, zoom levels, selection states of active markers, and toggles for visible map layers.
- **Dynamic Camera Control**: Features a `flyToFn` handler bound to the active Leaflet instance, allowing sidebars to pan/zoom the map view smoothly:
  ```typescript
  triggerFlyTo: (coords: [number, number], zoom?: number) => void
  ```
- **Visible Layers Registry**:
  ```typescript
  visibleLayers: {
    shelters: boolean;
    roads: boolean;
    assets: boolean;
    alerts: boolean;
    weather: boolean;
  }
  ```

### 2. Live Alerts Timeline State (`useAlertStore.ts`)
Manages the real-time stream of incoming incident alerts and filters (all, critical, warning, unverified).
- **Beep Synthesizer**: Connects to the Web Audio API to play alerts beeps when a new incident is pushed to the stream:
  - Critical incidents: `880Hz` high tone.
  - Warning incidents: `580Hz` double tone.
  - Feedback click sounds: `440Hz` clean tone.

### 3. AI Coordination Chat State (`useChatStore.ts`)
Drives the AI Copilot stream logic. Manages message history, active streaming state, active reasoning logs, and tool status feedback.
- **Thinking Thread / Reasoning Logs**: Stores lists of active thinking steps as they stream in:
  ```typescript
  activeReasoningSteps: string[];
  activeToolCalls: ToolCallStep[];
  ```

---

## 🛰️ Leaflet Dynamic Basemaps & Overlays

The spatial operations center in [MapView.tsx](file:///c:/Users/user/Desktop/google-hackathon/frontend/src/features/map-view/MapView.tsx) performs heavy graphic operations:

### 1. Real Google Satellite Map Switching
Unlike static leaflet maps, Beacon allows changing map tiles dynamically in the Floating Layers Control. Setting a React `key` equal to the active style forces the `TileLayer` to reload the grid instantly:
```tsx
<TileLayer
  key={mapStyle}
  url={
    mapStyle === 'satellite'
      ? 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}' // Google Hybrid Satellite
      : mapStyle === 'street'
      ? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' // OpenStreetMap
      : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' // Tactical Dark Matter
  }
/>
```

### 2. Radial Shelter Gauges
Shelter icons are generated as custom Leaflet `DivIcon`s that embed live SVG elements showing occupancy percentage radial gauges:
- Green: < 80% occupancy.
- Orange: 80% - 97% occupancy.
- Red: >= 98% (Critical / overflow diversion required).

### 3. Animated Radar Precipitation Bands
The weather overlay simulates Hurricane Elena's precipitation fields centered off the Gulf of Mexico/Galveston:
- Sweeping bands are rendered as concentric Leaflet `<Circle>` layers styled with SVG dasharrays:
  ```tsx
  dashArray: '80, 220' // Creates separate storm bands
  ```
- **GPU-Accelerated Sweep Animations**: Dashes crawl along circle boundaries using CSS `stroke-dashoffset` keyframes defined in [index.css](file:///c:/Users/user/Desktop/google-hackathon/frontend/src/index.css):
  ```css
  @keyframes radar-sweep-clockwise {
    from { stroke-dashoffset: 1000; }
    to { stroke-dashoffset: 0; }
  }
  .radar-band-fast {
    animation: radar-sweep-clockwise 15s linear infinite;
  }
  ```

---

## 🛠️ TypeScript Strict Compilation Requirements

To align with modern frontend best practices, all files are compiled under strict type rules.

- **Verbatim Module Syntax**: Imports of types must specify `import type` to prevent bundler runtime type pollution:
  ```typescript
  // CORRECT:
  import type { AlertSeverity } from '@/types'

  // INCORRECT:
  import { AlertSeverity } from '@/types'
  ```
- **Unused Variable Strictness**: All variables and imports must be used, or the compiler will throw `TS6133` and cancel production builds.

---

## 💻 Windows Local Development Gotchas

- ** Tailwind oxide EPERM File Lock**: On Windows systems, hot module reloading might lock Tailwind oxide native binary node processes. If a global `pnpm install` throws lock errors, execute npm/pnpm inside the isolated package folder:
  ```bash
  cd frontend
  pnpm install --ignore-workspace
  ```
