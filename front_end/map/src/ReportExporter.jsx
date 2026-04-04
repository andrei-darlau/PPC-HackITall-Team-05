import { useState } from 'react'

const ReportExporter = ({ user, onRequestAuth }) => {
  const [isGenerating, setIsGenerating] = useState(false)

  const handleDownload = () => {
    // 1. Check if user is logged in
    if (!user) {
      onRequestAuth();
      return;
    }

    // 2. Permission Check: Only 'admin' roles can export reports
    if (user.role !== 'admin') {
      alert("Permission Denied: You do not have sufficient privileges to export TSO reports. Contact an administrator.");
      return;
    }

    // 3. Execute Action
    setIsGenerating(true)
    setTimeout(() => {
      setIsGenerating(false)
      alert("TSO_Operational_Report_0900.pdf downloaded!")
    }, 1500)
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
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
        {/* Visual indicator that this is a locked feature if not logged in */}
        {!user && <span style={{ fontSize: '12px' }}>🔒</span>}
        {isGenerating ? 'Compiling Data...' : 'Export TSO Report'}
      </button>
    </div>
  )
}

export default ReportExporter