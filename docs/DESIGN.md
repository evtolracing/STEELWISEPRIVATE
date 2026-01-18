# SteelWise ERP - System Design Documentation

> Comprehensive system architecture and design philosophy

---

## Table of Contents

1. [Executive Vision](#executive-vision)
2. [System Architecture](#system-architecture)
3. [Data Model](#data-model)
4. [User Roles & Personas](#user-roles--personas)
5. [Module Design](#module-design)
6. [Integration Architecture](#integration-architecture)
7. [Security Design](#security-design)
8. [Performance & Scalability](#performance--scalability)

---

## Executive Vision

### Mission
Build a modern, AI-enhanced ERP platform specifically designed for steel service centers that streamlines operations from order intake through production, quality control, and shipping.

### Core Principles

1. **User-Centric Design**
   - Touch-friendly interfaces for shop floor
   - Fast workflows for counter sales
   - Real-time visibility for management

2. **Industry-Specific**
   - Built for steel processing operations
   - Heat traceability as first-class citizen
   - Material handling workflows

3. **AI-Enhanced**
   - Intelligent cost optimization
   - Automatic provider fallback
   - Predictive analytics

4. **Modern Stack**
   - React + Material UI frontend
   - Node.js + Express backend
   - PostgreSQL with Prisma ORM
   - Docker deployment

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Client Layer                         │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │   Browser   │  │   Tablet     │  │    Mobile    │   │
│  │   React     │  │   Shop Floor │  │     POS      │   │
│  └─────────────┘  └──────────────┘  └──────────────┘   │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                    API Gateway                           │
│              Express + JWT Auth                          │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                  Application Layer                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│  │Production│  │   AI     │  │ Orders   │  │Quality │ │
│  │ Services │  │ Services │  │ Services │  │Services│ │
│  └──────────┘  └──────────┘  └──────────┘  └────────┘ │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                    Data Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  PostgreSQL  │  │    Redis     │  │   S3/Blob    │  │
│  │  (Prisma)    │  │   (Cache)    │  │  (Files)     │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                 External Services                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│  │ DeepSeek │  │  OpenAI  │  │ Carriers │  │Payment │ │
│  │   API    │  │   API    │  │   APIs   │  │Gateway │ │
│  └──────────┘  └──────────┘  └──────────┘  └────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Technology Stack

#### Frontend
- **Framework:** React 18
- **UI Library:** Material UI (MUI) v5
- **Routing:** React Router v6
- **State Management:** React Query + Context API
- **Build Tool:** Vite
- **HTTP Client:** Axios

#### Backend
- **Runtime:** Node.js 24+
- **Framework:** Express.js
- **ORM:** Prisma
- **Authentication:** JWT
- **Validation:** Zod
- **API Documentation:** OpenAPI/Swagger

#### Database
- **Primary:** PostgreSQL 16
- **Caching:** Redis (planned)
- **Search:** PostgreSQL Full-Text (upgrade to Elasticsearch planned)

#### Infrastructure
- **Containerization:** Docker + Docker Compose
- **Package Manager:** pnpm (workspaces)
- **Process Manager:** PM2 (production)
- **Reverse Proxy:** Nginx (production)

---

## Data Model

### Core Entities

#### Organization Hierarchy
```
Organization (Customer/Supplier)
├── Locations
│   ├── WorkCenters
│   └── Storage Areas
└── Contacts
```

#### Material Traceability
```
Heat (Mill Certificate)
├── Chemistry
├── Mechanical Properties
└── Units (Physical Pieces)
    ├── Dimensions
    ├── Weight
    └── Location
```

#### Order Flow
```
Order (Quote/PO/SO)
├── OrderLines
│   ├── Product
│   ├── Quantity
│   └── Price
└── Jobs (Production Work)
    ├── WorkCenter Assignment
    ├── Schedule
    ├── Status Tracking
    └── Shipments
```

### Key Relationships

```prisma
// Core material model
Heat ─── hasMany ──→ Unit
Unit ─── belongsTo ──→ Heat
Unit ─── belongsTo ──→ Location

// Order processing
Order ─── hasMany ──→ OrderLine
OrderLine ─── creates ──→ Job
Job ─── belongsTo ──→ WorkCenter
Job ─── belongsTo ──→ Order

// Traceability
Job ─── processes ──→ Unit (input)
Job ─── produces ──→ Unit (output)
Unit ─── tracesTo ──→ Heat

// Organizations
Order ─── belongsTo ──→ Organization (buyer)
Order ─── belongsTo ──→ Organization (seller)
```

### Status Enums

#### JobStatus
```
ORDERED → SCHEDULED → IN_PROCESS → WAITING_QC → 
PACKAGING → READY_TO_SHIP → SHIPPED → COMPLETED
```

#### OrderStatus
```
DRAFT → PENDING_APPROVAL → APPROVED → IN_PRODUCTION → 
READY_TO_SHIP → SHIPPED → DELIVERED → COMPLETED
```

#### UnitStatus
```
AVAILABLE → ALLOCATED → IN_PROCESS → QC_HOLD → 
READY_TO_SHIP → SHIPPED → DELIVERED
```

---

## User Roles & Personas

### 1. Shop Floor Operator
**Primary Tasks:**
- Start/complete jobs
- Record material usage
- Report issues

**Key Screens:**
- Shop Floor Screen (touch-optimized)
- Job details
- Material scanning

**Permissions:**
- View assigned jobs
- Update job status
- View material info

### 2. POS Clerk / Counter Sales
**Primary Tasks:**
- Customer service
- Quick quotes
- Order entry
- Payment processing

**Key Screens:**
- POS interface (full-screen)
- Material search
- Quote builder
- Receipt printing

**Permissions:**
- Create orders
- View inventory
- Process payments
- Print documents

### 3. Production Manager
**Primary Tasks:**
- Schedule jobs
- Allocate resources
- Monitor progress
- Resolve bottlenecks

**Key Screens:**
- Production workflow board
- Planning & scheduling
- Capacity planning
- Analytics dashboard

**Permissions:**
- Full job management
- Reassign work
- Override schedules
- View all reports

### 4. Shipping Clerk
**Primary Tasks:**
- Prepare shipments
- Generate BOL
- Arrange carriers
- Track deliveries

**Key Screens:**
- Shipping screen
- Packing lists
- BOL generation
- Carrier tracking

**Permissions:**
- Ship orders
- Create shipments
- Print documents
- Update tracking

### 5. Quality Inspector
**Primary Tasks:**
- Test entry
- Certification
- Non-conformance
- Approvals

**Key Screens:**
- QA/QC dashboard
- Test entry
- Certificate generation
- NCR management

**Permissions:**
- Enter test results
- Approve/reject
- Generate certs
- Create NCRs

### 6. Administrator
**Primary Tasks:**
- System configuration
- User management
- Data maintenance
- Reporting

**Key Screens:**
- Admin dashboard
- User management
- System settings
- Audit logs

**Permissions:**
- Full system access
- User management
- Configuration
- Data export

---

## Module Design

### Production Workflow Module

**Purpose:** End-to-end job tracking from order to shipment

**Components:**
1. Workflow Board (Kanban)
2. Shop Floor Screen
3. Shipping Dispatch

**Key Features:**
- Visual status tracking
- Real-time updates
- Touch-friendly controls
- Auto-refresh

**Integration Points:**
- Orders (job creation)
- Work Centers (routing)
- Materials (consumption)
- Shipping (dispatch)

### Point of Sale Module

**Purpose:** Fast counter sales and quotes

**Components:**
1. Material Search
2. Quote Builder
3. Order Creation
4. Payment Processing

**Key Features:**
- Real-time inventory
- Quick pricing
- Instant quotes
- Receipt printing

**Integration Points:**
- Inventory (availability)
- Pricing (calculations)
- Customers (lookup)
- Orders (creation)

### AI Intelligence Module

**Purpose:** Cost-effective AI capabilities with fallback

**Components:**
1. Provider Service (unified interface)
2. DeepSeek Provider (primary)
3. OpenAI Provider (fallback)
4. Anthropic Provider (specialty)

**Key Features:**
- Auto provider selection
- Intelligent fallback
- Cost optimization
- Usage tracking

**Use Cases:**
- Product analysis
- Quote assistance
- Document parsing
- Predictive analytics

---

## Integration Architecture

### Internal Integration

**Event Bus Pattern:**
```javascript
// Job status changed
events.emit('job.statusChanged', {
  jobId, oldStatus, newStatus, timestamp
});

// Listeners
inventoryService.on('job.statusChanged', updateAllocations);
analyticsService.on('job.statusChanged', recordMetric);
notificationService.on('job.statusChanged', sendAlert);
```

### External Integration

**REST API:**
- Standard HTTP/JSON
- JWT authentication
- Rate limiting
- Versioning (v1, v2)

**Webhooks:**
- Event subscriptions
- Retry logic
- Signature verification
- Delivery tracking

**EDI Integration (Planned):**
- 850 (PO)
- 855 (PO Ack)
- 856 (ASN)
- 810 (Invoice)

---

## Security Design

### Authentication & Authorization

**JWT Tokens:**
- HS256 signing
- 24-hour expiration
- Refresh tokens
- Secure httpOnly cookies

**Role-Based Access Control:**
```javascript
// Permission check
if (!user.hasPermission('jobs.update')) {
  return res.status(403).json({ error: 'Forbidden' });
}

// Role hierarchy
ADMIN > MANAGER > OPERATOR > VIEWER
```

### Data Security

**Encryption:**
- TLS/SSL in transit
- Encrypted at rest (database level)
- Env variable encryption

**Input Validation:**
- Zod schemas
- SQL injection prevention (Prisma)
- XSS protection
- CSRF tokens

**Audit Logging:**
- User actions
- Data changes
- Failed auth attempts
- API calls

---

## Performance & Scalability

### Optimization Strategies

**Database:**
- Proper indexing
- Query optimization
- Connection pooling
- Read replicas (planned)

**Caching:**
- Redis for sessions
- Query result caching
- Static asset CDN

**Frontend:**
- Code splitting
- Lazy loading
- Image optimization
- Service workers (PWA)

### Monitoring

**Metrics:**
- Response times
- Error rates
- Database performance
- AI API costs

**Tools:**
- Application logs
- Database slow query log
- Error tracking (Sentry planned)
- Uptime monitoring

---

## Development Workflow

### Branch Strategy
```
main (production)
├── develop (integration)
├── feature/* (new features)
├── bugfix/* (bug fixes)
└── hotfix/* (urgent fixes)
```

### CI/CD Pipeline
```
1. Git push
2. Lint & type check
3. Run tests
4. Build application
5. Deploy to staging
6. Run E2E tests
7. Deploy to production (manual approval)
```

### Testing Strategy
- Unit tests (Jest)
- Integration tests (Supertest)
- E2E tests (Playwright)
- Load testing (k6)

---

## Future Enhancements

### Q1 2026
- [ ] Redis caching layer
- [ ] Real-time WebSocket updates
- [ ] Mobile app (React Native)
- [ ] Advanced AI features

### Q2 2026
- [ ] Multi-tenant architecture
- [ ] EDI integration
- [ ] Elasticsearch for search
- [ ] Advanced analytics

### Q3 2026
- [ ] Machine learning for scheduling
- [ ] Predictive maintenance
- [ ] IoT sensor integration
- [ ] Voice commands (Alexa/Google)

---

**Last Updated:** January 18, 2026
