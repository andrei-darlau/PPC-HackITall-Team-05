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

const LiveChart = ({ park }) => {
  const [data, setData] = useState([])

  // NOTE: Logic for updating chart data based on liveReadings has been removed.
  // This component is ready for a new data ingestion method.

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  return (
    <div style={{ width: '100%', height: '400px', position: 'relative' }}>
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