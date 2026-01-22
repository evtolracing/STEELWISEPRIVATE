# Production Workflow System

## Overview

The Production Workflow System is an internal tool built for Alro Steel to manage jobs from order intake through shipping. It provides three integrated screens with real-time status tracking and workflow management.

## Tech Stack

- **Frontend**: React + Material UI (functional components, no TypeScript)
- **Backend**: Node.js + Express REST API
- **Database**: PostgreSQL with Prisma ORM
- **Real-time Updates**: Auto-refresh (30 seconds)

## Architecture

### Job Lifecycle States

1. **ORDERED** - Job created from order
2. **SCHEDULED** - Assigned to work center with schedule
3. **IN_PROCESS** - Active work in progress
4. **WAITING_QC** - Awaiting quality check
5. **PACKAGING** - Being packaged for shipment
6. **READY_TO_SHIP** - Completed and ready for dispatch
7. **SHIPPED** - Dispatched with carrier tracking
8. **COMPLETED** - Fully delivered and closed

### Database Schema Updates

**Job Model** (added fields):
```prisma
model Job {
  // ... existing fields ...
  shippingCarrier String?   // Carrier name (FedEx, UPS, etc.)
  trackingNumber  String?   // Shipment tracking number
  shippedAt       DateTime? // Timestamp when shipped
}
```

## Components

### 1. Production Workflow Board
**Path**: `/production`  
**File**: `src/frontend/src/components/production/ProductionWorkflowBoard.jsx`

**Features**:
- 8-column Kanban board showing all job statuses
- Color-coded status columns with job counts
- Job cards display: job number, customer name, work center, scheduled dates
- Quick status transition buttons
- Filters: Location, Work Center, Division
- Auto-refresh every 30 seconds

