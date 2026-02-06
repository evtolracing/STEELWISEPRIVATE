# External Partner API Layer — Architecture & Design

## Platform: SteelWise Industrial Service Center
## Version: 1.0.0
## Date: 2026-02-05
## Author: Principal Platform API Architect

---

## A) PLATFORM PHILOSOPHY & OBJECTIVES

### Why APIs Are Strategic, Not Technical

The External Partner API Layer is not a "feature" — it is a **revenue multiplier** and **competitive moat**. In the metals and plastics service center industry, the companies that win are those that make it frictionless for customers to order, for suppliers to fulfill, and for carriers to deliver.

**Strategic Value:**
- **Customer Lock-in Through Integration**: Once a customer's ERP is wired to our RFQ/Order API, switching costs increase 10x. Their procurement team builds workflows around our endpoints.
- **Supplier Velocity**: Suppliers who receive POs and submit ASNs electronically ship 40% faster than fax/email-based peers. This directly impacts our fill rate.
- **Carrier Visibility**: Real-time status from carriers eliminates "where's my truck?" calls — the #1 source of logistics overhead.
- **Partner Ecosystem Scale**: Strategic partners (toll processors, outside services) become virtual extensions of our capacity without adding headcount.

### Integration Reduces Friction and Cost

| Manual Process | API-Enabled | Savings |
|---|---|---|
| Customer calls for quote | POST /rfqs | 15 min → 0 min |
| Fax PO to supplier | Auto-dispatched | 30 min → 0 min |
| Call carrier for ETA | GET /shipments | 10 min → 0 min |
| Email CoC/MTR | GET /documents | 20 min → instant |

### Trust Boundaries

```
┌─────────────────────────────────────────────────────┐
│                INTERNAL PLATFORM                     │
│  Full data access, admin controls, financial data    │
│                                                      │
│  ┌─────────────────────────────────────────────┐    │
│  │         PARTNER API GATEWAY                  │    │
│  │  OAuth2 + Scopes + Rate Limits + Audit       │    │
│  └──────────┬──────────┬──────────┬────────────┘    │
│             │          │          │                   │
└─────────────┼──────────┼──────────┼─────────────────┘
              │          │          │
      ┌───────▼──┐ ┌────▼─────┐ ┌─▼────────┐
      │ Customer │ │ Supplier │ │ Carrier   │
      │   API    │ │   API    │ │   API     │
      │ (scoped) │ │ (scoped) │ │ (scoped)  │
      └──────────┘ └──────────┘ └───────────┘
```

External parties NEVER see: internal margins, cost data, other partners' data, employee info, financial internals, audit logs of other tenants.

### Scale Without Chaos

The API layer provides:
- **Versioned contracts** — new features don't break existing integrations
- **Per-partner rate limits** — one misbehaving integration can't take down the platform
- **Scoped permissions** — partners see only what they need
- **Webhook subscriptions** — push model reduces polling load by 95%

---

## B) PARTNER TYPES & USE CASES

### Partner Type: CUSTOMER

**Allowed Actions:**
| Action | Endpoint | Method |
|---|---|---|
| Submit RFQ | `/api/v1/partner/customer/rfqs` | POST |
| List own RFQs | `/api/v1/partner/customer/rfqs` | GET |
| Get RFQ detail | `/api/v1/partner/customer/rfqs/:id` | GET |
| View quotes | `/api/v1/partner/customer/quotes` | GET |
| Accept/reject quote | `/api/v1/partner/customer/quotes/:id/respond` | POST |
| View orders | `/api/v1/partner/customer/orders` | GET |
| Get order status | `/api/v1/partner/customer/orders/:id` | GET |
| View order milestones | `/api/v1/partner/customer/orders/:id/milestones` | GET |
| Download documents | `/api/v1/partner/customer/documents` | GET |
| Get document file | `/api/v1/partner/customer/documents/:id/download` | GET |
| View shipments | `/api/v1/partner/customer/shipments` | GET |
| Track shipment | `/api/v1/partner/customer/shipments/:id` | GET |
| View invoices (read-only) | `/api/v1/partner/customer/invoices` | GET |

