import { useState } from 'react'

const SignInModal = ({ isOpen, onClose, onSignIn }) => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Simple validation to ensure both fields have text
    if (username.trim() && password.trim()) {
      // Fake a user object with an admin role
      onSignIn({ 
        username: username, 
        role: 'admin' 
      })
      
      // Clear the form and close the modal
      setUsername('')
      setPassword('')
      onClose()
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
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input 
              id="username"
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g., operator_01"
              autoFocus
            />
          </div>

          {/* New Password Field */}
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input 
              id="password"
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
            />
          </div>
          
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Sign In
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default SignInModal