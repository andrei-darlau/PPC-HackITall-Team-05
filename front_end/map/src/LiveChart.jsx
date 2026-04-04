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
import { API_BASE_URL } from './App'

const LiveChart = ({ farm }) => {
  const [data, setData] = useState([])

  useEffect(() => {
    if (!farm) return

    const fetchReadings = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/turbines/${farm.turbineId}/readings`)
        if (!res.ok) throw new Error('Network response was not ok')
        
        const rawData = await res.json()
        
        const formattedData = rawData.map(reading => ({
          time: new Date(reading.timestamp).getTime(),
          activePower: reading.activePower,
          windSpeed: reading.windSpeed,
          gearboxTemp: reading.gearboxTemp
        })).sort((a, b) => a.time - b.time) // Ensure chronological order

        setData(formattedData)
      } catch (err) {
        console.error('Failed to fetch turbine readings:', err)
      }
    }

    // Fetch immediately on mount
    fetchReadings()

    // Poll for new readings every 10 seconds
    const interval = setInterval(fetchReadings, 10000)
    return () => clearInterval(interval)
  }, [farm])

  // Format the UNIX timestamp into a readable time (e.g., 14:30)
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="chart-wrapper">
      <h2>Live Readings: {farm.name}</h2>
      <div style={{ width: '100%', height: 400 }}>
        <ResponsiveContainer>
          <LineChart
            data={data}
            margin={{ top: 20, right: 30, left: 10, bottom: 5 }}
          >
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
                if (name === "activePower") return [`${value.toFixed(2)} kW`, 'Active Power']
                return [value, name]
              }}
              contentStyle={{
                backgroundColor: 'var(--bg)',
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
    </div>
  )
}

export default LiveChart