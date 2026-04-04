import { useState, useEffect } from 'react'

const mockJobs = [
  { id: 'JOB-101', name: 'S3 Data Ingestion (15m)', status: 'SUCCESS', time: '14:00', duration: '12s' },
  { id: 'JOB-102', name: 'Data Quality Check', status: 'SUCCESS', time: '14:00', duration: '4s' },
  { id: 'JOB-103', name: 'External Meteo Sync', status: 'FAILED', time: '14:15', duration: '45s' },
  { id: 'JOB-104', name: 'S3 Data Ingestion (15m)', status: 'RUNNING', time: '14:15', duration: '...' },
]

const PipelineMonitor = () => {
  const [jobs, setJobs] = useState([])

  useEffect(() => {
    // Mocking the data load. Later: fetch('http://YOUR_BACKEND/api/jobs')
    setJobs(mockJobs)
  }, [])

  return (
    <div className="chart-wrapper">
      <h2>Pipeline & Job Execution</h2>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text)' }}>
              <th style={{ padding: '8px' }}>Job ID</th>
              <th style={{ padding: '8px' }}>Pipeline Name</th>
              <th style={{ padding: '8px' }}>Time</th>
              <th style={{ padding: '8px' }}>Duration</th>
              <th style={{ padding: '8px' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={job.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '12px 8px', fontFamily: 'monospace' }}>{job.id}</td>
                <td style={{ padding: '12px 8px' }}>{job.name}</td>
                <td style={{ padding: '12px 8px' }}>{job.time}</td>
                <td style={{ padding: '12px 8px' }}>{job.duration}</td>
                <td style={{ padding: '12px 8px' }}>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    backgroundColor: job.status === 'SUCCESS' ? 'rgba(74, 246, 38, 0.1)' : 
                                     job.status === 'FAILED' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(234, 179, 8, 0.1)',
                    color: job.status === 'SUCCESS' ? '#4af626' : 
                           job.status === 'FAILED' ? '#ef4444' : '#eab308'
                  }}>
                    {job.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default PipelineMonitor