import React, { useState, useEffect } from 'react'
import { FileText, Users, DollarSign, CheckCircle, Clock, AlertCircle, LogIn, LogOut, Shield, User, Plus, Edit, Trash2, Menu, X } from 'lucide-react'
import axios from 'axios'

// Use relative URLs - Vite proxy will handle HTTPS
const API_BASE_URL = '/api'

function App() {
  const [user, setUser] = useState(null)
  const [claims, setClaims] = useState([])
  const [allClaims, setAllClaims] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeView, setActiveView] = useState('my-claims') // 'my-claims', 'create-claim', 'all-claims', 'users'
  const [error, setError] = useState(null)
  const [showLogin, setShowLogin] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [editingClaim, setEditingClaim] = useState(null)
  const [viewingClaim, setViewingClaim] = useState(null)
  const [loginForm, setLoginForm] = useState({ username: '', password: '' })
  const [claimForm, setClaimForm] = useState({ title: '', description: '', amount: '', category: 'Other' })
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  })

  // Configure axios to send cookies
  axios.defaults.withCredentials = true

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      console.log('Checking authentication...')
      const response = await axios.get(`${API_BASE_URL}/me`)
      console.log('Auth response:', response.data)
      setUser(response.data.user)
      setActiveView('my-claims') // Set initial view
      fetchClaims()
    } catch (err) {
      console.log('No user logged in (this is normal)')
      setUser(null)
      setLoading(false)
      // Don't try to fetch claims if user is not authenticated
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    try {
      const response = await axios.post(`${API_BASE_URL}/login`, loginForm)
      setUser(response.data.user)
      setShowLogin(false)
      setLoginForm({ username: '', password: '' })
      setActiveView('my-claims') // Set default view after login
      fetchClaims()
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed')
    }
  }

  const handleLogout = async () => {
    try {
      await axios.post(`${API_BASE_URL}/logout`)
      setUser(null)
      setClaims([])
      setAllClaims([])
      setUsers([])
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

  const fetchClaims = async () => {
    try {
      setLoading(true)
      setError(null) // Clear any previous errors
      const response = await axios.get(`${API_BASE_URL}/claims`)
      setClaims(response.data)
      
      // Calculate stats
      const total = response.data.length
      const pending = response.data.filter(claim => claim.status === 'pending').length
      const approved = response.data.filter(claim => claim.status === 'approved').length
      const rejected = response.data.filter(claim => claim.status === 'rejected').length
      
      setStats({ total, pending, approved, rejected })
    } catch (err) {
      console.error('Error fetching claims:', err)
      if (err.response?.status === 401) {
        // Don't show error for 401 - user just needs to log in
        setUser(null) // Clear user if unauthorized
      } else {
        setError('Failed to fetch claims. Make sure the backend server is running.')
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchAllClaims = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/all-claims`)
      setAllClaims(response.data)
      setActiveView('all-claims')
    } catch (err) {
      setError('Failed to fetch all claims')
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/users`)
      setUsers(response.data)
      setActiveView('users')
    } catch (err) {
      setError('Failed to fetch users')
    }
  }

  const handleViewMyClaims = () => {
    setActiveView('my-claims')
    fetchClaims() // Refresh claims
  }

  const handleCreateClaim = () => {
    setActiveView('create-claim')
    setClaimForm({ title: '', description: '', amount: '', category: 'Other' })
  }

  const createClaim = async (e) => {
    e.preventDefault()
    try {
      await axios.post(`${API_BASE_URL}/claims`, claimForm)
      setClaimForm({ title: '', description: '', amount: '', category: 'Other' })
      setActiveView('my-claims') // Switch back to my claims view
      fetchClaims()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create claim')
    }
  }

  const updateClaim = async (e) => {
    e.preventDefault()
    try {
      await axios.put(`${API_BASE_URL}/claims/${editingClaim.id}`, claimForm)
      setEditingClaim(null)
      setClaimForm({ title: '', description: '', amount: '', category: 'Other' })
      fetchClaims()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update claim')
    }
  }

  const handleEditClaim = (claim) => {
    setEditingClaim(claim)
    // Pre-populate the form with existing claim values
    setClaimForm({
      title: claim.title || '',
      description: claim.description || '',
      amount: claim.amount || '',
      category: claim.category || 'Other'
    })
  }

  const deleteClaim = async (claimId) => {
    if (window.confirm('Are you sure you want to delete this claim?')) {
      try {
        await axios.delete(`${API_BASE_URL}/admin/claims/${claimId}`)
        fetchClaims()
        if (allClaims.length > 0) fetchAllClaims()
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to delete claim')
      }
    }
  }

  const getClaimById = async (claimId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/claims/${claimId}`)
      setViewingClaim(response.data)
    } catch (err) {
      setError('Failed to fetch claim details')
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4" />
      case 'pending':
        return <Clock className="w-4 h-4" />
      case 'rejected':
        return <AlertCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="loading">
        <div>Loading Claim Manager...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="App">
        <header className="header">
          <div className="container">
            <h1>Claim Manager</h1>
            <p>Security Workshop Application</p>
          </div>
        </header>

        <main className="main-content">
          <div className="container">
            <div className="card text-center">
              <h2>Welcome to Claim Manager</h2>
              <p className="mb-4">Please log in to access your claims</p>
              
              {!showLogin ? (
                <button 
                  onClick={() => setShowLogin(true)}
                  className="btn btn-primary"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Login
                </button>
              ) : (
                <form onSubmit={handleLogin} className="max-w-md mx-auto">
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Username</label>
                    <input
                      type="text"
                      value={loginForm.username}
                      onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded"
                      placeholder="Enter username"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Password</label>
                    <input
                      type="password"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded"
                      placeholder="Enter password"
                      required
                    />
                  </div>
                  <div className="flex space-x-2">
                    <button type="submit" className="btn btn-primary flex-1">
                      Login
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setShowLogin(false)}
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                  <div className="mt-4 text-sm text-gray-600">
                    <p><strong>Demo Accounts:</strong></p>
                    <p>Admin: admin / password123</p>
                    <p>Alice: alice / password123</p>
                    <p>Bob: bob / password123</p>
                  </div>
                </form>
              )}
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="App">
      <header className="header">
        <div className="container">
          <div className="flex justify-between items-center">
            <div>
              <h1>Claim Manager</h1>
              <p>Welcome back, {user.username}! ({user.role})</p>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="sidebar-toggle-btn"
                title="Toggle Sidebar"
                aria-label="Toggle Sidebar"
              >
                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              <button 
                onClick={handleLogout}
                className="btn btn-secondary"
              >
                <LogOut className="w-4 h-4 mr-1" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="app-layout">
        {/* Sidebar */}
        <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
          <nav className="sidebar-nav">
            <div className="sidebar-section">
              <h3 className="sidebar-section-title">Main</h3>
              <button 
                onClick={handleViewMyClaims}
                className={`sidebar-item ${activeView === 'my-claims' ? 'active' : ''}`}
              >
                <FileText className="w-5 h-5" />
                <span>View My Claims</span>
              </button>
              <button 
                onClick={handleCreateClaim}
                className={`sidebar-item ${activeView === 'create-claim' ? 'active' : ''}`}
              >
                <Plus className="w-5 h-5" />
                <span>Create New Claim</span>
              </button>
            </div>

            {user.role === 'admin' && (
              <div className="sidebar-section">
                <h3 className="sidebar-section-title">Admin</h3>
                <button 
                  onClick={fetchAllClaims}
                  className={`sidebar-item ${activeView === 'all-claims' ? 'active' : ''}`}
                >
                  <Shield className="w-5 h-5" />
                  <span>View All Claims</span>
                </button>
                <button 
                  onClick={fetchUsers}
                  className={`sidebar-item ${activeView === 'users' ? 'active' : ''}`}
                >
                  <Users className="w-5 h-5" />
                  <span>View Users</span>
                </button>
              </div>
            )}
          </nav>
        </aside>

        {/* Main Content */}
        <main className={`main-content ${sidebarOpen ? 'main-with-sidebar' : 'main-full'}`}>
          <div className="container">
          {error && (
            <div className="error">
              {error}
              <button onClick={() => setError(null)} className="ml-2 text-sm underline">Dismiss</button>
            </div>
          )}

          {/* Conditional Content Based on Active View */}
          {activeView === 'my-claims' && (
            <>
              {/* Stats Cards */}
              <div className="grid grid-3 mb-4">
                <div className="card">
                  <div className="flex items-center mb-2">
                    <FileText className="w-6 h-6 text-blue-600 mr-2" />
                    <h3>My Claims</h3>
                  </div>
                  <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
                </div>

                <div className="card">
                  <div className="flex items-center mb-2">
                    <Clock className="w-6 h-6 text-yellow-600 mr-2" />
                    <h3>Pending</h3>
                  </div>
                  <div className="text-3xl font-bold text-yellow-600">{stats.pending}</div>
                </div>

                <div className="card">
                  <div className="flex items-center mb-2">
                    <CheckCircle className="w-6 h-6 text-green-600 mr-2" />
                    <h3>Approved</h3>
                  </div>
                  <div className="text-3xl font-bold text-green-600">{stats.approved}</div>
                </div>
              </div>

              {/* Claims List */}
              <div className="card">
                <h2 className="text-xl font-semibold mb-6">My Claims</h2>
            {claims.length === 0 ? (
              <div className="empty-state">
                <FileText className="empty-state-icon" />
                <h3>No claims found</h3>
                <p>Create your first claim to get started!</p>
              </div>
            ) : (
              <div className="claims-grid">
                {claims.map((claim) => (
                  <div key={claim.id} className={`claim-card ${claim.status}`}>
                    {/* Header */}
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="claim-title">{claim.title}</h3>
                      <span className={`status-badge ${claim.status}`}>
                        {getStatusIcon(claim.status)}
                        <span className="ml-1">{claim.status}</span>
                      </span>
                    </div>
                    
                    {/* Description */}
                    {claim.description && (
                      <div 
                        className="claim-description"
                        dangerouslySetInnerHTML={{ __html: claim.description }}
                      />
                    )}
                    
                    {/* Amount */}
                    <div className="claim-amount">
                      {formatCurrency(claim.amount)}
                    </div>
                    
                    {/* Category and Owner */}
                    <div className="claim-tags">
                      {claim.category && (
                        <span className="claim-tag category">
                          {claim.category}
                        </span>
                      )}
                      {claim.owner_name && (
                        <span className="claim-tag owner">
                          {claim.owner_name}
                        </span>
                      )}
                    </div>
                    
                    {/* Date */}
                    <div className="claim-date">
                      Created {formatDate(claim.created_at)}
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="claim-actions">
                      <div className="flex">
                        <button 
                          onClick={() => getClaimById(claim.id)}
                          className="claim-action-btn view"
                          title="View Details"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleEditClaim(claim)}
                          className="claim-action-btn edit"
                          title="Edit Claim"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => deleteClaim(claim.id)}
                          className="claim-action-btn delete"
                          title="Delete Claim"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
              </div>
            </>
          )}

          {/* Create Claim View */}
          {activeView === 'create-claim' && (
            <div className="card">
              <h2 className="text-xl font-semibold mb-6">Create New Claim</h2>
              <form onSubmit={createClaim}>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Title</label>
                  <input
                    type="text"
                    value={claimForm.title}
                    onChange={(e) => setClaimForm({...claimForm, title: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded"
                    placeholder="Enter claim title"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={claimForm.description}
                    onChange={(e) => setClaimForm({...claimForm, description: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded"
                    placeholder="Enter claim description"
                    rows="3"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    value={claimForm.amount}
                    onChange={(e) => setClaimForm({...claimForm, amount: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded"
                    placeholder="Enter amount"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <select
                    value={claimForm.category}
                    onChange={(e) => setClaimForm({...claimForm, category: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded"
                  >
                    <option value="Other">Other</option>
                    <option value="Travel">Travel</option>
                    <option value="Meals">Meals</option>
                    <option value="Office Supplies">Office Supplies</option>
                    <option value="Training">Training</option>
                  </select>
                </div>
                <div className="flex space-x-2">
                  <button type="submit" className="btn btn-primary">Create Claim</button>
                  <button type="button" onClick={handleViewMyClaims} className="btn btn-secondary">Cancel</button>
                </div>
              </form>
            </div>
          )}

          {/* Admin Panel - All Claims */}
          {activeView === 'all-claims' && (
            <div className="card">
              {allClaims.length === 0 ? (
                <div className="empty-state">
                  <FileText className="empty-state-icon" />
                  <h3>No claims found</h3>
                  <p>Click "View All Claims" to load all claims</p>
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-semibold mb-6">All Claims</h2>
                  <div className="claims-grid">
                    {allClaims.map((claim) => (
                      <div key={claim.id} className={`claim-card ${claim.status}`}>
                        {/* Header */}
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="claim-title">{claim.title}</h3>
                          <span className={`status-badge ${claim.status}`}>
                            {getStatusIcon(claim.status)}
                            <span className="ml-1">{claim.status}</span>
                          </span>
                        </div>
                        
                        {/* Description */}
                        {claim.description && (
                          <div 
                            className="claim-description"
                            dangerouslySetInnerHTML={{ __html: claim.description }}
                          />
                        )}
                        
                        {/* Amount */}
                        <div className="claim-amount">
                          {formatCurrency(claim.amount)}
                        </div>
                        
                        {/* Category and Owner */}
                        <div className="claim-tags">
                          {claim.category && (
                            <span className="claim-tag category">
                              {claim.category}
                            </span>
                          )}
                          {claim.owner_name && (
                            <span className="claim-tag owner">
                              {claim.owner_name}
                            </span>
                          )}
                        </div>
                        
                        {/* Date */}
                        <div className="claim-date">
                          Created {formatDate(claim.created_at)}
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="claim-actions">
                          <div className="flex">
                            <button 
                              onClick={() => getClaimById(claim.id)}
                              className="claim-action-btn view"
                              title="View Details"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => setEditingClaim(claim)}
                              className="claim-action-btn edit"
                              title="Edit Claim"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => deleteClaim(claim.id)}
                              className="claim-action-btn delete"
                              title="Delete Claim"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Users List */}
          {activeView === 'users' && (
            <div className="card">
              {users.length === 0 ? (
                <div className="empty-state">
                  <Users className="empty-state-icon" />
                  <h3>No users found</h3>
                  <p>Click "View Users" to load users</p>
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-semibold mb-6">All Users</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {users.map((u) => (
                      <div key={u.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200 hover:border-gray-300">
                        <div className="flex items-center mb-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                            {u.username.charAt(0).toUpperCase()}
                          </div>
                          <div className="ml-4">
                            <h3 className="text-lg font-semibold text-gray-900">{u.username}</h3>
                            <p className="text-sm text-gray-600">{u.email}</p>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className={`status-badge ${u.role === 'admin' ? 'status-approved' : 'status-pending'}`}>
                            {u.role === 'admin' ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4" />}
                            <span className="ml-1">{u.role}</span>
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDate(u.created_at)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}


          {/* Edit Claim Modal (Create is now a view) */}
          {editingClaim && (
            <div className="modal-overlay">
              <div className="modal-content">
                <div className="modal-header">
                  <h2 className="modal-title">Edit Claim</h2>
                  <button 
                    onClick={() => {
                      setEditingClaim(null)
                      setClaimForm({ title: '', description: '', amount: '', category: 'Other' })
                    }}
                    className="modal-close"
                  >
                    ×
                  </button>
                </div>
                <div className="modal-body">
                  <form onSubmit={updateClaim}>
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-2">Title</label>
                      <input
                        type="text"
                        value={claimForm.title}
                        onChange={(e) => setClaimForm({...claimForm, title: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded"
                        placeholder="Enter claim title"
                        required
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-2">Description</label>
                      <textarea
                        value={claimForm.description}
                        onChange={(e) => setClaimForm({...claimForm, description: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded"
                        placeholder="Enter claim description"
                        rows="3"
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-2">Amount</label>
                      <input
                        type="number"
                        step="0.01"
                        value={claimForm.amount}
                        onChange={(e) => setClaimForm({...claimForm, amount: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded"
                        placeholder="Enter amount"
                        required
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-2">Category</label>
                      <select
                        value={claimForm.category}
                        onChange={(e) => setClaimForm({...claimForm, category: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded"
                      >
                        <option value="Travel">Travel</option>
                        <option value="Meals">Meals</option>
                        <option value="Office Supplies">Office Supplies</option>
                        <option value="Training">Training</option>
                        <option value="shared">Shared</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="modal-footer">
                      <button 
                        type="button" 
                        onClick={() => {
                          setEditingClaim(null)
                          setClaimForm({ title: '', description: '', amount: '', category: 'Other' })
                        }}
                        className="btn btn-secondary"
                      >
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-primary">
                        Update Claim
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* View Claim Details Modal */}
          {viewingClaim && (
            <div className="modal-overlay">
              <div className="modal-content">
                <div className="modal-header">
                  <h2 className="modal-title">Claim Details</h2>
                  <button 
                    onClick={() => setViewingClaim(null)}
                    className="modal-close"
                  >
                    ×
                  </button>
                </div>
                
                <div className="modal-body">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Title</label>
                      <p className="text-lg font-semibold">{viewingClaim.title}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Description</label>
                      <div 
                        className="p-3 bg-gray-50 rounded border min-h-[60px]"
                        dangerouslySetInnerHTML={{ __html: viewingClaim.description || 'No description provided' }}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Amount</label>
                        <p className="text-xl font-bold text-green-600">
                          {formatCurrency(viewingClaim.amount)}
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Status</label>
                        <span className={`status-badge ${viewingClaim.status}`}>
                          {getStatusIcon(viewingClaim.status)}
                          <span className="ml-1">{viewingClaim.status}</span>
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Category</label>
                        <span className="bg-gray-100 px-3 py-1 rounded-full text-sm">
                          {viewingClaim.category}
                        </span>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Owner</label>
                        <p className="text-sm">{viewingClaim.owner_name}</p>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Created</label>
                      <p className="text-sm text-gray-600">{formatDate(viewingClaim.created_at)}</p>
                    </div>
                    
                    {viewingClaim.updated_at !== viewingClaim.created_at && (
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Last Updated</label>
                        <p className="text-sm text-gray-600">{formatDate(viewingClaim.updated_at)}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="modal-footer">
                  <button 
                    onClick={() => setViewingClaim(null)}
                    className="btn btn-secondary"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
          </div>
        </main>
      </div>
    </div>
  )
}

export default App
