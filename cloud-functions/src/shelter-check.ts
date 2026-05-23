import type { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import type { Alert, Shelter } from 'beacon-shared';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';

const supabase = (SUPABASE_URL && SUPABASE_KEY) 
  ? createClient(SUPABASE_URL, SUPABASE_KEY) 
  : null;

export async function checkShelterCapacity(req: Request, res: Response) {
  // CORS setup
  res.set('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'POST, GET');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).send('');
  }

  if (!supabase) {
    return res.status(500).json({ error: 'Supabase credentials missing' });
  }

  try {
    // 1. Retrieve all shelters
    const { data: shelters, error: fetchError } = await supabase
      .from('shelters')
      .select('*');

    if (fetchError) throw fetchError;

    const criticalNotifications: string[] = [];

    // 2. Loop through and audit capacities
    for (const shelter of (shelters as Shelter[])) {
      const occupancyRatio = shelter.occupancy / shelter.capacity;
      
      // If shelter is overloaded and not already marked critical
      if (occupancyRatio >= 0.95 && shelter.status !== 'critical') {
        // Update shelter status to critical
        const { error: updateError } = await supabase
          .from('shelters')
          .update({ status: 'critical' })
          .eq('id', shelter.id);

        if (updateError) throw updateError;

        // Auto-generate rerouting alert
        const rerouteAlert: Alert = {
          id: `alert-auto-${Date.now()}-${shelter.id.slice(-4)}`,
          title: `Overload: ${shelter.name}`,
          description: `Capacity threshold breached (${Math.round(occupancyRatio * 100)}%). Redirection routing algorithms initiated.`,
          severity: 'critical',
          lat: shelter.lat,
          lng: shelter.lng,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          verified: true,
          category: 'shelter'
        };

        const { error: alertError } = await supabase
          .from('alerts')
          .insert([rerouteAlert]);

        if (alertError) throw alertError;

        criticalNotifications.push(shelter.name);
      }
    }

    return res.json({
      success: true,
      auditedCount: shelters.length,
      triggeredCriticals: criticalNotifications
    });
  } catch (err: any) {
    console.error('❌ Shelter Check error:', err);
    return res.status(500).json({ error: 'Failed shelter audit check', details: err.message });
  }
}
