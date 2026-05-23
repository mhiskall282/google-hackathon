# BEACON FRONTEND SYSTEM CONTEXT

## PROJECT OVERVIEW

Beacon is an AI-powered disaster response coordination platform built for the Google Cloud Rapid Agent Hackathon 2026 (Elastic Track).

Beacon helps emergency responders coordinate shelters, road safety, supply distribution, and crisis intelligence during natural disasters.

The demo scenario is:
"Hurricane Elena — 24 hours after landfall in Houston, Texas."

This frontend is the operational command center for the Beacon system.

---

# MY ROLE

I am the Frontend & Visualization Engineer.

I own:

* frontend architecture
* UI/UX
* React application structure
* map systems
* visualizations
* animations
* alert systems
* real-time interfaces
* interaction flows
* accessibility
* responsive layouts
* API integrations from backend services

I do NOT own:

* backend APIs
* database logic
* agent orchestration
* cloud functions
* Elasticsearch indexing
* MongoDB infrastructure

Assume backend APIs will exist.

---

# FRONTEND PRODUCT VISION

Beacon should feel like:

* Palantir
* ArcGIS emergency dashboard
* modern defense/intelligence operations center
* enterprise SaaS
* live operational command software

NOT:

* generic hackathon UI
* student dashboard
* toy map app
* plain CRUD admin panel

The UI must feel:

* cinematic
* reactive
* real-time
* operational
* high stakes
* professional

---

# CORE FRONTEND EXPERIENCE

## Main Layout

Three-panel operational dashboard:

### LEFT SIDEBAR (15%)

Purpose:

* autonomous alerts
* severity indicators
* system notifications
* timeline events

Behavior:

* animated slide-ins
* pulsing critical alerts
* live updates every 5 seconds
* severity color coding

---

### CENTER MAP (60%)

Purpose:

* primary operational visualization

Technology:

* Leaflet.js
* react-leaflet
* CartoDB dark matter tiles

Features:

* shelter markers
* road polylines
* supply caches
* live alert overlays
* pulsing conflict zones
* animated route drawing

Map should always feel alive.

---

### RIGHT SIDEBAR (25%)

Purpose:

* AI agent interaction panel
* query history
* tool execution visualization
* situation reports

Features:

* chat UI
* streaming responses
* tool call indicators
* reasoning steps
* structured responses

---

# DESIGN SYSTEM

## Visual Style

Theme:

* dark tactical operations center
* neon-accented emergency intelligence dashboard

Use:

* deep blacks
* slate grays
* subtle glows
* glassmorphism
* layered depth
* animated borders
* soft gradients

Avoid:

* excessive colors
* playful UI
* cartoon styling
* oversimplified layouts

---

# COLOR LANGUAGE

Critical:

* red

Warning:

* orange

Operational:

* green

Informational:

* blue

Unverified:

* amber pulsing states

---

# UI PHILOSOPHY

Every component should answer:

1. What changed?
2. Is it dangerous?
3. What action matters?
4. Is this verified?

The UI should communicate urgency without chaos.

---

# ENGINEERING RULES

## Architecture

Use:

* modular feature-based structure
* reusable components
* typed APIs
* scalable folders
* separation of concerns

Preferred structure:
src/
features/
components/
services/
hooks/
store/
lib/
layouts/
pages/
types/

---

# STATE MANAGEMENT

Preferred:

* Zustand

Use for:

* alerts
* map state
* selected shelters
* active routes
* live incidents
* UI state

---

# DATA FETCHING

Use:

* TanStack Query

Requirements:

* polling support
* optimistic updates where useful
* loading states
* stale-time optimization
* retry handling

---

# ANIMATION RULES

Use Framer Motion for:

* alerts
* panel transitions
* loading states
* map overlays
* pulsing incidents
* reasoning indicators

Animations must feel:

* smooth
* intentional
* premium

Avoid:

* gimmicky motion
* excessive bounce
* distracting effects

---

# MAP RULES

Map is the hero.

Always prioritize:

* readability
* contrast
* motion clarity
* status visibility

Road states:

* green = passable
* red = blocked
* orange pulsing = unverified/conflict

Shelters:

* dynamic sizing by capacity
* visual occupancy indicators

---

# AGENT EXPERIENCE

The AI panel must make reasoning visible.

Show:

* tool execution states
* progressive steps
* loading phases
* confidence indicators
* source reasoning

Judges should SEE intelligence happening.

---

# DEMO OPTIMIZATION

This frontend is optimized for:

* live demos
* judges
* storytelling
* visual impact

Desktop-first optimization is acceptable.

Reliability > experimental complexity.

---

# DEVELOPMENT BEHAVIOR

When generating code:

* always produce production-quality code
* avoid placeholder UIs
* avoid beginner patterns
* avoid oversized files
* use TypeScript strictly
* use clean naming
* prefer composability

When generating components:

* include loading states
* include empty states
* include animations
* include accessibility support

When uncertain:

* choose the more polished UX option

---

# BUILD PRIORITIES

Priority order:

1. Operational map
2. Alert system
3. Chat/reasoning UI
4. Real-time updates
5. Visual polish
6. Performance optimization
7. Mobile responsiveness

---

# FRONTEND SUCCESS METRIC

Success means judges say:
"This feels like a real emergency operations platform."
