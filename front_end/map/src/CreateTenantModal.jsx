import { useState } from 'react'
import { API_BASE_URL } from './App'

const CreateTenantModal = ({ isOpen, onClose, parks = [] }) => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [parkId, setParkId] = useState('')
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    
    if (username.trim() && password.trim() && parkId) {
      setIsLoading(true)
      
      try {
        const token = localStorage.getItem('auth_token')
        const response = await fetch(`${API_BASE_URL}/admin/tenants`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ username, password, parkId })
        })

        if (!response.ok) {
          throw new Error('Failed to create user. Please verify permissions and data.')
        }

        setSuccess(true)
        setUsername('')
        setPassword('')
        setParkId('')
        
        // Auto-close the modal after a short delay on success
        setTimeout(() => {
          setSuccess(false)
          onClose()
        }, 1500)

      } catch (err) {
        console.error('Creation failed:', err)
        setError(err.message || 'An error occurred during user creation.')
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleClose = () => {
    setError(null)
    setSuccess(false)
    onClose()
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content panel">
        <div className="modal-header">
          <h2>Create Tenant User</h2>
          <p className="subtitle">Provision access for a specific wind park</p>
        </div>
        
        <form className="sign-in-form" onSubmit={handleSubmit}>
          {error && (
            <div style={{ color: '#ef4444', fontSize: '13px', background: 'rgba(239, 68, 68, 0.1)', padding: '8px', borderRadius: '4px' }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{ color: '#10b981', fontSize: '13px', background: 'rgba(16, 185, 129, 0.1)', padding: '8px', borderRadius: '4px' }}>
              Tenant user created successfully!
            </div>
          )}

          <div className="form-group">
            <label htmlFor="new-username">Username</label>
            <input 
              id="new-username"
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g., tenant_alpha"
              required
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="new-password">Password</label>
            <input 
              id="new-password"
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter a secure password"
              required
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="new-parkId">Assigned Park</label>
            <select 
              id="new-parkId"
              value={parkId}
              onChange={(e) => setParkId(e.target.value)}
              required
              disabled={isLoading}
              style={{
                padding: '10px',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                background: 'var(--bg)',
                color: 'var(--text-h)',
                fontFamily: 'var(--sans)',
                fontSize: '13px',
                outline: 'none',
                width: '100%',
                boxSizing: 'border-box',
                cursor: 'pointer'
              }}
            >
              <option value="" disabled>-- Select a Park --</option>
              {parks.map((park) => (
                <option key={park.id} value={park.id}>
                  {park.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={handleClose} disabled={isLoading}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateTenantModal