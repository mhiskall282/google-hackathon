import { Shelter, RoadSegment, AssetCache, Alert, Message } from '@/types'

// Map Coordinates base for Houston, TX
export const HOUSTON_COORDS = {
  center: [29.7604, -95.3698] as [number, number],
  nrg: [29.6847, -95.4077] as [number, number],
  grb: [29.7516, -95.3585] as [number, number],
  toyota: [29.7508, -95.3621] as [number, number],
  hbu: [29.6942, -95.5152] as [number, number],
  i10_flood: [29.7891, -95.2215] as [number, number],
  loop610_block: [29.6985, -95.4215] as [number, number],
  hwy288_flood: [29.6385, -95.3855] as [number, number],
  dist_east: [29.7712, -95.1852] as [number, number],
  med_south: [29.6645, -95.4525] as [number, number],
  water_north: [29.8942, -95.4215] as [number, number],
  eng_west: [29.7345, -95.5515] as [number, number],
}

export const mockShelters: Shelter[] = [
  {
    id: 'shelter-1',
    name: 'NRG Arena & Center',
    lat: HOUSTON_COORDS.nrg[0],
    lng: HOUSTON_COORDS.nrg[1],
    capacity: 10000,
    occupancy: 8400,
    status: 'normal',
    supplies: [
      { item: 'Water Bottles', quantity: 15000, status: 'high' },
      { item: 'Rations (MREs)', quantity: 8200, status: 'medium' },
      { item: 'Medical Kits', quantity: 120, status: 'low' },
      { item: 'Blankets', quantity: 9500, status: 'high' }
    ]
  },
  {
    id: 'shelter-2',
    name: 'George R. Brown Convention Center',
    lat: HOUSTON_COORDS.grb[0],
    lng: HOUSTON_COORDS.grb[1],
    capacity: 5000,
    occupancy: 4950,
    status: 'critical',
    supplies: [
      { item: 'Water Bottles', quantity: 2000, status: 'low' },
      { item: 'Rations (MREs)', quantity: 1800, status: 'low' },
      { item: 'Medical Kits', quantity: 45, status: 'low' },
      { item: 'Blankets', quantity: 5100, status: 'high' }
    ]
  },
  {
    id: 'shelter-3',
    name: 'Toyota Center',
    lat: HOUSTON_COORDS.toyota[0],
    lng: HOUSTON_COORDS.toyota[1],
    capacity: 3000,
    occupancy: 1200,
    status: 'normal',
    supplies: [
      { item: 'Water Bottles', quantity: 9000, status: 'high' },
      { item: 'Rations (MREs)', quantity: 6500, status: 'high' },
      { item: 'Medical Kits', quantity: 250, status: 'high' },
      { item: 'Blankets', quantity: 4000, status: 'high' }
    ]
  },
  {
    id: 'shelter-4',
    name: 'HBU Athletic Center Gym',
    lat: HOUSTON_COORDS.hbu[0],
    lng: HOUSTON_COORDS.hbu[1],
    capacity: 800,
    occupancy: 800,
    status: 'full',
    supplies: [
      { item: 'Water Bottles', quantity: 1200, status: 'medium' },
      { item: 'Rations (MREs)', quantity: 700, status: 'low' },
      { item: 'Medical Kits', quantity: 15, status: 'low' },
      { item: 'Blankets', quantity: 820, status: 'high' }
    ]
  }
]

export const mockRoadSegments: RoadSegment[] = [
  {
    id: 'road-1',
    name: 'I-45 South Freeway (Passable)',
    status: 'passable',
    coordinates: [
      [29.7804, -95.3698],
      [29.7420, -95.3620],
      [29.7120, -95.3410],
      [29.6847, -95.4077]
    ]
  },
  {
    id: 'road-2',
    name: 'I-10 East (Blocked near San Jacinto River)',
    status: 'blocked',
    coordinates: [
      [29.7785, -95.3420],
      [29.7820, -95.2950],
      [29.7891, -95.2215],
      [29.7915, -95.1520]
    ]
  },
  {
    id: 'road-3',
    name: 'Loop 610 South (Blocked near Braeswood Blvd)',
    status: 'blocked',
    coordinates: [
      [29.7215, -95.4615],
      [29.6985, -95.4215],
      [29.6745, -95.3955]
    ]
  },
  {
    id: 'road-4',
    name: 'Highway 288 (Unverified Flooding near Clear Creek)',
    status: 'unverified',
    coordinates: [
      [29.7020, -95.3780],
      [29.6645, -95.3810],
      [29.6385, -95.3855],
      [29.5820, -95.3910]
    ]
  }
]

