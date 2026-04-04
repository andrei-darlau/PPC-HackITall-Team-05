import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

const Map = ({ farms, onSelectFarm }) => {
  const centerPosition = [44.43, 26.09]

  return (
    <div style={{ height: '400px', width: '100%', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border)' }}>
      <MapContainer 
        center={centerPosition} 
        zoom={9} 
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
              Status: <span style={{ color: farm.status === 'ONLINE' ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>
                {farm.status}
              </span><br/>
              Park ID: {farm.parkId}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}

export default Map