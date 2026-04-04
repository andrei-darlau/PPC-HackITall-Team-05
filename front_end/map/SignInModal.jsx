import { useState } from 'react';

const SignInModal = ({ isOpen, onClose, onSignIn }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username && password) {
      // Mock permission assignment: 'admin' gets admin rights, others are viewers
      const role = username.toLowerCase() === 'admin' ? 'admin' : 'viewer';
      onSignIn({ username, role });
      onClose();
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content panel">
        <div className="modal-header">
          <h2>Authentication Required</h2>
          <p className="subtitle">Sign in to access restricted actions.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="sign-in-form">
          <div className="form-group">
            <label>Username (Hint: use 'admin' for full access)</label>
            <input 
              type="text" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              required 
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Sign In</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignInModal;