# Phase 13: Multi-Tenant Architecture

**Document Version:** 1.0  
**Date:** January 17, 2026  
**Status:** SaaS Platform Architecture Specification

---

## 1. EXECUTIVE SUMMARY

This document defines the multi-tenant architecture for the SteelWise platform, enabling multiple service center companies to operate on shared infrastructure while maintaining complete data isolation, customization, and independent billing.

### Multi-Tenancy Goals

| Goal | Description | Priority |
|------|-------------|:--------:|
| **Data Isolation** | Complete separation of tenant data | Critical |
| **Scalability** | Support 100s of tenants efficiently | High |
| **Customization** | Per-tenant branding and configuration | High |
| **Cost Efficiency** | Shared infrastructure, economies of scale | High |
| **Compliance** | Meet data residency and audit requirements | Critical |
| **Onboarding** | Rapid tenant provisioning (<1 hour) | Medium |

### Tenant Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          TENANT HIERARCHY MODEL                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│                         ┌─────────────────────┐                                 │
│                         │    PLATFORM         │                                 │
│                         │    (SteelWise)      │                                 │
│                         └──────────┬──────────┘                                 │
│                                    │                                            │
│            ┌───────────────────────┼───────────────────────┐                   │
│            │                       │                       │                   │
│            ▼                       ▼                       ▼                   │
│   ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐           │
│   │    TENANT A     │    │    TENANT B     │    │    TENANT C     │           │
│   │  (ABC Steel Co) │    │ (XYZ Metals Inc)│    │(Regional Supply)│           │
│   └────────┬────────┘    └────────┬────────┘    └────────┬────────┘           │
│            │                      │                      │                     │
│     ┌──────┴──────┐        ┌──────┴──────┐        ┌──────┴──────┐             │
│     │             │        │             │        │             │             │
│     ▼             ▼        ▼             ▼        ▼             ▼             │
│ ┌───────┐    ┌───────┐ ┌───────┐    ┌───────┐ ┌───────┐    ┌───────┐         │
│ │ DIV 1 │    │ DIV 2 │ │ DIV 1 │    │ DIV 2 │ │ DIV 1 │    │ DIV 2 │         │
│ │ Steel │    │ Alum  │ │ Steel │    │Plastic│ │ Steel │    │Supplies│        │
│ └───┬───┘    └───┬───┘ └───┬───┘    └───┬───┘ └───┬───┘    └───┬───┘         │
│     │            │         │            │         │            │              │
│   ┌─┴─┐        ┌─┴─┐     ┌─┴─┐        ┌─┴─┐     ┌─┴─┐        ┌─┴─┐           │
│   │   │        │   │     │   │        │   │     │   │        │   │           │
│   ▼   ▼        ▼   ▼     ▼   ▼        ▼   ▼     ▼   ▼        ▼   ▼           │
│  LOC LOC      LOC LOC   LOC LOC      LOC LOC   LOC LOC      LOC LOC          │
│                                                                                 │
│  ═══════════════════════════════════════════════════════════════════════════   │
│                                                                                 │
│  HIERARCHY LEVELS:                                                              │
│                                                                                 │
│  1. PLATFORM    - SteelWise system owner (us)                                  │
│  2. TENANT      - Customer company (isolated, billable entity)                 │
│  3. DIVISION    - Business unit within tenant (Steel, Aluminum, etc.)          │
│  4. LOCATION    - Physical site (warehouse, branch, processing center)         │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. MULTI-TENANT ARCHITECTURE OPTIONS

### 2.1 Architecture Comparison

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    MULTI-TENANT ARCHITECTURE OPTIONS                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  OPTION A: SHARED DATABASE, SHARED SCHEMA (Row-Level Isolation)                │
│  ═══════════════════════════════════════════════════════════════════════════   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         SHARED DATABASE                                 │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │   │
│  │  │ orders                                                          │   │   │
│  │  │ ┌──────────┬─────────┬────────────┬────────────┬─────────────┐ │   │   │
│  │  │ │ id       │ tenantId│ customerId │ total      │ ...         │ │   │   │
│  │  │ ├──────────┼─────────┼────────────┼────────────┼─────────────┤ │   │   │
│  │  │ │ 1        │ ABC     │ C001       │ $5,000     │             │ │   │   │
│  │  │ │ 2        │ XYZ     │ C002       │ $3,200     │             │ │   │   │
│  │  │ │ 3        │ ABC     │ C003       │ $8,100     │             │ │   │   │
│  │  │ └──────────┴─────────┴────────────┴────────────┴─────────────┘ │   │   │
│  │  └─────────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ✓ Pros: Simple, cost-effective, easy to deploy                               │
│  ✗ Cons: No physical isolation, complex queries, noisy neighbor risk          │
│                                                                                 │
│  ─────────────────────────────────────────────────────────────────────────────  │
│                                                                                 │
│  OPTION B: SHARED DATABASE, SEPARATE SCHEMAS                                    │
│  ═══════════════════════════════════════════════════════════════════════════   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         SHARED DATABASE                                 │   │
│  │  ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐   │   │
│  │  │ SCHEMA: abc_steel │  │ SCHEMA: xyz_metals│  │ SCHEMA: regional  │   │   │
│  │  │ ┌───────────────┐ │  │ ┌───────────────┐ │  │ ┌───────────────┐ │   │   │
│  │  │ │ orders        │ │  │ │ orders        │ │  │ │ orders        │ │   │   │
│  │  │ │ customers     │ │  │ │ customers     │ │  │ │ customers     │ │   │   │
│  │  │ │ inventory     │ │  │ │ inventory     │ │  │ │ inventory     │ │   │   │
│  │  │ └───────────────┘ │  │ └───────────────┘ │  │ └───────────────┘ │   │   │
│  │  └───────────────────┘  └───────────────────┘  └───────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ✓ Pros: Better isolation, easier backup/restore per tenant                   │
│  ✗ Cons: Schema migration complexity, still shared resources                  │
│                                                                                 │
│  ─────────────────────────────────────────────────────────────────────────────  │
│                                                                                 │
│  OPTION C: SEPARATE DATABASES PER TENANT ★ RECOMMENDED ★                       │
│  ═══════════════════════════════════════════════════════════════════════════   │
│                                                                                 │
│  ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐          │
│  │ DATABASE:         │  │ DATABASE:         │  │ DATABASE:         │          │
│  │ abc_steel_prod    │  │ xyz_metals_prod   │  │ regional_prod     │          │
│  │ ┌───────────────┐ │  │ ┌───────────────┐ │  │ ┌───────────────┐ │          │
│  │ │ orders        │ │  │ │ orders        │ │  │ │ orders        │ │          │
│  │ │ customers     │ │  │ │ customers     │ │  │ │ customers     │ │          │
│  │ │ inventory     │ │  │ │ inventory     │ │  │ │ inventory     │ │          │
│  │ └───────────────┘ │  │ └───────────────┘ │  │ └───────────────┘ │          │
│  └───────────────────┘  └───────────────────┘  └───────────────────┘          │
│                                                                                 │
│  ✓ Pros: Complete isolation, independent scaling, easy data portability       │
│  ✓ Pros: Per-tenant backup/restore, compliance-friendly                       │
│  ✗ Cons: Higher infrastructure cost, connection pool management               │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Recommended Architecture: Hybrid Approach

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    RECOMMENDED: HYBRID ARCHITECTURE                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                      PLATFORM CONTROL PLANE                             │   │
│  │                      (Shared across all tenants)                        │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │   │
│  │  │ Tenant      │  │ Billing     │  │ Identity    │  │ Feature     │    │   │
│  │  │ Registry    │  │ Engine      │  │ Provider    │  │ Flags       │    │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                    │                                           │
│                           Tenant Resolution                                     │
│                                    │                                           │
│                                    ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                      APPLICATION TIER                                   │   │
│  │                      (Shared, Stateless Services)                       │   │
│  │                                                                         │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │   │
│  │  │ API Gateway │  │ Order Svc   │  │ Inventory   │  │ Shop Floor  │    │   │
│  │  │             │  │             │  │ Svc         │  │ Svc         │    │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    │   │
│  │                                                                         │   │
│  │  All services are tenant-aware via TenantContext                       │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                    │                                           │
│                         Connection Routing                                      │
│                                    │                                           │
│         ┌──────────────────────────┼──────────────────────────┐                │
│         │                          │                          │                │
│         ▼                          ▼                          ▼                │
│  ┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐        │
│  │   TENANT A DB   │      │   TENANT B DB   │      │   TENANT C DB   │        │
│  │   (Dedicated)   │      │   (Dedicated)   │      │   (Dedicated)   │        │
│  └─────────────────┘      └─────────────────┘      └─────────────────┘        │
│                                                                                 │
│  ═══════════════════════════════════════════════════════════════════════════   │
│                                                                                 │
│  KEY DECISIONS:                                                                 │
│                                                                                 │
│  • Control Plane: SHARED - Tenant registry, billing, identity                  │
│  • Application Tier: SHARED - Stateless, tenant-context aware                  │
│  • Data Tier: ISOLATED - Separate database per tenant                          │
│  • File Storage: ISOLATED - Separate blob containers per tenant                │
│  • Cache: SHARED with tenant-prefixed keys                                     │
│  • Message Queues: SHARED with tenant routing                                  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. TENANT BOUNDARIES

