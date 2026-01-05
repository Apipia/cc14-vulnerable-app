# Quick Start Guide

## 🚀 One Command Setup

```bash
docker-compose up --build
```

That's it! The application will:
- ✅ Automatically generate SSL certificates
- ✅ Initialize the database with sample data
- ✅ Start the frontend and backend servers

## 🌐 Access the Application

- **Frontend:** `https://localhost:3000`
- **Backend API:** `https://localhost:5001`

**Note:** You'll need to accept the self-signed certificate warning in your browser (click "Advanced" → "Proceed to localhost").

## 👤 Demo Accounts

- **Admin:** `admin` / `password123`
- **Alice:** `alice` / `password123`
- **Bob:** `bob` / `password123`

## 🛑 Stop the Application

Press `Ctrl+C` in the terminal, or run:
```bash
docker-compose down
```

## 🔄 Restart

Just run the same command again:
```bash
docker-compose up --build
```

The database and certificates persist, so you don't need to regenerate them.

## ❓ Troubleshooting

**Port already in use?**
- Make sure nothing else is running on ports 3000 or 5001
- Or modify the ports in `docker-compose.yml`

**Can't access the site?**
- Make sure Docker is running
- Check that containers are up: `docker-compose ps`
- View logs: `docker-compose logs`

**Certificate errors?**
- This is normal for self-signed certificates
- Just accept the warning in your browser

