import { useState } from 'react'

const ReportExporter = () => {
  const [isGenerating, setIsGenerating] = useState(false)

  const handleDownload = () => {
    setIsGenerating(true)
    // Mock a network delay for generating the PDF/CSV
    setTimeout(() => {
      setIsGenerating(false)
      alert("TSO_Operational_Report_0900.pdf downloaded! (Mocked)")
    }, 1500)
  }

  return (
    <div className="chart-wrapper" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <h2 style={{ margin: '0 0 8px 0' }}>TSO Operational Report</h2>
        <p style={{ color: 'var(--text)', fontSize: '14px' }}>
          Generate the daily 09:00 report (Production by type, parks, availability, and turbine status).
        </p>
      </div>
      <button 
        onClick={handleDownload}
        disabled={isGenerating}
        style={{
          backgroundColor: 'var(--accent)',
          color: '#fff',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '6px',
          cursor: isGenerating ? 'not-allowed' : 'pointer',
          fontWeight: 'bold',
          opacity: isGenerating ? 0.7 : 1
        }}
      >
        {isGenerating ? 'Compiling Data...' : 'Download TSO Report'}
      </button>
    </div>
  )
}

export default ReportExporter