### 3.1 Boundary Definition

```typescript
interface Tenant {
  tenantId: string;               // Unique identifier (UUID)
  tenantCode: string;             // Short code (e.g., 'ABC', 'XYZ')
  tenantName: string;             // Company name
  
  // Status
  status: 'PROVISIONING' | 'ACTIVE' | 'SUSPENDED' | 'TERMINATED';
  createdAt: Date;
  activatedAt?: Date;
  
  // Subscription
  subscriptionTier: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
  billingAccountId: string;
  
  // Configuration
  settings: TenantSettings;
  branding: TenantBranding;
  
  // Resource allocation
  databaseHost: string;
  databaseName: string;
  storageContainer: string;
  
  // Limits
  limits: TenantLimits;
}

interface TenantLimits {
  maxUsers: number;
  maxLocations: number;
  maxDivisions: number;
  maxStorageGB: number;
  maxApiRequestsPerHour: number;
  maxConcurrentConnections: number;
}
```

### 3.2 Resource Isolation Matrix

| Resource | Isolation Level | Implementation |
|----------|----------------|----------------|
| **Database** | Full | Separate database per tenant |
| **File Storage** | Full | Separate blob container |
| **API Endpoints** | Shared | Tenant header/subdomain routing |
| **Application Servers** | Shared | Stateless, tenant-context middleware |
| **Cache (Redis)** | Logical | Tenant-prefixed keys |
| **Message Queue** | Logical | Tenant-prefixed topics/queues |
| **Search Index** | Logical | Tenant-filtered indices |
| **Background Jobs** | Logical | Tenant-tagged job metadata |
| **Logs/Metrics** | Logical | Tenant dimension in all logs |
| **Secrets** | Full | Tenant-specific secret stores |

### 3.3 Tenant Context Propagation

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      TENANT CONTEXT PROPAGATION                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  REQUEST FLOW:                                                                  │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  1. REQUEST ARRIVES                                                     │   │
│  │  ─────────────────────────────────────────────────────────────────────  │   │
│  │                                                                         │   │
│  │  Method 1: Subdomain                                                    │   │
│  │  https://abc-steel.steelwise.com/api/orders                            │   │
│  │          ─────────                                                      │   │
│  │          tenant = abc-steel                                             │   │
│  │                                                                         │   │
│  │  Method 2: Header                                                       │   │
│  │  X-Tenant-ID: abc-steel                                                │   │
│  │                                                                         │   │
│  │  Method 3: JWT Claim                                                    │   │
│  │  { "tenant_id": "abc-steel", "user_id": "...", ... }                   │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                      │                                          │
│                                      ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  2. TENANT RESOLUTION MIDDLEWARE                                        │   │
│  │  ─────────────────────────────────────────────────────────────────────  │   │
│  │                                                                         │   │
│  │  • Extract tenant identifier from request                               │   │
│  │  • Validate tenant exists and is active                                 │   │
│  │  • Load tenant configuration from cache/registry                        │   │
│  │  • Set TenantContext for request lifecycle                              │   │
│  │  • Verify user belongs to tenant                                        │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                      │                                          │
│                                      ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  3. DATABASE CONNECTION ROUTING                                         │   │
│  │  ─────────────────────────────────────────────────────────────────────  │   │
│  │                                                                         │   │
│  │  TenantContext.tenantId → Connection Pool Manager                       │   │
│  │                                                                         │   │
│  │  Pool Manager routes to tenant-specific database:                       │   │
│  │  • abc-steel → postgres://abc-steel-db.cluster/abc_steel_prod          │   │
│  │  • xyz-metals → postgres://xyz-metals-db.cluster/xyz_metals_prod       │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                      │                                          │
│                                      ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  4. CONTEXT AVAILABLE THROUGHOUT REQUEST                                │   │
│  │  ─────────────────────────────────────────────────────────────────────  │   │
│  │                                                                         │   │
│  │  • Services: TenantContext.current().tenantId                          │   │
│  │  • Repositories: Automatic connection to tenant DB                      │   │
│  │  • Storage: Tenant container/prefix                                     │   │
│  │  • Cache: Tenant-prefixed keys                                          │   │
│  │  • Events: Tenant tagged in all events                                  │   │
│  │  • Logs: Tenant dimension in all logs                                   │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 3.4 Tenant Context Implementation

