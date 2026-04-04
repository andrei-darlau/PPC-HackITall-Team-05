import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

// Helper component to handle programmatic zoom and event listening
const MapController = ({ selectedPark, radius, onZoomFinished }) => {
  const map = useMap()

  useEffect(() => {
    if (!selectedPark) {
      onZoomFinished(false)
      return
    }

    // 1. Hide circles immediately before starting the animation
    onZoomFinished(false)

    // 2. Start the zoom into the park area
    map.flyTo(selectedPark.position, 12, {
      duration: 1.5 // Seconds
    })

    // 3. Listen for the exact moment movement ends
    const handleMoveEnd = () => {
      // Add a tiny delay to ensure Leaflet's SVG renderer has fully settled 
      // and removed the scaling CSS transforms before we draw the new circles.
      setTimeout(() => {
        onZoomFinished(true)
      }, 100)
    }

    // Use .once instead of .on so it automatically unbinds after firing
    map.once('moveend', handleMoveEnd)

    return () => {
      // Cleanup listener just in case the component unmounts mid-flight
      map.off('moveend', handleMoveEnd) 
    }
  }, [selectedPark, map, onZoomFinished])

  return null
}

const Map = ({ farms, onSelectFarm, selectedPark, radius, turbines = [] }) => {
  const centerPosition = [45.0, 25.0] 
  const [showCircle, setShowCircle] = useState(false)

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

        <MapController 
          selectedPark={selectedPark} 
          radius={radius} 
          onZoomFinished={setShowCircle} 
        />
        
        {farms.map((farm) => (
          <Marker 
            key={farm.id} 
            position={farm.position}
            eventHandlers={{
              click: () => onSelectFarm(farm),
            }}
          >
            <Popup>
              <strong>{farm.name}</strong><br/>
              Average Lat: {farm.averageLat.toFixed(4)}<br/>
              Average Long: {farm.averageLong.toFixed(4)}
            </Popup>
          </Marker>
        ))}

        {/* Display Park Radius Circle only after zoom is totally finished */}
        {selectedPark && radius && showCircle && (
          <Circle
            center={selectedPark.position}
            radius={radius * 1000} // Convert km to meters for Leaflet
            pathOptions={{ 
              fillColor: 'var(--accent)', 
              color: 'var(--accent)', 
              fillOpacity: 0.1, 
              weight: 1 
            }}
          />
        )}

        {/* Display individual turbines only after zoom is totally finished */}
        {selectedPark && showCircle && turbines.map((turbine) => (
          <Circle
            key={turbine.id}
            center={[turbine.latY, turbine.longX]}
            radius={40} // 40 meters radius
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