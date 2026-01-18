# SteelWise ERP - API Reference

> Complete REST API documentation for the SteelWise platform

**Base URL:** `http://localhost:3001/api`  
**Authentication:** JWT Bearer Token  
**Content-Type:** `application/json`

---

## Authentication

### POST /api/auth/login
Login and receive JWT token

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "OPERATOR"
  }
}
```

### POST /api/auth/logout
Invalidate current token

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

---

## Jobs API

### GET /api/jobs
List jobs with optional filters

**Query Parameters:**
- `status` - Filter by job status (ORDERED, SCHEDULED, IN_PROCESS, etc.)
- `locationId` - Filter by location UUID
- `workCenterId` - Filter by work center UUID
- `orderId` - Filter by order UUID
- `limit` - Number of results (default: 50)
- `offset` - Pagination offset

**Response:**
```json
[
  {
    "id": "uuid",
    "jobNumber": "JOB-000123",
    "status": "IN_PROCESS",
    "priority": 5,
    "scheduledStart": "2026-01-20T08:00:00Z",
    "actualStart": "2026-01-20T08:15:00Z",
    "workCenter": {
      "id": "uuid",
      "code": "SAW-01",
      "name": "Saw Station 1"
    },
    "order": {
      "id": "uuid",
      "orderNumber": "SO-2026-001",
      "buyerId": "uuid"
    },
    "assignedTo": {
      "id": "uuid",
      "firstName": "John",
      "lastName": "Doe"
    }
  }
]
```

### GET /api/jobs/:id
Get job details

**Response:**
```json
{
  "id": "uuid",
  "jobNumber": "JOB-000123",
  "status": "IN_PROCESS",
  "operationType": "SAWING",
  "priority": 5,
  "scheduledStart": "2026-01-20T08:00:00Z",
  "scheduledEnd": "2026-01-20T10:00:00Z",
  "actualStart": "2026-01-20T08:15:00Z",
  "actualEnd": null,
  "instructions": "Cut to 48 inch lengths",
  "notes": null,
  "workCenter": {
    "id": "uuid",
    "code": "SAW-01",
    "name": "Saw Station 1",
    "locationId": "uuid"
  },
  "order": {
    "id": "uuid",
    "orderNumber": "SO-2026-001",
    "buyer": {
      "name": "Acme Corp"
    },
    "lines": [...]
  },
  "assignedTo": {
    "id": "uuid",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com"
  },
  "createdBy": {
    "id": "uuid",
    "firstName": "Jane",
    "lastName": "Smith"
  },
  "createdAt": "2026-01-19T14:30:00Z",
  "updatedAt": "2026-01-20T08:15:00Z"
}
```

### POST /api/jobs
Create new job

**Request:**
```json
{
  "orderId": "uuid",
  "workCenterId": "uuid",
  "operationType": "SAWING",
  "scheduledStart": "2026-01-20T08:00:00Z",
  "scheduledEnd": "2026-01-20T10:00:00Z",
  "priority": 5,
  "instructions": "Cut to 48 inch lengths",
  "assignedToId": "uuid",
  "createdById": "uuid"
}
```

**Response:**
```json
{
  "id": "uuid",
  "jobNumber": "JOB-000124",
  "status": "SCHEDULED",
  ...
}
```

### POST /api/jobs/:id/status
Update job status

**Request:**
```json
{
  "status": "IN_PROCESS",
  "note": "Started cutting operation",
  "scrapWeight": 12.5
}
```

**Response:**
```json
{
  "id": "uuid",
  "jobNumber": "JOB-000123",
  "status": "IN_PROCESS",
  "actualStart": "2026-01-20T08:15:00Z",
  ...
}
```

### POST /api/jobs/:id/start
Start a job (SCHEDULED → IN_PROCESS)

**Request:**
```json
{
  "note": "Starting sawing operation"
}
```

**Response:**
```json
{
  "id": "uuid",
  "jobNumber": "JOB-000123",
  "status": "IN_PROCESS",
  "actualStart": "2026-01-20T08:15:00Z",
  ...
}
```

### POST /api/jobs/:id/complete
Complete a job (IN_PROCESS → READY_TO_SHIP)

**Request:**
```json
{
  "note": "All pieces cut and inspected"
}
```

**Response:**
```json
{
  "id": "uuid",
  "jobNumber": "JOB-000123",
  "status": "READY_TO_SHIP",
  "actualEnd": "2026-01-20T10:00:00Z",
  ...
}
```

### POST /api/jobs/:id/ship
Ship a job (READY_TO_SHIP → SHIPPED)

**Request:**
```json
{
  "carrier": "FedEx",
  "trackingNumber": "1Z999AA10123456784",
  "note": "Shipped via FedEx Ground"
}
```

**Response:**
```json
{
  "id": "uuid",
  "jobNumber": "JOB-000123",
  "status": "SHIPPED",
  "shippingCarrier": "FedEx",
  "trackingNumber": "1Z999AA10123456784",
  "shippedAt": "2026-01-20T15:30:00Z",
  ...
}
```

### GET /api/jobs/:id/history
Get job status change history

**Response:**
```json
[
  {
    "timestamp": "2026-01-19T14:30:00Z",
    "status": "ORDERED",
    "note": "Job created"
  },
  {
    "timestamp": "2026-01-20T08:15:00Z",
    "status": "IN_PROCESS",
    "note": "Job started"
  },
  {
    "timestamp": "2026-01-20T10:00:00Z",
    "status": "READY_TO_SHIP",
    "note": "Job completed"
  },
  {
    "timestamp": "2026-01-20T15:30:00Z",
    "status": "SHIPPED",
    "note": "Shipped via FedEx - 1Z999AA10123456784"
  }
]
```

### GET /api/jobs/stats/summary
Get job statistics

**Query Parameters:**
- `locationId` - Filter by location
- `workCenterId` - Filter by work center

**Response:**
```json
{
  "byStatus": {
    "ORDERED": 5,
    "SCHEDULED": 12,
    "IN_PROCESS": 8,
    "WAITING_QC": 3,
    "PACKAGING": 2,
    "READY_TO_SHIP": 6,
    "SHIPPED": 24,
    "COMPLETED": 150
  },
  "total": 210
}
```

---

## Orders API

### GET /api/orders
List orders

**Query Parameters:**
- `status` - Filter by order status
- `orderType` - Filter by type (QUOTE, PURCHASE_ORDER, SALES_ORDER)
- `buyerId` - Filter by buyer organization
- `limit` - Results per page
- `offset` - Pagination offset

**Response:**
```json
[
  {
    "id": "uuid",
    "orderNumber": "SO-2026-001",
    "orderType": "SALES_ORDER",
    "status": "IN_PRODUCTION",
    "orderDate": "2026-01-19T00:00:00Z",
    "requiredDate": "2026-01-25T00:00:00Z",
    "totalAmount": 12500.00,
    "buyer": {
      "id": "uuid",
      "name": "Acme Corp"
    }
  }
]
```

### GET /api/orders/:id
Get order details

### POST /api/orders
Create order

### PATCH /api/orders/:id
Update order

---

## Heats API

### GET /api/heats
List heats

**Query Parameters:**
- `heatNumber` - Search by heat number
- `mill` - Filter by mill
- `grade` - Filter by material grade

**Response:**
```json
[
  {
    "id": "uuid",
    "heatNumber": "H123456",
    "mill": "Nucor",
    "grade": "A36",
    "status": "AVAILABLE",
    "weightLb": 50000.0
  }
]
```

### GET /api/heats/:id
Get heat details

### POST /api/heats
Create heat

---

## Units API

### GET /api/units
List units

**Query Parameters:**
- `unitNumber` - Search by unit number
- `locationId` - Filter by location
- `status` - Filter by status
- `heatId` - Filter by heat

**Response:**
```json
[
  {
    "id": "uuid",
    "unitNumber": "UNIT-001234",
    "status": "AVAILABLE",
    "lengthInches": 240.0,
    "widthInches": 48.0,
    "thicknessInches": 0.5,
    "weightLb": 1200.0,
    "location": {
      "id": "uuid",
      "name": "Warehouse A - Bay 3"
    },
    "heat": {
      "id": "uuid",
      "heatNumber": "H123456"
    }
  }
]
```

### GET /api/units/:id
Get unit details

### POST /api/units
Create unit

### PATCH /api/units/:id
Update unit

---

## AI API

### POST /api/ai/chat
Chat completion

**Request:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "What is the best way to cut A36 steel?"
    }
  ],
  "taskType": "chat",
  "provider": "deepseek"
}
```