```typescript
// Tenant Context (AsyncLocalStorage for Node.js)
import { AsyncLocalStorage } from 'async_hooks';

interface TenantContext {
  tenantId: string;
  tenantCode: string;
  tenantName: string;
  databaseConnection: string;
  storageContainer: string;
  settings: TenantSettings;
  limits: TenantLimits;
  user?: UserContext;
}

const tenantStorage = new AsyncLocalStorage<TenantContext>();

// Middleware to establish context
async function tenantMiddleware(req: Request, res: Response, next: NextFunction) {
  // Extract tenant from request
  const tenantId = extractTenantId(req);
  
  if (!tenantId) {
    return res.status(400).json({ error: 'Tenant identification required' });
  }
  
  // Load tenant from registry (cached)
  const tenant = await tenantRegistry.getTenant(tenantId);
  
  if (!tenant) {
    return res.status(404).json({ error: 'Tenant not found' });
  }
  
  if (tenant.status !== 'ACTIVE') {
    return res.status(403).json({ error: 'Tenant is not active' });
  }
  
  // Validate user belongs to tenant
  if (req.user && req.user.tenantId !== tenantId) {
    return res.status(403).json({ error: 'User does not belong to this tenant' });
  }
  
  // Create context
  const context: TenantContext = {
    tenantId: tenant.tenantId,
    tenantCode: tenant.tenantCode,
    tenantName: tenant.tenantName,
    databaseConnection: tenant.databaseHost,
    storageContainer: tenant.storageContainer,
    settings: tenant.settings,
    limits: tenant.limits,
    user: req.user
  };
  
  // Run request in tenant context
  tenantStorage.run(context, () => {
    next();
  });
}

// Access context anywhere in the request
function getCurrentTenant(): TenantContext {
  const context = tenantStorage.getStore();
  if (!context) {
    throw new Error('No tenant context available');
  }
  return context;
}

// Usage in service
class OrderService {
  async createOrder(orderData: CreateOrderDto): Promise<Order> {
    const tenant = getCurrentTenant();
    
    // Database automatically routed to tenant DB
    const order = await this.orderRepository.create({
      ...orderData,
      tenantId: tenant.tenantId  // Redundant but explicit
    });
    
    // Log includes tenant dimension automatically
    this.logger.info('Order created', { orderId: order.id });
    
    return order;
  }
}
```

---

## 4. DATA ISOLATION

### 4.1 Database Isolation Strategy

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        DATABASE ISOLATION STRATEGY                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  TIER 1: ENTERPRISE TENANTS (Dedicated Resources)                              │
│  ═══════════════════════════════════════════════════════════════════════════   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                         │   │
│  │  ┌─────────────────┐      Dedicated Database Instance                  │   │
│  │  │ ABC STEEL       │      • Own server/cluster                          │   │
│  │  │ (Enterprise)    │──────• Custom scaling                              │   │
│  │  │                 │      • Custom backup schedule                      │   │
│  │  │ 500+ users      │      • Custom retention                            │   │
│  │  │ 15 locations    │      • Point-in-time recovery                      │   │
│  │  └─────────────────┘      • Read replicas available                     │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  TIER 2: PROFESSIONAL TENANTS (Dedicated Database, Shared Cluster)             │
│  ═══════════════════════════════════════════════════════════════════════════   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  SHARED CLUSTER                                                         │   │
│  │  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐           │   │
│  │  │ xyz_metals_prod │ │ regional_prod   │ │ midwest_prod    │           │   │
│  │  │ (Professional)  │ │ (Professional)  │ │ (Professional)  │           │   │
│  │  │                 │ │                 │ │                 │           │   │
│  │  │ 50-500 users    │ │ 50-500 users    │ │ 50-500 users    │           │   │
│  │  │ 5-15 locations  │ │ 5-15 locations  │ │ 5-15 locations  │           │   │
│  │  └─────────────────┘ └─────────────────┘ └─────────────────┘           │   │
│  │                                                                         │   │
│  │  • Separate databases on shared PostgreSQL cluster                     │   │
│  │  • Resource limits per database                                        │   │
│  │  • Shared backup infrastructure                                        │   │
│  │  • Daily backups, 30-day retention                                     │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  TIER 3: STARTER TENANTS (Shared Database, Schema Isolation)                   │
│  ═══════════════════════════════════════════════════════════════════════════   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  SHARED DATABASE: steelwise_starter_pool                               │   │
│  │                                                                         │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │   │
│  │  │ SCHEMA:     │ │ SCHEMA:     │ │ SCHEMA:     │ │ SCHEMA:     │       │   │
│  │  │ small_co_1  │ │ small_co_2  │ │ small_co_3  │ │ small_co_4  │       │   │
│  │  │ (Starter)   │ │ (Starter)   │ │ (Starter)   │ │ (Starter)   │       │   │
│  │  │ <50 users   │ │ <50 users   │ │ <50 users   │ │ <50 users   │       │   │
│  │  │ <5 locations│ │ <5 locations│ │ <5 locations│ │ <5 locations│       │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘       │   │
│  │                                                                         │   │
│  │  • Schema-per-tenant on shared database                                 │   │
│  │  • Row-level security as backup                                        │   │
│  │  • Shared backups                                                      │   │
│  │  • Upgrade path to Professional tier                                   │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Connection Pool Management

```typescript
interface TenantConnectionPool {
  tenantId: string;
  poolConfig: {
    host: string;
    database: string;
    schema?: string;           // For Starter tier
    maxConnections: number;
    minConnections: number;
    idleTimeoutMs: number;
  };
  pool: Pool;
  lastAccessed: Date;
}

class TenantDatabaseManager {
  private pools: Map<string, TenantConnectionPool> = new Map();
  private maxIdlePools = 100;  // Max inactive pools to keep
  
  async getConnection(tenantId: string): Promise<PoolClient> {
    let tenantPool = this.pools.get(tenantId);
    
    if (!tenantPool) {
      tenantPool = await this.createPool(tenantId);
      this.pools.set(tenantId, tenantPool);
    }
    
    tenantPool.lastAccessed = new Date();
    
    // Cleanup old pools periodically
    this.cleanupIdlePools();
    
    const client = await tenantPool.pool.connect();
    
    // For Starter tier, set schema
    if (tenantPool.poolConfig.schema) {
      await client.query(`SET search_path TO ${tenantPool.poolConfig.schema}`);
    }
    
    return client;
  }
  
  private async createPool(tenantId: string): Promise<TenantConnectionPool> {
    const tenant = await this.tenantRegistry.getTenant(tenantId);
    
    const poolConfig = this.getPoolConfig(tenant);
    
    const pool = new Pool({
      host: poolConfig.host,
      database: poolConfig.database,
      max: poolConfig.maxConnections,
      min: poolConfig.minConnections,
      idleTimeoutMillis: poolConfig.idleTimeoutMs
    });
    
    return {
      tenantId,
      poolConfig,
      pool,
      lastAccessed: new Date()
    };
  }
  
  private getPoolConfig(tenant: Tenant): PoolConfig {
    switch (tenant.subscriptionTier) {
      case 'ENTERPRISE':
        return {
          host: tenant.databaseHost,
          database: tenant.databaseName,
          maxConnections: 100,
          minConnections: 10,
          idleTimeoutMs: 60000
        };
      case 'PROFESSIONAL':
        return {
          host: 'shared-cluster.steelwise.com',
          database: tenant.databaseName,
          maxConnections: 50,
          minConnections: 5,
          idleTimeoutMs: 30000
        };
      case 'STARTER':
        return {
          host: 'starter-pool.steelwise.com',
          database: 'steelwise_starter',
          schema: tenant.tenantCode,
          maxConnections: 20,
          minConnections: 2,
          idleTimeoutMs: 10000
        };
    }
  }
}
```

### 4.3 Cross-Tenant Data Prevention

