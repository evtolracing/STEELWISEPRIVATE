# SteelWise ERP Platform

> **Internal steel service center management system for Alro Steel**  
> Complete production workflow, inventory, and order management platform

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm run install:all

# 2. Configure environment (then edit both files)
cp src/backend/.env.example src/backend/.env
cp src/frontend/.env.example src/frontend/.env.local

# 3. Start database
docker compose up -d postgres

# 4. Run migrations
cd src/backend && npx prisma migrate dev && cd ../..

# 5. Start development servers (two terminals)
npm run dev:backend
npm run dev:frontend
```

**Access URLs:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- Production Workflow: http://localhost:5173/production

To try the app without a database login, set `VITE_DEMO_MODE="true"` in
`src/frontend/.env.local`. Never enable demo mode on a deployment with real data.

---

## 📋 System Overview

SteelWise is a comprehensive ERP platform designed specifically for steel service centers, providing end-to-end management from order intake through production, quality control, and shipping.

### Key Features

✅ **Production Workflow Management**
- Real-time Kanban board with 8 job statuses
- Shop floor operator interface
- Shipping dispatch with carrier tracking

✅ **AI-Powered Intelligence**
- Multi-provider AI system (OpenAI, DeepSeek, Anthropic)
- Automatic cost optimization (10x savings with DeepSeek)
- Intelligent fallback handling

✅ **Point of Sale (POS)**
- Fast counter sales workflow
- Real-time inventory lookup
- Quick quote generation

✅ **Inventory & Materials**
- Heat traceability
- Unit tracking
- Location management

✅ **Order Management**
- Order intake and processing
- BOM/Recipe management
- Work order scheduling

✅ **Quality Control**
- QA/QC test entry
- Metallurgy tracking
- Compliance documentation

✅ **Logistics**
- Shipment management
- Carrier integration
- Delivery tracking

---

## 🏗️ Architecture

### Tech Stack

**Frontend**
- React 18
- Material UI (MUI)
- React Router
- React Query
- Vite

**Backend**
- Node.js + Express
- Prisma ORM
- PostgreSQL
- JWT Authentication

**AI Integration**
- OpenAI SDK
- DeepSeek API
- Anthropic SDK
- Streaming SSE support

**Infrastructure**
- Docker Compose
- npm (separate installs for backend and frontend)
- ESLint

### Project Structure

```
STEELWISEPRIVATE/
├── src/
│   ├── backend/              # Node.js + Express API
│   │   ├── prisma/           # Database schema & migrations
│   │   ├── src/
│   │   │   ├── routes/       # API endpoints
│   │   │   ├── services/     # Business logic
│   │   │   │   └── ai/       # AI provider system
│   │   │   └── server.js     # Express server
│   │   └── .env              # Environment config
│   │
│   └── frontend/             # React application
│       ├── src/
│       │   ├── apps/         # Feature applications
│       │   ├── components/   # React components
│       │   │   ├── production/  # Production workflow screens
│       │   │   ├── layout/      # Layout components
│       │   │   └── common/      # Shared components
│       │   ├── pages/        # Page components
│       │   ├── services/     # API clients
│       │   ├── router/       # Route configuration
│       │   └── theme/        # MUI theme
│       └── package.json
│
├── docs/                     # Consolidated documentation
├── docker-compose.yml        # Docker services config
└── package.json              # Workspace root config
```

---

## 🎯 Core Applications

### 1. Production Workflow System
**Routes:** `/production`, `/production/shop-floor`, `/production/shipping`

Complete job lifecycle management from order to shipment:
- **Workflow Board**: Kanban view of all jobs across 8 statuses
- **Shop Floor**: Operator interface for starting/completing work
- **Shipping Dispatch**: Carrier selection and tracking number entry

**Job Statuses:**
```
ORDERED → SCHEDULED → IN_PROCESS → WAITING_QC → PACKAGING 
  → READY_TO_SHIP → SHIPPED → COMPLETED
