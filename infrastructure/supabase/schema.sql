-- ========================================================
-- BEACON DATABASE INITIALIZATION SCHEMA (SUPABASE POSTGRES)
-- ========================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. ENUMS DEFINITIONS
create type alert_severity_type as enum ('critical', 'warning', 'info', 'unverified');
create type alert_category_type as enum ('shelter', 'road', 'supply', 'general');
create type shelter_status_type as enum ('normal', 'full', 'critical');
create type road_status_type as enum ('passable', 'blocked', 'unverified');
create type asset_type as enum ('medical', 'food', 'water', 'equipment');
create type asset_status_type as enum ('secure', 'low', 'unavailable');
create type message_role_type as enum ('user', 'assistant', 'system');

-- 2. TABLES CREATION

-- Alerts Timeline
create table if not exists public.alerts (
    id text primary key default 'alert-' || md5(random()::text),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    title text not null,
    description text not null,
    severity alert_severity_type default 'unverified'::alert_severity_type not null,
    lat double precision not null,
    lng double precision not null,
    timestamp text not null,
    verified boolean default false not null,
    category alert_category_type default 'general'::alert_category_type not null
);

-- Shelter command center registries
create table if not exists public.shelters (
    id text primary key default 'shelter-' || md5(random()::text),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    name text not null,
    lat double precision not null,
    lng double precision not null,
    capacity integer not null,
    occupancy integer not null,
    status shelter_status_type default 'normal'::shelter_status_type not null,
    supplies jsonb default '[]'::jsonb not null
);

-- Road network coordinate segments
create table if not exists public.roads (
    id text primary key default 'road-' || md5(random()::text),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    name text not null,
    coordinates jsonb not null, -- Array of [lat, lng]
    status road_status_type default 'unverified'::road_status_type not null
);

-- Resource stock cache depots
create table if not exists public.assets (
    id text primary key default 'cache-' || md5(random()::text),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    name text not null,
    lat double precision not null,
    lng double precision not null,
    type asset_type not null,
    status asset_status_type default 'secure'::asset_status_type not null
);

-- AI conversation logs
create table if not exists public.messages (
    id text primary key default 'msg-' || md5(random()::text),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    role message_role_type not null,
    content text not null,
    timestamp text not null,
    reasoning_steps jsonb default '[]'::jsonb,
    tool_calls jsonb default '[]'::jsonb
);

-- 3. ENABLE ROW LEVEL SECURITY (RLS) FOR ALL TABLES
alter table public.alerts enable row level security;
alter table public.shelters enable row level security;
alter table public.roads enable row level security;
alter table public.assets enable row level security;
alter table public.messages enable row level security;

-- 4. CREATE SECURE POLICIES FOR SYSTEM ACCESS (Allow Public Read, Restrict Writes to Authenticated Roles)
create policy "Allow public read access to alerts" on public.alerts for select using (true);
create policy "Restrict insert to alerts to authenticated roles" on public.alerts for insert with check (auth.role() = 'authenticated');

create policy "Allow public read access to shelters" on public.shelters for select using (true);
create policy "Restrict insert to shelters to authenticated roles" on public.shelters for insert with check (auth.role() = 'authenticated');

create policy "Allow public read access to roads" on public.roads for select using (true);
create policy "Restrict insert to roads to authenticated roles" on public.roads for insert with check (auth.role() = 'authenticated');

create policy "Allow public read access to assets" on public.assets for select using (true);
create policy "Restrict insert to assets to authenticated roles" on public.assets for insert with check (auth.role() = 'authenticated');

create policy "Allow public read access to messages" on public.messages for select using (true);
create policy "Restrict insert to messages to authenticated roles" on public.messages for insert with check (auth.role() = 'authenticated');

-- 5. SEED DATA FOR DISASTER TELEMETRY (HOUSTON TELEMETRY)

insert into public.shelters (id, name, lat, lng, capacity, occupancy, status, supplies) values
('shelter-1', 'NRG Arena & Center', 29.6847, -95.4077, 10000, 8400, 'normal', '[
  {"item": "Water Bottles", "quantity": 15000, "status": "high"},
  {"item": "Rations (MREs)", "quantity": 8200, "status": "medium"},
  {"item": "Medical Kits", "quantity": 120, "status": "low"},
  {"item": "Blankets", "quantity": 9500, "status": "high"}
]'),
('shelter-2', 'George R. Brown Convention Center', 29.7516, -95.3585, 5000, 4950, 'critical', '[
  {"item": "Water Bottles", "quantity": 2000, "status": "low"},
  {"item": "Rations (MREs)", "quantity": 1800, "status": "low"},
  {"item": "Medical Kits", "quantity": 45, "status": "low"},
  {"item": "Blankets", "quantity": 5100, "status": "high"}
]'),
('shelter-3', 'Toyota Center', 29.7508, -95.3621, 3000, 1200, 'normal', '[
  {"item": "Water Bottles", "quantity": 9000, "status": "high"},
  {"item": "Rations (MREs)", "quantity": 6500, "status": "high"},
  {"item": "Medical Kits", "quantity": 250, "status": "high"},
  {"item": "Blankets", "quantity": 4000, "status": "high"}
]');

insert into public.roads (id, name, coordinates, status) values
('road-1', 'I-45 South Freeway (Passable)', '[[29.7804, -95.3698], [29.7420, -95.3620], [29.7120, -95.3410], [29.6847, -95.4077]]', 'passable'),
('road-2', 'I-10 East (Blocked near San Jacinto River)', '[[29.7785, -95.3420], [29.7820, -95.2950], [29.7891, -95.2215], [29.7915, -95.1520]]', 'blocked');

insert into public.assets (id, name, lat, lng, type, status) values
('cache-1', 'Distribution Hub East', 29.7712, -95.1852, 'water', 'secure'),
('cache-2', 'Medical Stock Cache South', 29.6645, -95.4525, 'medical', 'low');

insert into public.alerts (id, title, description, severity, lat, lng, timestamp, verified, category) values
('alert-1', 'George R. Brown (GRB) Shelter Overload', 'GRB Convention Center has reached 99% occupancy. Emergency re-routing of inbound evacuees is urgently required.', 'critical', 29.7516, -95.3585, '24h Post-Landfall', true, 'shelter'),
('alert-2', 'I-10 East Flooding Blockage', 'Water levels at San Jacinto River have breached main roadway. I-10 East is fully impassable in both directions.', 'critical', 29.7891, -95.2215, '23.5h Post-Landfall', true, 'road');
