# SteelWise Platform - Microservices Architecture

## Overview

Evolution from monolithic ERP to distributed microservices architecture supporting:
- Multi-channel frontends (Web, Mobile, Partner Portal)
- Domain-driven microservices
- Event-driven communication
- Multi-database strategy
- Blockchain provenance layer
- AI/Analytics capabilities

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                                  │
├─────────────────────────────────────────────────────────────────────┤
│   Web UI        │    Mobile App      │    Partner Portal            │
│   (React/Vite)  │    (React Native)  │    (React/Vite)              │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     API GATEWAY / BFF LAYER                          │
├─────────────────────────────────────────────────────────────────────┤
│  • Kong / Custom Express Gateway                                     │
│  • Rate Limiting, Auth, Request Routing                              │
│  • GraphQL Federation (optional)                                     │
│  • Request/Response Transformation                                   │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    DOMAIN MICROSERVICES                              │
├──────────────────┬──────────────────┬───────────────────────────────┤
│  identity-svc    │  master-data-svc │  engineering-svc              │
│  ─────────────   │  ────────────────│  ──────────────               │
│  • Users/Roles   │  • Plants        │  • Specs                      │
│  • Orgs/Tenants  │  • Materials     │  • BOMs                       │
│  • Auth/SSO      │  • Grades        │  • Recipes                    │
│  • Permissions   │  • Products      │  • Tolerances                 │
├──────────────────┼──────────────────┼───────────────────────────────┤
│  mes-svc         │  traceability-svc│  inventory-svc                │
│  ─────────────   │  ────────────────│  ─────────────                │
│  • Work Orders   │  • Heats         │  • Locations                  │
│  • Shop Floor    │  • Coils         │  • Stock Levels               │
│  • Scheduling    │  • Genealogy     │  • Movements                  │
│  • IoT Ingest    │  • QC Holds      │  • Reservations               │
├──────────────────┼──────────────────┼───────────────────────────────┤
│  orders-svc      │  pricing-svc     │  logistics-svc                │
│  ─────────────   │  ────────────────│  ─────────────                │
│  • RFQs          │  • Base Prices   │  • Shipments                  │
│  • POs/SOs       │  • Surcharges    │  • Routing                    │
│  • Allocations   │  • Contracts     │  • Carriers                   │
│  • Order Status  │  • Market Feeds  │  • Tracking                   │
├──────────────────┼──────────────────┼───────────────────────────────┤
│  compliance-svc  │  blockchain-svc  │  billing-svc                  │
│  ─────────────   │  ────────────────│  ────────────                 │
│  • Documents     │  • Provenance    │  • Invoices                   │
│  • Certs (MTR)   │  • Immutable Log │  • Payments                   │
│  • Audits        │  • Smart Contr.  │  • AR/AP                      │
│  • Regulations   │  • Hash Anchors  │  • Credit                     │
└──────────────────┴──────────────────┴───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     EVENT BUS (Kafka / NATS)                         │
├─────────────────────────────────────────────────────────────────────┤
│  Topics:                                                             │
│  • steelwise.identity.*     • steelwise.orders.*                     │
│  • steelwise.inventory.*    • steelwise.traceability.*               │
│  • steelwise.mes.*          • steelwise.logistics.*                  │
│  • steelwise.compliance.*   • steelwise.blockchain.*                 │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      DATA LAYER                                      │
├─────────────────┬───────────────────┬───────────────────────────────┤
│  PostgreSQL     │  TimescaleDB      │  MinIO/S3                     │
│  ─────────────  │  ────────────     │  ─────────                    │
│  • Transactional│  • IoT Metrics    │  • Documents                  │
│  • Master Data  │  • Sensor Data    │  • Images                     │
│  • Per-service  │  • Time-series    │  • Certificates               │
│    schemas      │  • Analytics      │  • Backups                    │
├─────────────────┼───────────────────┼───────────────────────────────┤
│  Redis          │  Elasticsearch    │  Blockchain                   │
│  ─────────────  │  ─────────────    │  ──────────                   │
│  • Caching      │  • Full-text      │  • Hyperledger Fabric         │
│  • Sessions     │  • Log aggregation│  • or Polygon L2              │
│  • Rate limits  │  • Search         │  • Immutable ledger           │
└─────────────────┴───────────────────┴───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   BI / ANALYTICS / AI LAYER                          │
├─────────────────────────────────────────────────────────────────────┤
│  • Apache Superset / Metabase (BI Dashboards)                        │
│  • ML Models: Demand Forecasting, Quality Prediction                 │
│  • Real-time Anomaly Detection (IoT)                                 │
│  • Supply Chain Optimization                                         │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Directory Structure