**Data Visibility Boundaries:**
- ✅ Own RFQs, quotes, orders, shipments, invoices, documents
- ✅ Product availability (limited catalog view)
- ✅ Delivery ETAs and milestones
- ❌ Internal pricing/margins
- ❌ Other customers' data
- ❌ Supplier information
- ❌ Production scheduling details
- ❌ Internal quality holds

### Partner Type: SUPPLIER

**Allowed Actions:**
| Action | Endpoint | Method |
|---|---|---|
| View assigned POs | `/api/v1/partner/supplier/purchase-orders` | GET |
| Acknowledge PO | `/api/v1/partner/supplier/purchase-orders/:id/acknowledge` | POST |
| Submit ASN | `/api/v1/partner/supplier/asn` | POST |
| Upload documents (MTR/CoC) | `/api/v1/partner/supplier/documents` | POST |
| View SCARs | `/api/v1/partner/supplier/scars` | GET |
| Respond to SCAR | `/api/v1/partner/supplier/scars/:id/respond` | POST |
| View own scorecard | `/api/v1/partner/supplier/scorecard` | GET |

**Data Visibility Boundaries:**
- ✅ POs assigned to them
- ✅ Own ASN history
- ✅ SCARs issued to them
- ✅ Own scorecard (delivery, quality metrics)
- ❌ Customer information
- ❌ Sales pricing
- ❌ Other suppliers' data
- ❌ Internal inventory levels
- ❌ Internal quality decisions

### Partner Type: CARRIER

**Allowed Actions:**
| Action | Endpoint | Method |
|---|---|---|
| View assigned shipments | `/api/v1/partner/carrier/shipments` | GET |
| Accept/decline shipment | `/api/v1/partner/carrier/shipments/:id/respond` | POST |
| Update status | `/api/v1/partner/carrier/shipments/:id/status` | POST |
| Upload POD | `/api/v1/partner/carrier/shipments/:id/pod` | POST |
| Report exception | `/api/v1/partner/carrier/exceptions` | POST |
| View own performance | `/api/v1/partner/carrier/performance` | GET |

**Data Visibility Boundaries:**
- ✅ Shipments assigned to them
- ✅ Pickup/delivery addresses and contacts
- ✅ Package dimensions, weights, piece counts
- ✅ Own performance metrics
- ❌ Order pricing/values
- ❌ Customer account details
- ❌ Material specifications beyond shipping needs
- ❌ Other carriers' data

---

## C) API SECURITY & ACCESS MODEL

### Authentication: OAuth2 Client Credentials Flow

```
Partner App → POST /api/v1/partner/auth/token
  Body: { client_id, client_secret, grant_type: "client_credentials" }
  Response: { access_token, token_type: "Bearer", expires_in: 3600, scope: "customer:read customer:write" }
```

### Token Structure (JWT)
```json
{
  "sub": "partner_abc123",
  "partner_id": "uuid",
  "partner_type": "CUSTOMER",
  "org_id": "uuid",
  "scopes": ["customer:rfq:write", "customer:orders:read", "customer:documents:read"],
  "iat": 1738764000,
  "exp": 1738767600,
  "iss": "steelwise-api"
}
```

### Scopes by Partner Type

| Scope | Customer | Supplier | Carrier |
|---|---|---|---|
| `rfq:write` | ✅ | ❌ | ❌ |
| `rfq:read` | ✅ | ❌ | ❌ |
| `quotes:read` | ✅ | ❌ | ❌ |
| `quotes:respond` | ✅ | ❌ | ❌ |
| `orders:read` | ✅ | ❌ | ❌ |
| `documents:read` | ✅ | ✅ | ❌ |
| `documents:write` | ❌ | ✅ | ✅ |
| `po:read` | ❌ | ✅ | ❌ |
| `po:acknowledge` | ❌ | ✅ | ❌ |
| `asn:write` | ❌ | ✅ | ❌ |
| `scar:read` | ❌ | ✅ | ❌ |
| `scar:respond` | ❌ | ✅ | ❌ |
| `shipments:read` | ✅ | ❌ | ✅ |
| `shipments:respond` | ❌ | ❌ | ✅ |
| `shipments:status` | ❌ | ❌ | ✅ |
| `pod:write` | ❌ | ❌ | ✅ |
| `exceptions:write` | ❌ | ❌ | ✅ |
| `invoices:read` | ✅ | ❌ | ❌ |

