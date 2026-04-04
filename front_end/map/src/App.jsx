import { useState } from 'react'
import Map from './Map'
import LiveChart from './LiveChart'
import TerminalBox from './TerminalBox' // Import our new terminal!
import './App.css'

const windFarms = [
  { id: 1, name: 'Bucharest North Farm', position: [44.53, 26.09] },
  { id: 2, name: 'Ilfov East Turbines', position: [44.43, 26.25] },
  { id: 3, name: 'Danube Breeze Array', position: [43.95, 25.98] },
]

function App() {
  const [selectedFarm, setSelectedFarm] = useState(null)

  return (
    <div id="dashboard" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', /* This centers everything in the middle of the screen */
      gap: '32px', 
      padding: '40px 24px',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      <h1>Wind Energy Dashboard</h1>
      
      {/* Map Container - Full width up to 800px */}
      <div style={{ width: '100%', maxWidth: '800px' }}>
        <Map farms={windFarms} onSelectFarm={setSelectedFarm} />
      </div>
      
      {/* Chart Container - Full width up to 600px (75% of the map's 800px width) */}
      <div style={{ width: '100%', maxWidth: '600px' }}>
        {selectedFarm ? (
          <LiveChart key={selectedFarm.id} farm={selectedFarm} />
        ) : (
          <div className="chart-wrapper" style={{ 
            display: 'grid', 
            placeItems: 'center', 
            height: '400px', /* Matches the height of the chart */
            width: '100%', 
            boxSizing: 'border-box' 
          }}>
            <h3 style={{ textAlign: 'center', padding: '0 20px' }}>
              Select a wind farm on the map to view its live output.
            </h3>
          </div>
        )}
      </div>

      {/* Terminal Container - Full width up to 800px to match the map */}
      <div style={{ width: '100%', maxWidth: '800px' }}>
        <TerminalBox />
      </div>

    </div>
  )
}

export default App