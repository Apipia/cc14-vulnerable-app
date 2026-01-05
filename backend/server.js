const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cookieParser = require('cookie-parser');
const https = require('https');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

// Database setup
const dbPath = path.join(__dirname, '../database/claim_manager.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
  }
});

// JWT Secret (insecure for workshop purposes)
const JWT_SECRET = 'insecure-workshop-secret-key';

// Middleware
app.use(cors({
  origin: true, // Allow all origins for development
  credentials: true // Allow cookies
}));
// Support both JSON and form-encoded requests (for CSRF demonstration)
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse form-encoded bodies
app.use(cookieParser());

// Authentication middleware (intentionally weak for workshop)
const authenticateToken = (req, res, next) => {
  const token = req.cookies.authToken;
  
  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token.' });
  }
};

// Admin check middleware (intentionally broken for workshop)
const requireAdmin = (req, res, next) => {
  // BROKEN: This should check req.user.role === 'admin' but doesn't
  // This allows any authenticated user to access admin functions
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next(); // Always allow if authenticated - BROKEN ACCESS CONTROL
};

// Basic route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Claim Manager API is running!',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api/*'
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: 'SQLite',
    uptime: process.uptime()
  });
});

// API routes
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working correctly!' });
});

// Authentication endpoints
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // For workshop purposes, we'll use a simple password check
    // In real app, you'd use bcrypt.compare(password, user.password_hash)
    if (password !== 'password123') {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // VULNERABLE: Cookie without HttpOnly flag for XSS exploitation
    // VULNERABLE: SameSite=None for CSRF exploitation (requires HTTPS)
    const useHttps = fs.existsSync(path.join(__dirname, 'certs/server.crt'));
    res.cookie('authToken', token, {
      httpOnly: false, // VULNERABLE: Should be true
      secure: useHttps,   // Required for SameSite=None, false for HTTP
      sameSite: useHttps ? 'none' : 'lax', // VULNERABLE: Allows CSRF attacks
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    res.json({ 
      message: 'Login successful',
      user: { id: user.id, username: user.username, role: user.role }
    });
  });
});

app.post('/api/logout', (req, res) => {
  res.clearCookie('authToken');
  res.json({ message: 'Logged out successfully' });
});

app.get('/api/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// Claims endpoints with vulnerabilities
app.get('/api/claims', authenticateToken, (req, res) => {
  // Show user's own claims and shared claims
  const query = `
    SELECT c.*, u.username as owner_name 
    FROM claims c 
    LEFT JOIN users u ON c.user_id = u.id 
    WHERE c.user_id = ? OR c.category = 'shared'
    ORDER BY c.created_at DESC
  `;
  
  db.all(query, [req.user.id], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// VULNERABLE: Broken Access Control - allows any user to see any claim
app.get('/api/claims/:id', authenticateToken, (req, res) => {
  const claimId = req.params.id;
  
  // BROKEN: Should check if user owns the claim or is admin
  // This allows any authenticated user to see any claim
  db.get('SELECT c.*, u.username as owner_name FROM claims c LEFT JOIN users u ON c.user_id = u.id WHERE c.id = ?', [claimId], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!row) {
      return res.status(404).json({ error: 'Claim not found' });
    }
    
    res.json(row);
  });
});

// VULNERABLE: No CSRF protection - allows CSRF attacks
app.post('/api/claims', authenticateToken, (req, res) => {
  const { title, description, amount, category } = req.body;
  
  if (!title || !amount) {
    return res.status(400).json({ error: 'Title and amount are required' });
  }

  const query = 'INSERT INTO claims (user_id, title, description, amount, category) VALUES (?, ?, ?, ?, ?)';
  db.run(query, [req.user.id, title, description, amount, category || 'Other'], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    res.json({ 
      message: 'Claim created successfully',
      id: this.lastID 
    });
  });
});

// VULNERABLE: Stored XSS - allows malicious scripts in claim descriptions
app.put('/api/claims/:id', authenticateToken, (req, res) => {
  const claimId = req.params.id;
  const { title, description, amount, category } = req.body;
  
  // BROKEN: No input sanitization - allows XSS
  const query = 'UPDATE claims SET title = ?, description = ?, amount = ?, category = ? WHERE id = ? AND user_id = ?';
  db.run(query, [title, description, amount, category, claimId, req.user.id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Claim not found or not owned by user' });
    }
    
    res.json({ message: 'Claim updated successfully' });
  });
});

// Admin endpoints with broken authorization
app.get('/api/admin/users', authenticateToken, requireAdmin, (req, res) => {
  // This endpoint is accessible to any authenticated user due to broken requireAdmin
  db.all('SELECT id, username, email, role, created_at FROM users', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

app.get('/api/admin/all-claims', authenticateToken, requireAdmin, (req, res) => {
  // This endpoint is accessible to any authenticated user due to broken requireAdmin
  const query = 'SELECT c.*, u.username as owner_name FROM claims c LEFT JOIN users u ON c.user_id = u.id ORDER BY c.created_at DESC';
  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// VULNERABLE: Admin can delete any claim without proper authorization check
app.delete('/api/admin/claims/:id', authenticateToken, requireAdmin, (req, res) => {
  const claimId = req.params.id;
  
  db.run('DELETE FROM claims WHERE id = ?', [claimId], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Claim not found' });
    }
    
    res.json({ message: 'Claim deleted successfully' });
  });
});

// Graceful shutdown
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Database connection closed.');
    process.exit(0);
  });
});

// Check if SSL certificates exist and start HTTPS or HTTP server
const certPath = path.join(__dirname, 'certs/server.crt');
const keyPath = path.join(__dirname, 'certs/server.key');

if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
  // HTTPS mode
  const options = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath)
  };
  
  https.createServer(options, app).listen(PORT, '0.0.0.0', () => {
    console.log(`Claim Manager HTTPS backend server running on port ${PORT}`);
    console.log(`Access via: https://localhost:${PORT}`);
    console.log(`⚠️  Using self-signed certificate - browser will show security warning`);
  });
} else {
  // HTTP mode
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Claim Manager HTTP backend server running on port ${PORT}`);
    console.log(`Access via: http://localhost:${PORT}`);
    console.log(`ℹ️  To enable HTTPS, run: cd backend && ./generate-cert.sh`);
  });
}