```typescript
// Prisma middleware for tenant isolation
prisma.$use(async (params, next) => {
  const tenant = getCurrentTenant();
  
  if (!tenant) {
    throw new Error('Tenant context required for database operations');
  }
  
  // For writes, ensure tenantId is set
  if (['create', 'createMany', 'update', 'updateMany', 'upsert'].includes(params.action)) {
    if (params.args.data) {
      // Inject tenantId into data (even though we use separate DBs)
      params.args.data.tenantId = tenant.tenantId;
    }
  }
  
  // For reads, add tenant filter
  if (['findFirst', 'findMany', 'findUnique', 'count', 'aggregate'].includes(params.action)) {
    if (!params.args) params.args = {};
    if (!params.args.where) params.args.where = {};
    
    // Add tenant filter as safety check
    params.args.where.tenantId = tenant.tenantId;
  }
  
  // For deletes, add tenant filter
  if (['delete', 'deleteMany'].includes(params.action)) {
    if (!params.args) params.args = {};
    if (!params.args.where) params.args.where = {};
    
    params.args.where.tenantId = tenant.tenantId;
  }
  
  return next(params);
});

// Row-Level Security (PostgreSQL) for additional protection
/*
  CREATE POLICY tenant_isolation ON orders
    USING (tenant_id = current_setting('app.current_tenant')::uuid);
  
  ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
*/
```

---

## 5. ROLE PROPAGATION

### 5.1 Role Hierarchy in Multi-Tenant Context

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    MULTI-TENANT ROLE HIERARCHY                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  PLATFORM LEVEL (SteelWise Staff)                                               │
│  ═══════════════════════════════════════════════════════════════════════════   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  ┌─────────────────┐                                                    │   │
│  │  │ PLATFORM_ADMIN  │  Full platform access, all tenants                 │   │
│  │  └────────┬────────┘                                                    │   │
│  │           │                                                              │   │
│  │  ┌────────┼────────┬─────────────────┐                                  │   │
│  │  │        │        │                 │                                  │   │
│  │  ▼        ▼        ▼                 ▼                                  │   │
│  │ ┌────────┐ ┌──────┐ ┌─────────────┐ ┌──────────────┐                   │   │
│  │ │PLATFORM│ │BILLING│ │  SUPPORT    │ │  PLATFORM   │                   │   │
│  │ │OPS     │ │ADMIN  │ │  AGENT      │ │  DEV        │                   │   │
│  │ └────────┘ └──────┘ └─────────────┘ └──────────────┘                   │   │
│  │                                                                         │   │
│  │  * Can impersonate tenant users for support                             │   │
│  │  * Cannot modify tenant data directly                                   │   │
│  │  * Full audit trail for platform access                                 │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  TENANT LEVEL (Customer Users)                                                  │
│  ═══════════════════════════════════════════════════════════════════════════   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                         │   │
│  │  ┌─────────────────┐                                                    │   │
│  │  │  TENANT_OWNER   │  Full access within tenant                         │   │
│  │  └────────┬────────┘  (Typically company owner/CEO)                     │   │
│  │           │                                                              │   │
│  │  ┌────────┴────────┐                                                    │   │
│  │  │                 │                                                    │   │
│  │  ▼                 ▼                                                    │   │
│  │ ┌─────────────┐  ┌─────────────┐                                        │   │
│  │ │TENANT_ADMIN │  │ DIV_MANAGER │                                        │   │
│  │ │(IT Admin)   │  │(Division VP)│                                        │   │
│  │ └──────┬──────┘  └──────┬──────┘                                        │   │
│  │        │                │                                               │   │
│  │        │         ┌──────┴──────┐                                        │   │
│  │        │         │             │                                        │   │
│  │        ▼         ▼             ▼                                        │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐                                │   │
│  │  │ LOC_MGR  │ │ SALES_MGR│ │ OPS_MGR  │                                │   │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘                                │   │
│  │       │            │            │                                       │   │
│  │       ▼            ▼            ▼                                       │   │
│  │  ┌──────────────────────────────────────────────────────────────────┐  │   │
│  │  │  Standard Operational Roles (as defined in Access Control doc)  │  │   │
│  │  │  SALES_REP, SUPERVISOR, OPERATOR, COUNTER, SHIPPING, etc.       │  │   │
│  │  └──────────────────────────────────────────────────────────────────┘  │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Role Assignment Model

```typescript
interface TenantUser {
  userId: string;
  tenantId: string;
  email: string;
  name: string;
  
  // Role assignments (can have multiple)
  roleAssignments: RoleAssignment[];
  
  // Scope restrictions
  divisionAccess: string[];          // Division IDs user can access
  locationAccess: string[];          // Location IDs user can access
  
  // Status
  status: 'ACTIVE' | 'INACTIVE' | 'LOCKED';
  lastLogin?: Date;
}

interface RoleAssignment {
  roleId: string;                    // Role code (e.g., 'SALES_MGR')
  scope: RoleScope;
  assignedAt: Date;
  assignedBy: string;
  expiresAt?: Date;                  // Optional expiration
}

interface RoleScope {
  type: 'TENANT' | 'DIVISION' | 'LOCATION';
  scopeId: string;                   // tenant/division/location ID
}

// Example: User with different roles at different scopes
const exampleUser: TenantUser = {
  userId: 'user-123',
  tenantId: 'abc-steel',
  email: 'john.smith@abcsteel.com',
  name: 'John Smith',
  roleAssignments: [
    {
      roleId: 'SALES_MGR',
      scope: { type: 'DIVISION', scopeId: 'div-steel' },
      assignedAt: new Date('2025-01-01'),
      assignedBy: 'admin-user'
    },
    {
      roleId: 'SALES_REP',
      scope: { type: 'DIVISION', scopeId: 'div-aluminum' },
      assignedAt: new Date('2025-01-01'),
      assignedBy: 'admin-user'
    }
  ],
  divisionAccess: ['div-steel', 'div-aluminum'],
  locationAccess: ['loc-houston', 'loc-dallas', 'loc-austin'],
  status: 'ACTIVE'
};
```

### 5.3 Permission Resolution

```typescript
class PermissionResolver {
  
  async hasPermission(
    user: TenantUser,
    permission: string,
    resourceScope?: ResourceScope
  ): Promise<boolean> {
    
    // Get all role assignments for user
    const assignments = user.roleAssignments.filter(a => 
      !a.expiresAt || a.expiresAt > new Date()
    );
    
    for (const assignment of assignments) {
      // Check if role has the permission
      const role = await this.roleRegistry.getRole(assignment.roleId);
      if (!role.permissions.includes(permission)) {
        continue;
      }
      
      // Check scope match
      if (resourceScope) {
        if (!this.scopeMatches(assignment.scope, resourceScope)) {
          continue;
        }
      }
      
      return true;
    }
    
    return false;
  }
  
  private scopeMatches(roleScope: RoleScope, resourceScope: ResourceScope): boolean {
    switch (roleScope.type) {
      case 'TENANT':
        // Tenant-wide role covers everything
        return true;
        
      case 'DIVISION':
        // Division role covers division and its locations
        return resourceScope.divisionId === roleScope.scopeId ||
               (resourceScope.type === 'LOCATION' && 
                this.locationBelongsToDivision(resourceScope.locationId, roleScope.scopeId));
        
      case 'LOCATION':
        // Location role only covers that location
        return resourceScope.type === 'LOCATION' && 
               resourceScope.locationId === roleScope.scopeId;
    }
  }
}
```

---

## 6. BRANDING & WHITE LABEL

