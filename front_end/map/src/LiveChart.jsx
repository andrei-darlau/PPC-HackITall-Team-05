import { useState, useEffect } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine // Added ReferenceLine
} from 'recharts'
import { API_BASE_URL } from './App'

const LiveChart = () => {
  const [data, setData] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true;

    const fetchTelemetry = async () => {
      try {
        setIsLoading(true);
        // Include auth token if the user is logged in
        const token = localStorage.getItem('auth_token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

        const response = await fetch(`${API_BASE_URL}/kpi/history/public`, { headers });
        
        if (!response.ok) {
          throw new Error('Failed to fetch telemetry data');
        }

        const payload = await response.json();

        // 1. Transform the object into an array
        // 2. Convert ISO timestamp string to Unix milliseconds for Recharts X-Axis
        // 3. Convert kW to MW (divide by 1000)
        const formattedData = Object.entries(payload).map(([timestamp, kwValue]) => ({
          time: new Date(timestamp).getTime(),
          activePower: Number((kwValue / 1000).toFixed(2)) 
        }));

        // Ensure chronological order
        formattedData.sort((a, b) => a.time - b.time);

        if (isMounted) {
          setData(formattedData);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error loading chart data:', err);
        if (isMounted) setIsLoading(false);
      }
    };

    fetchTelemetry();

    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array ensures this runs once on mount

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Dynamically calculate the Y-Axis bounds to zoom in on the data variance.
  const calculateYMin = (dataMin) => Math.max(0, Math.floor(dataMin * 0.95));
  const calculateYMax = (dataMax) => Math.ceil(dataMax * 1.05);

  if (isLoading) {
    return (
      <div className="empty-state" style={{ height: '400px' }}>
        Loading system-wide telemetry...
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="empty-state" style={{ height: '400px' }}>
        No telemetry data available for this timeframe.
      </div>
    )
  }

  // Calculate the average active power
  const averagePower = data.reduce((sum, item) => sum + item.activePower, 0) / data.length;

  return (
    <div style={{ width: '100%', height: '400px', position: 'relative' }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
          
          <XAxis
            dataKey="time"
            type="number"
            domain={['dataMin', 'dataMax']}
            tickFormatter={formatTime}
            stroke="var(--text)"
            tick={{ fontSize: 12 }}
            minTickGap={50}
          />
          
          <YAxis
            yAxisId="left"
            stroke="var(--accent)"
            tickFormatter={(val) => `${val} MW`}
            tick={{ fontSize: 12 }}
            width={85}
            domain={[calculateYMin, calculateYMax]}
          />
          
          <Tooltip
            labelFormatter={formatTime}
            formatter={(value) => [`${value} MW`, 'Power Output']}
            contentStyle={{
              backgroundColor: 'var(--panel-bg)',
              borderColor: 'var(--border)',
              borderRadius: '8px',
              color: 'var(--text-h)'
            }}
          />
          
          {/* Added Reference Line for Average */}
          <ReferenceLine 
            y={averagePower} 
            yAxisId="left"
            stroke="var(--text)" 
            strokeDasharray="4 4" 
            label={{ 
              position: 'top', 
              value: `Avg: ${averagePower.toFixed(2)} MW`, 
              fill: 'var(--text)',
              fontSize: 12
            }} 
          />

          <Line
            yAxisId="left"
            type="monotone"
            dataKey="activePower"
            stroke="var(--accent)"
            strokeWidth={2}
            dot={false}
            isAnimationActive={true} 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default LiveChart