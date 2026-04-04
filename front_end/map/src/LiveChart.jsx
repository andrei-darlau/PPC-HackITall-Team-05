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

// Now takes in the specific park, and the live readings array passed from App.jsx
const LiveChart = ({ park, liveReadings }) => {
  const [data, setData] = useState([])

  useEffect(() => {
    if (!park || !liveReadings || liveReadings.length === 0) return

    // Filter to find the turbines that belong to the selected park
    const parkTurbines = liveReadings.filter(r => r.parkId === park.id)
    
    // Sum up the active power of all turbines in this park
    const totalActivePower = parkTurbines.reduce((sum, t) => sum + t.activePower, 0)
    
    // Create a new data point based on the current time
    const newPoint = {
      time: new Date().getTime(), 
      activePower: totalActivePower,
    }

    // Append to chart data, keeping only the last 15 points to create a rolling chart
    setData(prevData => {
      const updatedData = [...prevData, newPoint]
      if (updatedData.length > 15) {
        return updatedData.slice(updatedData.length - 15)
      }
      return updatedData
    })
  }, [park, liveReadings])

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  return (
    <div style={{ width: '100%', height: '400px' }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
          <XAxis
            dataKey="time"
            type="number"
            domain={['dataMin', 'dataMax']}
            tickFormatter={formatTime}
            stroke="var(--text)"
            tick={{ fontSize: 12 }}
          />
          <YAxis
            yAxisId="left"
            stroke="var(--accent)"
            tickFormatter={(val) => `${val} kW`}
            tick={{ fontSize: 12 }}
            width={80}
          />
          <Tooltip
            labelFormatter={formatTime}
            formatter={(value, name) => {
              if (name === "activePower") return [`${value.toFixed(2)} kW`, 'Total Active Power']
              return [value, name]
            }}
            contentStyle={{
              backgroundColor: 'var(--panel-bg)',
              borderColor: 'var(--border)',
              borderRadius: '8px',
              color: 'var(--text-h)'
            }}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="activePower"
            stroke="var(--accent)"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false} 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default LiveChart