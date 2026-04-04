import { useState, useEffect, useRef } from 'react'
import { API_BASE_URL } from './App'

const TerminalBox = () => {
  const [logs, setLogs] = useState([])
  const endOfMessagesRef = useRef(null)

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/alerts`)
        if (!res.ok) return
        
        const data = await res.json()
        
        // Map real backend alerts to terminal strings
        const formattedLogs = data.map((alert) => {
          const timestamp = new Date(alert.timestamp).toLocaleTimeString('en-GB')
          return {
            id: `${alert.turbineId}-${alert.timestamp}`,
            text: `[${timestamp}] [${alert.severity}] ${alert.turbineId}: ${alert.message}`,
            severity: alert.severity
          }
        })
        
        setLogs(formattedLogs)
      } catch (err) {
        console.error("Failed to fetch alerts:", err)
      }
    }

    // Fetch alerts immediately on mount (no fake system messages)
    fetchAlerts()

    // Poll every 5 seconds
    const interval = setInterval(fetchAlerts, 5000)
    return () => clearInterval(interval)
  }, [])

  // Auto-scroll to the bottom when new logs arrive
  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  const getColor = (severity) => {
    switch(severity) {
      case 'HIGH': return '#ef4444' // Red
      case 'MEDIUM': return '#eab308' // Yellow
      case 'LOW': return '#4af626' // Green
      default: return '#4af626'
    }
  }

  return (
    <div style={{
      backgroundColor: '#121212',
      fontFamily: 'ui-monospace, Consolas, monospace',
      padding: '16px',
      borderRadius: '8px',
      height: '250px',
      width: '100%',
      overflowY: 'auto',
      boxSizing: 'border-box',
      textAlign: 'left',
      border: '2px solid #2e303a',
      boxShadow: 'inset 0 0 15px rgba(0,0,0,0.8)'
    }}>
      <div style={{ 
        marginBottom: '12px', 
        color: '#888', 
        borderBottom: '1px solid #333', 
        paddingBottom: '8px',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: '1px'
      }}>
        Live Alert Feed
      </div>
      
      {logs.length === 0 ? (
        <div style={{ color: '#888', fontSize: '14px' }}>Waiting for alerts...</div>
      ) : (
        logs.map((log) => (
          <div key={log.id} style={{ 
            margin: '4px 0', 
            fontSize: '14px', 
            lineHeight: '1.5',
            color: getColor(log.severity)
          }}>
            {log.text}
          </div>
        ))
      )}
      
      <div ref={endOfMessagesRef} />
    </div>
  )
}

export default TerminalBox