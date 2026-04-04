import { useState, useEffect } from 'react'

const mockJobs = [
  { id: 'JOB-101', name: 'S3 Data Ingestion', status: 'SUCCESS', time: '14:00', duration: '12s' },
  { id: 'JOB-102', name: 'Data Quality Check', status: 'SUCCESS', time: '14:00', duration: '4s' },
  { id: 'JOB-103', name: 'External Meteo Sync', status: 'FAILED', time: '14:15', duration: '45s' },
  { id: 'JOB-104', name: 'S3 Data Ingestion', status: 'RUNNING', time: '14:15', duration: '...' },
]

const PipelineMonitor = () => {
  const [jobs, setJobs] = useState([])

  useEffect(() => {
    setJobs(mockJobs)
  }, [])

  return (
    <div style={{ height: '300px', overflowY: 'auto' }}>
      <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '13px' }}>
        <thead style={{ position: 'sticky', top: 0, backgroundColor: 'var(--panel-bg)', zIndex: 1 }}>
          <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text)' }}>
            <th style={{ padding: '10px 8px', fontWeight: '500' }}>Job ID</th>
            <th style={{ padding: '10px 8px', fontWeight: '500' }}>Pipeline</th>
            <th style={{ padding: '10px 8px', fontWeight: '500' }}>Time</th>
            <th style={{ padding: '10px 8px', fontWeight: '500' }}>Dur</th>
            <th style={{ padding: '10px 8px', fontWeight: '500' }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr key={job.id} style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '12px 8px', fontFamily: 'var(--mono)', color: 'var(--text-h)' }}>{job.id}</td>
              <td style={{ padding: '12px 8px' }}>{job.name}</td>
              <td style={{ padding: '12px 8px' }}>{job.time}</td>
              <td style={{ padding: '12px 8px' }}>{job.duration}</td>
              <td style={{ padding: '12px 8px' }}>
                <span style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: '600',
                  letterSpacing: '0.5px',
                  backgroundColor: job.status === 'SUCCESS' ? 'rgba(16, 185, 129, 0.1)' : 
                                   job.status === 'FAILED' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(234, 179, 8, 0.1)',
                  color: job.status === 'SUCCESS' ? '#10b981' : 
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
  )
}

export default PipelineMonitor