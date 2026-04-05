import { useState, useEffect, useCallback, useRef } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { API_BASE_URL } from './App'

const ParkDashboard = ({ selectedPark, selectedTurbine }) => {
  const [data, setData] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const [graphType, setGraphType] = useState('power')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  
  const [isLive, setIsLive] = useState(false)
  const [livePeriod, setLivePeriod] = useState(24) 
  
  const timeoutRef = useRef(null)
  const dataRef = useRef([])
  const isLiveRef = useRef(isLive)
  const livePeriodRef = useRef(livePeriod)

  useEffect(() => { isLiveRef.current = isLive }, [isLive])
  useEffect(() => { livePeriodRef.current = livePeriod }, [livePeriod])
  useEffect(() => { dataRef.current = data }, [data])

  const formatForInput = (d) => {
    const pad = (n) => n.toString().padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  useEffect(() => {
    const end = new Date()
    const start = new Date()
    start.setHours(start.getHours() - 24)
    setStartDate(formatForInput(start))
    setEndDate(formatForInput(end))
  }, [])

  const fetchParkData = useCallback(async (startIso, endIso, isDelta = false) => {
    if (!selectedPark && !selectedTurbine) return

    if (!isDelta) setIsLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem('auth_token')
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {}

      // Switch endpoint based on whether we are viewing a single turbine or a whole park
      const endpoint = selectedTurbine 
        ? `${API_BASE_URL}/kpi/${selectedTurbine.id}/history`
        : `${API_BASE_URL}/kpi/${selectedPark.id}/metrics`;

      const url = new URL(endpoint)
      url.searchParams.append('start', startIso)
      url.searchParams.append('end', endIso)

      const response = await fetch(url.toString(), { headers })
      
      if (!response.ok) {
        if (response.status === 403) throw new Error('You do not have permission to view telemetry for this resource.')
        throw new Error('Failed to fetch telemetry data')
      }

      const payload = await response.json()
      
      const formattedData = payload.map(item => {
        const mappedItem = { ...item, time: new Date(item.timeBucket).getTime() };
        if (mappedItem.activePower != null) mappedItem.activePower = Number((mappedItem.activePower / 1000).toFixed(2));
        if (mappedItem.windSpeed != null) mappedItem.windSpeed = Number((mappedItem.windSpeed / 3.6).toFixed(2));
        return mappedItem;
      })

      setData(prevData => {
        const combined = isDelta ? [...prevData, ...formattedData] : formattedData;
        const uniqueData = Array.from(new Map(combined.map(item => [item.time, item])).values());
        uniqueData.sort((a, b) => a.time - b.time);

        if (isLiveRef.current) {
          const cutoffTime = new Date().getTime() - (livePeriodRef.current * 60 * 60 * 1000);
          return uniqueData.filter(d => d.time >= cutoffTime);
        }
        
        return uniqueData;
      })

    } catch (err) {
      console.error('Error loading data:', err)
      setError(err.message)
      if (!isDelta) setData([])
    } finally {
      setIsLoading(false)
    }
  }, [selectedPark, selectedTurbine])

  useEffect(() => {
    if (!isLive && startDate && endDate) {
      fetchParkData(`${startDate}:00`, `${endDate}:00`, false)
    }
  }, [isLive, startDate, endDate, graphType, fetchParkData])

  useEffect(() => {
    let isMounted = true;

    if (!isLive) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      return;
    }

    const runLiveFetch = () => {
      const end = new Date();
      let startIso;
      let isDelta = false;

      const currentData = dataRef.current;
      
      if (currentData.length > 0) {
        const lastDataPointTime = currentData[currentData.length - 1].time;
        startIso = new Date(lastDataPointTime + 1).toISOString();
        isDelta = true;
      } else {
        const start = new Date();
        start.setHours(start.getHours() - livePeriodRef.current);
        startIso = start.toISOString();
      }
      
      fetchParkData(startIso, end.toISOString(), isDelta);
    }

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
          runLiveFetch();
          scheduleNextRefresh(); 
        }
      }, msUntilNext);
    };

    const start = new Date();
    start.setHours(start.getHours() - livePeriod);
    fetchParkData(start.toISOString(), new Date().toISOString(), false).then(() => {
       if (isMounted) scheduleNextRefresh();
    });

    return () => {
      isMounted = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isLive, livePeriod, fetchParkData]);


  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const getUnit = () => {
    if (graphType === 'temperature') return '°C'
    if (graphType === 'windSpeed') return 'm/s'
    return 'MW'
  }

  const renderLines = () => {
    if (graphType === 'power') return <Line type="monotone" dataKey="activePower" name="Active Power" stroke="var(--accent)" strokeWidth={2} dot={false} isAnimationActive={false} />
    if (graphType === 'windSpeed') return <Line type="monotone" dataKey="windSpeed" name="Wind Speed" stroke="#10b981" strokeWidth={2} dot={false} isAnimationActive={false} />
    if (graphType === 'temperature') return (
      <>
        <Line type="monotone" dataKey="ambientTemp" name="Ambient" stroke="#3b82f6" strokeWidth={2} dot={false} isAnimationActive={false} />
        <Line type="monotone" dataKey="converterTemp" name="Converter" stroke="#ef4444" strokeWidth={2} dot={false} isAnimationActive={false} />
        <Line type="monotone" dataKey="gearboxTemp" name="Gearbox" stroke="#f59e0b" strokeWidth={2} dot={false} isAnimationActive={false} />
        <Line type="monotone" dataKey="gen1Temp" name="Generator 1" stroke="#ec4899" strokeWidth={2} dot={false} isAnimationActive={false} />
        <Line type="monotone" dataKey="gen2Temp" name="Generator 2" stroke="#8b5cf6" strokeWidth={2} dot={false} isAnimationActive={false} />
        <Line type="monotone" dataKey="transformerTemp" name="Transformer" stroke="#14b8a6" strokeWidth={2} dot={false} isAnimationActive={false} />
      </>
    )
    return null
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end', background: 'var(--bg)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
        
        <div className="form-group" style={{ minWidth: '150px' }}>
          <label style={{ fontSize: '12px', fontWeight: '600', marginBottom: '4px', display: 'block' }}>Metric</label>
          <select 
            value={graphType} 
            onChange={(e) => setGraphType(e.target.value)}
            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--panel-bg)', color: 'var(--text-h)', outline: 'none' }}
          >
            <option value="power">Active Power</option>
            <option value="temperature">Temperatures (All)</option>
            <option value="windSpeed">Wind Speed</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '35px', padding: '0 8px' }}>
          <input 
            type="checkbox" 
            id="live-toggle"
            checked={isLive}
            onChange={(e) => setIsLive(e.target.checked)}
            style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--accent)' }}
          />
          <label htmlFor="live-toggle" style={{ fontWeight: '600', cursor: 'pointer', color: isLive ? 'var(--accent)' : 'var(--text)' }}>
            Live
          </label>
        </div>

        {isLive ? (
          <div className="form-group" style={{ minWidth: '180px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', marginBottom: '4px', display: 'block' }}>Period</label>
            <select 
              value={livePeriod} 
              onChange={(e) => setLivePeriod(Number(e.target.value))}
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--panel-bg)', color: 'var(--text-h)', outline: 'none' }}
            >
              <option value={1}>Last 1 Hour</option>
              <option value={3}>Last 3 Hours</option>
              <option value={6}>Last 6 Hours</option>
              <option value={12}>Last 12 Hours</option>
              <option value={24}>Last 24 Hours</option>
              <option value={48}>Last 2 Days</option>
              <option value={72}>Last 3 Days</option>
              <option value={168}>Last 7 Days</option>
              <option value={720}>Last 30 Days</option>
            </select>
          </div>
        ) : (
          <>
            <div className="form-group" style={{ minWidth: '180px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', marginBottom: '4px', display: 'block' }}>Start Time</label>
              <input 
                type="datetime-local" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)}
                style={{ width: '100%', padding: '7px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--panel-bg)', color: 'var(--text-h)' }}
              />
            </div>

            <div className="form-group" style={{ minWidth: '180px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', marginBottom: '4px', display: 'block' }}>End Time</label>
              <input 
                type="datetime-local" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)}
                style={{ width: '100%', padding: '7px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--panel-bg)', color: 'var(--text-h)' }}
              />
            </div>
          </>
        )}
      </div>

      <div style={{ width: '100%', height: '360px', position: 'relative' }}>
        {isLoading && data.length === 0 ? (
          <div className="empty-state" style={{ height: '100%' }}>Loading telemetry...</div>
        ) : error ? (
          <div className="empty-state" style={{ height: '100%', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}>{error}</div>
        ) : data.length === 0 ? (
          <div className="empty-state" style={{ height: '100%' }}>No telemetry found for this time range.</div>
        ) : (
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
                minTickGap={50} 
              />
              <YAxis 
                stroke="var(--accent)" 
                tickFormatter={(val) => `${val} ${getUnit()}`} 
                tick={{ fontSize: 12 }} 
                width={80} 
              />
              <Tooltip 
                labelFormatter={formatTime} 
                contentStyle={{ backgroundColor: 'var(--panel-bg)', borderColor: 'var(--border)', borderRadius: '8px', color: 'var(--text-h)' }} 
              />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px', color: 'var(--text)' }}/>
              {renderLines()}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

export default ParkDashboard
