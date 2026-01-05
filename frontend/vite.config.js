import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// Check if HTTPS certificates exist
const certPath = path.resolve(__dirname, '../backend/certs/server.crt')
const keyPath = path.resolve(__dirname, '../backend/certs/server.key')
let useHttps = false
let httpsConfig = false

try {
  if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
    useHttps = true
    httpsConfig = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath)
    }
    console.log('✓ HTTPS enabled - using certificates from backend/certs/')
  } else {
    // Fallback: Let Vite auto-generate certificates
    console.log('ℹ️  Using Vite auto-generated HTTPS certificates')
    useHttps = true
    httpsConfig = true // Vite will auto-generate
  }
} catch (error) {
  console.warn('⚠️  Could not load certificates, using Vite auto-generated:', error.message)
  useHttps = true
  httpsConfig = true // Vite will auto-generate
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
        target: useHttps ? 'https://localhost:5001' : 'http://localhost:5001',
        changeOrigin: true,
        secure: false, // Allow self-signed certificates
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})
