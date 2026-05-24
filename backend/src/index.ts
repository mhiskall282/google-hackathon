import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import type { Alert, Shelter, RoadSegment, AssetCache } from 'beacon-shared';
import { GoogleGenerativeAI, FunctionDeclaration } from '@google/generative-ai';
import { MongoClient, Db } from 'mongodb';
import { z } from 'zod';

// Load environment variables
dotenv.config();

// Zod Environment Schema Validation
const envSchema = z.object({
  PORT: z.string().transform((val) => parseInt(val, 10)).default('4000'),
  SUPABASE_URL: z.string().url().optional().or(z.literal('')),
  SUPABASE_KEY: z.string().optional().or(z.literal('')),
  GEMINI_API_KEY: z.string().optional().or(z.literal('')),
  MONGO_URL: z.string().optional()
});

const parsedEnv = envSchema.safeParse(process.env);
if (!parsedEnv.success) {
  console.error('❌ Environment validation failed:', parsedEnv.error.format());
  process.exit(1);
}
const env = parsedEnv.data;

const PORT = env.PORT;
const SUPABASE_URL = env.SUPABASE_URL || '';
const SUPABASE_KEY = env.SUPABASE_KEY || '';
const GEMINI_API_KEY = env.GEMINI_API_KEY || '';
const MONGO_URL = env.MONGO_URL || 'mongodb://admin:devpassword@localhost:27017/beacon_telemetry?authSource=admin';

const app = express();
app.use(express.json());

// Enable CORS for frontend client API queries
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Rate limiting configuration (60 requests per minute per IP)
const ipCache = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000;
const MAX_REQUESTS = 60;

const rateLimiter = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  
  const record = ipCache.get(ip);
  if (!record || now > record.resetTime) {
    ipCache.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return next();
  }
  
  record.count++;
  if (record.count > MAX_REQUESTS) {
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }
  next();
};

// Initialize Supabase Client if keys are available
const supabase = (SUPABASE_URL && SUPABASE_KEY) 
  ? createClient(SUPABASE_URL, SUPABASE_KEY) 
  : null;

if (supabase) {
  console.log('📡 Connected to Supabase Instance.');
} else {
  console.log('⚠️ Running in LOCAL MOCK Mode (Supabase environment variables not detected).');
}

// Initialize Gemini Generative AI client
const ai = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;
if (ai) {
  console.log('🤖 Google Gemini AI Client initialized.');
} else {
  console.log('⚠️ Gemini client offline (GEMINI_API_KEY not detected).');
}

// Initialize MongoDB client for telemetry archiving
let mongoClient: MongoClient | null = null;
let mongoDb: Db | null = null;

async function connectMongo() {
  try {
    console.log('📡 Connecting to MongoDB Telemetry Database...');
    mongoClient = new MongoClient(MONGO_URL, { serverSelectionTimeoutMS: 3000 });
    await mongoClient.connect();
    mongoDb = mongoClient.db();
    console.log('✅ Connected to MongoDB. Telemetry archiving active.');
    
    // Create capped collection for logs archive
    const collections = await mongoDb.listCollections({ name: 'telemetry_archive' }).toArray();
    if (collections.length === 0) {
      await mongoDb.createCollection('telemetry_archive', {
        capped: true,
        size: 5242880, // 5MB limit
        max: 5000 // 5000 records maximum
      });
      console.log('🌀 Created capped collection "telemetry_archive".');
    }
  } catch (err: any) {
    console.warn('⚠️ MongoDB connection failed. Running in GRACEFUL FALLBACK mode (Telemetry archiving disabled):', err.message);
    mongoClient = null;
    mongoDb = null;
  }
}
connectMongo();

// Helper to write to telemetry archive
async function archiveTelemetry(event: { type: string; payload: any }) {
  if (mongoDb) {
    try {
      await mongoDb.collection('telemetry_archive').insertOne({
        ...event,
        archived_at: new Date()
      });
    } catch (err: any) {
      console.error('❌ Failed to write to MongoDB archive:', err.message);
    }
  }
}

// In-Memory mock DB state (used in local mock mode or as caching layer)
const activeAlerts: Alert[] = [
  {
    id: 'alert-1',
    title: 'George R. Brown (GRB) Shelter Overload',
    description: 'GRB Convention Center has reached 99% occupancy. Emergency re-routing of inbound evacuees is urgently required.',
    severity: 'critical',
    lat: 29.7516,
    lng: -95.3585,
    timestamp: '24h Post-Landfall',
    verified: true,
    category: 'shelter'
  },
  {
    id: 'alert-2',
    title: 'I-10 East Flooding Blockage',
    description: 'Water levels at San Jacinto River have breached main roadway. I-10 East is fully impassable in both directions.',
    severity: 'critical',
    lat: 29.7891,
    lng: -95.2215,
    timestamp: '23.5h Post-Landfall',
    verified: true,
    category: 'road'
  }
];