export const mockAssets: AssetCache[] = [
  {
    id: 'cache-1',
    name: 'Distribution Hub East',
    lat: HOUSTON_COORDS.dist_east[0],
    lng: HOUSTON_COORDS.dist_east[1],
    type: 'water',
    status: 'secure'
  },
  {
    id: 'cache-2',
    name: 'Medical Stock Cache South',
    lat: HOUSTON_COORDS.med_south[0],
    lng: HOUSTON_COORDS.med_south[1],
    type: 'medical',
    status: 'low'
  },
  {
    id: 'cache-3',
    name: 'Emergency Water Cache North',
    lat: HOUSTON_COORDS.water_north[0],
    lng: HOUSTON_COORDS.water_north[1],
    type: 'water',
    status: 'unavailable'
  },
  {
    id: 'cache-4',
    name: 'Engineering Equipment West',
    lat: HOUSTON_COORDS.eng_west[0],
    lng: HOUSTON_COORDS.eng_west[1],
    type: 'equipment',
    status: 'secure'
  }
]

export const initialAlerts: Alert[] = [
  {
    id: 'alert-1',
    title: 'George R. Brown (GRB) Shelter Overload',
    description: 'GRB Convention Center has reached 99% occupancy. Emergency re-routing of inbound evacuees is urgently required.',
    severity: 'critical',
    lat: HOUSTON_COORDS.grb[0],
    lng: HOUSTON_COORDS.grb[1],
    timestamp: '24h Post-Landfall',
    verified: true,
    category: 'shelter'
  },
  {
    id: 'alert-2',
    title: 'I-10 East Flooding Blockage',
    description: 'Water levels at San Jacinto River have breached main roadway. I-10 East is fully impassable in both directions.',
    severity: 'critical',
    lat: HOUSTON_COORDS.i10_flood[0],
    lng: HOUSTON_COORDS.i10_flood[1],
    timestamp: '23.5h Post-Landfall',
    verified: true,
    category: 'road'
  },
  {
    id: 'alert-3',
    title: 'Medical Cache Depletion',
    description: 'Medical Supply Cache South has dropped below 10% inventory of critical trauma bandages and basic anti-infection kits.',
    severity: 'warning',
    lat: HOUSTON_COORDS.med_south[0],
    lng: HOUSTON_COORDS.med_south[1],
    timestamp: '23h Post-Landfall',
    verified: true,
    category: 'supply'
  },
  {
    id: 'alert-4',
    title: 'Unverified Report: Bridge Structural Damage',
    description: 'Social media reporting of possible foundation collapse on Hwy 288 near Clear Creek. Utility crews dispatched to inspect.',
    severity: 'unverified',
    lat: HOUSTON_COORDS.hwy288_flood[0],
    lng: HOUSTON_COORDS.hwy288_flood[1],
    timestamp: '22h Post-Landfall',
    verified: false,
    category: 'road'
  }
]

// Extra alerts triggered during simulation
export const incomingAlertsStream: Alert[] = [
  {
    id: 'alert-5',
    title: 'Pulsing Gas Leak near Toyota Center',
    description: 'Hazardous gas leak reported at 1500 Polk St. Emergency evacuation zone set up for a 2-block radius. Dispatching containment team.',
    severity: 'critical',
    lat: 29.7495,
    lng: -95.3615,
    timestamp: 'Just Now',
    verified: true,
    category: 'general'
  },
  {
    id: 'alert-6',
    title: 'Water Cache North Structural Fail',
    description: 'Severe structural damages reported on primary storage silo at North Cache. Remaining stockpiles declared inaccessible.',
    severity: 'warning',
    lat: HOUSTON_COORDS.water_north[0],
    lng: HOUSTON_COORDS.water_north[1],
    timestamp: 'Just Now',
    verified: true,
    category: 'supply'
  },
  {
    id: 'alert-7',
    title: 'HBU Gymnasium approaching full capacity',
    description: 'Evacuee arrivals at HBU Gym have exceeded original bounds. Shelter status shifted to Full.',
    severity: 'warning',
    lat: HOUSTON_COORDS.hbu[0],
    lng: HOUSTON_COORDS.hbu[1],
    timestamp: 'Just Now',
    verified: true,
    category: 'shelter'
  }
]

