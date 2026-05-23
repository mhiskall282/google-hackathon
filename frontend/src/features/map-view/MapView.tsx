import React, { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useMapStore } from '@/store/useMapStore'
import { useAlertStore } from '@/store/useAlertStore'
import { mockShelters, mockRoadSegments, mockAssets, HOUSTON_COORDS } from '@/services/mockData'
import { ShieldCheck, ShieldAlert, Users, Truck, Info, Navigation } from 'lucide-react'

// Map controller sub-component to bind Zustand store camera actions with Leaflet instance
function MapController() {
  const map = useMap()
  const setFlyToFn = useMapStore((state) => state.setFlyToFn)

  useEffect(() => {
    setFlyToFn((coords, zoom) => {
      map.flyTo(coords, zoom || map.getZoom(), {
        duration: 1.5,
        easeLinearity: 0.25
      })
    })
  }, [map, setFlyToFn])

  return null
}

// Custom Leaflet SVG DivIcon creators (Avoids missing local asset issues in Vite)

// 1. Shelter Marker: renders a mini SVG radial gauge showing occupancy ratio
const createShelterIcon = (occupancy: number, capacity: number, status: string, isSelected: boolean) => {
  const ratio = occupancy / capacity
  const percent = Math.min(100, Math.round(ratio * 100))
  
  let color = '#22c55e' // Green
  let pulse = ''
  if (percent >= 98 || status === 'critical') {
    color = '#ef4444' // Red
    pulse = '<div class="absolute w-6 h-6 rounded-full border border-emergency-critical opacity-55 animate-ping"></div>'
  } else if (percent >= 80) {
    color = '#f97316' // Orange
  }

  const radius = 14
  const dashArray = 2 * Math.PI * radius
  const dashOffset = dashArray - ratio * dashArray

  return L.divIcon({
    className: 'custom-shelter-icon',
    html: `
      <div class="relative flex items-center justify-center w-9 h-9">
        <!-- Indicator glow background -->
        <div class="absolute w-9 h-9 rounded-full bg-slate-950/85 border ${
          isSelected ? 'border-cyan-400 border-2' : 'border-slate-800'
        } shadow-lg shadow-black/80"></div>
        
        <!-- SVG Gauge -->
        <svg class="absolute w-9 h-9 transform -rotate-90">
          <circle cx="18" cy="18" r="${radius}" stroke="#1e293b" stroke-width="1.8" fill="transparent"/>
          <circle cx="18" cy="18" r="${radius}" stroke="${color}" stroke-width="2.2" stroke-dasharray="${dashArray}" stroke-dashoffset="${dashOffset}" stroke-linecap="round" fill="transparent"/>
        </svg>

        <!-- Numeric occupancy percent text -->
        <span class="absolute text-[8px] font-mono font-bold text-slate-100">${percent}%</span>
        ${pulse}
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18]
  })
}

// 2. Incident Alert Marker: renders a pulsing warning target
const createAlertIcon = (severity: string, isSelected: boolean) => {
  let color = '#ef4444'
  let glow = 'rgba(239, 68, 68, 0.45)'
  
  if (severity === 'warning') {
    color = '#f97316'
    glow = 'rgba(249, 115, 22, 0.45)'
  } else if (severity === 'unverified') {
    color = '#eab308'
    glow = 'rgba(234, 179, 8, 0.45)'
  } else if (severity === 'info') {
    color = '#06b6d4'
    glow = 'rgba(6, 182, 212, 0.45)'
  }

  return L.divIcon({
    className: 'custom-alert-icon',
    html: `
      <div class="relative flex items-center justify-center w-8 h-8">
        <!-- Pulsing waves -->
        <div class="absolute w-6 h-6 rounded-full animate-ping opacity-60" style="background-color: ${glow}"></div>
        <div class="absolute w-5 h-5 rounded-full border ${isSelected ? 'border-cyan-400 border-2' : 'border-slate-800/80'} bg-slate-950/85 flex items-center justify-center shadow-md">
          <div class="w-2 h-2 rounded-full animate-pulse" style="background-color: ${color}"></div>
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  })
}

