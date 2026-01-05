import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import https from 'https'

// Frontend uses HTTP, backend uses HTTPS
// The Vite proxy will handle the HTTPS connection to the backend
// This avoids certificate issues in the browser for the frontend
let useHttps = false
let httpsConfig = false

// Check if we're in Docker (certificates would be in a different container)
// For local development, we could check for certs, but in Docker it's simpler to use HTTP
const isDocker = process.env.VITE_API_URL || process.env.NODE_ENV === 'production'
if (isDocker) {
  console.log('ℹ️  Running in container - using HTTP (backend handles HTTPS)')
} else {
  // For local development, check if certs exist
  const certPath = path.resolve(__dirname, '../backend/certs/server.crt')
  const keyPath = path.resolve(__dirname, '../backend/certs/server.key')
  try {
    if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
      useHttps = true
      httpsConfig = {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath)
      }
      console.log('✓ HTTPS enabled - using certificates from backend/certs/')
    }
  } catch (error) {
    console.log('ℹ️  Using HTTP (certificates not accessible)')
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    https: httpsConfig, // Use HTTPS if certificates exist, otherwise HTTP
    proxy: {
      '/api': {
        // In Docker: use service name 'backend' with HTTPS
        // Locally: use localhost with HTTPS if certs exist, otherwise HTTP
        target: process.env.VITE_API_URL || (useHttps ? 'https://localhost:5001' : 'http://localhost:5001'),
        changeOrigin: true,
        secure: false, // Allow self-signed certificates
        ws: true, // Enable websockets if needed
        agent: process.env.VITE_API_URL?.startsWith('https') ? new https.Agent({
          rejectUnauthorized: false // Accept self-signed certificates for Docker inter-container communication
        }) : undefined,
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})
