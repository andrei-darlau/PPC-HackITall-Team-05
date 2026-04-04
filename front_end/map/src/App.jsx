import { useState, useEffect } from 'react'
import Map from './Map'
import LiveChart from './LiveChart'
import TerminalBox from './TerminalBox'
import PipelineMonitor from './PipelineMonitor'
import ReportExporter from './ReportExporter'
import './App.css'

export const API_BASE_URL = 'http://10.200.22.157:6767/api'

function App() {
  const [turbines, setTurbines] = useState([])
  const [selectedFarm, setSelectedFarm] = useState(null)
  const [kpis, setKpis] = useState(null)

  useEffect(() => {
    fetch(`${API_BASE_URL}/dashboard/kpis`)
      .then((res) => res.json())
      .then((data) => setKpis(data))
      .catch((err) => console.error('Failed to fetch KPIs:', err))

    fetch(`${API_BASE_URL}/turbines`)
      .then((res) => res.json())
      .then((data) => {
        const formattedTurbines = data.map((t) => ({
          ...t,
          id: t.turbineId,
          name: `${t.turbineId} (${t.model})`,
          position: [t.latitude, t.longitude],
        }))
        setTurbines(formattedTurbines)
      })
      .catch((err) => console.error('Failed to fetch turbines:', err))
  }, [])

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
            <p className="kpi-value">{kpis.totalMwh} <span style={{fontSize: '16px'}}>MWh</span></p>
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
          <Map farms={turbines} onSelectFarm={setSelectedFarm} />
        </div>
        
        <div className="panel chart-panel">
          <h2>Telemetry: {selectedFarm ? selectedFarm.name : 'No Selection'}</h2>
          {selectedFarm ? (
            <LiveChart key={selectedFarm.id} farm={selectedFarm} />
          ) : (
            <div className="empty-state">
              Select a turbine on the map to view live output telemetry.
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