**Response:**
```json
{
  "message": {
    "role": "assistant",
    "content": "For A36 steel, the best cutting method depends..."
  },
  "provider": "deepseek",
  "model": "deepseek-chat",
  "usage": {
    "promptTokens": 15,
    "completionTokens": 125,
    "totalTokens": 140,
    "cost": 0.000035
  }
}
```

### POST /api/ai/chat/stream
Streaming chat completion (SSE)

**Request:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Explain heat treatment for steel"
    }
  ],
  "taskType": "chat"
}
```

**Response:** Server-Sent Events stream
```
data: {"content": "Heat", "done": false}
data: {"content": " treatment", "done": false}
data: {"content": " is a", "done": false}
...
data: {"done": true, "usage": {...}}
```

### POST /api/ai/embeddings
Generate text embeddings

**Request:**
```json
{
  "text": "A36 hot rolled steel plate",
  "provider": "openai"
}
```

**Response:**
```json
{
  "embedding": [0.123, -0.456, 0.789, ...],
  "dimensions": 1536,
  "provider": "openai",
  "model": "text-embedding-3-small"
}
```

### GET /api/ai/providers
List available AI providers

**Response:**
```json
{
  "providers": [
    {
      "name": "deepseek",
      "available": true,
      "models": ["deepseek-chat", "deepseek-reasoner"]
    },
    {
      "name": "openai",
      "available": true,
      "models": ["gpt-4o", "gpt-4o-mini"]
    }
  ],
  "defaultProvider": "deepseek"
}
```

### POST /api/ai/test
Test provider connection

**Request:**
```json
{
  "provider": "deepseek"
}
```

**Response:**
```json
{
  "success": true,
  "provider": "deepseek",
  "latencyMs": 245
}
```

### GET /api/ai/usage
Get AI usage statistics

**Query Parameters:**
- `startDate` - Start date (ISO 8601)
- `endDate` - End date (ISO 8601)
- `provider` - Filter by provider

**Response:**
```json
{
  "totalRequests": 1250,
  "totalTokens": 3500000,
  "totalCost": 0.49,
  "byProvider": {
    "deepseek": {
      "requests": 1200,
      "tokens": 3400000,
      "cost": 0.47
    },
    "openai": {
      "requests": 50,
      "tokens": 100000,
      "cost": 0.02
    }
  }
}
```

---

## Error Responses

All endpoints return consistent error responses:

### 400 Bad Request
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "error": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "error": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```

---

## Rate Limiting

- **Limit:** 100 requests per minute per IP
- **Header:** `X-RateLimit-Remaining`
- **Reset:** `X-RateLimit-Reset` (Unix timestamp)

---

## Pagination

List endpoints support pagination:

**Query Parameters:**
- `limit` - Items per page (default: 50, max: 100)
- `offset` - Number of items to skip

**Response Headers:**
- `X-Total-Count` - Total number of items
- `X-Page-Size` - Current page size
- `X-Page-Offset` - Current offset

---

## Webhooks

Configure webhooks to receive real-time notifications:

**Events:**
- `job.created`
- `job.started`
- `job.completed`
- `job.shipped`
- `order.created`
- `order.updated`

**Payload:**
```json
{
  "event": "job.completed",
  "timestamp": "2026-01-20T10:00:00Z",
  "data": {
    "id": "uuid",
    "jobNumber": "JOB-000123",
    ...
  }
}
```

---

**Last Updated:** January 18, 2026