### 6.1 Branding Configuration

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        TENANT BRANDING OPTIONS                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  TIER: STARTER                                                                  │
│  ───────────────────────────────────────────────────────────────────────────── │
│  ✓ Company name in header                                                       │
│  ✓ Company logo (one size)                                                      │
│  ✗ Custom colors                                                                │
│  ✗ Custom subdomain                                                             │
│  ✗ White label (SteelWise branding visible)                                    │
│                                                                                 │
│  TIER: PROFESSIONAL                                                             │
│  ───────────────────────────────────────────────────────────────────────────── │
│  ✓ Company name in header                                                       │
│  ✓ Company logo (multiple sizes)                                               │
│  ✓ Primary and accent colors                                                   │
│  ✓ Custom subdomain (company.steelwise.com)                                    │
│  ✓ Email templates with company branding                                       │
│  ✗ White label (SteelWise "Powered by" visible)                               │
│                                                                                 │
│  TIER: ENTERPRISE                                                               │
│  ───────────────────────────────────────────────────────────────────────────── │
│  ✓ Full theme customization                                                    │
│  ✓ Multiple logo variants (dark/light, icon, full)                            │
│  ✓ Complete color palette                                                      │
│  ✓ Custom fonts                                                                │
│  ✓ Custom subdomain                                                            │
│  ✓ Custom domain (erp.company.com)                                             │
│  ✓ Full white label (no SteelWise branding)                                   │
│  ✓ Custom login page                                                           │
│  ✓ Custom email domain                                                         │
│  ✓ Custom document templates                                                   │
│  ✓ Custom mobile app icon (optional add-on)                                   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Branding Data Model

```typescript
interface TenantBranding {
  tenantId: string;
  
  // Basic
  companyName: string;
  tagline?: string;
  
  // Logos
  logos: {
    primary: string;             // URL to main logo
    icon?: string;               // Square icon version
    lightMode?: string;          // For light backgrounds
    darkMode?: string;           // For dark backgrounds
    favicon?: string;            // Browser favicon
  };
  
  // Colors
  colors: {
    primary: string;             // Primary brand color
    primaryLight?: string;
    primaryDark?: string;
    accent?: string;             // Secondary/accent color
    background?: string;         // App background
    surface?: string;            // Card/surface color
    text?: string;               // Primary text
    textSecondary?: string;
    error?: string;
    warning?: string;
    success?: string;
  };
  
  // Typography
  fonts?: {
    heading?: string;            // Font family for headings
    body?: string;               // Font family for body text
  };
  
  // Domain
  domain: {
    subdomain: string;           // abc-steel.steelwise.com
    customDomain?: string;       // erp.abcsteel.com
  };
  
  // White label
  whiteLabel: {
    enabled: boolean;
    hidePoweredBy: boolean;
    customLoginPage: boolean;
    customEmailDomain?: string;
  };
  
  // Documents
  documentBranding: {
    headerLogo: string;
    footerText: string;
    showCompanyAddress: boolean;
  };
}

// CSS Variable Generation
function generateBrandingCSS(branding: TenantBranding): string {
  return `
    :root {
      --brand-primary: ${branding.colors.primary};
      --brand-primary-light: ${branding.colors.primaryLight || lighten(branding.colors.primary, 20)};
      --brand-primary-dark: ${branding.colors.primaryDark || darken(branding.colors.primary, 20)};
      --brand-accent: ${branding.colors.accent || branding.colors.primary};
      --brand-background: ${branding.colors.background || '#ffffff'};
      --brand-surface: ${branding.colors.surface || '#f5f5f5'};
      --brand-text: ${branding.colors.text || '#1a1a1a'};
      --brand-text-secondary: ${branding.colors.textSecondary || '#666666'};
      --font-heading: ${branding.fonts?.heading || 'Inter, sans-serif'};
      --font-body: ${branding.fonts?.body || 'Inter, sans-serif'};
    }
  `;
}
```

### 6.3 Custom Domain Configuration

```typescript
// Domain verification and routing
interface CustomDomainConfig {
  tenantId: string;
  customDomain: string;           // erp.abcsteel.com
  verificationStatus: 'PENDING' | 'VERIFIED' | 'FAILED';
  verificationToken: string;      // DNS TXT record value
  sslStatus: 'PENDING' | 'ACTIVE' | 'EXPIRED';
  sslExpiresAt?: Date;
  createdAt: Date;
}

// Domain verification flow
async function verifyCustomDomain(tenantId: string, domain: string): Promise<void> {
  // 1. Generate verification token
  const token = generateVerificationToken();
  
  // 2. Save domain config
  await domainRepo.save({
    tenantId,
    customDomain: domain,
    verificationStatus: 'PENDING',
    verificationToken: token
  });
  
  // 3. Instruct user to add DNS TXT record
  // _steelwise-verify.erp.abcsteel.com TXT "sw-verify=abc123..."
  
  // 4. Background job checks DNS periodically
  // 5. Once verified, provision SSL certificate
  // 6. Configure load balancer routing
}

// Request routing by domain
function resolveTenantFromDomain(hostname: string): string | null {
  // Check subdomain pattern
  const subdomainMatch = hostname.match(/^([a-z0-9-]+)\.steelwise\.com$/);
  if (subdomainMatch) {
    return tenantRegistry.getBySubdomain(subdomainMatch[1]);
  }
  
  // Check custom domain
  const customDomain = domainRegistry.getByCustomDomain(hostname);
  if (customDomain) {
    return customDomain.tenantId;
  }
  
  return null;
}
```

---

## 7. BILLING MODEL

### 7.1 Billing Dimensions

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          BILLING DIMENSIONS                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  DIMENSION 1: SUBSCRIPTION TIER (Base Platform Fee)                            │
│  ═══════════════════════════════════════════════════════════════════════════   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ Tier         │ Monthly Base │ Includes                                 │   │
│  │ ─────────────│──────────────│───────────────────────────────────────── │   │
│  │ STARTER      │ $499/mo      │ 1 location, 5 users, core modules       │   │
│  │ PROFESSIONAL │ $1,499/mo    │ 5 locations, 25 users, all modules      │   │
│  │ ENTERPRISE   │ $4,999/mo    │ Unlimited locations, 100 users, all     │   │
│  │              │ + custom     │ modules + white label + SLA             │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  DIMENSION 2: USERS (Per User Fee)                                              │
│  ═══════════════════════════════════════════════════════════════════════════   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ User Type        │ Monthly Fee │ Notes                                 │   │
│  │ ─────────────────│─────────────│────────────────────────────────────── │   │
│  │ Full User        │ $49/user    │ Complete access                       │   │
│  │ Operator User    │ $19/user    │ Shop floor access only                │   │
│  │ View-Only User   │ $9/user     │ Dashboard/report access               │   │
│  │ Customer Portal  │ $0          │ Included (unlimited)                  │   │
│  │                  │             │                                        │   │
│  │ Included in tier uses tier rate; additional users billed separately   │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  DIMENSION 3: LOCATIONS (Per Location Fee)                                      │
│  ═══════════════════════════════════════════════════════════════════════════   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ Tier         │ Included │ Additional Location                         │   │
│  │ ─────────────│──────────│────────────────────────────────────────────  │   │
│  │ STARTER      │ 1        │ Not available (upgrade required)            │   │
│  │ PROFESSIONAL │ 5        │ $299/location/month                          │   │
│  │ ENTERPRISE   │ Unlimited│ Included in base                             │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  DIMENSION 4: MODULES (Optional Module Fees)                                    │
│  ═══════════════════════════════════════════════════════════════════════════   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ Module               │ Starter │ Professional │ Enterprise            │   │
│  │ ─────────────────────│─────────│──────────────│─────────────────────  │   │
│  │ Order Management     │ ✓       │ ✓            │ ✓                      │   │
│  │ Inventory            │ ✓       │ ✓            │ ✓                      │   │
│  │ Shop Floor           │ ✓       │ ✓            │ ✓                      │   │
│  │ Shipping             │ ✓       │ ✓            │ ✓                      │   │
│  │ Billing              │ ✓       │ ✓            │ ✓                      │   │
│  │ ─────────────────────│─────────│──────────────│─────────────────────  │   │
│  │ Advanced Scheduling  │ $199/mo │ ✓            │ ✓                      │   │
│  │ Traceability/MTR     │ $149/mo │ ✓            │ ✓                      │   │
│  │ Advanced Analytics   │ $299/mo │ $199/mo      │ ✓                      │   │
│  │ Customer Portal      │ $199/mo │ ✓            │ ✓                      │   │
│  │ API Access           │ N/A     │ $299/mo      │ ✓                      │   │
│  │ EDI Integration      │ N/A     │ $499/mo      │ ✓                      │   │
│  │ Advanced Pricing     │ $99/mo  │ ✓            │ ✓                      │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  DIMENSION 5: USAGE-BASED (Transaction Volume)                                  │
│  ═══════════════════════════════════════════════════════════════════════════   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ Metric               │ Included        │ Overage                       │   │
│  │ ─────────────────────│─────────────────│─────────────────────────────  │   │
│  │ Orders/Month         │ 500 / 2,000 / ∞ │ $0.50/order                   │   │
│  │ Storage (GB)         │ 10 / 50 / 500   │ $0.10/GB                      │   │
│  │ API Calls/Month      │ N/A / 100K / 1M │ $0.001/call                   │   │
│  │ Email Notifications  │ 1K / 10K / 50K  │ $0.01/email                   │   │
│  │ SMS Notifications    │ 100 / 500 / 2K  │ $0.05/SMS                     │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Billing Data Model

