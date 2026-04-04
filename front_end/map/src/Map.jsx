import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

const Map = ({ farms, onSelectFarm }) => {
  // Center map on Bucharest area
  const centerPosition = [44.43, 26.09]

  return (
    <div className="map-wrapper">
      <MapContainer 
        center={centerPosition} 
        zoom={9} 
        scrollWheelZoom={true}
        style={{ height: '400px', width: '100%', borderRadius: '8px', zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Map over the passed wind farms to create markers */}
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
              Status: <span style={{ color: farm.status === 'ONLINE' ? 'green' : 'red' }}>
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