const fallbackShelters: Shelter[] = [
  {
    id: 'shelter-1',
    name: 'NRG Arena & Center',
    lat: 29.6847,
    lng: -95.4077,
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
    lat: 29.7516,
    lng: -95.3585,
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
    lat: 29.7508,
    lng: -95.3621,
    capacity: 3000,
    occupancy: 1200,
    status: 'normal',
    supplies: [
      { item: 'Water Bottles', quantity: 9000, status: 'high' },
      { item: 'Rations (MREs)', quantity: 6500, status: 'high' },
      { item: 'Medical Kits', quantity: 250, status: 'high' },
      { item: 'Blankets', quantity: 4000, status: 'high' }
    ]
  }
];

const fallbackRoads: RoadSegment[] = [
  {
    id: 'road-1',
    name: 'I-45 South Freeway (Passable)',
    status: 'passable',
    coordinates: [[29.7804, -95.3698], [29.7420, -95.3620], [29.7120, -95.3410], [29.6847, -95.4077]]
  },
  {
    id: 'road-2',
    name: 'I-10 East (Blocked near San Jacinto River)',
    status: 'blocked',
    coordinates: [[29.7785, -95.3420], [29.7820, -95.2950], [29.7891, -95.2215], [29.7915, -95.1520]]
  }
];

const fallbackAssets: AssetCache[] = [
  {
    id: 'cache-1',
    name: 'Distribution Hub East',
    lat: 29.7712,
    lng: -95.1852,
    type: 'water',
    status: 'secure'
  },
  {
    id: 'cache-2',
    name: 'Medical Stock Cache South',
    lat: 29.6645,
    lng: -95.4525,
    type: 'medical',
    status: 'low'
  }
];

// Create HTTP Server
const server = createServer(app);

// Create WebSocket Server
const wss = new WebSocketServer({ server });

// Track connected WebSocket clients
interface ExtendedWebSocket extends WebSocket {
  isAlive?: boolean;
}
const clients = new Set<ExtendedWebSocket>();

wss.on('connection', (ws: ExtendedWebSocket) => {
  ws.isAlive = true;
  clients.add(ws);
  console.log(`🔌 Client connected. Total active links: ${clients.size}`);
  
  // Send current alerts cache upon connection
  ws.send(JSON.stringify({ type: 'SYNC_ALERTS', payload: activeAlerts }));

  ws.on('pong', () => {
    ws.isAlive = true;
  });

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log('✉️ Received WebSocket message:', data.type);
      
      // Echo or broadcast logic
      if (data.type === 'NEW_ALERT') {
        const alert: Alert = data.payload;
        activeAlerts.unshift(alert);
        broadcast({ type: 'ALERT_BROADCAST', payload: alert });
        
        // Log telemetry event in MongoDB
        archiveTelemetry({ type: 'ALERT_BROADCAST', payload: alert });
      }
    } catch (err) {
      console.error('❌ Failed to parse WebSocket message:', err);
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
    console.log(`🔌 Client disconnected. Remaining links: ${clients.size}`);
  });
});