// Chat response presets for cinematic demonstration
export interface MockScenario {
  reasoning: string[];
  tools: { name: string; input: string; output: string }[];
  reply: string;
}

export const chatScenarios: Record<string, MockScenario> = {
  shelter: {
    reasoning: [
      'Scanning Houston shelter capacity indexes...',
      'Retrieving George R. Brown (GRB) capacity levels: 4950/5000 (99%) occupancy',
      'Retrieving Toyota Center capacity levels: 1200/3000 (40%) occupancy',
      'Calculating closest safe routing from GRB to Toyota Center avoiding blockages...',
      'Identifying that I-45 South Freeway is Passable and offers a direct 5-minute corridor.'
    ],
    tools: [
      {
        name: 'query_shelter_capacity',
        input: '{"filter": "critical"}',
        output: '[{"id": "shelter-2", "name": "George R. Brown Center", "occupancy": 4950, "capacity": 5000}]'
      },
      {
        name: 'calculate_route_optimization',
        input: '{"origin": "GRB Center", "destination": "Toyota Center"}',
        output: '{"optimal_route": "I-45 South", "status": "passable", "travel_time_mins": 6}'
      }
    ],
    reply: `**Incident Commander Alert Level Yellow:**
George R. Brown (GRB) is currently at **99% capacity** (4,950/5,000 evacuees). We must divert any inbound emergency buses immediately.

**Recommended Action Matrix:**
1. **Divert to Toyota Center**: Currently at only **40% occupancy** (1,200/3,000 capacity). It has a surplus of water and medical supplies.
2. **Transit Corridor**: Instruct all dispatchers to use the **I-45 South Freeway**, which has been verified as **passable** by aerial reconnaissance.
3. **Dispatch Teams**: I am issuing a tool call to reserve 300 spaces at Toyota Center for immediate overflow. Would you like me to alert the GRB intake commander?`
  },
  road: {
    reasoning: [
      'Querying road blockage logs in Harris County...',
      'Detecting critical blockages on I-10 East (Water Breach) and Loop 610 South (Utility Pole Collapse)...',
      'Synthesizing safe bypass maps for responders driving from East Distribution Hub to NRG Arena...',
      'Routing engine running Dijkstra optimization...'
    ],
    tools: [
      {
        name: 'search_road_blockages',
        input: '{"location": "Houston East to South"}',
        output: '[{"id": "road-2", "name": "I-10 East", "status": "blocked"}, {"id": "road-3", "name": "Loop 610 South", "status": "blocked"}]'
      },
      {
        name: 'compute_alternate_route',
        input: '{"origin": "Dist East", "destination": "NRG Center"}',
        output: '{"path": ["I-10 East Bypass", "I-45 South"], "avoid": ["Loop 610 South"], "status": "passable"}'
      }
    ],
    reply: `**Road Navigation Intelligence Report:**
Hurricane Elena flood waters have blocked **I-10 East** and debris has severed **Loop 610 South**. 

**Primary Transit Solutions:**
- **Avoid I-10 East & Loop 610 South** completely.
- **Supply Delivery Route**: To transport supplies from the **Distribution Hub East** to **NRG Arena**, use the *I-10 East local bypass* up to the junction, then connect to the **I-45 South Freeway**, which remains clear and passable.
- **Caution Flag**: Hwy 288 is unverified near Clear Creek; do not route heavy supply trucks through this sector until the bridge is verified by engineering crews.`
  },
  supplies: {
    reasoning: [
      'Scanning asset caches for medical supplies...',
      'Alert flagged: Medical Cache South is down to 10% inventory.',
      'Checking alternative distribution caches with high medical assets...',
      'Locating high stockpiles: Toyota Center has 250 Medical Kits (status: high).',
      'Generating supply dispatch directive...'
    ],
    tools: [
      {
        name: 'query_asset_inventory',
        input: '{"type": "medical"}',
        output: '[{"id": "cache-2", "name": "Medical Stock South", "status": "low"}, {"id": "shelter-3", "name": "Toyota Center", "medical": "high"}]'
      },
      {
        name: 'create_dispatch_ticket',
        input: '{"source": "Toyota Center", "target": "Medical Stock South", "amount": 100}',
        output: '{"ticket_id": "DISP-8924", "status": "pending_approval"}'
      }
    ],
    reply: `**Resource Allocation System Update:**
We have identified a critical supply bottleneck. **Medical Stock Cache South** is nearly depleted of trauma supplies (status: **LOW**).

**Allocation Directive:**
1. **Source Supplies**: **Toyota Center** has a massive surplus of medical kits (250 kits, status: high).
2. **Action Plan**: Dispatching a utility vehicle with **100 medical kits** from Toyota Center to the South Cache.
3. **Dispatch Ticket Created**: ticket ID \`DISP-8924\`. Please approve the allocation in the UI to dispatch the vehicles.`
  },
  default: {
    reasoning: [
      'Ingesting global command command request...',
      'Synthesizing operational parameters for Houston command panel...',
      'Returning system summary...'
    ],
    tools: [],
    reply: `**Beacon AI Disaster Coordination Copilot Online**
I am monitoring telemetry for **Hurricane Elena (24h post-landfall)**.

**System Telemetry Summary:**
- **Critical Alerts**: 2 active (GRB Shelter capacity overload, I-10 East Flooding)
- **Shelters Active**: 4 emergency locations online
- **Caches Monitored**: 4 supply caches mapped

*How can I assist coordinate response?*
- Ask about **"shelters"** to calculate evacuee re-routing.
- Ask about **"road"** or **"blockage"** to check passable corridors.
- Ask about **"supplies"** to trigger resource dispatch tickets.`
  }
}

