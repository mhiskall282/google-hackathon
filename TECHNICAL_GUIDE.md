# Beacon Technical Architecture & Developer Guide

Welcome to the technical architecture guide for **Beacon**—the real-time operations center dashboard for tactical disaster coordination. This guide describes the system architecture, state flow patterns, map overlays, shared workspace packages, backend server, database schemas, local infrastructure setup, and serverless Google Cloud Functions.

---

## 🗺️ Tech Stack Overview

Beacon is built as an integrated, production-grade monorepo containing multiple workspace packages:
1. **beacon-frontend** ([frontend/](file:///c:/Users/user/Desktop/google-hackathon/frontend)): React 18, Vite 5, Leaflet, Zustand 4, Tailwind CSS v4, and the Web Audio API.
2. **beacon-shared** ([shared/](file:///c:/Users/user/Desktop/google-hackathon/shared)): Pure TypeScript schemas defining telemetry contracts.
3. **beacon-backend** ([backend/](file:///c:/Users/user/Desktop/google-hackathon/backend)): Node.js, Express, WebSocket server (`ws`), and the Supabase JS SDK.
4. **beacon-cloud-functions** ([cloud-functions/](file:///c:/Users/user/Desktop/google-hackathon/cloud-functions)): Serverless Node.js endpoints utilizing the Google Cloud Functions framework and the Gemini Pro API.
5. **infrastructure** ([infrastructure/](file:///c:/Users/user/Desktop/google-hackathon/infrastructure)): Docker Compose database setups and Supabase schema scripts.

---

## 📂 Monorepo Architecture & Dependencies

Beacon manages package linkages via `pnpm` workspaces. 

```
/
├── frontend/               # React + Vite application
│   └── package.json        # References "beacon-shared": "workspace:*"
├── backend/                # Express + WebSockets Node server
│   └── package.json        # References "beacon-shared": "workspace:*"
├── cloud-functions/        # GCF serverless handlers (Gemini Pro + Supabase)
│   └── package.json        # References "beacon-shared": "workspace:*"
├── shared/                 # Common TypeScript interface definitions
│   └── src/index.ts        # Exports: Alert, Shelter, RoadSegment, AssetCache, Message
├── infrastructure/         # Docker Compose & Supabase SQL migrations
└── package.json            # Root configuration running workspaces
```

---

## 🧬 Monorepo Workspace Shared Types (`beacon-shared`)

All coordinates, severities, and status schemas are exported from the single source of truth: `shared/src/index.ts`. 

Frontend maps their types to [frontend/src/types/index.ts](file:///c:/Users/user/Desktop/google-hackathon/frontend/src/types/index.ts) using:
```typescript
export * from 'beacon-shared'
```

Any changes made to data contracts in `shared/src/index.ts` automatically propagate to both frontend compile tasks and backend server tasks upon save, with zero rebuild steps required.

---

## 📡 Backend Architecture (`beacon-backend`)

The Node.js server serves HTTP REST requests and sustains real-time state broadcasts over WebSockets.
- **WebSocket Real-Time Broadcast**: Connected frontends are synced with the current alert array on load. When new alerts are pushed via REST or WebSocket from any incident dispatcher, they are broadcasted to all connected clients.
- **Supabase Client Integration**: The server uses `@supabase/supabase-js` to persist and retrieve disaster telemetry from the Supabase Postgres instance.

---

## ☁️ Serverless Google Cloud Functions (`beacon-cloud-functions`)

Beacon features serverless Node.js handlers located in the [cloud-functions/](file:///c:/Users/user/Desktop/google-hackathon/cloud-functions) directory. They integrate **Gemini Pro** and **Supabase** database triggers.

### 1. HTTP Webhook Alert Parser (`processIncomingAlert`)
Triggered by external webhooks (such as incident dispatcher forms, citizen SMS, or automated radio logs).
- **Gemini Pro NLP Parsing**: Receives a raw text description (`rawReport`) and invokes the Gemini Pro LLM (`gemini-pro`) using `@google/generative-ai` to parse, categorize, and approximate coordinates relative to Houston landmarks (e.g. NRG Arena, George R. Brown Center, Toyota Center).
- **Supabase Insert**: Saves the parsed structured JSON directly to your live Supabase `alerts` table.
- **Local Fallback**: Safely drops into Local Mock Mode if credentials are omitted.
- **Execution Endpoint**: Runs locally on `http://localhost:8080`.

### 2. Auto Shelter Monitor (`checkShelterCapacity`)
Fires dynamically or via cron schedulers to audit active shelters in Supabase.
- **Capacity Overflow Check**: Iterates through active shelter registries. If a shelter's occupancy exceeds the **95% capacity threshold**, the function updates the shelter status to `critical` in the database.
- **Automated Rerouting Alert**: Inserts a high-priority, verified critical warning into the `alerts` timeline, triggering automated redirection algorithms on the map UI.
- **Execution Endpoint**: Runs locally on `http://localhost:8081`.

---

## 🗄️ Database Infrastructure Setup

All database components are declared in [infrastructure/](file:///c:/Users/user/Desktop/google-hackathon/infrastructure/):
- **Supabase PostgreSQL Schema Script**: Declares enums, tables, Row-Level Security (RLS) policies, and seed rows representing active shelters, segments, and assets.
- **Local Docker Compose**: Starts local PostgreSQL (automatically initialized with `schema.sql`) and MongoDB container databases to run local offline development environments.

---

## 💻 Monorepo Workspace Executable Scripts

Manage compile and run processes using these commands at the root:

| Command | Run Port | Action |
| :--- | :--- | :--- |
| `pnpm dev:frontend` | `5173` | Launch Vite Dev server for Frontend UI |
| `pnpm dev:backend` | `4000` | Launch watch mode tsx execution for Node server |
| `pnpm dev:functions:alert` | `8080` | Local GCF runtime for Gemini Alert Webhook |
| `pnpm dev:functions:shelter` | `8081` | Local GCF runtime for Shelter Capacity Monitor |
| `pnpm typecheck` | N/A | Perform recursive typescript compile check on all folders |
| `pnpm build` | N/A | Bundle frontend assets and compile backend + GCF files |
| `pnpm install` | N/A | Symlink workspace packages and fetch node dependencies |