```typescript
interface TenantSubscription {
  subscriptionId: string;
  tenantId: string;
  
  // Plan
  tier: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
  status: 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'SUSPENDED';
  
  // Billing cycle
  billingCycle: 'MONTHLY' | 'ANNUAL';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  
  // Payment
  paymentMethodId: string;
  billingEmail: string;
  
  // Base pricing
  basePriceMonthly: number;
  
  // Add-ons
  addons: SubscriptionAddon[];
  
  // Usage tracking
  usageLimits: UsageLimits;
  currentUsage: CurrentUsage;
}

interface SubscriptionAddon {
  addonId: string;
  addonType: 'USER' | 'LOCATION' | 'MODULE' | 'STORAGE';
  quantity: number;
  unitPrice: number;
  startDate: Date;
  endDate?: Date;
}

interface UsageLimits {
  maxUsers: number;
  maxLocations: number;
  maxOrdersPerMonth: number;
  maxStorageGB: number;
  maxApiCallsPerMonth: number;
  maxEmailsPerMonth: number;
  maxSmsPerMonth: number;
}

interface CurrentUsage {
  periodStart: Date;
  periodEnd: Date;
  
  activeUsers: number;
  activeLocations: number;
  ordersThisPeriod: number;
  storageUsedGB: number;
  apiCallsThisPeriod: number;
  emailsSentThisPeriod: number;
  smsSentThisPeriod: number;
}
```

### 7.3 Invoice Generation

```typescript
interface TenantInvoice {
  invoiceId: string;
  tenantId: string;
  subscriptionId: string;
  
  // Period
  periodStart: Date;
  periodEnd: Date;
  invoiceDate: Date;
  dueDate: Date;
  
  // Status
  status: 'DRAFT' | 'OPEN' | 'PAID' | 'VOID' | 'UNCOLLECTIBLE';
  
  // Line items
  lineItems: InvoiceLineItem[];
  
  // Totals
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  amountPaid: number;
  amountDue: number;
}

interface InvoiceLineItem {
  description: string;
  category: 'BASE' | 'USER' | 'LOCATION' | 'MODULE' | 'USAGE' | 'OVERAGE';
  quantity: number;
  unitPrice: number;
  amount: number;
}

// Invoice generation
async function generateMonthlyInvoice(tenantId: string): Promise<TenantInvoice> {
  const subscription = await subscriptionRepo.getByTenantId(tenantId);
  const usage = await usageTracker.getUsageForPeriod(tenantId, subscription.currentPeriodStart, subscription.currentPeriodEnd);
  
  const lineItems: InvoiceLineItem[] = [];
  
  // 1. Base subscription
  lineItems.push({
    description: `${subscription.tier} Plan - Monthly`,
    category: 'BASE',
    quantity: 1,
    unitPrice: subscription.basePriceMonthly,
    amount: subscription.basePriceMonthly
  });
  
  // 2. Additional users
  const includedUsers = getIncludedUsers(subscription.tier);
  const additionalUsers = Math.max(0, usage.activeUsers - includedUsers);
  if (additionalUsers > 0) {
    lineItems.push({
      description: `Additional Users (${additionalUsers})`,
      category: 'USER',
      quantity: additionalUsers,
      unitPrice: 49,
      amount: additionalUsers * 49
    });
  }
  
  // 3. Additional locations
  const includedLocations = getIncludedLocations(subscription.tier);
  const additionalLocations = Math.max(0, usage.activeLocations - includedLocations);
  if (additionalLocations > 0) {
    lineItems.push({
      description: `Additional Locations (${additionalLocations})`,
      category: 'LOCATION',
      quantity: additionalLocations,
      unitPrice: 299,
      amount: additionalLocations * 299
    });
  }
  
  // 4. Module add-ons
  for (const addon of subscription.addons.filter(a => a.addonType === 'MODULE')) {
    lineItems.push({
      description: `${getModuleName(addon.addonId)} Module`,
      category: 'MODULE',
      quantity: 1,
      unitPrice: addon.unitPrice,
      amount: addon.unitPrice
    });
  }
  
  // 5. Usage overages
  const orderOverage = Math.max(0, usage.ordersThisPeriod - subscription.usageLimits.maxOrdersPerMonth);
  if (orderOverage > 0) {
    lineItems.push({
      description: `Order Overage (${orderOverage} orders)`,
      category: 'OVERAGE',
      quantity: orderOverage,
      unitPrice: 0.50,
      amount: orderOverage * 0.50
    });
  }
  
  // Calculate totals
  const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
  const discount = await calculateDiscount(subscription);
  const tax = await calculateTax(tenantId, subtotal - discount);
  
  return {
    invoiceId: generateId(),
    tenantId,
    subscriptionId: subscription.subscriptionId,
    periodStart: subscription.currentPeriodStart,
    periodEnd: subscription.currentPeriodEnd,
    invoiceDate: new Date(),
    dueDate: addDays(new Date(), 30),
    status: 'OPEN',
    lineItems,
    subtotal,
    discount,
    tax,
    total: subtotal - discount + tax,
    amountPaid: 0,
    amountDue: subtotal - discount + tax
  };
}
```

---

## 8. GOVERNANCE PATTERNS