**Status Colors**:
- ORDERED: Grey (#757575)
- SCHEDULED: Blue (#2196f3)
- IN_PROCESS: Orange (#ff9800)
- WAITING_QC: Purple (#9c27b0)
- PACKAGING: Cyan (#00bcd4)
- READY_TO_SHIP: Green (#4caf50)
- SHIPPED: Indigo (#3f51b5)
- COMPLETED: Teal (#009688)

### 2. Shop Floor Screen
**Path**: `/production/shop-floor`  
**File**: `src/frontend/src/components/production/ShopFloorScreen.jsx`

**Features**:
- Two-panel layout: Scheduled (left) + In Process (right)
- Start Job button (SCHEDULED → IN_PROCESS)
- Complete Job button with notes dialog (IN_PROCESS → READY_TO_SHIP)
- Work center filter for operators
- Large touch-friendly interface
- Auto-refresh every 30 seconds

**Workflow**:
1. Operator views scheduled jobs in left panel
2. Clicks "Start Job" to begin work (sets actualStart timestamp)
3. Job moves to "In Process" panel on right
4. When done, clicks "Complete Job" and adds optional notes
5. Job transitions to READY_TO_SHIP status

### 3. Shipping Screen
**Path**: `/production/shipping`  
**File**: `src/frontend/src/components/production/ShippingScreen.jsx`

**Features**:
- Two-panel layout: Ready to Ship (left) + Recently Shipped (right)
- Ship dialog with carrier selection, tracking number, notes
- Carrier options: FedEx, UPS, USPS, DHL, Local Delivery, Customer Pickup, Other
- Tracking number validation
- Shipment timestamp recording
- Auto-refresh every 30 seconds

**Workflow**:
1. Shipping clerk views READY_TO_SHIP jobs
2. Clicks "Ship" button
3. Enters carrier, tracking number, optional notes
4. System records shippedAt timestamp
5. Job moves to SHIPPED status and appears in right panel

## API Endpoints

**Base URL**: `http://localhost:3001/api/jobs`

### GET /jobs
List all jobs with optional filters.

**Query Parameters**:
- `status` - Filter by JobStatus enum
- `locationId` - Filter by location UUID
- `workCenterId` - Filter by work center UUID
- `divisionId` - Filter by division

**Response**: Array of job objects with order, workCenter, assignedTo relations

### POST /jobs/:id/status
Update job status with validation.

**Body**:
```json
{
  "status": "IN_PROCESS",
  "note": "Optional status note",
  "scrapWeight": 5.2
}
```

**Behavior**:
- Sets `actualStart` when status → IN_PROCESS
- Sets `actualEnd` when status → COMPLETED/READY_TO_SHIP/SHIPPED
- Accumulates scrapWeight if provided

### POST /jobs/:id/start
Start a job (SCHEDULED → IN_PROCESS).

**Body**:
```json
{
  "note": "Starting saw operation"
}
```

**Validation**: Only works if current status is SCHEDULED or ORDERED

### POST /jobs/:id/complete
Complete a job (IN_PROCESS → READY_TO_SHIP).

**Body**:
```json
{
  "note": "Job completed, all parts inspected"
}
```

**Validation**: Only works if current status is IN_PROCESS or PACKAGING

### POST /jobs/:id/ship
Ship a job (READY_TO_SHIP → SHIPPED).

**Body**:
```json
{
  "carrier": "FedEx",
  "trackingNumber": "1234567890",
  "note": "Shipped via FedEx Ground"
}
```

**Required**: carrier, trackingNumber  
**Validation**: Only works if current status is READY_TO_SHIP

### GET /jobs/:id/history
Get job status change history.

**Response**: Array of status transitions with timestamps
```json
[
  {
    "timestamp": "2024-01-15T08:00:00Z",
    "status": "ORDERED",
    "note": "Job created"
  },
  {
    "timestamp": "2024-01-15T09:30:00Z",
    "status": "IN_PROCESS",
    "note": "Job started"
  }
]
```

### GET /jobs/stats/summary
Get job count statistics.

**Query Parameters**:
- `locationId` - Filter by location
- `workCenterId` - Filter by work center
- `divisionId` - Filter by division

**Response**:
```json
{
  "byStatus": {
    "ORDERED": 12,
    "SCHEDULED": 45,
    "IN_PROCESS": 23,
    "READY_TO_SHIP": 8,
    "SHIPPED": 156,
    "COMPLETED": 1024
  },
  "total": 1268
}
```

## Production Layout

**File**: `src/frontend/src/components/production/ProductionLayout.jsx`

- Top navigation bar with "Alro Steel - Production System" branding
- Tab navigation: Workflow Board | Shop Floor | Shipping
- Full-width container for production screens
- No sidebar (standalone app experience)

## Navigation Integration

Added to main sidebar under "Production" section:
- **Workflow Board** - `/production` (main entry point)
- **Shop Floor** - `/shop-floor` (existing standalone route + new nested route)

## Router Configuration

**File**: `src/frontend/src/router/AppRouter.jsx`

```jsx
// Standalone production layout with nested routes
{
  path: '/production',
  element: <ProductionLayout />,
  children: [
    { index: true, element: <ProductionWorkflowBoard /> },
    { path: 'shop-floor', element: <ShopFloorScreen /> },
    { path: 'shipping', element: <ShippingScreen /> },
  ],
}
```

## Setup Instructions

### 1. Database Migration

```bash
cd src/backend
npx prisma migrate dev --name add_shipping_fields_to_job
```

This adds:
- `shippingCarrier` String?
- `trackingNumber` String?
- `shippedAt` DateTime?

### 2. Start Development Servers

Ensure PostgreSQL is running:
```bash
docker compose up -d postgres
```

Start dev servers:
```bash
npm run dev
```

- Backend: http://localhost:3001
- Frontend: http://localhost:5174

### 3. Access Production Workflow

Navigate to: http://localhost:5174/production

## Usage Scenarios

### Scenario 1: Shop Floor Operator
1. Open `/production/shop-floor`
2. Filter by work center (e.g., "SAW-01")
3. View scheduled jobs for the day
4. Click "Start Job" to begin work
5. When complete, click "Complete Job" and add notes
6. Job moves to Ready to Ship

### Scenario 2: Shipping Clerk
1. Open `/production/shipping`
2. View all READY_TO_SHIP jobs
3. Click "Ship" on a job
4. Select carrier (e.g., "FedEx")
5. Enter tracking number
6. Add optional notes
7. Submit - job moves to SHIPPED

### Scenario 3: Production Manager
1. Open `/production` (workflow board)
2. View all jobs across all statuses
3. Filter by location/work center/division
4. Monitor bottlenecks (columns with high counts)
5. Click status transition buttons to manually adjust
6. Track progress in real-time

## Future Enhancements

### Phase 2 Features
- [ ] Drag-and-drop job reordering within columns
- [ ] Bulk status updates (select multiple jobs)
- [ ] Job assignment from workflow board
- [ ] Real-time notifications (WebSocket)
- [ ] Mobile-optimized touch interface
- [ ] Barcode scanning for job lookup
- [ ] Print shipping labels integration
- [ ] Historical analytics dashboard

### Performance Optimizations
- [ ] Virtual scrolling for large job lists
- [ ] WebSocket instead of polling
- [ ] Optimistic UI updates
- [ ] Pagination for workflow board
- [ ] Redis caching for stats

## Integration Points

### Existing Systems
- **Orders Module**: Jobs are created from Order records
- **Work Centers**: Jobs assigned to specific work centers
- **Users**: Jobs can be assigned to operators
- **Locations**: Multi-location filtering

### External Systems (Future)
- ERP integration for job sync
- WMS for inventory allocation
- Carrier APIs for label printing
- Quality management system for WAITING_QC stage

## File Structure

```
src/
├── frontend/
│   └── src/
│       ├── components/
│       │   └── production/
│       │       ├── ProductionLayout.jsx
│       │       ├── ProductionWorkflowBoard.jsx
│       │       ├── ShopFloorScreen.jsx
│       │       └── ShippingScreen.jsx
│       ├── services/
│       │   └── jobsService.js
│       └── router/
│           └── AppRouter.jsx
└── backend/
    └── src/
        └── routes/
            └── jobs.js
```

## Notes

- All timestamps are stored in UTC
- Auto-refresh can be disabled by setting interval to null
- Status transitions are validated server-side
- Shipping fields are optional until SHIPPED status
- Work centers must exist before jobs can be assigned
- Order relation is optional (jobs can exist standalone)

## Support

For issues or questions:
1. Check browser console for errors
2. Verify backend logs for API errors
3. Ensure database is running and migrated
4. Confirm all dependencies are installed (`pnpm install`)
