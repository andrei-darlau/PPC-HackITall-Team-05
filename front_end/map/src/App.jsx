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
  const [kpis, setKpis] = useState(null)
  const [liveReadings, setLiveReadings] = useState([])
  // NEW: State to hold the turbines of the selected park
  const [parkTurbines, setParkTurbines] = useState([])

  useEffect(() => {
    // 1. Fetch Park Locations for the Map
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

    // 2. Fetch Live KPIs and compute dashboard totals
    const fetchKpis = () => {
      fetch(`${API_BASE_URL}/kpi/live`)
        .then((res) => res.json())
        .then((data) => {
          setLiveReadings(data) 
          
          const totalPowerKw = data.reduce((sum, turbine) => sum + (turbine.activePower || 0), 0)
          const totalMwh = (totalPowerKw / 1000).toFixed(2) 
          
          setKpis({
            totalMwh: totalMwh,
            availability: 98.5, 
            activeAlerts: 0,    
            offlineTurbines: 0  
          })
        })
        .catch((err) => console.error('Failed to fetch KPIs:', err))
    }

    fetchKpis()
    const interval = setInterval(fetchKpis, 15000) 
    return () => clearInterval(interval)
  }, [])

  // NEW: Fetch Turbines when a park is selected
  useEffect(() => {
    if (selectedPark) {
      fetch(`${API_BASE_URL}/parks/${selectedPark.id}/turbines`)
        .then((res) => res.json())
        .then((data) => setParkTurbines(data))
        .catch((err) => console.error('Failed to fetch turbines:', err))
    } else {
      setParkTurbines([])
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

      {kpis && (
        <div className="kpi-grid">
          <div className="kpi-card">
            <h4>Total Output</h4>
            <p className="kpi-value">{kpis.totalMwh} <span style={{fontSize: '16px'}}>MW</span></p>
          </div>
          <div className="kpi-card">
            <h4>Availability</h4>
            <p className="kpi-value">{kpis.availability}%</p>
          </div>
          <div className="kpi-card" style={{ borderColor: kpis.activeAlerts > 0 ? 'rgba(239, 68, 68, 0.5)' : 'var(--border)' }}>
            <h4>Active Alerts</h4>
            <p className="kpi-value" style={{ color: kpis.activeAlerts > 0 ? '#ef4444' : 'inherit' }}>
              {kpis.activeAlerts}
            </p>
          </div>
          <div className="kpi-card">
            <h4>Offline Turbines</h4>
            <p className="kpi-value">{kpis.offlineTurbines}</p>
          </div>
        </div>
      )}
      
      <div className="main-grid">
        <div className="panel map-panel">
          <h2>Geospatial Overview</h2>
          <Map farms={parks} onSelectFarm={setSelectedPark} />
        </div>

        {/* NEW: Turbine List Side Box */}
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
            <LiveChart key={selectedPark.id} park={selectedPark} liveReadings={liveReadings} />
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