// 3. Asset Cache Marker: displays cache type abbreviation
const createAssetIcon = (type: string, status: string, isSelected: boolean) => {
  let statusColor = '#22c55e'
  if (status === 'low') statusColor = '#f97316'
  if (status === 'unavailable') statusColor = '#ef4444'

  return L.divIcon({
    className: 'custom-asset-icon',
    html: `
      <div class="relative flex items-center justify-center w-8 h-8">
        <div class="absolute inset-0 rounded border ${isSelected ? 'border-cyan-400 border-2' : 'border-slate-700/60'} bg-slate-950/90 shadow-md"></div>
        <!-- Small status corner dot -->
        <div class="absolute top-1 right-1 w-1.5 h-1.5 rounded-full" style="background-color: ${statusColor}"></div>
        <!-- Resource Abbreviation -->
        <span class="absolute text-[8px] font-mono text-slate-300 font-bold uppercase tracking-wider">${type.substring(0, 3)}</span>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  })
}

export function MapView() {
  const [mapStyle, setMapStyle] = useState<'dark' | 'satellite' | 'street'>('dark')
  const { 
    selectedShelterId, 
    selectedAlertId, 
    selectedRoadId, 
    selectedAssetId,
    visibleLayers,
    setSelectedShelterId,
    setSelectedAlertId,
    setSelectedRoadId,
    setSelectedAssetId
  } = useMapStore()

  const { alerts, selectedAlertId: activeAlertStoreId } = useAlertStore()

  // Track map selection synchronizer (zoom into selected item)
  const handleSelectShelter = (id: string, lat: number, lng: number) => {
    setSelectedShelterId(id)
    // Zoom in slightly
    const flyToFn = useMapStore.getState().flyToFn
    if (flyToFn) flyToFn([lat, lng], 13)
  }

  const handleSelectAsset = (id: string, lat: number, lng: number) => {
    setSelectedAssetId(id)
    const flyToFn = useMapStore.getState().flyToFn
    if (flyToFn) flyToFn([lat, lng], 13)
  }

  // Get color for road states
  const getRoadColor = (status: string, isSelected: boolean) => {
    if (isSelected) return '#22d3ee' // Cyan highlight
    switch (status) {
      case 'blocked':
        return '#ef4444' // Red
      case 'unverified':
        return '#eab308' // Pulsing Amber
      default:
        return '#22c55e' // Green passable
    }
  }

  return (
    <div className="w-full h-full relative z-10 select-none">
      {/* Map Element */}
      <MapContainer
        center={HOUSTON_COORDS.center}
        zoom={11}
        scrollWheelZoom={true}
        className="w-full h-full"
        zoomControl={true}
      >
        <MapController />
        
        {/* Dynamic map tiles selection */}
        <TileLayer
          key={mapStyle}
          attribution={
            mapStyle === 'satellite'
              ? '&copy; Google Maps'
              : mapStyle === 'street'
              ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          }
          url={
            mapStyle === 'satellite'
              ? 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'
              : mapStyle === 'street'
              ? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
              : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
          }
          maxZoom={20}
        />

        {/* 1. Shelters Layer */}
        {visibleLayers.shelters && mockShelters.map((shelter) => {
          const isSelected = selectedShelterId === shelter.id
          return (
            <Marker
              key={shelter.id}
              position={[shelter.lat, shelter.lng]}
              icon={createShelterIcon(shelter.occupancy, shelter.capacity, shelter.status, isSelected)}
              eventHandlers={{
                click: () => handleSelectShelter(shelter.id, shelter.lat, shelter.lng)
              }}
            >
              <Popup>
                <div className="font-sans space-y-2 max-w-[200px]">
                  <div className="flex items-center gap-1 text-slate-400 font-mono text-[9px] uppercase tracking-wider">
                    <Users className="h-3 w-3 text-emergency-info" />
                    <span>SHELTER COMMAND</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-100 font-display uppercase leading-tight">{shelter.name}</h4>
                  
                  <div className="font-mono text-[10px] text-slate-300">
                    <div className="flex justify-between border-b border-slate-800 py-1">
                      <span>Occupancy:</span>
                      <span className="font-bold text-slate-100">{shelter.occupancy}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800 py-1">
                      <span>Total Capacity:</span>
                      <span>{shelter.capacity}</span>
                    </div>
                    <div className="flex justify-between py-1 font-bold">
                      <span>Utilization:</span>
                      <span className={shelter.occupancy / shelter.capacity >= 0.9 ? 'text-emergency-critical' : 'text-emergency-ok'}>
                        {Math.round((shelter.occupancy / shelter.capacity) * 100)}%
                      </span>
                    </div>
                  </div>

                  {/* Supply summary */}
                  <div className="text-[9px] font-mono mt-1 space-y-1">
                    <span className="text-slate-400 block border-b border-slate-800 pb-0.5 uppercase">Critical Stock:</span>
                    {shelter.supplies.map((supp, sIdx) => (
                      <div key={sIdx} className="flex justify-between items-center text-slate-300">
                        <span>{supp.item}</span>
                        <span className={`px-1 py-0.2 rounded text-[8px] ${
                          supp.status === 'high' ? 'text-emergency-ok border border-emergency-ok/20 bg-emergency-ok/5' :
                          supp.status === 'medium' ? 'text-emergency-warning border border-emergency-warning/20 bg-emergency-warning/5' :
                          'text-emergency-critical border border-emergency-critical/20 bg-emergency-critical/5'
                        }`}>{supp.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Popup>
            </Marker>
          )
        })}

        {/* 2. Incident Alert Markers (Synced with Sidebar Alerts) */}
        {visibleLayers.alerts && alerts.map((alert) => {
          const isSelected = selectedAlertId === alert.id || activeAlertStoreId === alert.id
          return (
            <React.Fragment key={alert.id}>
              {/* Pulse Circle Overlay */}
              <Circle
                center={[alert.lat, alert.lng]}
                radius={isSelected ? 1200 : 600}
                pathOptions={{
                  fillColor: alert.severity === 'critical' ? '#ef4444' : alert.severity === 'warning' ? '#f97316' : '#eab308',
                  fillOpacity: isSelected ? 0.08 : 0.03,
                  color: alert.severity === 'critical' ? '#ef4444' : alert.severity === 'warning' ? '#f97316' : '#eab308',
                  weight: isSelected ? 1.5 : 0.8,
                  dashArray: isSelected ? '4,4' : undefined
                }}
              />
              <Marker
                position={[alert.lat, alert.lng]}
                icon={createAlertIcon(alert.severity, isSelected)}
                eventHandlers={{
                  click: () => {
                    setSelectedAlertId(alert.id)
                    const flyToFn = useMapStore.getState().flyToFn
                    if (flyToFn) flyToFn([alert.lat, alert.lng], 13)
                  }
                }}
              >
                <Popup>
                  <div className="font-sans space-y-1.5 max-w-[180px]">
                    <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[9px] uppercase tracking-wider">
                      {alert.verified ? (
                        <ShieldCheck className="h-3.5 w-3.5 text-emergency-ok" />
                      ) : (
                        <ShieldAlert className="h-3.5 w-3.5 text-emergency-unverified" />
                      )}
                      <span>INCIDENT REPORT</span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-100 uppercase leading-snug">{alert.title}</h4>
                    <p className="text-[10px] text-slate-300 leading-relaxed">{alert.description}</p>
                    <div className="flex justify-between items-center text-[9px] font-mono border-t border-slate-800 pt-1 text-slate-400">
                      <span>Status: {alert.verified ? 'Verified' : 'Pending'}</span>
                      <span>{alert.timestamp}</span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            </React.Fragment>
          )
        })}

        {/* 3. Road Segment Polylines */}
        {visibleLayers.roads && mockRoadSegments.map((road) => {
          const isSelected = selectedRoadId === road.id
          return (
            <Polyline
              key={road.id}
              positions={road.coordinates}
              pathOptions={{
                color: getRoadColor(road.status, isSelected),
                weight: isSelected ? 5.5 : 3.2,
                opacity: isSelected ? 0.95 : 0.75,
                dashArray: road.status === 'blocked' ? '6,6' : road.status === 'unverified' ? '4,10' : undefined
              }}
              eventHandlers={{
                click: () => setSelectedRoadId(road.id)
              }}
            >
              <Popup>
                <div className="font-sans space-y-1 max-w-[180px]">
                  <div className="flex items-center gap-1 text-slate-400 font-mono text-[9px] uppercase tracking-wider">
                    <Truck className="h-3.5 w-3.5 text-emergency-ok" />
                    <span>ROAD NETWORK</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-100 leading-snug">{road.name}</h4>
                  <div className="text-[10px] font-mono flex items-center gap-1">
                    <span className="text-slate-400">Status:</span>
                    <span className={`uppercase font-bold ${
                      road.status === 'blocked' ? 'text-emergency-critical' :
                      road.status === 'unverified' ? 'text-emergency-unverified' :
                      'text-emergency-ok'
                    }`}>{road.status}</span>
                  </div>
                </div>
              </Popup>
            </Polyline>
          )
        })}

        {/* 4. Asset Caches Layer */}
        {visibleLayers.assets && mockAssets.map((asset) => {
          const isSelected = selectedAssetId === asset.id
          return (
            <Marker
              key={asset.id}
              position={[asset.lat, asset.lng]}
              icon={createAssetIcon(asset.type, asset.status, isSelected)}
              eventHandlers={{
                click: () => handleSelectAsset(asset.id, asset.lat, asset.lng)
              }}
            >
              <Popup>
                <div className="font-sans space-y-1.5 max-w-[180px]">
                  <div className="flex items-center gap-1 text-slate-400 font-mono text-[9px] uppercase tracking-wider">
                    <Info className="h-3.5 w-3.5 text-slate-400" />
                    <span>SUPPLY DEPOT</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-100 leading-snug">{asset.name}</h4>
                  <div className="font-mono text-[10px] space-y-0.5">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Type:</span>
                      <span className="text-slate-100 font-bold capitalize">{asset.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Status:</span>
                      <span className={`font-bold uppercase ${
                        asset.status === 'secure' ? 'text-emergency-ok' :
                        asset.status === 'low' ? 'text-emergency-warning' :
                        'text-emergency-critical'
                      }`}>{asset.status}</span>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          )
        })}

        {/* 5. Hurricane Elena Weather Radar Precipitation Bands */}
        {visibleLayers.weather && (
          <>
            {/* Hurricane Eye Marker/Center */}
            <Circle
              center={[29.15, -94.75]} // Gulf/Galveston area
              radius={8000} // 8km eye radius
              pathOptions={{
                fillColor: '#ef4444',
                fillOpacity: 0.15,
                color: '#ef4444',
                weight: 2,
                dashArray: '5, 5',
                className: 'animate-pulse'
              }}
            />
            {/* Inner intense precipitation band */}
            <Circle
              center={[29.15, -94.75]}
              radius={24000} // 24km radius
              pathOptions={{
                fillColor: 'transparent',
                color: '#ef4444', // Red critical storm cell
                weight: 6,
                opacity: 0.6,
                dashArray: '80, 220',
                className: 'radar-band-fast'
              }}
            />
            {/* Middle precipitation bands */}
            <Circle
              center={[29.15, -94.75]}
              radius={45000} // 45km radius
              pathOptions={{
                fillColor: 'transparent',
                color: '#f97316', // Orange moderate rain
                weight: 5,
                opacity: 0.5,
                dashArray: '120, 280',
                className: 'radar-band-medium'
              }}
            />
            <Circle
              center={[29.15, -94.75]}
              radius={68000} // 68km radius
              pathOptions={{
                fillColor: 'transparent',
                color: '#eab308', // Yellow light rain
                weight: 4,
                opacity: 0.45,
                dashArray: '180, 320',
                className: 'radar-band-slow'
              }}
            />
            {/* Outer trailing rain band sweeping over Houston */}
            <Circle
              center={[29.15, -94.75]}
              radius={95000} // 95km radius - reaches Houston
              pathOptions={{
                fillColor: 'transparent',
                color: '#22c55e', // Green light rain band reaching Houston
                weight: 3.5,
                opacity: 0.35,
                dashArray: '250, 450',
                className: 'radar-band-fast'
              }}
            />
            
            {/* Custom Polyline trailing rain arcs for more dynamic texture */}
            <Polyline
              positions={[
                [29.35, -95.10],
                [29.50, -95.00],
                [29.65, -94.85],
                [29.75, -94.60]
              ]}
              pathOptions={{
                color: '#06b6d4', // Cyan high-velocity convective cell
                weight: 4,
                opacity: 0.5,
                dashArray: '30, 150',
                className: 'radar-band-medium'
              }}
            />
            <Polyline
              positions={[
                [29.00, -95.40],
                [29.25, -95.20],
                [29.55, -94.95],
                [29.80, -94.50]
              ]}
              pathOptions={{
                color: '#22c55e', // Green precipitation band
                weight: 3,
                opacity: 0.4,
                dashArray: '60, 200',
                className: 'radar-band-slow'
              }}
            />
          </>
        )}
      </MapContainer>

      {/* Floating Layer Controls Panel inside center map (Glassmorphic) */}
      <div className="absolute bottom-6 right-6 z-[1000] glass-panel border rounded px-3 py-2.5 max-w-[170px] pointer-events-auto">
        <span className="block text-[8px] font-mono font-bold tracking-widest text-slate-400 uppercase mb-1.5">
          BASEMAP STYLE
        </span>
        <div className="flex flex-col gap-1.5 mb-3 border-b border-terminal-border/40 pb-2.5">
          {(['dark', 'satellite', 'street'] as const).map((style) => (
            <button
              key={style}
              type="button"
              onClick={() => setMapStyle(style)}
              className={`text-left text-[9px] font-mono uppercase px-2 py-1 rounded border transition-all duration-150 cursor-pointer ${
                mapStyle === style
                  ? 'bg-emergency-info/20 border-emergency-info/60 text-slate-100 font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              {style === 'dark' ? 'Tactical Dark' : style === 'satellite' ? 'Google Satellite' : 'Standard Street'}
            </button>
          ))}
        </div>

        <span className="block text-[8px] font-mono font-bold tracking-widest text-slate-400 uppercase mb-2">
          MAP OVERLAY LAYERS
        </span>
        <div className="space-y-1.5">
          {(['shelters', 'alerts', 'roads', 'assets', 'weather'] as const).map((layerKey) => (
            <label key={layerKey} className="flex items-center gap-2 text-[10px] font-mono text-slate-300 hover:text-slate-100 cursor-pointer">
              <input
                type="checkbox"
                checked={visibleLayers[layerKey]}
                onChange={() => useMapStore.getState().toggleLayer(layerKey)}
                className="accent-emergency-info h-3 w-3 bg-slate-900 border-slate-700 rounded focus:ring-0 focus:ring-offset-0"
              />
              <span className="capitalize">
                {layerKey === 'weather' ? 'Weather Radar' : layerKey}
              </span>
            </label>
          ))}
        </div>
      </div>
      
      {/* Dynamic Navigation Indicator on top-left of center map */}
      <div className="absolute top-6 left-6 z-[1000] glass-panel border rounded px-3.5 py-2 font-mono text-[9px] text-slate-300 max-w-[200px] pointer-events-none">
        <div className="flex items-center gap-1.5 text-emergency-info">
          <Navigation className="h-3.5 w-3.5 animate-pulse" />
          <span className="font-bold">GRID LOCATOR</span>
        </div>
        <div className="text-slate-400 mt-1">
          HOUSTON S: <span className="text-slate-200">29.76° N, 95.37° W</span>
        </div>
      </div>
    </div>
  )
}
