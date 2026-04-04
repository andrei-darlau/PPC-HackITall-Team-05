import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

const Map = ({ farms, onSelectFarm }) => {
  // Centered roughly on Romania to match the backend coordinates
  const centerPosition = [45.0, 25.0] 

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
      </MapContainer>
    </div>
  )
}

export default Map