// Function to simulate AI streaming response with thinking phases and tool executions
export function simulateChatStream(
  userInput: string,
  onProgress: (text: string, reasoning: string[], tools: ToolCallStep[]) => void,
  onComplete: (finalMessage: Message) => void
) {
  // Determine scenario based on keyword
  const normalized = userInput.toLowerCase();
  let scenario = chatScenarios.default;
  if (normalized.includes('shelter')) {
    scenario = chatScenarios.shelter;
  } else if (normalized.includes('road') || normalized.includes('block') || normalized.includes('traffic') || normalized.includes('way')) {
    scenario = chatScenarios.road;
  } else if (normalized.includes('supply') || normalized.includes('supplies') || normalized.includes('medical') || normalized.includes('kit') || normalized.includes('cache')) {
    scenario = chatScenarios.supplies;
  }

  const reasoning = scenario.reasoning;
  const toolCalls = scenario.tools.map((t, idx) => ({
    id: `tool-${idx}-${Date.now()}`,
    name: t.name,
    status: 'running' as const,
    input: t.input
  }));
  
  const finalReply = scenario.reply;
  
  let currentReasoningIndex = 0;
  let currentToolIndex = 0;
  const currentReasoning: string[] = [];
  const currentTools: ToolCallStep[] = [];
  
  // Timer driven state progression to simulate AI agent workflows
  const interval = setInterval(() => {
    // 1. Progress through reasoning steps
    if (currentReasoningIndex < reasoning.length) {
      currentReasoning.push(reasoning[currentReasoningIndex]);
      currentReasoningIndex++;
      onProgress('', [...currentReasoning], [...currentTools]);
      return;
    }
    
    // 2. Trigger tool execution
    if (currentToolIndex < toolCalls.length) {
      const activeTool = toolCalls[currentToolIndex];
      
      // If we just added it, run it
      if (!currentTools.some((t) => t.id === activeTool.id)) {
        currentTools.push(activeTool);
        onProgress('', [...currentReasoning], [...currentTools]);
      } else {
        // Otherwise, complete it
        const originalSpec = scenario.tools[currentToolIndex];
        currentTools[currentToolIndex] = {
          ...activeTool,
          status: 'completed',
          output: originalSpec.output
        };
        currentToolIndex++;
        onProgress('', [...currentReasoning], [...currentTools]);
      }
      return;
    }
    
    // 3. Clear interval and start streaming reply text
    clearInterval(interval);
    
    let charIndex = 0;
    const streamSpeed = 15; // characters per tick
    const textInterval = setInterval(() => {
      if (charIndex <= finalReply.length) {
        onProgress(finalReply.substring(0, charIndex), [...currentReasoning], [...currentTools]);
        charIndex += streamSpeed;
      } else {
        clearInterval(textInterval);
        
        // Finalize message object
        onComplete({
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: finalReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          reasoningSteps: reasoning,
          toolCalls: currentTools.map((t, idx) => ({
            ...t,
            status: 'completed',
            output: scenario.tools[idx].output
          }))
        });
      }
    }, 30);

  }, 1000);
}