### Security Controls
- **Least Privilege**: Partners get minimum scopes needed
- **Time-bound Tokens**: 1-hour expiry, no refresh tokens (re-authenticate)
- **Explicit Revocation**: Admin can revoke any API key instantly
- **IP Allowlisting**: Optional per-partner IP restrictions
- **Environment Separation**: Sandbox and Production are fully isolated
- **Full Audit Logging**: Every API call logged with partner ID, endpoint, timestamp, response code

---

## D) API DOMAINS & ENDPOINTS

All partner endpoints live under `/api/v1/partner/{partnerType}/`.

### Customer API Domain

```
POST   /api/v1/partner/customer/rfqs                    — Submit RFQ
GET    /api/v1/partner/customer/rfqs                    — List own RFQs
GET    /api/v1/partner/customer/rfqs/:id                — RFQ detail
GET    /api/v1/partner/customer/quotes                  — List quotes
GET    /api/v1/partner/customer/quotes/:id              — Quote detail
POST   /api/v1/partner/customer/quotes/:id/respond      — Accept/reject
GET    /api/v1/partner/customer/orders                  — List orders
GET    /api/v1/partner/customer/orders/:id              — Order detail + status
GET    /api/v1/partner/customer/orders/:id/milestones   — Production milestones
GET    /api/v1/partner/customer/documents               — List documents
GET    /api/v1/partner/customer/documents/:id/download  — Download file
GET    /api/v1/partner/customer/shipments               — List shipments
GET    /api/v1/partner/customer/shipments/:id           — Shipment tracking
GET    /api/v1/partner/customer/invoices                — List invoices (read-only)
```

### Supplier API Domain

```
GET    /api/v1/partner/supplier/purchase-orders              — View POs
GET    /api/v1/partner/supplier/purchase-orders/:id          — PO detail
POST   /api/v1/partner/supplier/purchase-orders/:id/acknowledge — Acknowledge PO
POST   /api/v1/partner/supplier/asn                          — Submit ASN
GET    /api/v1/partner/supplier/asn                          — List own ASNs
POST   /api/v1/partner/supplier/documents                    — Upload MTR/CoC
GET    /api/v1/partner/supplier/scars                        — View SCARs
GET    /api/v1/partner/supplier/scars/:id                    — SCAR detail
POST   /api/v1/partner/supplier/scars/:id/respond            — Respond to SCAR
GET    /api/v1/partner/supplier/scorecard                    — View own scorecard
```

### Carrier API Domain

```
GET    /api/v1/partner/carrier/shipments                  — Assigned shipments
GET    /api/v1/partner/carrier/shipments/:id              — Shipment detail
POST   /api/v1/partner/carrier/shipments/:id/respond      — Accept/decline
POST   /api/v1/partner/carrier/shipments/:id/status       — Update status
POST   /api/v1/partner/carrier/shipments/:id/pod          — Upload POD
POST   /api/v1/partner/carrier/exceptions                 — Report exception
GET    /api/v1/partner/carrier/performance                — Own performance metrics
```

---

## E) EVENT SUBSCRIPTIONS & WEBHOOKS

### Supported Events

| Event | Available To | Payload |
|---|---|---|
| `rfq.received` | Customer | RFQ confirmation |
| `quote.available` | Customer | Quote ready for review |
| `quote.expiring` | Customer | Quote expires in 24h |
| `order.confirmed` | Customer, Supplier | Order confirmed |
| `order.status_changed` | Customer | Status update |
| `order.delayed` | Customer | Delay notification |
| `shipment.dispatched` | Customer, Carrier | Shipment left facility |
| `shipment.delivered` | Customer | Delivery confirmed |
| `shipment.exception` | Customer, Carrier | Exception occurred |
| `po.issued` | Supplier | New PO available |
| `scar.issued` | Supplier | New SCAR notification |
| `document.available` | Customer, Supplier | New document ready |
| `invoice.issued` | Customer | New invoice |

### Webhook Model

