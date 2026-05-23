export type AlertSeverity = 'critical' | 'warning' | 'info' | 'unverified';

export interface Alert {
  id: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  lat: number;
  lng: number;
  timestamp: string;
  verified: boolean;
  category: 'shelter' | 'road' | 'supply' | 'general';
}

export interface ShelterSupply {
  item: string;
  quantity: number;
  status: 'low' | 'medium' | 'high';
}

export interface Shelter {
  id: string;
  name: string;
  lat: number;
  lng: number;
  capacity: number;
  occupancy: number;
  status: 'normal' | 'full' | 'critical';
  supplies: ShelterSupply[];
}

export type RoadStatus = 'passable' | 'blocked' | 'unverified';

export interface RoadSegment {
  id: string;
  name: string;
  coordinates: [number, number][]; // [lat, lng] array for Polyline drawing
  status: RoadStatus;
}

export interface AssetCache {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: 'medical' | 'food' | 'water' | 'equipment';
  status: 'secure' | 'low' | 'unavailable';
}

export type MessageRole = 'user' | 'assistant' | 'system';

export interface ToolCallStep {
  id: string;
  name: string;
  status: 'running' | 'completed' | 'failed';
  input: string;
  output?: string;
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  isStreaming?: boolean;
  reasoningSteps?: string[];
  toolCalls?: ToolCallStep[];
}