// Periodic heartbeat sweeps every 30 seconds to prune dead connections
const heartbeatInterval = setInterval(() => {
  wss.clients.forEach((ws: ExtendedWebSocket) => {
    if (ws.isAlive === false) {
      console.log('🔌 Terminating dead connection link.');
      return ws.terminate();
    }
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

wss.on('close', () => {
  clearInterval(heartbeatInterval);
});

// Broadcast payload helper
function broadcast(data: object) {
  const payload = JSON.stringify(data);
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

// Database Tool Execution Handlers
async function executeListShelters() {
  if (supabase) {
    const { data } = await supabase.from('shelters').select('*');
    if (data) return data;
  }
  return fallbackShelters;
}

async function executeListRoadSegments() {
  if (supabase) {
    const { data } = await supabase.from('roads').select('*');
    if (data) return data;
  }
  return fallbackRoads;
}

async function executeListSupplyCaches() {
  if (supabase) {
    const { data } = await supabase.from('assets').select('*');
    if (data) return data;
  }
  return fallbackAssets;
}

// REST Endpoints
app.get('/', (req, res) => {
  res.json({
    name: 'Beacon Tactical Telemetry Hub API',
    status: 'ONLINE',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      alerts: '/api/alerts',
      liveAlerts: '/api/alerts/live',
      chat: '/api/chat (POST)'
    }
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'HEALTHY', supabaseConnected: !!supabase, mongoConnected: !!mongoDb });
});

// Retrieve alerts
app.get('/api/alerts', async (req, res) => {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return res.json(data);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
  
  // Return in-memory mock data
  res.json(activeAlerts);
});

// Post a new alert
app.post('/api/alerts', async (req, res) => {
  const newAlert: Alert = {
    id: `alert-${Date.now()}`,
    ...req.body,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('alerts')
        .insert([newAlert])
        .select();
      
      if (error) throw error;
      
      // Broadcast over WebSockets
      broadcast({ type: 'ALERT_BROADCAST', payload: data[0] });
      // Archive to MongoDB
      archiveTelemetry({ type: 'ALERT_CREATION', payload: data[0] });
      
      return res.status(201).json(data[0]);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  // Fallback local push
  activeAlerts.unshift(newAlert);
  broadcast({ type: 'ALERT_BROADCAST', payload: newAlert });
  archiveTelemetry({ type: 'ALERT_CREATION', payload: newAlert });
  res.status(201).json(newAlert);
});

// Helper to fetch live GDACS and USGS global feeds
async function fetchGlobalLiveAlerts(): Promise<Alert[]> {
  const liveAlerts: Alert[] = [];
  
  try {
    console.log('📡 Fetching UN GDACS global disaster feeds...');
    const gdacsRes = await fetch('https://www.gdacs.org/xml/gdacs.geojson');
    if (gdacsRes.ok) {
      const gdacsData = await gdacsRes.json() as any;
      if (gdacsData.features) {
        gdacsData.features.slice(0, 15).forEach((feat: any) => {
          const props = feat.properties;
          const geom = feat.geometry;
          if (geom && geom.coordinates) {
            const lng = geom.coordinates[0];
            const lat = geom.coordinates[1];
            
            let severity: 'critical' | 'warning' | 'info' | 'unverified' = 'info';
            if (props.alertlevel === 'red') severity = 'critical';
            else if (props.alertlevel === 'orange') severity = 'warning';
            
            liveAlerts.push({
              id: `gdacs-${props.eventid || Math.random()}`,
              title: props.eventname ? `GDACS: ${props.eventname}` : 'Global Disaster Alert',
              description: props.description || `Active event type: ${props.eventtype} with severity ${props.alertlevel}`,
              severity,
              lat,
              lng,
              timestamp: props.todate || 'Active Now',
              verified: true,
              category: 'general'
            });
          }
        });
      }
    }
  } catch (err) {
    console.error('❌ Failed to fetch GDACS live feed:', err);
  }

  try {
    console.log('📡 Fetching USGS global earthquake feeds...');
    const usgsRes = await fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson');
    if (usgsRes.ok) {
      const usgsData = await usgsRes.json() as any;
      if (usgsData.features) {
        usgsData.features.slice(0, 15).forEach((feat: any) => {
          const props = feat.properties;
          const geom = feat.geometry;
          if (geom && geom.coordinates) {
            const lng = geom.coordinates[0];
            const lat = geom.coordinates[1];
            
            let severity: 'critical' | 'warning' | 'info' | 'unverified' = 'info';
            if (props.mag >= 6.0) severity = 'critical';
            else if (props.mag >= 5.0) severity = 'warning';

            liveAlerts.push({
              id: `usgs-${feat.id || Math.random()}`,
              title: `USGS: M ${props.mag} Earthquake`,
              description: props.place || `Earthquake detected at depth: ${geom.coordinates[2]}km`,
              severity,
              lat,
              lng,
              timestamp: new Date(props.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              verified: true,
              category: 'general'
            });
          }
        });
      }
    }
  } catch (err) {
    console.error('❌ Failed to fetch USGS live feed:', err);
  }

  return liveAlerts;
}

// Endpoint to retrieve real global live alerts
app.get('/api/alerts/live', async (req, res) => {
  try {
    const liveAlerts = await fetchGlobalLiveAlerts();
    res.json(liveAlerts);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch global live data feeds', details: err.message });
  }
});

// Gemini Copilot Function Declarations
const listSheltersDeclaration: FunctionDeclaration = {
  name: 'listShelters',
  description: 'Retrieve the current list of emergency shelters in Houston, including their names, capacities, current occupancies, status, and stocked supplies.',
  parameters: {
    type: 'OBJECT' as any,
    properties: {},
    required: []
  }
};

const listRoadSegmentsDeclaration: FunctionDeclaration = {
  name: 'listRoadSegments',
  description: 'Retrieve the list of major highway and road segments, including their current status (passable, blocked, unverified) and coordinate paths.',
  parameters: {
    type: 'OBJECT' as any,
    properties: {},
    required: []
  }
};

const listSupplyCachesDeclaration: FunctionDeclaration = {
  name: 'listSupplyCaches',
  description: 'Retrieve the emergency supply cache depots, including their names, coordinates, resource types (medical, food, water, equipment), and status.',
  parameters: {
    type: 'OBJECT' as any,
    properties: {},
    required: []
  }
};

// API Endpoint for AI Copilot (SSE Streaming + Multi-Tool routing)
app.post('/api/chat', rateLimiter, async (req, res) => {
  const { message, history } = req.body || {};

  if (!message) {
    return res.status(400).json({ error: 'Missing field: message' });
  }

  // Set SSE Headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  const sendSSE = (type: string, payload: any) => {
    res.write(`data: ${JSON.stringify({ type, payload })}\n\n`);
  };

  if (!ai) {
    sendSSE('REASONING', 'Establishing local mock reasoning link...');
    await new Promise((r) => setTimeout(r, 600));
    sendSSE('REASONING', 'Querying local fallback databases...');
    await new Promise((r) => setTimeout(r, 400));
    sendSSE('TEXT', '⚠️ Local Fallback Mode: Gemini AI Client is currently offline (GEMINI_API_KEY missing from environment). Config backend/.env to connect to Google Cloud generative services.');
    sendSSE('DONE', null);
    return res.end();
  }

  try {
    const model = ai.getGenerativeModel({
      model: 'gemini-3.5-flash',
      tools: [{
        functionDeclarations: [
          listSheltersDeclaration,
          listRoadSegmentsDeclaration,
          listSupplyCachesDeclaration
        ]
      }],
      systemInstruction: `You are the Beacon Emergency AI Copilot. You are coordinating rescue logistics during Hurricane Elena in Houston, TX. 
You have access to real-time database tools to query shelters, road blockages, and supply caches.
Before calling any tool, briefly describe what you are doing in the reasoning trace (e.g. "Querying shelter capacity indexes..."). 
Format all response text in markdown. If you recommend redirection or transit bypass, explain the reason and name specific passable segments (like I-45) or open shelters (like Toyota Center).`
    });

    const chat = model.startChat({
      history: (history || []).map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }))
    });

    const processStream = async (messageOrParts: any) => {
      const streamResult = await chat.sendMessageStream(messageOrParts);
      
      let nextMessageParts: any = null;
      for await (const chunk of streamResult.stream) {
        const calls = chunk.functionCalls();
        if (calls && calls.length > 0) {
          for (const call of calls) {
            sendSSE('REASONING', `Gemini requested tool call: "${call.name}"`);
            
            let toolOutput: any;
            if (call.name === 'listShelters') {
              sendSSE('REASONING', 'Querying Supabase database shelters registry...');
              toolOutput = await executeListShelters();
            } else if (call.name === 'listRoadSegments') {
              sendSSE('REASONING', 'Querying traffic sensors for impassable road corridors...');
              toolOutput = await executeListRoadSegments();
            } else if (call.name === 'listSupplyCaches') {
              sendSSE('REASONING', 'Reading resource stockpiles and asset depots...');
              toolOutput = await executeListSupplyCaches();
            } else {
              toolOutput = { error: 'Unknown tool' };
            }
            
            sendSSE('TOOL_CALL', {
              id: `${call.name}-${Date.now()}`,
              name: call.name,
              status: 'completed',
              input: JSON.stringify(call.args),
              output: JSON.stringify(toolOutput)
            });
            
            // Set up next step input with function response
            nextMessageParts = [{
              functionResponse: {
                name: call.name,
                response: { content: toolOutput }
              }
            }];
            break;
          }
          break; // Stop iterating current stream as we must feed the function response back
        } else {
          const text = chunk.text();
          if (text) {
            sendSSE('TEXT', text);
          }
        }
      }
      
      // If a tool was executed, recursively call processStream with the tool response
      if (nextMessageParts) {
        await processStream(nextMessageParts);
      }
    };

    await processStream(message);
    
    // Log telemetry event in MongoDB
    await archiveTelemetry({
      type: 'LLM_CHAT',
      payload: { prompt: message, timestamp: new Date() }
    });

    sendSSE('DONE', null);
  } catch (err: any) {
    console.error('❌ Gemini stream error:', err);
    sendSSE('REASONING', `Stream processing encountered a generative error: ${err.message}`);
    sendSSE('TEXT', `\n\n❌ **Error during copilot generation:** ${err.message}`);
    sendSSE('DONE', null);
  } finally {
    res.end();
  }
});

server.listen(PORT, () => {
  console.log(`🚀 Beacon Coordination Backend running on http://localhost:${PORT}`);
});
