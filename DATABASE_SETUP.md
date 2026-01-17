# SteelWise ERP - Database Setup Guide

## Prerequisites

The SteelWise ERP system requires PostgreSQL as its database. You have three options for setting up PostgreSQL:

### Option 1: Docker (Recommended - Easiest)

1. **Install Docker Desktop for Windows:**
   - Download from: https://www.docker.com/products/docker-desktop/
   - Install and restart your computer
   - Open Docker Desktop to start the Docker service

2. **Start PostgreSQL Container:**
   ```bash
   cd C:\Users\trost\Desktop\STEELWISE\ALROWARE
   docker-compose up -d
   ```

3. **Verify Database is Running:**
   ```bash
   docker ps
   ```
   You should see the `steelwise-db` container running

### Option 2: PostgreSQL Native Installation

1. **Download PostgreSQL:**
   - Visit: https://www.postgresql.org/download/windows/
   - Download PostgreSQL 16 installer
   - Run the installer

2. **During Installation:**
   - Set password to: `password` (or update `.env` file with your password)
   - Port: `5432` (default)
   - Locale: Default

3. **Create Database:**
   - Open pgAdmin (installed with PostgreSQL)
   - Right-click "Databases" → "Create" → "Database"
   - Name: `steelwise`
   - Save

### Option 3: Cloud PostgreSQL (Supabase - Free)

1. **Create Free Account:**
   - Visit: https://supabase.com
   - Sign up for free account

2. **Create Project:**
   - Click "New Project"
   - Name: steelwise
   - Database Password: Choose a strong password
   - Region: Choose closest to you
   - Wait for project to be created (~2 minutes)

3. **Get Connection String:**
   - Go to Project Settings → Database
   - Copy the "Connection string" (URI format)
   - It looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres`

4. **Update .env File:**
   ```bash
   cd C:\Users\trost\Desktop\STEELWISE\ALROWARE\src\backend
   ```
   - Open `.env` file
   - Replace `DATABASE_URL` with your Supabase connection string

## After Database Setup

Once you have PostgreSQL running (any option above):

### 1. Run Database Migrations

```bash
cd C:\Users\trost\Desktop\STEELWISE\ALROWARE\src\backend
npm run db:migrate
```

This creates all the tables, indexes, and relationships in your database.

### 2. Seed Test Data

```bash
npm run db:seed
```

This populates your database with:
- 2 users (admin and operator)
- 3 steel mills
- 4 steel grades (A36, A572-50, 304 SS, 316 SS)
- 3 products (Hot Rolled, Cold Rolled, Galvanized)
- 3 customers
- 3 heats with chemistry data
- 20 coils/units
- 10 orders
- 5 work orders
- 5 shipments
- QC test results and holds

### 3. Start Backend Server

```bash
npm run dev
```

Server will start on: http://localhost:3001

### 4. Start Frontend Server

Open a new terminal:

```bash
cd C:\Users\trost\Desktop\STEELWISE\ALROWARE\src\frontend
npm run dev
```

Frontend will start on: http://localhost:5173

### 5. Login Credentials

```
Email: admin@steelwise.com
Password: password123
```

## Troubleshooting

### "Can't reach database server"
- **Docker:** Run `docker ps` to verify container is running
- **Native:** Open Services (Win+R → services.msc), find "postgresql-x64-16", ensure it's running
- **Supabase:** Check internet connection and verify connection string

### "Port 5432 already in use"
- Another PostgreSQL instance is running
- Check Services and stop other PostgreSQL services
- Or use Docker which isolates the port

### "EADDRINUSE: port 3001"
- Backend server is already running
- Find and close the existing terminal
- Or use: `Get-Process -Id (Get-NetTCPConnection -LocalPort 3001).OwningProcess | Stop-Process`

### "Migration failed"
- Ensure database exists and is accessible
- Check DATABASE_URL in `.env` file
- For Supabase, verify connection string includes password

## Database Management Tools

### Prisma Studio (Built-in)
```bash
cd C:\Users\trost\Desktop\STEELWISE\ALROWARE\src\backend
npm run db:studio
```
Opens at: http://localhost:5555

### pgAdmin (Native PostgreSQL)
- Installed with PostgreSQL
- Visual database management tool

### Supabase Dashboard
- Built-in SQL editor and table editor
- Access from your Supabase project

## Next Steps

Once everything is running:

1. **Open Browser:** http://localhost:5173
2. **Login** with admin credentials above
3. **Explore:**
   - Dashboard → View inventory and order summaries
   - Heats → Browse heat numbers with chemistry data
   - Units → View coil inventory
   - Work Orders → Production scheduling
   - Logistics → Shipment tracking
   - Q&A/QC → Quality control and testing
   - Provenance → Full traceability from mill to end-user

## Development Workflow

```bash
# Terminal 1 - Backend
cd C:\Users\trost\Desktop\STEELWISE\ALROWARE\src\backend
npm run dev

# Terminal 2 - Frontend
cd C:\Users\trost\Desktop\STEELWISE\ALROWARE\src\frontend
npm run dev

# Terminal 3 - Database (optional)
cd C:\Users\trost\Desktop\STEELWISE\ALROWARE\src\backend
npm run db:studio
```

All three terminals need to stay open while developing!
