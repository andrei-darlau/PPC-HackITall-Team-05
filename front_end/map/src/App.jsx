import { useState, useEffect, useCallback } from 'react'
import Map from './Map'
import LiveChart from './LiveChart'
import ParkDashboard from './ParkDashboard'
import ReportExporter from './ReportExporter'
import SignInModal from './SignInModal' 
import CreateTenantModal from './CreateTenantModal'
import FaultySensorsTerminal from './FaultySensorsTerminal'
import './App.css'

export const API_BASE_URL = 'http://10.200.22.157:6767/api/v1'

export const parseJwt = (token) => {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    }).join(''))
    return JSON.parse(jsonPayload)
  } catch (e) {
    return null
  }
}

function App() {
  const [parks, setParks] = useState([])
  const [selectedPark, setSelectedPark] = useState(null)
  
  // --- Turbine & Park State ---
  const [selectedTurbine, setSelectedTurbine] = useState(null)
  const [parkTurbines, setParkTurbines] = useState([])
  const [parkRadius, setParkRadius] = useState(null)
  
  // --- New state for faulty sensor data ---
  const [parkFaults, setParkFaults] = useState({})
  
  const [user, setUser] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false)

  const handleSignOut = useCallback(() => {
    setUser(null)
    setSelectedPark(null)
    setSelectedTurbine(null)
    localStorage.removeItem('auth_token')
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    if (token && !user) {
      const decoded = parseJwt(token)
      if (decoded) {
        setUser({ username: decoded.sub || 'Operator', role: decoded.role })
      } else {
        handleSignOut()
      }
    }
  }, [user, handleSignOut])

  const fetchWithAuth = useCallback(async (url, options = {}) => {
    const token = localStorage.getItem('auth_token');
    
    const headers = {
      ...options.headers,
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
    
    const response = await fetch(url, { ...options, headers });
    
    if (response.status === 401 || response.status === 403) {
      handleSignOut();
      throw new Error('Session expired or unauthorized');
    }
    
    return response;
  }, [handleSignOut]);

  useEffect(() => {
    fetchWithAuth(`${API_BASE_URL}/parks/locations`)
      .then((res) => res.json())
      .then((data) => {
        const formattedParks = data.map((p) => ({
          ...p,
          id: p.parkId,
          name: p.parkId, 
          position: [p.averageLat, p.averageLong], 
        }))
        setParks(formattedParks)
      })
      .catch((err) => console.error('Failed to fetch parks:', err))
  }, [fetchWithAuth])

  useEffect(() => {
    if (selectedPark) {
      fetchWithAuth(`${API_BASE_URL}/parks/${selectedPark.id}/turbines`)
        .then((res) => res.json())
        .then((data) => setParkTurbines(data))
        .catch((err) => console.error('Failed to fetch turbines:', err))

      fetchWithAuth(`${API_BASE_URL}/parks/${selectedPark.id}/radius`)
        .then((res) => res.json())
        .then((data) => setParkRadius(data))
        .catch((err) => {
          console.error('Failed to fetch radius:', err)
          setParkRadius(null)
        })

      // Fetch faulty sensors for the last 24 hours
      fetchWithAuth(`${API_BASE_URL}/analytics/parks/${selectedPark.id}/faulty-sensors?hoursBack=24`)
        .then((res) => res.json())
        .then((data) => setParkFaults(data))
        .catch((err) => {
          console.error('Failed to fetch faults:', err)
          setParkFaults({}) 
        })
    } else {
      setParkTurbines([])
      setParkRadius(null)
      setParkFaults({})
    }
  }, [selectedPark, fetchWithAuth])

  const handleSelectFarm = async (farm) => {
    const token = localStorage.getItem('auth_token');
    if (!token) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/parks/${farm.id}/turbines`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setSelectedPark(farm);
        setSelectedTurbine(null); // Reset turbine view if changing parks
        return true; 
      } else if (response.status === 403 || response.status === 401) {
        return false; 
      }
    } catch (err) {
      console.error('Failed to verify access:', err);
      return false;
    }
    return false;
  };

  const handleDropdownChange = async (e) => {
    const parkId = e.target.value;
    
    if (!parkId) {
      setSelectedPark(null);
      setSelectedTurbine(null);
      return;
    }

    const farm = parks.find((p) => String(p.id) === String(parkId));
    if (farm) {
      if (!user) {
        alert("Sign in to interact.");
        return;
      }
      
      const hasAccess = await handleSelectFarm(farm);
      if (!hasAccess) {
        alert(`Access Restricted. Server denied access to ${farm.name}.`);
      }
    }
  };

  return (
    <div className="dashboard-container">
      <SignInModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSignIn={setUser} />
      <CreateTenantModal isOpen={isCreateUserModalOpen} onClose={() => setIsCreateUserModalOpen(false)} parks={parks} />

      <header className="header-row">
        <div>
          <h1>Wind Energy Command Center</h1>
          <p className="subtitle">Real-time telemetry and operational status</p>
        </div>
        
        <div className="header-actions">
          {user?.role === 'ROLE_ADMIN' && (
            <button className="btn-secondary" onClick={() => setIsCreateUserModalOpen(true)} style={{ marginRight: '8px' }}>
              + Create User
            </button>
          )}

          {user ? (
            <div className="user-badge">
              <span>{user.username}</span>
              <span className="user-role">{user.role}</span>
              <button onClick={handleSignOut} style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', marginLeft: '4px' }} title="Sign Out">✕</button>
            </div>
          ) : (
            <button className="btn-secondary" onClick={() => setIsModalOpen(true)}>Sign In</button>
          )}

          <ReportExporter user={user} onRequestAuth={() => setIsModalOpen(true)} />
        </div>
      </header>
      
      <div className="main-grid" style={!user ? { gridTemplateColumns: '1fr 2fr' } : {}}>
        <div className="panel map-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ marginBottom: 0 }}>Geospatial Overview</h2>
            
            <select 
              value={selectedPark?.id || ""}
              onChange={handleDropdownChange}
              style={{
                padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)',
                background: 'var(--bg)', color: 'var(--text-h)', fontFamily: 'var(--sans)',
                fontSize: '13px', outline: 'none', cursor: 'pointer'
              }}
            >
              <option value="">-- Select a Park --</option>
              {parks.map(park => (
                <option key={park.id} value={park.id}>{park.name}</option>
              ))}
            </select>
          </div>

          <Map 
            farms={parks} 
            onSelectFarm={handleSelectFarm} 
            selectedPark={selectedPark} 
            radius={parkRadius} 
            turbines={parkTurbines}
            user={user} 
            selectedTurbine={selectedTurbine}
            onSelectTurbine={setSelectedTurbine}
            parkFaults={parkFaults}
          />
        </div>

        {user && (
          <div className="panel turbine-panel">
            <h2>{selectedPark ? `${selectedPark.name} Turbines` : 'Park Details'}</h2>
            {selectedPark ? (
              <div className="turbine-list">
                {parkTurbines.map((turbine) => {
                  const isSelected = selectedTurbine?.id === turbine.id;
                  
                  return (
                    <div 
                      key={turbine.id} 
                      className="turbine-list-item"
                      onClick={() => setSelectedTurbine(turbine)}
                      style={{ 
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        borderColor: isSelected ? 'var(--accent)' : 'var(--border)',
                        background: isSelected ? 'var(--accent-bg)' : 'var(--bg)'
                      }}
                    >
                      <strong style={{ color: isSelected ? 'var(--accent)' : 'var(--text-h)' }}>
                        {turbine.id}
                      </strong>
                      <span className="turbine-model">Model: {turbine.wtgModelId}</span>
                    </div>
                  )
                })}
              </div>
            ) : (
               <div className="empty-state" style={{ height: '400px' }}>
                  Select a park to view its turbines.
               </div>
            )}
          </div>
        )}
        
        <div className="panel chart-panel">
          {user && selectedPark ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ margin: 0 }}>
                  {selectedTurbine ? `${selectedTurbine.id} Analytics` : `${selectedPark.name} Average Analytics`}
                </h2>
                
                {selectedTurbine && (
                  <button 
                    className="btn-secondary" 
                    onClick={() => setSelectedTurbine(null)}
                    style={{ fontSize: '11px', padding: '4px 8px' }}
                  >
                    ← View Park Average
                  </button>
                )}
              </div>
              
              <ParkDashboard 
                key={selectedTurbine ? selectedTurbine.id : selectedPark.id}
                selectedPark={selectedPark} 
                selectedTurbine={selectedTurbine} 
              />
            </>
          ) : (
            <>
              <h2>Global Telemetry Overview</h2>
              <LiveChart />
            </>
          )}
        </div>
      </div>

      <FaultySensorsTerminal user={user} parks={parks} />

    </div>
  )
}

export default App
