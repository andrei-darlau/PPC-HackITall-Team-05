import { useState } from 'react'

const ReportExporter = () => {
  const [isGenerating, setIsGenerating] = useState(false)

  const handleDownload = () => {
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
          backgroundColor: 'var(--accent)',
          color: '#fff',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '6px',
          cursor: isGenerating ? 'not-allowed' : 'pointer',
          fontWeight: '600',
          fontSize: '14px',
          opacity: isGenerating ? 0.7 : 1,
          transition: 'opacity 0.2s'
        }}
      >
        {isGenerating ? 'Compiling Data...' : 'Export TSO Report'}
      </button>
    </div>
  )
}

export default ReportExporter