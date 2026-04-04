import { useState, useEffect } from 'react'
import Map from './Map'
import LiveChart from './LiveChart'
import TerminalBox from './TerminalBox'
import PipelineMonitor from './PipelineMonitor'
import ReportExporter from './ReportExporter'
import './App.css'

export const API_BASE_URL = 'http://10.200.22.157:6767/api/v1'

function App() {
  const [parks, setParks] = useState([])
  const [selectedPark, setSelectedPark] = useState(null)
  const [parkTurbines, setParkTurbines] = useState([])
  const [parkRadius, setParkRadius] = useState(null)

  useEffect(() => {
    fetch(`${API_BASE_URL}/parks/locations`)
      .then((res) => res.json())
      .then((data) => {
        const formattedParks = data.map((p) => ({
          ...p,
          id: p.parkId,
          name: p.parkId,
          position: [p.averageLat, p.averageLong], 
        }))
        setParks(formattedParks)
      })
      .catch((err) => console.error('Failed to fetch parks:', err))
  }, [])

  useEffect(() => {
    if (selectedPark) {
      // Fetch Turbines
      fetch(`${API_BASE_URL}/parks/${selectedPark.id}/turbines`)
        .then((res) => res.json())
        .then((data) => setParkTurbines(data))
        .catch((err) => console.error('Failed to fetch turbines:', err))

      // Fetch Radius (returns a float in km)
      fetch(`${API_BASE_URL}/parks/${selectedPark.id}/radius`)
        .then((res) => res.json())
        .then((data) => setParkRadius(data))
        .catch((err) => {
          console.error('Failed to fetch radius:', err)
          setParkRadius(null)
        })
    } else {
      setParkTurbines([])
      setParkRadius(null)
    }
  }, [selectedPark])

  return (
    <div className="dashboard-container">
      <header className="header-row">
        <div>
          <h1>Wind Energy Command Center</h1>
          <p className="subtitle">Real-time telemetry and operational status</p>
        </div>
        <ReportExporter />
      </header>
      
      <div className="main-grid">
        <div className="panel map-panel">
          <h2>Geospatial Overview</h2>
          <Map 
            farms={parks} 
            onSelectFarm={setSelectedPark} 
            selectedPark={selectedPark} 
            radius={parkRadius} 
            turbines={parkTurbines} 
          />
        </div>

        <div className="panel turbine-panel">
          <h2>{selectedPark ? `${selectedPark.name} Turbines` : 'Park Details'}</h2>
          {selectedPark ? (
            <div className="turbine-list">
              {parkTurbines.map((turbine) => (
                <div key={turbine.id} className="turbine-list-item">
                  <strong>{turbine.id}</strong>
                  <span className="turbine-model">Model: {turbine.wtgModelId}</span>
                </div>
              ))}
            </div>
          ) : (
             <div className="empty-state" style={{ height: '400px' }}>
                Select a park to view its turbines.
             </div>
          )}
        </div>
        
        <div className="panel chart-panel">
          <h2>Telemetry: {selectedPark ? selectedPark.name : 'No Selection'}</h2>
          {selectedPark ? (
            <LiveChart key={selectedPark.id} park={selectedPark} />
          ) : (
            <div className="empty-state" style={{ height: '400px' }}>
              Select a park on the map to view live output telemetry.
            </div>
          )}
        </div>
      </div>

      <div className="bottom-grid">
        <div className="panel">
          <h2>Data Pipeline Execution</h2>
          <PipelineMonitor />
        </div>
        <div className="panel terminal-panel">
          <h2>System Alert Feed</h2>
          <TerminalBox />
        </div>
      </div>
    </div>
  )
}

export default App