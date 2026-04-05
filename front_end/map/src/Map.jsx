import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

// Simplified controller: Just handles the flyTo animation
const MapController = ({ selectedPark }) => {
  const map = useMap()

  useEffect(() => {
    if (selectedPark) {
      map.flyTo(selectedPark.position, 12, {
        duration: 1.5 
      })
    }
  }, [selectedPark, map])

  return null
}

const Map = ({ farms, onSelectFarm, selectedPark, radius, turbines = [], user }) => {
  const centerPosition = [45.0, 25.0] 
  const [deniedParkId, setDeniedParkId] = useState(null) 

  const isVisitor = !user;

  return (
    <div style={{ height: '400px', width: '100%', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border)' }}>
      <MapContainer 
        center={centerPosition} 
        zoom={6} 
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%', zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapController selectedPark={selectedPark} />
        
        {farms.map((farm) => {
          return (
            <Marker 
              key={farm.id} 
              position={farm.position}
              eventHandlers={{
                click: async () => {
                  if (isVisitor) return;
                  
                  // Reset any previous errors
                  setDeniedParkId(null);
                  
                  // Ask the backend if we have access
                  const hasAccess = await onSelectFarm(farm);
                  
                  if (!hasAccess) {
                    setDeniedParkId(farm.id);
                  }
                },
              }}
            >
              <Popup>
                <strong>{farm.name}</strong><br/>
                Average Lat: {farm.averageLat.toFixed(4)}<br/>
                Average Long: {farm.averageLong.toFixed(4)}
                
                {isVisitor && (
                  <div style={{ color: 'var(--accent)', marginTop: '8px', fontWeight: '500' }}>
                    Sign in to interact.
                  </div>
                )}
                {!isVisitor && deniedParkId === farm.id && (
                  <div style={{ color: '#ef4444', marginTop: '8px', fontWeight: '500' }}>
                    Access Restricted. Server denied access.
                  </div>
                )}
              </Popup>
            </Marker>
          )
        })}

        {selectedPark && radius && !isVisitor && (
          <Circle
            center={selectedPark.position}
            radius={radius * 1000}
            pathOptions={{ 
              fillColor: 'var(--accent)', 
              color: 'var(--accent)', 
              fillOpacity: 0.1, 
              weight: 1 
            }}
          />
        )}

        {selectedPark && !isVisitor && turbines.map((turbine) => (
          <Circle
            key={turbine.id}
            center={[turbine.latY, turbine.longX]}
            radius={40}
            pathOptions={{ 
              fillColor: '#10b981', 
              color: '#059669', 
              fillOpacity: 0.8, 
              weight: 2 
            }}
          >
            <Popup>
              <strong>Turbine: {turbine.id}</strong><br/>
              Model: {turbine.wtgModelId}
            </Popup>
          </Circle>
        ))}
      </MapContainer>
    </div>
  )
}

export default Map