### 8.1 Tenant Lifecycle Management

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      TENANT LIFECYCLE STATES                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐                     │
│  │   SIGNUP    │─────▶│PROVISIONING │─────▶│    TRIAL    │                     │
│  │             │      │             │      │  (14 days)  │                     │
│  └─────────────┘      └─────────────┘      └──────┬──────┘                     │
│                                                   │                             │
│                              ┌────────────────────┼────────────────────┐       │
│                              │                    │                    │       │
│                              ▼                    ▼                    ▼       │
│                       ┌─────────────┐      ┌─────────────┐      ┌───────────┐ │
│                       │   ACTIVE    │      │TRIAL_EXPIRED│      │ CANCELLED │ │
│                       │             │◀─────│(grace: 7d)  │─────▶│           │ │
│                       └──────┬──────┘      └─────────────┘      └───────────┘ │
│                              │                                                  │
│                              │ Payment Failed                                   │
│                              ▼                                                  │
│                       ┌─────────────┐                                          │
│                       │  PAST_DUE   │                                          │
│                       │ (grace: 15d)│                                          │
│                       └──────┬──────┘                                          │
│                              │                                                  │
│              ┌───────────────┼───────────────┐                                 │
│              │               │               │                                 │
│              ▼               ▼               ▼                                 │
│       ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                         │
│       │   ACTIVE    │ │  SUSPENDED  │ │ TERMINATED  │                         │
│       │  (Paid up)  │ │(Read-only)  │ │(Data purge) │                         │
│       └─────────────┘ └──────┬──────┘ └─────────────┘                         │
│                              │                                                  │
│                              │ 30 days                                          │
│                              ▼                                                  │
│                       ┌─────────────┐                                          │
│                       │ TERMINATED  │                                          │
│                       │(Data purge) │                                          │
│                       └─────────────┘                                          │
│                                                                                 │
│  ═══════════════════════════════════════════════════════════════════════════   │
│                                                                                 │
│  STATE BEHAVIORS:                                                               │
│                                                                                 │
│  PROVISIONING: Creating databases, storage, initial config                     │
│  TRIAL:        Full access, usage tracked, upgrade prompts                     │
│  ACTIVE:       Normal operation                                                 │
│  PAST_DUE:     Normal operation, payment warnings                              │
│  SUSPENDED:    Read-only access, cannot create new data                        │
│  TERMINATED:   No access, data retention for 90 days                           │
│  CANCELLED:    User-initiated, same as terminated                              │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 8.2 Tenant Provisioning Process

```typescript
interface TenantProvisioningJob {
  tenantId: string;
  steps: ProvisioningStep[];
  currentStep: number;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  startedAt: Date;
  completedAt?: Date;
  error?: string;
}

interface ProvisioningStep {
  stepId: string;
  name: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

async function provisionTenant(signup: TenantSignup): Promise<Tenant> {
  const tenantId = generateTenantId();
  
  const job: TenantProvisioningJob = {
    tenantId,
    steps: [
      { stepId: '1', name: 'Create tenant record', status: 'PENDING' },
      { stepId: '2', name: 'Provision database', status: 'PENDING' },
      { stepId: '3', name: 'Run schema migrations', status: 'PENDING' },
      { stepId: '4', name: 'Create storage container', status: 'PENDING' },
      { stepId: '5', name: 'Configure subdomain', status: 'PENDING' },
      { stepId: '6', name: 'Seed initial data', status: 'PENDING' },
      { stepId: '7', name: 'Create admin user', status: 'PENDING' },
      { stepId: '8', name: 'Configure integrations', status: 'PENDING' },
      { stepId: '9', name: 'Send welcome email', status: 'PENDING' }
    ],
    currentStep: 0,
    status: 'IN_PROGRESS',
    startedAt: new Date()
  };
  
  try {
    // Step 1: Create tenant record
    await executeStep(job, 0, async () => {
      await tenantRepo.create({
        tenantId,
        tenantCode: signup.companyCode,
        tenantName: signup.companyName,
        status: 'PROVISIONING',
        subscriptionTier: signup.tier
      });
    });
    
    // Step 2: Provision database
    await executeStep(job, 1, async () => {
      const dbConfig = await databaseProvisioner.createDatabase(tenantId, signup.tier);
      await tenantRepo.updateDatabaseConfig(tenantId, dbConfig);
    });
    
    // Step 3: Run migrations
    await executeStep(job, 2, async () => {
      await migrationRunner.runMigrations(tenantId);
    });
    
    // Step 4: Storage
    await executeStep(job, 3, async () => {
      const storageConfig = await storageProvisioner.createContainer(tenantId);
      await tenantRepo.updateStorageConfig(tenantId, storageConfig);
    });
    
    // Step 5: Subdomain
    await executeStep(job, 4, async () => {
      await domainManager.configureSubdomain(signup.companyCode);
    });
    
    // Step 6: Seed data
    await executeStep(job, 5, async () => {
      await seedService.seedTenant(tenantId, {
        divisions: signup.divisions,
        locations: signup.locations,
        defaultSettings: getDefaultSettings(signup.tier)
      });
    });
    
    // Step 7: Admin user
    await executeStep(job, 6, async () => {
      await userService.createAdminUser(tenantId, {
        email: signup.adminEmail,
        name: signup.adminName,
        sendInvite: true
      });
    });
    
    // Step 8: Integrations
    await executeStep(job, 7, async () => {
      await integrationService.configureDefaults(tenantId);
    });
    
    // Step 9: Welcome email
    await executeStep(job, 8, async () => {
      await emailService.sendWelcomeEmail(signup.adminEmail, {
        tenantName: signup.companyName,
        loginUrl: `https://${signup.companyCode}.steelwise.com`
      });
    });
    
    // Mark complete
    job.status = 'COMPLETED';
    job.completedAt = new Date();
    
    // Activate tenant
    await tenantRepo.updateStatus(tenantId, 'TRIAL');
    
    return await tenantRepo.getById(tenantId);
    
  } catch (error) {
    job.status = 'FAILED';
    job.error = error.message;
    await alertService.notifyProvisioningFailure(tenantId, error);
    throw error;
  }
}
```

### 8.3 Data Retention & Deletion

```typescript
interface TenantDataRetentionPolicy {
  tenantId: string;
  
  // Active tenant retention
  transactionDataDays: number;       // Orders, invoices, etc.
  auditLogDays: number;              // System audit logs
  systemLogDays: number;             // Application logs
  
  // Terminated tenant retention
  terminatedRetentionDays: number;   // How long to keep data after termination
  
  // Backup retention
  dailyBackupRetentionDays: number;
  weeklyBackupRetentionWeeks: number;
  monthlyBackupRetentionMonths: number;
}

// Default retention policy
const defaultRetention: TenantDataRetentionPolicy = {
  tenantId: '',
  transactionDataDays: 2555,         // 7 years (regulatory)
  auditLogDays: 365,                 // 1 year
  systemLogDays: 90,                 // 90 days
  terminatedRetentionDays: 90,       // 90 days after termination
  dailyBackupRetentionDays: 30,
  weeklyBackupRetentionWeeks: 12,
  monthlyBackupRetentionMonths: 12
};

