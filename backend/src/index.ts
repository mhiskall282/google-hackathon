import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import type { Alert, Message, Shelter, RoadSegment } from 'beacon-shared';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 4000;
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';

const app = express();
app.use(express.json());

// Initialize Supabase Client if keys are available
const supabase = (SUPABASE_URL && SUPABASE_KEY) 
  ? createClient(SUPABASE_URL, SUPABASE_KEY) 
  : null;

if (supabase) {
  console.log('📡 Connected to Supabase Instance.');
} else {
  console.log('⚠️ Running in LOCAL MOCK Mode (Supabase environment variables not detected).');
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

// Create HTTP Server
const server = createServer(app);

// Create WebSocket Server
const wss = new WebSocketServer({ server });

// Track connected WebSocket clients
const clients = new Set<WebSocket>();

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log(`🔌 Client connected. Total active links: ${clients.size}`);
  
  // Send current alerts cache upon connection
  ws.send(JSON.stringify({ type: 'SYNC_ALERTS', payload: activeAlerts }));

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log('✉️ Received WebSocket message:', data.type);
      
      // Echo or broadcast logic
      if (data.type === 'NEW_ALERT') {
        const alert: Alert = data.payload;
        activeAlerts.unshift(alert);
        broadcast({ type: 'ALERT_BROADCAST', payload: alert });
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

// Broadcast payload helper
function broadcast(data: object) {
  const payload = JSON.stringify(data);
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

// REST Endpoints
app.get('/api/health', (req, res) => {
  res.json({ status: 'HEALTHY', supabaseConnected: !!supabase });
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
      return res.status(201).json(data[0]);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  // Fallback local push
  activeAlerts.unshift(newAlert);
  broadcast({ type: 'ALERT_BROADCAST', payload: newAlert });
  res.status(201).json(newAlert);
});

server.listen(PORT, () => {
  console.log(`🚀 Beacon Coordination Backend running on http://localhost:${PORT}`);
});
