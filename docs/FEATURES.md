# SteelWise ERP - Complete Feature Documentation

> Comprehensive guide to all platform features and capabilities

---

## Table of Contents

1. [Production Workflow System](#production-workflow-system)
2. [Point of Sale (POS)](#point-of-sale-pos)
3. [AI Integration](#ai-integration)
4. [Order Management](#order-management)
5. [Inventory & Materials](#inventory--materials)
6. [Planning & Scheduling](#planning--scheduling)
7. [Quality Control](#quality-control)
8. [Logistics & Shipping](#logistics--shipping)

---

## Production Workflow System

### Overview
Complete job lifecycle management from order intake through shipping dispatch.

### Components

#### 1. Workflow Board
**Route:** `/production`

**Purpose:** Visual Kanban management of all jobs across production stages

**Features:**
- 8-column board showing job statuses:
  - ORDERED (gray)
  - SCHEDULED (blue)
  - IN_PROCESS (orange)
  - WAITING_QC (purple)
  - PACKAGING (cyan)
  - READY_TO_SHIP (green)
  - SHIPPED (teal)
  - COMPLETED (success green)

- **Job Cards Display:**
  - Job number and customer name
  - Work center assignment
  - Scheduled start date
  - Priority indicator
  - Quick action buttons

- **Filters:**
  - Location dropdown
  - Work Center dropdown
  - Division dropdown
  - Clear all filters

- **Auto-refresh:** 30-second intervals

**User Actions:**
- Click job card to view details
- Click status button to transition job
- Filter by location/work center/division
- View real-time job counts per status

#### 2. Shop Floor Screen
**Route:** `/production/shop-floor`

**Purpose:** Operator interface for starting and completing work

**Layout:**
- **Left Panel:** Scheduled Jobs (ready to start)
- **Right Panel:** In Process Jobs (currently active)

**Features:**

**Scheduled Jobs:**
- View all jobs assigned to work center
- Job details: number, customer, scheduled time
- "Start Job" button
- Work center filter

**In Process Jobs:**
- View all active work
- Elapsed time display
- "Complete Job" button with notes dialog
- Completion notes field (optional)

**Completion Dialog:**
- Text area for operator notes
- Cancel/Complete buttons
- Marks job as READY_TO_SHIP

**Auto-refresh:** 30 seconds

#### 3. Shipping Screen
**Route:** `/production/shipping`

**Purpose:** Dispatch interface for shipping department

**Layout:**
- **Left Panel:** Ready to Ship
- **Right Panel:** Recently Shipped (last 24 hours)

**Features:**

**Ready to Ship Panel:**
- All jobs marked READY_TO_SHIP
- Job cards with customer and details
- "Ship" button per job

**Ship Dialog:**
- **Carrier dropdown:**
  - FedEx
  - UPS
  - USPS
  - DHL
  - Local Delivery
  - Customer Pickup
  - Other
- **Tracking number:** Text input (required)
- **Notes:** Optional shipping notes
- **Validation:** Requires carrier and tracking

**Recently Shipped Panel:**
- Jobs shipped in last 24 hours
- Displays: carrier, tracking number, shipped time
- Read-only view

**Auto-refresh:** 30 seconds

### API Endpoints

```http
GET    /api/jobs                 # List jobs with filters
GET    /api/jobs/:id             # Get job details
POST   /api/jobs/:id/start       # Start job (SCHEDULED → IN_PROCESS)
POST   /api/jobs/:id/complete    # Complete job (IN_PROCESS → READY_TO_SHIP)
POST   /api/jobs/:id/ship        # Ship job (READY_TO_SHIP → SHIPPED)
GET    /api/jobs/:id/history     # Get status change history
GET    /api/jobs/stats/summary   # Get job statistics
```

### Database Fields

**Job Model:**
```prisma
model Job {
  id              String    @id @default(uuid())
  jobNumber       String    @unique
  status          JobStatus @default(SCHEDULED)
  workCenterId    String?
  assignedToId    String?
  scheduledStart  DateTime?
  actualStart     DateTime?
  actualEnd       DateTime?
  shippingCarrier String?
  trackingNumber  String?
  shippedAt       DateTime?
  notes           String?
  // ... more fields
}
```

---

## Point of Sale (POS)

### Overview
Fast counter sales workflow for walk-in customers and phone orders.

### Route
`/pos` (standalone full-screen)

### Features

#### Material Search
- Real-time search across inventory
- Heat number lookup
- Size/grade filtering
- Location-based availability

#### Quick Quote
- Instant pricing calculation
- Quantity-based discounts
- Tax calculation
- Print quote

#### Order Creation
- Fast order entry
- Customer lookup/create
- Multiple line items
- Payment processing

#### Receipt Printing
- Professional invoice format
- Heat traceability info
- Barcode generation
- Email/print options

### Workflow
1. Search material by heat, size, or grade
2. Select items and quantities
3. Add customer information
4. Generate quote or create order
5. Process payment
6. Print receipt

---

## AI Integration

### Overview
Multi-provider AI system with automatic cost optimization and intelligent fallback.

### Supported Providers

#### 1. DeepSeek (Primary)
**Models:**
- DeepSeek Chat (general purpose)
- DeepSeek Reasoner (advanced reasoning)

**Pricing:**
- Input: $0.14 per 1M tokens
- Output: $0.28 per 1M tokens
- Cache reads: $0.014 per 1M tokens

**Use Cases:**
- Primary provider for all tasks
- 10x cost savings vs GPT-4o
- Automatic prompt caching

#### 2. OpenAI (Fallback)
**Models:**
- GPT-4o (advanced)
- GPT-4o-mini (fast)
- O1-preview (reasoning)
- text-embedding-3-small
- text-embedding-3-large

**Pricing:**
- GPT-4o: $2.50-$10.00 per 1M tokens
- GPT-4o-mini: $0.15-$0.60 per 1M tokens

**Use Cases:**
- Fallback when DeepSeek fails
- Text embeddings
- Vision tasks

#### 3. Anthropic (Specialty)
**Models:**
- Claude 3.5 Sonnet
- Claude 3 Opus
- Claude 3 Haiku

**Pricing:**
- Sonnet: $3.00-$15.00 per 1M tokens
- Opus: $15.00-$75.00 per 1M tokens

**Use Cases:**
- Advanced reasoning
- 200K context window
- Tool use scenarios

### Features

#### Automatic Provider Selection
System automatically selects best provider based on task type:
- **Chat:** DeepSeek Chat
- **Code:** DeepSeek Chat
- **Reasoning:** DeepSeek Reasoner
- **Analysis:** DeepSeek Reasoner
- **Embeddings:** OpenAI text-embedding-3-small

#### Intelligent Fallback
- Automatic retry with exponential backoff
- Fallback to secondary provider on failure
- Maintains conversation context
- Transparent to end user

#### Cost Tracking
- Real-time usage monitoring
- Per-request cost calculation
- Provider comparison metrics
- Monthly billing summaries

#### Streaming Support
- Server-Sent Events (SSE)
- Real-time response streaming
- Progressive UI updates
- Cancel support

### API Endpoints

```http
POST   /api/ai/chat              # Chat completion
POST   /api/ai/chat/stream       # Streaming chat (SSE)
POST   /api/ai/embeddings        # Generate embeddings
GET    /api/ai/providers         # List available providers
POST   /api/ai/test              # Test provider connection
GET    /api/ai/usage             # Usage statistics
POST   /api/ai/analyze-product   # Product analysis
POST   /api/ai/quote-assistant   # Quote generation help
```

### Configuration

**Environment Variables:**
```env
DEEPSEEK_API_KEY="sk-..."
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-..."
AI_DEFAULT_PROVIDER="deepseek"
AI_ENABLED="true"
AI_FALLBACK_ENABLED="true"
AI_MAX_RETRIES="3"
```

---

## Order Management

### Features
- Order creation and editing
- Multiple order types (quote, purchase, sales)
- Line item management
- Pricing and discounts
- Tax calculation
- Payment terms
- Approval workflows

### Order Types
- **Quote:** Preliminary pricing
- **Purchase Order:** Buying from supplier
- **Sales Order:** Selling to customer
- **Return Order:** RMA processing

### Order Statuses
- DRAFT
- PENDING_APPROVAL
- APPROVED
- IN_PRODUCTION
- READY_TO_SHIP
- SHIPPED
- DELIVERED
- COMPLETED
- CANCELLED

---

## Inventory & Materials

### Heat Traceability
- Complete mill certification tracking
- Chemistry analysis
- Test results
- Compliance documentation
- QR code generation

### Unit Management
- Individual piece tracking
- Location assignment
- Weight and dimensions
- Status tracking (available, allocated, shipped)
- Photo documentation

### Location Management
- Multi-warehouse support
- Bin locations
- Zone management
- Transfer tracking

---

## Planning & Scheduling

### Capacity Planning
- Work center utilization
- Resource allocation
- Timeline visualization
- Bottleneck identification

### Scheduling Features
- Drag-and-drop scheduling
- Priority-based assignment
- Due date management
- Conflict resolution
- What-if scenarios

---

## Quality Control

### QA/QC Features
- Test entry and tracking
- Certification management
- Non-conformance reports
- Corrective action tracking
- Audit trails

### Metallurgy Testing
- Chemical composition
- Mechanical properties
- Hardness testing
- Impact testing
- Results documentation

---

## Logistics & Shipping

### Shipment Management
- Multiple shipments per order
- Carrier selection
- Tracking number management
- BOL generation
- POD tracking

### Supported Carriers
- FedEx
- UPS
- USPS
- DHL
- Local delivery
- Customer pickup
- Custom carriers

### Documentation
- Bill of lading
- Packing lists
- Commercial invoices
- Heat certificates
- Custom documentation

---

## User Roles & Permissions

### Available Roles
- **Administrator:** Full system access
- **Manager:** Department management
- **Operator:** Shop floor operations
- **Clerk:** Order entry and processing
- **Inspector:** Quality control
- **Viewer:** Read-only access

### Permission Levels
- View
- Create
- Edit
- Delete
- Approve
- Admin

---

## Reporting & Analytics

### Available Reports
- Production summary
- Job completion rates
- Material usage
- Scrap tracking
- On-time delivery
- Revenue by customer
- Inventory levels
- Quality metrics

### Dashboard Features
- Real-time KPIs
- Customizable widgets
- Trend analysis
- Drill-down capability
- Export to Excel/PDF

---

## Integration Points

### ERP Systems
- Import orders
- Export invoices
- Sync inventory
- Customer master data

### EDI Integration
- 850 (Purchase Order)
- 855 (PO Acknowledgment)
- 856 (ASN)
- 810 (Invoice)

### External APIs
- Carrier tracking APIs
- Payment processing
- Tax calculation
- Address validation

---

## Mobile Features

### Responsive Design
- Tablet-optimized shop floor
- Mobile-friendly POS
- Touch-friendly controls
- Offline capability (planned)

---

**Last Updated:** January 18, 2026
