import { useState } from 'react'
import { API_BASE_URL } from './App'

const ReportExporter = ({ user, onRequestAuth }) => {
  const [isGenerating, setIsGenerating] = useState(false)
  // Default to today's date formatted as YYYY-MM-DD
  const [reportDate, setReportDate] = useState(() => new Date().toISOString().split('T')[0])

  const handleDownload = async () => {
    // 1. Check if user is logged in
    if (!user) {
      onRequestAuth();
      return;
    }

    // 2. Permission Check: Only 'ROLE_ADMIN' can export reports
    if (user.role !== 'ROLE_ADMIN') {
      alert("Permission Denied: You do not have sufficient privileges to export TSO reports. Contact an administrator.");
      return;
    }

    // 3. Execute Action
    setIsGenerating(true)
    
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`${API_BASE_URL}/reports/tso?date=${reportDate}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`)
      }

      // Read the file data directly as a Blob instead of text
      const blob = await response.blob()
      
      // Create a local object URL for the Blob
      const downloadUrl = window.URL.createObjectURL(blob)
      
      // Create a hidden anchor tag to trigger the file download
      const link = document.createElement('a')
      link.href = downloadUrl
      
      // The 'download' attribute forces a download instead of a navigation.
      // Adjust the file extension (.csv, .xlsx, .pdf) to match what your API actually generates!
      link.setAttribute('download', `TSO_Report_${reportDate}.csv`) 
      
      document.body.appendChild(link)
      link.click()
      
      // Clean up the DOM and release the object URL from memory
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)

    } catch (error) {
      console.error("Export failed:", error)
      alert("An error occurred while generating the report: " + error.message)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      
      {user?.role === 'ROLE_ADMIN' && (
        <input 
          type="date" 
          value={reportDate}
          onChange={(e) => setReportDate(e.target.value)}
          disabled={isGenerating}
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid var(--border)',
            background: 'var(--panel-bg)',
            color: 'var(--text-h)',
            fontFamily: 'var(--sans)',
            fontSize: '13px',
            outline: 'none',
            cursor: isGenerating ? 'not-allowed' : 'pointer'
          }}
          title="Select report date"
        />
      )}

      <button 
        onClick={handleDownload}
        disabled={isGenerating}
        style={{
          backgroundColor: isGenerating ? 'var(--border)' : 'var(--accent)',
          color: isGenerating ? 'var(--text)' : '#fff',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '6px',
          cursor: isGenerating ? 'not-allowed' : 'pointer',
          fontWeight: '600',
          fontSize: '14px',
          transition: 'all 0.2s',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        {!user && <span style={{ fontSize: '12px' }}>🔒</span>}
        {isGenerating ? 'Compiling Data...' : 'Export TSO Report'}
      </button>
    </div>
  )
}

export default ReportExporter