```

### 2. Point of Sale (POS)
**Route:** `/pos`

Fast-track counter sales with:
- Real-time material search
- Quick pricing
- Instant order creation
- Print invoices

### 3. Planning & Scheduling
**Route:** `/planning`

Capacity planning and work center scheduling:
- Resource allocation
- Timeline visualization
- Workload balancing

### 4. Order Board
**Route:** `/order-board`

Visual management of all orders:
- Kanban-style board
- Priority management
- Status tracking

---

## 🤖 AI Integration

### Multi-Provider System

The platform includes a unified AI provider system supporting:

| Provider | Models | Use Case | Cost/1M Tokens |
|----------|--------|----------|----------------|
| **DeepSeek** | Chat, Reasoner | Primary (all tasks) | $0.14 - $0.28 |
| **OpenAI** | GPT-4o, GPT-4o-mini | Fallback, embeddings | $2.50 - $10.00 |
| **Anthropic** | Claude 3.5 | Advanced reasoning | $3.00 - $15.00 |

**Key Features:**
- ✅ Automatic provider selection by task type
- ✅ Intelligent fallback on failure
- ✅ 10x cost savings with DeepSeek
- ✅ Retry logic with exponential backoff
- ✅ Usage tracking and cost monitoring
- ✅ Streaming responses (SSE)

**API Endpoints:**
- `POST /api/ai/chat` - Chat completions
- `POST /api/ai/chat/stream` - Streaming chat
- `POST /api/ai/embeddings` - Text embeddings
- `GET /api/ai/providers` - List providers

---

## 📊 Database Schema

### Core Models

**Job** - Production work items
```prisma
- jobNumber, status, priority
- workCenter, assignedTo
- scheduledStart, actualStart, actualEnd
- shippingCarrier, trackingNumber, shippedAt
```

**Order** - Customer orders
```prisma
- orderNumber, orderType, status
- buyer, seller
- lines (OrderLine[])
- subtotal, tax, freight, total
```

**Heat** - Material heat lots
```prisma
- heatNumber, mill, grade
- chemistry, certifications
- traceability
```

**Unit** - Physical inventory units
```prisma
- unitNumber, location
- dimensions, weight
- heat, status
```

**WorkCenter** - Production resources
```prisma
- code, name, type
- location, capacity
- capabilities
```

---

## 🔧 Development

### Prerequisites

- **Node.js** 22+
- **npm** 10+
- **Docker Desktop** (for local PostgreSQL)
- **Git**

### Environment Setup

1. **Install dependencies** (root tooling, backend and frontend)
```bash
npm run install:all
```

2. **Configure environment**
```bash
cp src/backend/.env.example src/backend/.env
cp src/frontend/.env.example src/frontend/.env.local
# Edit both files. See the comments in each for what every setting does.
```

`JWT_SECRET` must be at least 32 characters in production (the server refuses
to start otherwise). Generate one with `openssl rand -hex 48`. In development a
random secret is used if it is missing.

3. **Start database**
```bash
docker compose up -d postgres
```

4. **Run migrations and generate the Prisma client**
```bash
cd src/backend
npx prisma migrate dev
```

5. **Seed database (optional)**
```bash
npx prisma db seed
```

6. **Start dev servers** (two terminals)
```bash
npm run dev:backend    # API on http://localhost:3001
npm run dev:frontend   # App on http://localhost:5173 (proxies /api to the backend)
```

### First admin user

`POST /api/auth/register` is open only while the database has no users, so the
first account can be created. After that, only admins can create accounts.

### Available Scripts

Run from the repository root:

```bash
npm run install:all      # Install root, backend and frontend dependencies
npm run dev:backend      # Start the API with auto-reload
npm run dev:frontend     # Start the frontend dev server
npm run build            # Generate Prisma client and build the frontend
npm run prisma:migrate   # Run database migrations (dev)
npm run lint             # Lint the whole repo
npm run lint:fix         # Lint and auto-fix
npm run format           # Format code with Prettier
```

There is no automated test suite yet; it is planned for Phase 4 of the completion plan.

---

## 📡 API Documentation

### Base URL
```
http://localhost:3001/api
```

### Authentication
```http
Authorization: Bearer <jwt-token>
```

### Core Endpoints

#### Jobs
```http
GET    /api/jobs              # List jobs (with filters)
GET    /api/jobs/:id          # Get job details
POST   /api/jobs              # Create job
POST   /api/jobs/:id/status   # Update status
POST   /api/jobs/:id/start    # Start job
POST   /api/jobs/:id/complete # Complete job
POST   /api/jobs/:id/ship     # Ship job
GET    /api/jobs/:id/history  # Status history
GET    /api/jobs/stats/summary # Job statistics
```

#### Orders
```http
GET    /api/orders            # List orders
GET    /api/orders/:id        # Get order
POST   /api/orders            # Create order
PATCH  /api/orders/:id        # Update order
```

#### Heats
```http
GET    /api/heats             # List heats
GET    /api/heats/:id         # Get heat
POST   /api/heats             # Create heat
```

#### Units
```http
GET    /api/units             # List units
GET    /api/units/:id         # Get unit
POST   /api/units             # Create unit
PATCH  /api/units/:id         # Update unit
```

#### AI
```http
POST   /api/ai/chat           # Chat completion
POST   /api/ai/chat/stream    # Streaming chat
POST   /api/ai/embeddings     # Generate embeddings
GET    /api/ai/providers      # List providers
POST   /api/ai/test           # Test provider
GET    /api/ai/usage          # Usage statistics
```

---

## 🚢 Deployment

### Production Build

```bash
# Build all
npm run build

