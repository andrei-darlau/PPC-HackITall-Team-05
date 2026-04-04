import { useState, useEffect } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

const LiveChart = () => {
  const [data, setData] = useState([])

  useEffect(() => {
    // 1. Generate initial mock data (Last 60 minutes)
    const now = Date.now()
    const initialData = []
    for (let i = 60; i >= 0; i--) {
      initialData.push({
        time: now - i * 60 * 1000, // 1 point per minute
        value: Math.random() * 0.8, // Normal values between 0 - 0.8 MWh
      })
    }
    setData(initialData)

    // 2. Simulate a live back-end feed updating every 3 seconds
    const interval = setInterval(() => {
      setData((currentData) => {
        const newTime = Date.now()
        
        // Let's create an occasional large spike to test the auto-expanding Y-Axis
        const isSpike = Math.random() > 0.95 
        const newValue = isSpike ? Math.random() * 4 + 1 : Math.random() * 0.8

        const newDataPoint = { time: newTime, value: newValue }

        // Filter out data older than 1 hour (60 mins * 60 secs * 1000 ms)
        const oneHourAgo = newTime - 60 * 60 * 1000
        
        return [...currentData, newDataPoint].filter((d) => d.time >= oneHourAgo)
      })
    }, 3000)

    // Cleanup interval on unmount
    return () => clearInterval(interval)
  }, [])

  // Format the UNIX timestamp into a readable time (e.g., 14:30)
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="chart-wrapper">
      <h2>Live Energy Output</h2>
      <div style={{ width: '100%', height: 400 }}>
        <ResponsiveContainer>
          <LineChart
            data={data}
            margin={{ top: 20, right: 30, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
            
            {/* X-Axis: Time over 1 Hour */}
            <XAxis
              dataKey="time"
              type="number"
              domain={['dataMin', 'dataMax']}
              tickFormatter={formatTime}
              stroke="var(--text)"
              tick={{ fontSize: 12 }}
            />
            
            {/* Y-Axis: Minimum range 0-1, but scales up if dataMax > 1 */}
            <YAxis
              domain={[0, (dataMax) => Math.max(1, Math.ceil(dataMax))]}
              stroke="var(--text)"
              tickFormatter={(val) => `${val} MWh`}
              tick={{ fontSize: 12 }}
              width={80}
            />
            
            <Tooltip
              labelFormatter={formatTime}
              formatter={(value) => [`${value.toFixed(2)} MWh`, 'Energy']}
              contentStyle={{
                backgroundColor: 'var(--bg)',
                borderColor: 'var(--border)',
                borderRadius: '8px',
                color: 'var(--text-h)'
              }}
            />
            
            <Line
              type="monotone"
              dataKey="value"
              stroke="var(--accent)"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false} // Disabled animation so real-time updates don't stutter
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default LiveChart