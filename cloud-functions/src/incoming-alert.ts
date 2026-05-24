import type { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';
import type { Alert } from 'beacon-shared';
import dotenv from 'dotenv';

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';

// Initialize Supabase
const supabase = (SUPABASE_URL && SUPABASE_KEY) 
  ? createClient(SUPABASE_URL, SUPABASE_KEY) 
  : null;

// Initialize Gemini
const ai = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

export async function processIncomingAlert(req: Request, res: Response) {
  // CORS setup
  res.set('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.set('Access-Control-Max-Age', '3600');
    return res.status(204).send('');
  }

  const { rawReport } = req.body || {};

  if (!rawReport) {
    return res.status(400).json({ error: 'Missing field: rawReport' });
  }

  if (!ai || !supabase) {
    console.warn('⚠️ GCF running in Mock Local mode (credentials missing).');
    const mockAlert: Alert = {
      id: `alert-${Date.now()}`,
      title: 'Incident Report (Mocked)',
      description: rawReport,
      severity: 'unverified',
      lat: 29.7604,
      lng: -95.3698,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      verified: false,
      category: 'general'
    };
    return res.status(201).json({ success: true, mode: 'mock', alert: mockAlert });
  }

  try {
    // 1. Call Gemini to parse and structure the report
    const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const prompt = `
      You are an emergency command parsing bot. Analyzes the following raw disaster field message:
      "${rawReport}"

      Generate a structured JSON block fitting this schema. 
      Estimate coords in Houston, TX if mentioned (e.g. NRG Arena = [29.6847, -95.4077], GRB Center = [29.7516, -95.3585], Toyota Center = [29.7508, -95.3621]).
      If unknown location, center to Houston [29.7604, -95.3698].

      {
        "title": "Short neon tactical summary (max 6 words)",
        "description": "Cleaned response description",
        "severity": "critical" | "warning" | "info" | "unverified",
        "lat": number,
        "lng": number,
        "verified": boolean,
        "category": "shelter" | "road" | "supply" | "general"
      }

      Return ONLY the raw JSON block without markdown code blocks, ticks, or text.
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();
    
    // Parse structured JSON
    const parsedData = JSON.parse(responseText);

    const alertData: Alert = {
      id: `alert-cf-${Date.now()}`,
      title: parsedData.title || 'Incoming Report',
      description: parsedData.description || rawReport,
      severity: parsedData.severity || 'unverified',
      lat: parsedData.lat || 29.7604,
      lng: parsedData.lng || -95.3698,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      verified: parsedData.verified ?? false,
      category: parsedData.category || 'general'
    };

    // 2. Insert into Supabase
    const { data, error } = await supabase
      .from('alerts')
      .insert([alertData])
      .select();

    if (error) throw error;

    return res.status(201).json({ success: true, alert: data[0] });
  } catch (err: any) {
    console.error('❌ Cloud Function error:', err);
    return res.status(500).json({ error: 'Failed to process alert', details: err.message });
  }
}