# Backend builds to: src/backend/dist
# Frontend builds to: src/frontend/dist
```

### Environment Variables (Production)

```env
NODE_ENV=production
PORT=3001

# Database
DATABASE_URL="postgresql://user:pass@host:5432/steelwise"

# Security
JWT_SECRET="strong-random-secret"
CORS_ORIGIN="https://yourdomain.com"

# AI
DEEPSEEK_API_KEY="sk-..."
AI_DEFAULT_PROVIDER="deepseek"
```

### Docker Deployment

```bash
# Build and run
docker compose up -d

# Scale services
docker compose up -d --scale backend=3
```

---

## 📚 Documentation

For detailed documentation, see:
- **[docs/SETUP.md](./docs/SETUP.md)** - Setup and installation
- **[docs/API.md](./docs/API.md)** - API reference
- **[docs/FEATURES.md](./docs/FEATURES.md)** - Feature documentation
- **[docs/DESIGN.md](./docs/DESIGN.md)** - System design

---

## 🔒 Security

In place:
- JWT authentication for staff accounts, required secret with no fallback
- Admin-only account creation after the first user
- Security headers (Helmet), CORS allowlist, request size limits
- Rate limiting on the API and on login
- Partner API with its own token signing key, scopes and per-partner rate limits
- No secrets in the repository: all keys come from environment variables

Not yet in place (see the completion plan):
- Authentication and role checks on every internal API route
- Location and division scoping of data
- Shared rate-limit store across serverless instances

---

## 🧪 Testing

No automated tests exist yet. Phase 4 of the completion plan adds API, permission
and end-to-end tests with CI on every pull request.

---

## 📝 Contributing

### Branch Strategy
- `main` - Production-ready code
- `develop` - Integration branch
- `feature/*` - Feature branches
- `bugfix/*` - Bug fixes

### Commit Convention
```
feat: Add production workflow shipping screen
fix: Resolve job status transition bug
docs: Update API documentation
chore: Update dependencies
```

---

## 📦 Recent Updates

### Latest (January 2026)

✅ **Production Workflow System** (v1.0)
- Kanban workflow board with 8 status columns
- Shop floor operator interface
- Shipping dispatch with carrier tracking
- Real-time auto-refresh (30s)

✅ **AI Integration** (v1.0)
- Multi-provider system (DeepSeek, OpenAI, Anthropic)
- 10x cost savings with DeepSeek as primary
- Automatic fallback handling
- Streaming support

✅ **POS System** (v1.0)
- Fast counter sales workflow
- Real-time inventory search
- Quick quote generation

---

## 📞 Support

For issues or questions:
- Create GitHub issue
- Contact development team
- See documentation in `docs/` directory

---

## 📄 License

Proprietary - Internal use only  
© 2026 Alro Steel / SteelWise Platform

---

## 🎯 Roadmap

### Q1 2026
- [ ] Advanced scheduling algorithms
- [ ] Mobile app (React Native)
- [ ] Enhanced AI features
- [ ] Real-time notifications

### Q2 2026
- [ ] EDI integration
- [ ] Advanced analytics dashboard
- [ ] Multi-location support
- [ ] API v2

---

**Status**: In development: completing for production (Phase 0 of the completion plan)  
**Version**: 1.0.0