```
src/
├── gateway/                    # API Gateway / BFF
│   ├── src/
│   │   ├── middleware/         # Auth, rate-limit, logging
│   │   ├── routes/             # Route definitions
│   │   └── index.ts
│   ├── package.json
│   └── Dockerfile
│
├── services/                   # Domain Microservices
│   ├── identity/
│   │   ├── src/
│   │   │   ├── domain/         # Domain entities
│   │   │   ├── application/    # Use cases
│   │   │   ├── infrastructure/ # DB, external
│   │   │   └── api/            # REST/gRPC handlers
│   │   ├── prisma/
│   │   ├── package.json
│   │   └── Dockerfile
│   │
│   ├── master-data/
│   ├── engineering/
│   ├── mes/
│   ├── traceability/
│   ├── inventory/
│   ├── orders/
│   ├── pricing/
│   ├── logistics/
│   ├── compliance/
│   ├── blockchain/
│   └── billing/
│
├── packages/                   # Shared Libraries
│   ├── types/                  # Shared TypeScript types
│   ├── utils/                  # Common utilities
│   ├── events/                 # Event schemas & publishers
│   └── auth/                   # Auth middleware
│
├── frontend/                   # Existing React app (Web UI)
├── mobile/                     # React Native app (future)
├── partner-portal/             # Partner Portal (future)
│
├── infrastructure/
│   ├── docker/
│   │   ├── docker-compose.yml
│   │   ├── docker-compose.dev.yml
│   │   └── docker-compose.prod.yml
│   ├── kubernetes/             # K8s manifests (future)
│   └── terraform/              # IaC (future)
│
└── docs/
    └── api/                    # OpenAPI specs
```

---

## Service Communication Patterns

### Synchronous (REST/gRPC)
- Client → Gateway → Service
- Service → Service (internal APIs)

### Asynchronous (Event Bus)
- Service publishes domain events
- Other services subscribe and react
- Eventually consistent

### Event Schema Example
```typescript
interface DomainEvent {
  eventId: string;
  eventType: string;
  aggregateId: string;
  aggregateType: string;
  timestamp: Date;
  version: number;
  payload: Record<string, unknown>;
  metadata: {
    correlationId: string;
    causationId?: string;
    userId?: string;
    tenantId: string;
  };
}
```

---

## Service Registry

| Service          | Port  | Database Schema    | Primary Events               |
|------------------|-------|--------------------|-----------------------------|
| gateway          | 3000  | -                  | -                           |
| identity-svc     | 3001  | identity           | UserCreated, OrgUpdated     |
| master-data-svc  | 3002  | master_data        | GradeCreated, PlantUpdated  |
| engineering-svc  | 3003  | engineering        | SpecPublished, BOMUpdated   |
| mes-svc          | 3004  | mes                | WorkOrderStarted, Completed |
| traceability-svc | 3005  | traceability       | CoilCreated, QCHoldPlaced   |
| inventory-svc    | 3006  | inventory          | StockReceived, Transferred  |
| orders-svc       | 3007  | orders             | OrderCreated, Allocated     |
| pricing-svc      | 3008  | pricing            | PriceUpdated, SurchargeSet  |
| logistics-svc    | 3009  | logistics          | ShipmentDispatched          |
| compliance-svc   | 3010  | compliance         | CertGenerated, AuditLogged  |
| blockchain-svc   | 3011  | -                  | ProvenanceAnchored          |
| billing-svc      | 3012  | billing            | InvoiceIssued, PaymentRecvd |

---

## Technology Stack

### Backend
- **Runtime**: Node.js 20 LTS
- **Language**: TypeScript 5.x
- **Framework**: Express / Fastify
- **ORM**: Prisma
- **Validation**: Zod
- **API Docs**: OpenAPI 3.0

### Event Bus
- **Development**: NATS (lightweight)
- **Production**: Apache Kafka / Redpanda

### Databases
- **Primary**: PostgreSQL 16
- **Time-series**: TimescaleDB
- **Cache**: Redis 7
- **Search**: Elasticsearch 8
- **Object Store**: MinIO (S3-compatible)

### Blockchain
- **Permissioned**: Hyperledger Fabric
- **Public L2**: Polygon (optional)

### Infrastructure
- **Containers**: Docker
- **Orchestration**: Docker Compose (dev), Kubernetes (prod)
- **CI/CD**: GitHub Actions

---

## Migration Strategy

### Phase 1: Gateway + Core Services
1. API Gateway (routing, auth)
2. Identity Service (users, orgs)
3. Master Data Service (grades, products)

### Phase 2: Operational Services
4. Traceability Service (heats, coils)
5. Inventory Service
6. Orders Service

### Phase 3: Advanced Services
7. MES Service
8. Logistics Service
9. Compliance Service

### Phase 4: Extended Platform
10. Pricing Service (multi-region)
11. Blockchain Service
12. Billing Service

### Phase 5: Analytics & AI
13. BI Integration
14. ML Pipeline
15. Real-time dashboards

---

## Implementation Priority

```
Week 1-2:   Gateway + Identity + Shared Packages
Week 3-4:   Master Data + Traceability
Week 5-6:   Inventory + Orders
Week 7-8:   MES + Logistics
Week 9-10:  Compliance + Blockchain
Week 11-12: Billing + Analytics Integration
```

---

## Next Steps

1. Set up monorepo with pnpm workspaces
2. Create shared packages (types, events, auth)
3. Build API Gateway with routing
4. Implement Identity Service
5. Set up Docker Compose for local development
6. Migrate existing backend logic into services
