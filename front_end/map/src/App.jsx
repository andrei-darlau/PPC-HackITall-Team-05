import { useState, useEffect } from 'react'
import Map from './Map'
import LiveChart from './LiveChart'
import TerminalBox from './TerminalBox'
import './App.css'
import PipelineMonitor from './PipelineMonitor'
import ReportExporter from './ReportExporter'

export const API_BASE_URL = 'http://10.200.22.157:6767/api'

function App() {
  const [turbines, setTurbines] = useState([])
  const [selectedFarm, setSelectedFarm] = useState(null)
  const [kpis, setKpis] = useState(null)

  useEffect(() => {
    // 1. Fetch Dashboard KPIs
    fetch(`${API_BASE_URL}/dashboard/kpis`)
      .then((res) => res.json())
      .then((data) => setKpis(data))
      .catch((err) => console.error('Failed to fetch KPIs:', err))

    // 2. Fetch Turbines for the Map
    fetch(`${API_BASE_URL}/turbines`)
      .then((res) => res.json())
      .then((data) => {
        // Transform the backend model to the format our frontend expects
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
    <div id="dashboard" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center',
      gap: '32px', 
      padding: '40px 24px',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      <h1>Wind Energy Dashboard</h1>

      {/* KPI Cards Container */}
      {kpis && (
        <div className="kpi-grid">
          <div className="kpi-card">
            <h4>Total Output</h4>
            <p className="kpi-value">{kpis.totalMwh} <span style={{fontSize: '14px'}}>MWh</span></p>
          </div>
          <div className="kpi-card">
            <h4>Availability</h4>
            <p className="kpi-value">{kpis.availability}%</p>
          </div>
          <div className="kpi-card" style={{ borderColor: kpis.activeAlerts > 0 ? '#ef4444' : 'var(--border)' }}>
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
      
      {/* Map Container */}
      <div style={{ width: '100%', maxWidth: '800px' }}>
        <Map farms={turbines} onSelectFarm={setSelectedFarm} />
      </div>
      
      {/* Chart Container */}
      <div style={{ width: '100%', maxWidth: '800px' }}>
        {selectedFarm ? (
          <LiveChart key={selectedFarm.id} farm={selectedFarm} />
        ) : (
          <div className="chart-wrapper" style={{ 
            display: 'grid', 
            placeItems: 'center', 
            height: '400px',
            width: '100%', 
            boxSizing: 'border-box' 
          }}>
            <h3 style={{ textAlign: 'center', padding: '0 20px', color: 'var(--text)' }}>
              Select a turbine on the map to view its live output.
            </h3>
          </div>
        )}
      </div>

      {/* Terminal Container */}
      <div style={{ width: '100%', maxWidth: '800px' }}>
        <TerminalBox />
      </div>
        <div style={{ width: '100%', maxWidth: '800px' }}>
        <ReportExporter />
      </div>

      <div style={{ width: '100%', maxWidth: '800px' }}>
        <PipelineMonitor />
      </div>
    </div>
  )
}

export default App