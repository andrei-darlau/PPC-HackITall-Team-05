import { useState } from 'react'
import { API_BASE_URL, parseJwt } from './App'

const SignInModal = ({ isOpen, onClose, onSignIn }) => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    
    if (username.trim() && password.trim()) {
      setIsLoading(true)
      
      try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, password })
        })

        if (!response.ok) {
          throw new Error('Invalid credentials or server error.')
        }

        const token = await response.text()
        localStorage.setItem('auth_token', token)
        
        // Decode the JWT to determine if they are an admin or a specific tenant
        const decoded = parseJwt(token) || {}
        
        onSignIn({ 
          username: decoded.sub || username, 
          // Replaced the admin fallback with strictly what the token provides
          role: decoded.role 
        })
        
        setUsername('')
        setPassword('')
        onClose()
      } catch (err) {
        console.error('Login failed:', err)
        setError('Authentication failed. Please check your credentials.')
      } finally {
        setIsLoading(false)
      }
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content panel">
        <div className="modal-header">
          <h2>Sign In</h2>
          <p className="subtitle">Enter your credentials to continue</p>
        </div>
        
        <form className="sign-in-form" onSubmit={handleSubmit}>
          {error && (
            <div style={{ color: '#ef4444', fontSize: '13px', background: 'rgba(239, 68, 68, 0.1)', padding: '8px', borderRadius: '4px' }}>
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input 
              id="username"
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g., admin or park_manager"
              autoFocus
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input 
              id="password"
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              disabled={isLoading}
            />
          </div>
          
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={isLoading}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default SignInModal