**Registration:**
```json
POST /api/v1/partner/webhooks
{
  "url": "https://partner.example.com/hooks/steelwise",
  "events": ["order.confirmed", "shipment.dispatched"],
  "secret": "whsec_partner_generated_secret"
}
```

**Payload Delivery:**
```json
{
  "id": "evt_abc123",
  "type": "order.confirmed",
  "created_at": "2026-02-05T14:30:00Z",
  "data": { ... },
  "partner_id": "partner_abc123"
}
```

**Security:** HMAC-SHA256 signature in `X-SteelWise-Signature` header.

**Retry Policy:**
- Attempt 1: Immediate
- Attempt 2: 1 minute
- Attempt 3: 5 minutes
- Attempt 4: 30 minutes
- Attempt 5: 2 hours
- After 5 failures: webhook disabled, admin alerted

---

## F) DATA CONTRACTS & VERSIONING

### Versioning Strategy
- **URL-based**: `/api/v1/partner/...`, `/api/v2/partner/...`
- **Semantic**: MAJOR.MINOR.PATCH (breaking.additive.fix)
- **Deprecation**: 6-month notice, `Sunset` header, `Deprecation` header
- **Backward Compatibility**: New fields are additive-only within a major version

### Deprecation Headers
```
Sunset: Sat, 01 Aug 2026 00:00:00 GMT
Deprecation: true
Link: </api/v2/partner/customer/orders>; rel="successor-version"
```

---

## G) GOVERNANCE & THROTTLING

### Rate Limits by Tier

| Tier | Requests/min | Requests/hour | Burst |
|---|---|---|---|
| Standard | 60 | 1,000 | 10/sec |
| Strategic | 300 | 10,000 | 50/sec |
| Internal | 1,000 | 50,000 | 100/sec |

### Response Headers
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1738764060
Retry-After: 30
```

### Abuse Detection
- Sudden 10x spike → automatic throttle
- Repeated 4xx errors → alert + potential suspension
- Unusual data patterns → security review

---

## H) UI/UX FOR PARTNER MANAGEMENT

### Pages (Material UI)

1. **Partner Registry** — `/admin/partners`
   - List all partners with type, status, tier, last active
   - Create/edit partner profiles
   - Enable/disable partners

2. **API Keys & Scopes** — `/admin/partners/:id/keys`
   - Generate/revoke API keys
   - Manage scopes per key
   - View key usage statistics

3. **Webhook Subscriptions** — `/admin/partners/:id/webhooks`
   - View all webhook subscriptions
   - Test webhook delivery
   - View delivery logs and failures

4. **Usage Metrics** — `/admin/partners/:id/usage`
   - API call volume charts
   - Error rate graphs
   - Rate limit hit frequency

5. **Error Logs** — `/admin/partners/:id/errors`
   - Detailed error logs
   - Stack traces (internal only)
   - Partner-facing error messages

---

## I) AUDIT & COMPLIANCE

- Every API call: partner_id, endpoint, method, status, duration, IP, timestamp
- Data access trails: which records were accessed
- Security alerts: failed auth, scope violations, rate limit breaches
- Compliance exports: CSV/JSON for audit periods
- 90-day retention for API logs, 7-year for financial access logs

---

## J) TESTING & VALIDATION

- Permission enforcement: verify scope denial returns 403
- Schema validation: malformed requests return 400 with details
- Webhook retries: simulate failures and verify retry schedule
- Rate limiting: burst test to verify throttling
- Partner isolation: partner A cannot see partner B's data

---

## K) ROLLOUT & GO/NO-GO CRITERIA

### Phase 1: Sandbox (Week 1-2)
- Deploy to sandbox environment
- 2-3 pilot partners per type
- Full monitoring enabled

### Phase 2: Limited Production (Week 3-4)
- Promote to production with pilot partners
- Success metric: <1% error rate, <500ms p95 latency

### Go/No-Go Thresholds
- ✅ All permission tests pass
- ✅ Rate limiting verified
- ✅ Webhook delivery >99% within retry window
- ✅ Zero data isolation violations
- ✅ Audit logs complete and queryable
- ❌ No-go if: any cross-partner data leak, auth bypass, or >5% error rate
