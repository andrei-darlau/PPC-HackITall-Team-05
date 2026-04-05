import { useState, useEffect, useCallback, useRef } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts'
import { API_BASE_URL } from './App'

const LiveChart = () => {
  const [data, setData] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const timeoutRef = useRef(null)

  // 1. Refresh -> Call API -> Plot given values
  const fetchTelemetry = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('auth_token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

      const response = await fetch(`${API_BASE_URL}/kpi/history/public`, { headers });
      
      if (!response.ok) {
        throw new Error('Failed to fetch telemetry data');
      }

      const payload = await response.json();

      // Strictly map the raw payload into chart-ready format (convert kW to MW)
      const formattedData = Object.entries(payload).map(([timestamp, kwValue]) => ({
        time: new Date(timestamp).getTime(),
        activePower: Number((kwValue / 1000).toFixed(2)) 
      }));

      // Entirely replace old state with only the newly fetched data
      setData(formattedData);
    } catch (err) {
      console.error('Error loading chart data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const scheduleNextRefresh = () => {
      const now = new Date();
      const currentMinute = now.getMinutes();
      const targetMinutes = [1, 16, 31, 46];
      
      let nextMinute = targetMinutes.find(m => m > currentMinute);
      
      const nextDate = new Date(now);
      if (nextMinute === undefined) {
        nextDate.setHours(now.getHours() + 1);
        nextDate.setMinutes(1);
      } else {
        nextDate.setMinutes(nextMinute);
      }
      
      nextDate.setSeconds(0);
      nextDate.setMilliseconds(0);

      const msUntilNext = nextDate.getTime() - now.getTime();
      
      timeoutRef.current = setTimeout(() => {
        if (isMounted) {
          fetchTelemetry();
          scheduleNextRefresh(); 
        }
      }, msUntilNext);
    };

    fetchTelemetry().then(() => {
      if (isMounted) scheduleNextRefresh();
    });

    return () => {
      isMounted = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [fetchTelemetry]);

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const calculateYMin = (dataMin) => Math.max(0, Math.floor(dataMin * 0.95));
  const calculateYMax = (dataMax) => Math.ceil(dataMax * 1.05);

  const averagePower = data.length > 0 
    ? data.reduce((sum, item) => sum + item.activePower, 0) / data.length 
    : 0;

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px', paddingRight: '10px' }}>
        <button 
          onClick={() => fetchTelemetry()} 
          className="btn-secondary" 
          disabled={isLoading}
          style={{ padding: '6px 12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          {isLoading ? '↻ Refreshing...' : '↻ Refresh'}
        </button>
      </div>

      <div style={{ width: '100%', height: '360px', position: 'relative' }}>
        {isLoading && data.length === 0 ? (
          <div className="empty-state" style={{ height: '360px' }}>
            Loading system-wide telemetry...
          </div>
        ) : !data || data.length === 0 ? (
          <div className="empty-state" style={{ height: '360px' }}>
            No telemetry data available for this timeframe.
          </div>
        ) : (
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
                dot={true} 
                isAnimationActive={false} 
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

export default LiveChart