import { useState, useEffect, useRef } from 'react'

// A list of fake backend messages to randomly pick from
const fakeMessages = [
  "[SYSTEM] Connecting to WebSocket stream...",
  "[OK] Handshake successful. Latency: 12ms",
  "[DATA] Fetching live metrics from Bucharest North Farm...",
  "[DATA] Fetching live metrics from Ilfov East Turbines...",
  "[DATA] Fetching live metrics from Danube Breeze Array...",
  "[SYNC] Data payload received (24 bytes)",
  "[SYNC] Data payload received (128 bytes)",
  "[OK] Connection heartbeat OK",
  "[WARN] Slight jitter detected on network, compensating...",
  "[SYSTEM] Parsing telemetry data..."
]

const TerminalBox = () => {
  const [logs, setLogs] = useState(["[SYSTEM] Initializing wind farm backend connection..."])
  const endOfMessagesRef = useRef(null)

  useEffect(() => {
    // Generate a random message every 2 seconds
    const interval = setInterval(() => {
      const randomMsg = fakeMessages[Math.floor(Math.random() * fakeMessages.length)]
      
      // Get a timestamp like "14:30:15"
      const timestamp = new Date().toLocaleTimeString('en-GB')
      
      setLogs((prevLogs) => {
        const newLogs = [...prevLogs, `[${timestamp}] ${randomMsg}`]
        // Only keep the last 50 messages so the browser doesn't slow down
        return newLogs.slice(-50)
      })
    }, 2000)

    // Cleanup interval when component unmounts
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{
      backgroundColor: '#121212',
      color: '#4af626', // Hacker terminal green
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
        fontWeight: 'bold'
      }}>
        root@wind-farm-backend:~# ./tail-logs.sh
      </div>
      
      {/* Map through all the logs and display them */}
      {logs.map((log, index) => (
        <div key={index} style={{ margin: '4px 0', fontSize: '14px', lineHeight: '1.5' }}>
          {log}
        </div>
      ))}
      
      {/* This invisible div helps us auto-scroll to the bottom */}
      <div ref={endOfMessagesRef} />
    </div>
  )
}

export default TerminalBox