// Tenant termination process
async function terminateTenant(tenantId: string): Promise<void> {
  const tenant = await tenantRepo.getById(tenantId);
  
  // 1. Mark as terminated
  await tenantRepo.updateStatus(tenantId, 'TERMINATED');
  
  // 2. Revoke all user access
  await userService.revokeAllUsers(tenantId);
  
  // 3. Schedule data deletion
  await scheduler.schedule({
    jobType: 'TENANT_DATA_DELETION',
    tenantId,
    executeAt: addDays(new Date(), tenant.retentionPolicy.terminatedRetentionDays),
    payload: { tenantId }
  });
  
  // 4. Export data for customer (if requested)
  if (tenant.exportRequested) {
    await dataExportService.createExport(tenantId);
  }
  
  // 5. Notify customer
  await emailService.sendTerminationConfirmation(tenant.billingEmail, {
    tenantName: tenant.tenantName,
    dataRetentionDays: tenant.retentionPolicy.terminatedRetentionDays,
    exportAvailable: tenant.exportRequested
  });
}

// Data deletion job
async function deleteTenantData(tenantId: string): Promise<void> {
  // 1. Delete database
  await databaseProvisioner.deleteDatabase(tenantId);
  
  // 2. Delete storage container
  await storageProvisioner.deleteContainer(tenantId);
  
  // 3. Delete backups
  await backupService.deleteBackups(tenantId);
  
  // 4. Remove from search indices
  await searchService.removeIndex(tenantId);
  
  // 5. Purge cache entries
  await cacheService.purgeTenant(tenantId);
  
  // 6. Anonymize audit logs (keep for platform analytics)
  await auditService.anonymizeTenantLogs(tenantId);
  
  // 7. Delete tenant record (keep minimal record for billing history)
  await tenantRepo.markDeleted(tenantId);
}
```

### 8.4 Cross-Tenant Security Rules

```typescript
// Security rules to prevent cross-tenant access
const crossTenantSecurityRules = {
  
  // Rule 1: All database queries must include tenant context
  databaseAccess: {
    enforcement: 'MANDATORY',
    rule: 'All queries routed through tenant-aware connection pool',
    fallback: 'Reject query if no tenant context'
  },
  
  // Rule 2: API endpoints validate tenant ownership
  apiAccess: {
    enforcement: 'MANDATORY',
    rule: 'Resource tenant must match request tenant context',
    fallback: 'Return 403 Forbidden'
  },
  
  // Rule 3: File storage access
  storageAccess: {
    enforcement: 'MANDATORY',
    rule: 'File paths must include tenant container prefix',
    fallback: 'Return 403 Forbidden'
  },
  
  // Rule 4: Cache access
  cacheAccess: {
    enforcement: 'MANDATORY',
    rule: 'Cache keys must include tenant prefix',
    fallback: 'Cache miss (not error)'
  },
  
  // Rule 5: Background jobs
  jobExecution: {
    enforcement: 'MANDATORY',
    rule: 'Jobs must set tenant context before execution',
    fallback: 'Job fails with security error'
  },
  
  // Rule 6: Platform staff access
  platformAccess: {
    enforcement: 'AUDIT',
    rule: 'Platform staff access logged and requires justification',
    fallback: 'Access allowed but fully audited'
  }
};

// Middleware to enforce cross-tenant security
async function crossTenantSecurityMiddleware(req: Request, res: Response, next: NextFunction) {
  const tenant = getCurrentTenant();
  const resourceTenantId = req.params.tenantId || req.body?.tenantId;
  
  // If resource specifies a tenant, it must match context
  if (resourceTenantId && resourceTenantId !== tenant.tenantId) {
    // Log security violation attempt
    await securityAudit.log({
      event: 'CROSS_TENANT_ACCESS_ATTEMPT',
      requestingTenantId: tenant.tenantId,
      targetTenantId: resourceTenantId,
      userId: tenant.user?.userId,
      path: req.path,
      method: req.method,
      ip: req.ip
    });
    
    return res.status(403).json({
      error: 'Access denied',
      code: 'CROSS_TENANT_VIOLATION'
    });
  }
  
  next();
}
```

---

## 9. ISOLATION VERIFICATION

### 9.1 Automated Isolation Testing

```typescript
// Isolation test suite (run in CI/CD and periodically in production)
describe('Tenant Isolation Tests', () => {
  
  test('Database queries are tenant-scoped', async () => {
    // Create test data in Tenant A
    const tenantA = await createTestTenant('tenant-a');
    await runInTenantContext(tenantA, async () => {
      await orderRepo.create({ customerId: 'c1', total: 100 });
    });
    
    // Verify Tenant B cannot see Tenant A's data
    const tenantB = await createTestTenant('tenant-b');
    await runInTenantContext(tenantB, async () => {
      const orders = await orderRepo.findAll();
      expect(orders).toHaveLength(0);
    });
  });
  
  test('API endpoints reject cross-tenant requests', async () => {
    const tenantA = await createTestTenant('tenant-a');
    const orderA = await runInTenantContext(tenantA, () => 
      orderRepo.create({ customerId: 'c1', total: 100 })
    );
    
    const tenantB = await createTestTenant('tenant-b');
    const response = await request(app)
      .get(`/api/orders/${orderA.id}`)
      .set('X-Tenant-ID', tenantB.tenantId)
      .set('Authorization', `Bearer ${tenantB.userToken}`);
    
    expect(response.status).toBe(404); // Not found (not 403 to avoid info leak)
  });
  
  test('File storage is tenant-isolated', async () => {
    const tenantA = await createTestTenant('tenant-a');
    const fileUrl = await runInTenantContext(tenantA, () =>
      storageService.uploadFile('test.pdf', testFileBuffer)
    );
    
    // Verify URL contains tenant container
    expect(fileUrl).toContain(tenantA.storageContainer);
    
    // Verify direct access without tenant context fails
    const tenantB = await createTestTenant('tenant-b');
    await expect(
      runInTenantContext(tenantB, () => storageService.getFile(fileUrl))
    ).rejects.toThrow('Access denied');
  });
  
  test('Cache keys are tenant-prefixed', async () => {
    const tenantA = await createTestTenant('tenant-a');
    await runInTenantContext(tenantA, () =>
      cacheService.set('user:123', { name: 'John' })
    );
    
    const tenantB = await createTestTenant('tenant-b');
    const result = await runInTenantContext(tenantB, () =>
      cacheService.get('user:123')
    );
    
    expect(result).toBeNull(); // Tenant B cannot see Tenant A's cache
  });
});
```

---

## 10. SUMMARY

### Architecture Decisions

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| **Database** | Separate DB per tenant (Pro/Enterprise), Schema per tenant (Starter) | Maximum isolation for larger tenants, cost efficiency for small |
| **Application** | Shared, stateless services | Cost efficiency, easier deployment |
| **Storage** | Separate container per tenant | Complete file isolation |
| **Cache** | Shared with tenant-prefixed keys | Cost efficiency with logical isolation |
| **Identity** | Shared identity provider | SSO support, unified management |
| **Billing** | Hybrid (base + users + modules + usage) | Flexible pricing for different customer sizes |

### Tenant Boundaries Summary

| Level | Isolation | Customization |
|-------|-----------|---------------|
| **Tenant** | Full data isolation | Branding, settings, modules |
| **Division** | Logical within tenant | Product categories, pricing |
| **Location** | Logical within tenant | Inventory, work centers, users |

### Governance Summary

| Concern | Approach |
|---------|----------|
| **Provisioning** | Automated, <1 hour for new tenant |
| **Data Retention** | Configurable per tier, regulatory compliance |
| **Termination** | 90-day retention, data export available |
| **Security** | Multi-layer isolation, continuous testing |

---

**End of Multi-Tenant Architecture Specification**
