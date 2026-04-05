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

const Map = ({ farms, onSelectFarm, selectedPark, radius, turbines = [], user, selectedTurbine, onSelectTurbine, parkFaults = {} }) => {
  const centerPosition = [45.0, 25.0] 
  const [deniedParkId, setDeniedParkId] = useState(null) 

  const isVisitor = !user;

  return (
    <div style={{ height: '600px', width: '100%', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border)' }}>
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

        {/* Dynamic Turbine Rendering with Click Handlers and Fault Colors */}
        {selectedPark && !isVisitor && turbines.map((turbine) => {
          const isSelected = selectedTurbine?.id === turbine.id;
          const faults = parkFaults[turbine.id] || [];
          
          // Calculate the total number of errors for this specific turbine in the last 24h
          const totalErrors = faults.reduce((sum, fault) => sum + fault.rejectionCount, 0);

          // Determine Base Colors based on error thresholds
          let fillColor = '#10b981'; // Green (<= 10 errors)
          let strokeColor = '#059669';

          if (totalErrors > 10000) {
            fillColor = '#ef4444'; // Red (> 200 errors)
            strokeColor = '#b91c1c';
          } else if (totalErrors > 2000) {
            fillColor = '#eab308'; // Yellow (<= 200 errors)
            strokeColor = '#a16207';
          }

          // If selected, override the stroke to the accent blue to make it stand out
          if (isSelected) {
            strokeColor = '#3b82f6';
          }
          
          return (
            <Circle
              key={turbine.id}
              center={[turbine.latY, turbine.longX]}
              radius={isSelected ? 60 : 40} // Enlarge if selected
              eventHandlers={{
                click: () => onSelectTurbine(turbine)
              }}
              pathOptions={{ 
                fillColor: fillColor, 
                color: strokeColor, 
                fillOpacity: isSelected ? 1 : 0.8, 
                weight: isSelected ? 3 : 2 
              }}
            >
              <Popup>
                <div style={{ minWidth: '180px' }}>
                  <strong>Turbine: {turbine.id}</strong><br/>
                  <span style={{ fontSize: '12px', color: 'var(--text)' }}>Model: {turbine.wtgModelId}</span>
                  
                  <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
                    <strong>Health (24h): </strong> 
                    {totalErrors === 0 ? (
                      <span style={{ color: '#10b981' }}>Optimal</span>
                    ) : (
                      <span style={{ color: totalErrors > 200 ? '#ef4444' : '#eab308' }}>
                        {totalErrors} Errors
                      </span>
                    )}
                    
                    {faults.length > 0 && (
                      <ul style={{ paddingLeft: '16px', margin: '6px 0 0 0', fontSize: '12px', maxHeight: '100px', overflowY: 'auto' }}>
                        {faults.map((f, idx) => (
                          <li key={idx} style={{ marginBottom: '4px' }}>
                            <strong>{f.sensorType}</strong>: {f.rejectionCount}x<br/>
                            <span style={{ color: 'var(--text)', fontSize: '11px' }}>{f.latestRejectionReason}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </Popup>
            </Circle>
          )
        })}
      </MapContainer>
    </div>
  )
}

export default Map