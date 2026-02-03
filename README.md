# Claim Manager - Security Workshop Application

A modern web application for managing expense claims, built with Node.js, React, and SQLite. **This application is intentionally vulnerable and designed for security workshops and educational purposes. This application was built with AI.**

## 🚀 Quick Start (Docker)

**One command to run everything:**
```bash
docker-compose up --build
```

Then visit `https://localhost:3000` and accept the certificate warning.

**Demo Accounts:**
- Admin: `admin` / `password123`
- Alice: `alice` / `password123`
- Bob: `bob` / `password123`

That's it! The setup automatically handles database initialization and SSL certificate generation.

## ⚠️ **IMPORTANT: This application contains intentional security vulnerabilities!**

**DO NOT use this code in production!** This application is designed for educational purposes to demonstrate common web security vulnerabilities.

## 🚀 Features

- **Frontend**: React with Vite for fast development
- **Backend**: Node.js with Express.js
- **Database**: SQLite for lightweight local development
- **Docker**: Full containerization for easy setup
- **Security Vulnerabilities**: Intentionally vulnerable for workshop scenarios

## 🎯 **Security Vulnerabilities Included**

1. **Broken Access Control** - Users can access admin functions and other users' data
2. **Cross-Site Request Forgery (CSRF)** - Vulnerable cookie settings and no CSRF protection
3. **Cross-Site Scripting (XSS)** - Stored XSS in claim descriptions with non-HttpOnly cookies

## 📋 Prerequisites

- Node.js 18+ 
- Docker and Docker Compose (optional)
- Git

## 🛠️ Quick Start

### Option 1: Docker (Recommended - One Command!)

**Simply run:**
```bash
docker-compose up --build
```

Or use the convenience script:
```bash
./start.sh
```

**That's it!** The setup automatically:
- ✅ Generates SSL certificates (for HTTPS)
- ✅ Initializes the database with sample data
- ✅ Starts both frontend and backend servers

**Access the application:**
- Frontend: `https://localhost:3000` (accept the certificate warning)
- Backend API: `https://localhost:5001`

**Demo Accounts:**
- Admin: `admin` / `password123`
- Alice: `alice` / `password123`
- Bob: `bob` / `password123`

**Note:** On first run, you'll need to accept the self-signed certificate warnings in your browser.

### Option 2: Local Development

1. **Install dependencies:**
   ```bash
   # Backend
   cd backend
   npm install
   
   # Frontend
   cd ../frontend
   npm install
   ```

2. **Generate SSL certificates (for HTTPS):**
   ```bash
   cd ../backend
   npm run generate-cert
   ```

3. **Initialize the database:**
   ```bash
   cd backend
   npm run init-db
   ```

4. **Start development servers:**
   ```bash
   # Terminal 1: Backend
   cd backend
   npm run dev
   
   # Terminal 2: Frontend
   cd frontend
   npm run dev
   ```

4. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5001

## 📁 Project Structure

```
claim-manager/
├── backend/                 # Node.js/Express backend
│   ├── scripts/
│   │   └── init-db.js      # Database initialization
│   ├── server.js           # Main server file
│   ├── package.json        # Backend dependencies
│   └── Dockerfile          # Backend container
├── frontend/               # React frontend
│   ├── src/
│   │   ├── App.jsx         # Main React component
│   │   ├── main.jsx        # React entry point
│   │   └── index.css       # Global styles
│   ├── package.json        # Frontend dependencies
│   └── Dockerfile          # Frontend container
├── database/               # SQLite database files
├── docker-compose.yml      # Docker orchestration
└── package.json           # Root package.json
```

## 🗄️ Database Schema

The application includes the following tables:

- **users**: User accounts and authentication
- **claims**: Expense claim records
- **categories**: Claim categories

Sample data is automatically loaded during initialization.

## 🔧 Available Scripts

### Backend (`cd backend`)
- `npm run dev` - Start with nodemon (auto-restart)
- `npm start` - Start production server
- `npm run init-db` - Initialize database with sample data
- `npm run generate-cert` - Generate SSL certificates for HTTPS

### Frontend (`cd frontend`)
- `npm run dev` - Start Vite development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Docker
- `docker-compose up --build` - Start the application
- `docker-compose down` - Stop containers

## 🌐 API Endpoints

- `GET /` - API information
- `GET /health` - Health check
- `GET /api/test` - Test endpoint
- `GET /api/claims` - Get all claims

## 🔒 Security Workshop Ready

This application is designed for web security workshops and includes:

- Basic authentication structure
- SQLite database for easy manipulation
- CORS enabled for cross-origin requests
- JWT token support (ready for implementation)
- Input validation opportunities
- SQL injection testing scenarios

## 🐛 Troubleshooting

### Database Issues
- Ensure the `database/` directory exists
- Run `npm run init-db` to recreate the database
- Check file permissions on the database directory

### Port Conflicts
- Backend runs on port 5000
- Frontend runs on port 3000
- Modify ports in respective package.json files if needed

### Docker Issues
- Ensure Docker is running
- Try `docker-compose down` then `docker-compose up --build`
- Check logs with `docker-compose logs`

## 📝 Next Steps

The application is now ready for development! You can:

1. Add authentication endpoints
2. Implement CRUD operations for claims
3. Add user management features
4. Implement security features for the workshop
5. Add more sophisticated UI components

## 🤝 Contributing

This is a workshop application. Feel free to modify and extend it for your specific security workshop needs.

## 🎓 **Security Workshop**

This application contains intentional security vulnerabilities for educational purposes. Students should explore the application to identify and understand these vulnerabilities.

## 📄 License

MIT License - feel free to use for educational purposes.
