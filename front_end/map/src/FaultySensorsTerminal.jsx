import { useState, useEffect } from 'react'
import { API_BASE_URL } from './App'

const FaultySensorsTerminal = ({ user, parks }) => {
  const [selectedParkId, setSelectedParkId] = useState('')
  const [hoursBack, setHoursBack] = useState(24)
  const [logs, setLogs] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // Auto-select the first park if the user only has access to one
  useEffect(() => {
    if (parks.length === 1 && !selectedParkId) {
      setSelectedParkId(parks[0].id)
    }
  }, [parks, selectedParkId])

  // If no user is logged in, hide the component entirely
  if (!user) return null

  const handleFetch = async () => {
    if (!selectedParkId) {
      setError("Please select a park first.")
      return
    }
    
    if (!hoursBack || hoursBack <= 0) {
      setError("Please enter a valid number of hours.")
      return
    }

    setIsLoading(true)
    setError(null)
    setLogs([])

    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`${API_BASE_URL}/analytics/parks/${selectedParkId}/faulty-sensors?hoursBack=${hoursBack}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        if (response.status === 403) throw new Error("Permission Denied: You do not have access to this park's analytics.")
        throw new Error("Failed to fetch sensor data.")
      }

      const data = await response.json()
      const newLogs = []

      // Iterate over the Map<String, List<FaultObject>>
      Object.entries(data).forEach(([turbineId, faults]) => {
        faults.forEach(fault => {
          // Format the timestamp for cleaner reading
          const timeFormatted = fault.latestRejectedAt.replace('T', ' ')
          
          // Format: ID - faulty sensor - reason - count - first error: time
          newLogs.push(`${turbineId} - ${fault.sensorType} - ${fault.latestRejectionReason} - ${fault.rejectionCount} times - first error: ${timeFormatted}`)
        })
      })

      if (newLogs.length === 0) {
        newLogs.push(`No faulty sensors detected in the last ${hoursBack} hours.`)
      }

      setLogs(newLogs)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="panel" style={{ marginTop: '24px' }}>
      <h2>Sensor Diagnostics Terminal</h2>
      
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: '16px' }}>
        <div className="form-group" style={{ minWidth: '200px' }}>
          <label>Target Park</label>
          <select 
            value={selectedParkId}
            onChange={(e) => setSelectedParkId(e.target.value)}
            style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-h)', outline: 'none' }}
          >
            <option value="" disabled>-- Select a Park --</option>
            {parks.map(park => (
              <option key={park.id} value={park.id}>{park.name}</option>
            ))}
          </select>
        </div>

        <div className="form-group" style={{ width: '120px' }}>
          <label>Hours Back</label>
          <input 
            type="number" 
            value={hoursBack}
            onChange={(e) => setHoursBack(e.target.value)}
            min="1"
            style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-h)', outline: 'none' }}
          />
        </div>

        <button 
          className="btn-primary" 
          onClick={handleFetch} 
          disabled={isLoading}
          style={{ height: '36px', padding: '0 24px' }}
        >
          {isLoading ? 'Scanning...' : 'Run Diagnostics'}
        </button>
      </div>

      {error && <div style={{ color: '#ef4444', marginBottom: '12px', fontSize: '13px' }}>{error}</div>}

      <div className="terminal-box">
        {logs.length === 0 && !isLoading && !error && (
          <div style={{ color: '#555' }}>&gt; Awaiting diagnostic execution...</div>
        )}
        {logs.map((log, index) => (
          <div key={index} className="terminal-line" style={{ color: '#ef4444' }}>
            <span style={{ color: '#3b82f6' }}>&gt;</span> {log}
          </div>
        ))}
      </div>
    </div>
  )
}

export default FaultySensorsTerminal