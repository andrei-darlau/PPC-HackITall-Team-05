import { useState, useEffect, useRef } from 'react'

const TerminalBox = () => {
  const [logs, setLogs] = useState([])
  
  // 1. Ref for the scrollable container instead of the empty div at the bottom
  const containerRef = useRef(null)
  
  // 2. Ref to track if the user is currently scrolled to the bottom
  const isAtBottomRef = useRef(true)

  useEffect(() => {
    const initialAlerts = [
      { severity: 'LOW', message: 'System boot sequence initiated.', turbineId: 'SYS' },
      { severity: 'LOW', message: 'Connected to Spring Boot backend.', turbineId: 'SYS' },
    ]

    const initialLogs = initialAlerts.map((alert, index) => ({
      id: `init-${index}`,
      text: `[${new Date().toLocaleTimeString('en-GB')}] [${alert.severity}] ${alert.turbineId}: ${alert.message}`,
      severity: alert.severity
    }))
    
    setLogs(initialLogs)

    const interval = setInterval(() => {
      if (Math.random() > 0.6) {
        const severities = ['LOW', 'MEDIUM', 'HIGH']
        const severity = severities[Math.floor(Math.random() * severities.length)]
        const newAlert = {
          id: `mock-${Date.now()}`,
          text: `[${new Date().toLocaleTimeString('en-GB')}] [${severity}] WTG-${Math.floor(Math.random() * 10)}: Telemetry variance noted`,
          severity: severity
        }
        // Increased the slice to 100 so you have enough logs to test scrolling up
        setLogs(prev => [...prev, newAlert].slice(-100)) 
      }
    }, 7000)

    return () => clearInterval(interval)
  }, [])

  // 3. Update scroll position ONLY if the user is at the bottom
  useEffect(() => {
    if (isAtBottomRef.current && containerRef.current) {
      // Scrolls only the container, preventing the whole page from jumping
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [logs])

  // 4. Handler to figure out if the user scrolled up
  const handleScroll = () => {
    if (containerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current
      // If the distance from the bottom is less than 10px, consider it "at the bottom"
      isAtBottomRef.current = scrollHeight - scrollTop - clientHeight < 10
    }
  }

  const getColor = (severity) => {
    switch(severity) {
      case 'HIGH': return '#ef4444' 
      case 'MEDIUM': return '#eab308' 
      case 'LOW': return '#10b981' 
      default: return '#10b981'
    }
  }

  return (
    <div 
      ref={containerRef}
      onScroll={handleScroll} // 5. Attach the scroll listener
      style={{
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
      }}
    >
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
      {/* We removed the endOfMessagesRef div entirely */}
    </div>
  )
}

export default TerminalBox