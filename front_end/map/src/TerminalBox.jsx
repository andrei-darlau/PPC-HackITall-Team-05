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

    fetchAlerts()
    const interval = setInterval(fetchAlerts, 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  const getColor = (severity) => {
    switch(severity) {
      case 'HIGH': return '#ef4444' 
      case 'MEDIUM': return '#eab308' 
      case 'LOW': return '#10b981' 
      default: return '#10b981'
    }
  }

  return (
    <div style={{
      backgroundColor: '#0a0a0a',
      fontFamily: 'var(--mono)',
      padding: '16px',
      borderRadius: '6px',
      height: '300px',
      width: '100%',
      overflowY: 'auto',
      boxSizing: 'border-box',
      textAlign: 'left',
      border: '1px solid #262626',
    }}>
      {logs.length === 0 ? (
        <div style={{ color: '#525252', fontSize: '13px' }}>Awaiting system alerts...</div>
      ) : (
        logs.map((log) => (
          <div key={log.id} style={{ 
            margin: '4px 0', 
            fontSize: '13px', 
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