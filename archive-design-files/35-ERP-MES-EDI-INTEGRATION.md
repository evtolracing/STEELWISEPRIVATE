# Phase 18: ERP/MES/EDI Integration Architecture

**Document Version:** 1.0  
**Date:** January 17, 2026  
**Status:** Enterprise Integration Specification

---

## 1. EXECUTIVE SUMMARY

This document defines how the SteelWise platform interoperates with enterprise ERP systems (SAP, Oracle, Epicor, etc.), Manufacturing Execution Systems (MES), and Electronic Data Interchange (EDI) environments. The goal is to provide a flexible, event-driven integration layer that allows SteelWise to function as either a standalone system or as a specialized metals execution module within a larger enterprise ecosystem.

### Integration Philosophy

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        INTEGRATION PHILOSOPHY                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  DEPLOYMENT MODES                                                               │
│  ═══════════════════════════════════════════════════════════════════════════   │
│                                                                                 │
│  MODE 1: STANDALONE                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                         │   │
│  │  SteelWise is the system of record for all operations                  │   │
│  │  • Orders entered directly                                              │   │
│  │  • Invoices generated and sent                                          │   │
│  │  • Inventory master maintained here                                     │   │
│  │  • GL sync via export files                                             │   │
│  │                                                                         │   │
│  │  Typical: Small-medium service centers, no existing ERP                 │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  MODE 2: ERP-SUBORDINATE                                                        │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                         │   │
│  │  ERP is system of record; SteelWise handles shop execution             │   │
│  │  • Orders flow from ERP → SteelWise                                     │   │
│  │  • Completions flow SteelWise → ERP                                     │   │
│  │  • Inventory balances sync bidirectionally                              │   │
│  │  • Invoicing happens in ERP                                             │   │
│  │                                                                         │   │
│  │  Typical: Enterprise customers with SAP/Oracle/Epicor                  │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  MODE 3: HYBRID                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                         │   │
│  │  SteelWise owns shop floor; ERP owns financials                        │   │
│  │  • Some orders from ERP, some entered directly                          │   │
│  │  • Inventory balances sync to ERP nightly                               │   │
│  │  • Costing in SteelWise, GL posting in ERP                              │   │
│  │  • EDI handled by either system                                         │   │
│  │                                                                         │   │
│  │  Typical: Companies with legacy ERP, modernizing shop floor            │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  INTEGRATION PRINCIPLES                                                         │
│  ═══════════════════════════════════════════════════════════════════════════   │
│                                                                                 │
│  1. EVENT-FIRST: Publish domain events; subscribers decide what to do         │
│  2. IDEMPOTENT: All operations can be safely retried                           │
│  3. TRACEABLE: Every integration has correlation IDs and audit logs           │
│  4. RESILIENT: Failures don't cascade; queues buffer transient issues         │
│  5. CONFIGURABLE: Integration points can be enabled/disabled per tenant       │
│  6. MAPPABLE: Field mappings are configurable, not hard-coded                  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. INTEGRATION ARCHITECTURE

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    ENTERPRISE INTEGRATION ARCHITECTURE                                   │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                         │
│                            EXTERNAL SYSTEMS                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                                                 │   │
│  │  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐       │   │
│  │  │    SAP      │   │   Oracle    │   │   Epicor    │   │  EDI VAN    │   │   Other     │       │   │
│  │  │   S/4HANA   │   │   NetSuite  │   │   Prophet21 │   │  (SPS/TIE)  │   │   MES/WMS   │       │   │
│  │  └──────┬──────┘   └──────┬──────┘   └──────┬──────┘   └──────┬──────┘   └──────┬──────┘       │   │
│  │         │                 │                 │                 │                 │              │   │
│  └─────────┼─────────────────┼─────────────────┼─────────────────┼─────────────────┼──────────────┘   │
│            │                 │                 │                 │                 │                   │
│            ▼                 ▼                 ▼                 ▼                 ▼                   │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                                                 │   │
│  │                              INTEGRATION GATEWAY LAYER                                          │   │
│  │                                                                                                 │   │
│  │  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐       │   │
│  │  │   SAP       │   │   Oracle    │   │   Generic   │   │    EDI      │   │    MES      │       │   │
│  │  │  Adapter    │   │   Adapter   │   │ ERP Adapter │   │   Adapter   │   │   Adapter   │       │   │
│  │  └──────┬──────┘   └──────┬──────┘   └──────┬──────┘   └──────┬──────┘   └──────┬──────┘       │   │
│  │         │                 │                 │                 │                 │              │   │
│  │         └─────────────────┴─────────────────┴─────────────────┴─────────────────┘              │   │
│  │                                             │                                                   │   │
│  │                                             ▼                                                   │   │
│  │  ┌─────────────────────────────────────────────────────────────────────────────────────────┐   │   │
│  │  │                           CANONICAL DATA MODEL                                          │   │   │
│  │  │                                                                                         │   │   │
│  │  │  Normalized entities: Order, Product, Customer, Inventory, Shipment, Invoice           │   │   │
│  │  │  All adapters translate to/from canonical model                                         │   │   │
│  │  │                                                                                         │   │   │
│  │  └─────────────────────────────────────────────────────────────────────────────────────────┘   │   │
│  │                                             │                                                   │   │
│  └─────────────────────────────────────────────┼───────────────────────────────────────────────────┘   │
│                                                │                                                       │
│  ┌─────────────────────────────────────────────┼───────────────────────────────────────────────────┐   │
│  │                                             ▼                                                   │   │
│  │                              INTEGRATION SERVICES                                               │   │
│  │                                                                                                 │   │
│  │  ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐    │   │
│  │  │   Event Bus       │  │   Message Queue   │  │   Scheduler       │  │   Transformer     │    │   │
│  │  │   (Pub/Sub)       │  │   (RabbitMQ)      │  │   (Cron Jobs)     │  │   (Field Mapping) │    │   │
│  │  └─────────┬─────────┘  └─────────┬─────────┘  └─────────┬─────────┘  └─────────┬─────────┘    │   │
│  │            │                      │                      │                      │              │   │
│  │            └──────────────────────┴──────────────────────┴──────────────────────┘              │   │
│  │                                             │                                                   │   │
│  └─────────────────────────────────────────────┼───────────────────────────────────────────────────┘   │
│                                                │                                                       │
│  ┌─────────────────────────────────────────────┼───────────────────────────────────────────────────┐   │
│  │                                             ▼                                                   │   │
│  │                               STEELWISE CORE PLATFORM                                           │   │
│  │                                                                                                 │   │
│  │  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐       │   │
│  │  │   Orders    │   │  Inventory  │   │  Production │   │  Shipping   │   │   Billing   │       │   │
│  │  │   Module    │   │   Module    │   │   Module    │   │   Module    │   │   Module    │       │   │
│  │  └─────────────┘   └─────────────┘   └─────────────┘   └─────────────┘   └─────────────┘       │   │
│  │                                                                                                 │   │
│  └─────────────────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Integration Patterns

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        INTEGRATION PATTERNS                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  PATTERN 1: EVENT-DRIVEN (PREFERRED)                                            │
│  ═══════════════════════════════════════════════════════════════════════════   │
│                                                                                 │
│  ┌──────────────┐      Event Bus      ┌──────────────┐                         │
│  │  SteelWise   │ ──── Publish ────▶ │   Queue      │                         │
│  │  Domain      │                     │              │                         │
│  │  Event       │                     │  order.      │                         │
│  │              │                     │  completed   │                         │
│  └──────────────┘                     └──────┬───────┘                         │
│                                              │                                  │
│                          ┌───────────────────┼───────────────────┐             │
│                          │                   │                   │             │
│                          ▼                   ▼                   ▼             │
│                   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐       │
│                   │ ERP Adapter  │   │ EDI Adapter  │   │ Webhook      │       │
│                   │ (Subscriber) │   │ (Subscriber) │   │ (Subscriber) │       │
│                   └──────────────┘   └──────────────┘   └──────────────┘       │
│                                                                                 │
│  Use for: Real-time updates, order status changes, inventory movements         │
│  Latency: <5 seconds typical                                                   │
│                                                                                 │
│  ───────────────────────────────────────────────────────────────────────────   │
│                                                                                 │
│  PATTERN 2: REQUEST/RESPONSE (SYNC API)                                         │
│  ═══════════════════════════════════════════════════════════════════════════   │
│                                                                                 │
│  ┌──────────────┐       REST API       ┌──────────────┐                        │
│  │  External    │ ──── Request ─────▶ │  SteelWise   │                        │
│  │  System      │ ◀── Response ────── │  API         │                        │
│  └──────────────┘                      └──────────────┘                        │
│                                                                                 │
│  Use for: Data queries, master data sync, immediate responses needed          │
│  Latency: <500ms SLA                                                           │
│                                                                                 │
│  ───────────────────────────────────────────────────────────────────────────   │
│                                                                                 │
│  PATTERN 3: BATCH/SCHEDULED (POLLING)                                           │
│  ═══════════════════════════════════════════════════════════════════════════   │
│                                                                                 │
│  ┌──────────────┐       Scheduler       ┌──────────────┐                       │
│  │  Cron Job    │ ─── Every 15 min ──▶ │  Sync Job    │                       │
│  │  (Trigger)   │                       │              │                       │
│  └──────────────┘                       └──────┬───────┘                       │
│                                                │                                │
│                                                ▼                                │
│                                   ┌────────────────────────┐                   │
│                                   │  1. Query changes      │                   │
│                                   │  2. Transform data     │                   │
│                                   │  3. Push to target     │                   │
│                                   │  4. Log results        │                   │
│                                   └────────────────────────┘                   │
│                                                                                 │
│  Use for: Inventory reconciliation, GL posting, EDI polling                    │
│  Latency: Configurable (5 min to 24 hours)                                     │
│                                                                                 │
│  ───────────────────────────────────────────────────────────────────────────   │
│                                                                                 │
│  PATTERN 4: FILE-BASED                                                          │
│  ═══════════════════════════════════════════════════════════════════════════   │
│                                                                                 │
│  ┌──────────────┐       SFTP/S3         ┌──────────────┐                       │
│  │  SteelWise   │ ──── Drop File ────▶ │  External    │                       │
│  │  Export      │                       │  System      │                       │
│  └──────────────┘                       │  (watches)   │                       │
│                                         └──────────────┘                       │
│                                                                                 │
│  Use for: EDI, legacy system integration, GL exports                           │
│  Formats: CSV, XML, JSON, EDI X12, EDIFACT                                     │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 2.3 Component Architecture

```typescript
// Integration Gateway Architecture

interface IntegrationGateway {
  // Adapter registry
  adapters: Map<string, IntegrationAdapter>;
  
  // Event bus
  eventBus: EventBus;
  
  // Message queue
  messageQueue: MessageQueue;
  
  // Scheduler
  scheduler: Scheduler;
  
  // Transformer
  transformer: DataTransformer;
  
  // Configuration
  config: IntegrationConfig;
}

interface IntegrationAdapter {
  adapterId: string;
  adapterType: 'ERP' | 'MES' | 'EDI' | 'WMS' | 'CUSTOM';
  systemName: string;  // SAP, Oracle, Epicor, etc.
  
  // Connection
  connection: AdapterConnection;
  
  // Capabilities
  capabilities: {
    canReceiveOrders: boolean;
    canSendOrderStatus: boolean;
    canSyncInventory: boolean;
    canReceiveShipments: boolean;
    canSendInvoices: boolean;
    // ... etc
  };
  
  // Field mappings
  fieldMappings: FieldMapping[];
  
  // Methods
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  healthCheck(): Promise<HealthStatus>;
  
  // Inbound
  receive(messageType: string): Promise<CanonicalMessage>;
  
  // Outbound
  send(message: CanonicalMessage): Promise<SendResult>;
}

interface AdapterConnection {
  protocol: 'REST' | 'SOAP' | 'ODATA' | 'IDOC' | 'RFC' | 'SFTP' | 'AS2';
  
  // Endpoint
  endpoint: string;
  
  // Authentication
  auth: {
    type: 'BASIC' | 'OAUTH2' | 'API_KEY' | 'CERTIFICATE' | 'SAP_JWT';
    credentials: Record<string, string>;  // Encrypted
  };
  
  // Retry policy
  retryPolicy: {
    maxRetries: number;
    backoffMultiplier: number;
    initialDelayMs: number;
  };
  
  // Rate limiting
  rateLimit: {
    requestsPerSecond: number;
    burstLimit: number;
  };
}

interface FieldMapping {
  mappingId: string;
  entityType: string;  // Order, Customer, Product, etc.
  direction: 'INBOUND' | 'OUTBOUND' | 'BIDIRECTIONAL';
  
  fields: FieldMapEntry[];
}

interface FieldMapEntry {
  canonicalField: string;       // SteelWise field name
  externalField: string;        // External system field name
  transformation?: string;      // e.g., "UPPERCASE", "DATE_FORMAT:YYYYMMDD"
  defaultValue?: any;
  required: boolean;
  notes?: string;
}
```

---

## 3. EDI INTEGRATION

### 3.1 Supported EDI Documents

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    EDI DOCUMENT CATALOG                                                  │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                         │
│  INBOUND DOCUMENTS (Received from Trading Partners)                                                     │
│  ═══════════════════════════════════════════════════════════════════════════════════════════════════   │
│                                                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                                                 │   │
│  │  EDI 850 - PURCHASE ORDER                                                                       │   │
│  │  ─────────────────────────────────────────────────────────────────────────────────────────────  │   │
│  │  Purpose: Customer sends order to SteelWise                                                     │   │
│  │  Trigger: Customer places order via EDI                                                         │   │
│  │  Action:  Create Sales Order in SteelWise                                                       │   │
│  │                                                                                                 │   │
│  │  Key Segments:                                                                                  │   │
│  │  • BEG - Beginning segment (PO number, date, type)                                              │   │
│  │  • N1 - Party identification (ship-to, bill-to)                                                 │   │
│  │  • PO1 - Line item detail (product, qty, price)                                                 │   │
│  │  • SCH - Schedule (requested delivery date)                                                     │   │
│  │  • CTT - Transaction totals                                                                     │   │
│  │                                                                                                 │   │
│  │  ──────────────────────────────────────────────────────────────────────────────────────────────│   │
│  │                                                                                                 │   │
│  │  EDI 860 - PURCHASE ORDER CHANGE                                                                │   │
│  │  ─────────────────────────────────────────────────────────────────────────────────────────────  │   │
│  │  Purpose: Customer modifies existing order                                                      │   │
│  │  Trigger: Customer changes qty, date, or cancels lines                                          │   │
│  │  Action:  Update Sales Order, trigger re-planning                                               │   │
│  │                                                                                                 │   │
│  │  ──────────────────────────────────────────────────────────────────────────────────────────────│   │
│  │                                                                                                 │   │
│  │  EDI 862 - SHIPPING SCHEDULE                                                                    │   │
│  │  ─────────────────────────────────────────────────────────────────────────────────────────────  │   │
│  │  Purpose: Customer's production schedule (automotive)                                           │   │
│  │  Trigger: Daily/weekly from OEM customers                                                       │   │
│  │  Action:  Update demand forecast, adjust inventory                                              │   │
│  │                                                                                                 │   │
│  │  ──────────────────────────────────────────────────────────────────────────────────────────────│   │
│  │                                                                                                 │   │
│  │  EDI 830 - PLANNING SCHEDULE                                                                    │   │
│  │  ─────────────────────────────────────────────────────────────────────────────────────────────  │   │
│  │  Purpose: Forecast/release for blanket orders                                                   │   │
│  │  Trigger: Weekly from MRP-driven customers                                                      │   │
│  │  Action:  Update blanket order releases                                                         │   │
│  │                                                                                                 │   │
│  └─────────────────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                                         │
│  OUTBOUND DOCUMENTS (Sent to Trading Partners)                                                          │
│  ═══════════════════════════════════════════════════════════════════════════════════════════════════   │
│                                                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                                                 │   │
│  │  EDI 855 - PURCHASE ORDER ACKNOWLEDGMENT                                                        │   │
│  │  ─────────────────────────────────────────────────────────────────────────────────────────────  │   │
│  │  Purpose: Confirm receipt and acceptance of order                                               │   │
│  │  Trigger: Order accepted/modified in SteelWise                                                  │   │
│  │  Content: Confirmed quantities, prices, dates                                                   │   │
│  │                                                                                                 │   │
│  │  Status Codes:                                                                                  │   │
│  │  • AC - Acknowledged without changes                                                            │   │
│  │  • AD - Acknowledged with changes                                                               │   │
│  │  • RJ - Rejected                                                                                │   │
│  │                                                                                                 │   │
│  │  ──────────────────────────────────────────────────────────────────────────────────────────────│   │
│  │                                                                                                 │   │
│  │  EDI 856 - ADVANCE SHIP NOTICE (ASN)                                                            │   │
│  │  ─────────────────────────────────────────────────────────────────────────────────────────────  │   │
│  │  Purpose: Notify customer of incoming shipment                                                  │   │
│  │  Trigger: Shipment confirmed in SteelWise                                                       │   │
│  │  Content: Carrier, tracking, items, weights, pallet/package details                             │   │
│  │                                                                                                 │   │
│  │  Key Segments:                                                                                  │   │
│  │  • BSN - Beginning segment (shipment ID, date)                                                  │   │
│  │  • HL - Hierarchical level (shipment > order > pack > item)                                     │   │
│  │  • TD1/TD3/TD5 - Carrier details                                                                │   │
│  │  • REF - Reference numbers (PO, BOL, PRO)                                                       │   │
│  │  • MAN - Marks and numbers (barcodes, labels)                                                   │   │
│  │  • SN1 - Item detail (shipped qty, UOM)                                                         │   │
│  │                                                                                                 │   │
│  │  ──────────────────────────────────────────────────────────────────────────────────────────────│   │
│  │                                                                                                 │   │
│  │  EDI 810 - INVOICE                                                                              │   │
│  │  ─────────────────────────────────────────────────────────────────────────────────────────────  │   │
│  │  Purpose: Bill customer for shipped goods                                                       │   │
│  │  Trigger: Invoice generated in SteelWise                                                        │   │
│  │  Content: Line items, prices, taxes, payment terms                                              │   │
│  │                                                                                                 │   │
│  │  Key Segments:                                                                                  │   │
│  │  • BIG - Beginning segment (invoice #, date, PO reference)                                      │   │
│  │  • N1 - Party identification                                                                    │   │
│  │  • IT1 - Line item detail                                                                       │   │
│  │  • TDS - Total monetary value summary                                                           │   │
│  │  • CAD - Carrier detail                                                                         │   │
│  │                                                                                                 │   │
│  │  ──────────────────────────────────────────────────────────────────────────────────────────────│   │
│  │                                                                                                 │   │
│  │  EDI 846 - INVENTORY INQUIRY/ADVICE                                                             │   │
│  │  ─────────────────────────────────────────────────────────────────────────────────────────────  │   │
│  │  Purpose: Share inventory availability with customer                                            │   │
│  │  Trigger: Scheduled (daily) or on-demand                                                        │   │
│  │  Content: Product availability by location                                                      │   │
│  │                                                                                                 │   │
│  │  ──────────────────────────────────────────────────────────────────────────────────────────────│   │
│  │                                                                                                 │   │
│  │  EDI 997 - FUNCTIONAL ACKNOWLEDGMENT                                                            │   │
│  │  ─────────────────────────────────────────────────────────────────────────────────────────────  │   │
│  │  Purpose: Confirm receipt of any EDI document                                                   │   │
│  │  Trigger: Automatic on document receipt                                                         │   │
│  │  Content: Accepted/rejected status                                                              │   │
│  │                                                                                                 │   │
│  └─────────────────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 EDI Mapping Examples

```typescript
// EDI 850 → SteelWise Order mapping

interface EDI850Mapping {
  // Header mapping
  header: {
    'BEG02': { target: 'order.poNumber', transform: null },
    'BEG03': { target: 'order.poDate', transform: 'DATE_X12_TO_ISO' },
    'BEG05': { target: 'order.poType', transform: 'MAP:NE=NEW,RO=REORDER' },
    
    // Party identification
    'N1*ST': { 
      target: 'order.shipTo', 
      subMappings: {
        'N102': 'shipTo.name',
        'N103': 'shipTo.idQualifier',
        'N104': 'shipTo.id',
        'N301': 'shipTo.address1',
        'N302': 'shipTo.address2',
        'N401': 'shipTo.city',
        'N402': 'shipTo.state',
        'N403': 'shipTo.zip'
      }
    },
    
    'N1*BT': { target: 'order.billTo', /* similar */ },
    
    // Dates
    'DTM*002': { target: 'order.requestedDeliveryDate', transform: 'DATE_X12_TO_ISO' },
    'DTM*010': { target: 'order.requestedShipDate', transform: 'DATE_X12_TO_ISO' }
  };
  
  // Line item mapping
  lineItems: {
    'PO101': { target: 'line.lineNumber', transform: null },
    'PO102': { target: 'line.orderedQty', transform: 'DECIMAL' },
    'PO103': { target: 'line.uom', transform: 'MAP:EA=EA,LB=LB,FT=FT,PC=PC' },
    'PO104': { target: 'line.unitPrice', transform: 'DECIMAL' },
    'PO105': { target: 'line.priceUom', transform: 'MAP_UOM' },
    'PO106': { target: 'line.productIdQualifier', transform: null },
    'PO107': { target: 'line.productId', transform: 'LOOKUP_PRODUCT' },
    
    // Schedule
    'SCH01': { target: 'line.scheduledQty', transform: 'DECIMAL' },
    'SCH05': { target: 'line.scheduledDate', transform: 'DATE_X12_TO_ISO' },
    
    // Product description
    'PID05': { target: 'line.description', transform: null },
    
    // Notes
    'NTE02': { target: 'line.notes', transform: 'CONCAT' }
  };
}

// EDI document processor
class EDI850Processor {
  
  async process(ediDocument: string): Promise<Order> {
    // Parse X12
    const parsed = this.parser.parse(ediDocument);
    
    // Validate structure
    this.validateStructure(parsed);
    
    // Transform to canonical order
    const order = this.transformToOrder(parsed);
    
    // Validate order
    await this.validateOrder(order);
    
    // Product lookup
    await this.resolveProducts(order);
    
    // Pricing validation
    await this.validatePricing(order);
    
    return order;
  }
  
  private transformToOrder(parsed: ParsedEDI): Order {
    const mapping = this.getMappingConfig();
    const order: Partial<Order> = {};
    
    // Map header
    for (const [ediPath, config] of Object.entries(mapping.header)) {
      const value = this.extractValue(parsed, ediPath);
      const transformed = this.applyTransform(value, config.transform);
      this.setNestedValue(order, config.target, transformed);
    }
    
    // Map line items
    order.lines = parsed.lineItems.map(ediLine => {
      const line: Partial<OrderLine> = {};
      for (const [ediPath, config] of Object.entries(mapping.lineItems)) {
        const value = this.extractValue(ediLine, ediPath);
        const transformed = this.applyTransform(value, config.transform);
        this.setNestedValue(line, config.target, transformed);
      }
      return line as OrderLine;
    });
    
    return order as Order;
  }
}

// SteelWise Order → EDI 856 ASN mapping

interface EDI856Generator {
  
  async generate(shipment: Shipment): Promise<string> {
    const segments: string[] = [];
    
    // ISA/GS envelope (trading partner specific)
    segments.push(this.generateEnvelope(shipment.tradingPartnerId));
    
    // BSN - Beginning Segment
    segments.push(this.formatSegment('BSN', [
      '00',                                    // Transaction Set Purpose Code
      shipment.shipmentNumber,                 // Shipment ID
      this.formatDate(shipment.shipDate),      // Date
      this.formatTime(shipment.shipTime),      // Time
      '0001'                                   // Hierarchical Structure Code
    ]));
    
    // HL - Shipment Level
    let hlCounter = 1;
    segments.push(this.formatSegment('HL', [
      hlCounter.toString(),                    // HL ID
      '',                                      // Parent HL (none for shipment)
      'S',                                     // Level Code = Shipment
      '1'                                      // Has children
    ]));
    
    // TD5 - Carrier Details
    segments.push(this.formatSegment('TD5', [
      'B',                                     // Routing Sequence Code
      '2',                                     // ID Code Qualifier = SCAC
      shipment.carrier.scac,                   // Carrier ID
      '',                                      // 
      shipment.carrier.name                    // Carrier Name
    ]));
    
    // REF - Reference Numbers
    segments.push(this.formatSegment('REF', ['BM', shipment.bolNumber]));
    segments.push(this.formatSegment('REF', ['CN', shipment.proNumber]));
    
    // DTM - Date/Time
    segments.push(this.formatSegment('DTM', ['011', this.formatDate(shipment.shipDate)]));
    
    // N1 - Ship From
    segments.push(this.generateN1('SF', shipment.shipFrom));
    
    // N1 - Ship To
    segments.push(this.generateN1('ST', shipment.shipTo));
    
    // For each order in shipment
    for (const orderShipment of shipment.orders) {
      hlCounter++;
      
      // HL - Order Level
      segments.push(this.formatSegment('HL', [
        hlCounter.toString(),
        '1',                                   // Parent = Shipment HL
        'O',                                   // Level Code = Order
        '1'
      ]));
      
      // PRF - PO Reference
      segments.push(this.formatSegment('PRF', [orderShipment.poNumber]));
      
      // For each item
      for (const item of orderShipment.items) {
        hlCounter++;
        
        // HL - Item Level
        segments.push(this.formatSegment('HL', [
          hlCounter.toString(),
          (hlCounter - 1).toString(),          // Parent = Order HL
          'I',                                 // Level Code = Item
          '0'                                  // No children
        ]));
        
        // LIN - Item Identification
        segments.push(this.formatSegment('LIN', [
          item.lineNumber.toString(),
          'VP',                                // Vendor Part Number
          item.productNumber,
          'BP',                                // Buyer Part Number
          item.customerPartNumber || ''
        ]));
        
        // SN1 - Item Detail
        segments.push(this.formatSegment('SN1', [
          '',
          item.shippedQty.toString(),
          item.uom,
          '',
          item.orderedQty.toString(),
          item.uom
        ]));
      }
    }
    
    // CTT - Transaction Totals
    segments.push(this.formatSegment('CTT', [shipment.totalLineItems.toString()]));
    
    // SE/GE/IEA trailer
    segments.push(this.generateTrailer());
    
    return segments.join('~\n');
  }
}
```

### 3.3 EDI Configuration

```typescript
interface EDIConfiguration {
  tenantId: string;
  
  // VAN (Value Added Network) settings
  van: {
    provider: 'SPS_COMMERCE' | 'TIE_KINETIX' | 'CLEO' | 'BOOMI' | 'DIRECT_AS2';
    
    // Connection for SPS Commerce
    spsCommerce?: {
      companyId: string;
      apiKey: string;
      environment: 'TEST' | 'PRODUCTION';
    };
    
    // Direct AS2
    as2?: {
      partnerId: string;
      localId: string;
      partnerUrl: string;
      encryptionCert: string;
      signingKey: string;
    };
  };
  
  // Trading partner configurations
  tradingPartners: TradingPartnerConfig[];
  
  // Default document settings
  defaults: {
    acknowledgment997: boolean;    // Auto-send 997
    acknowledgment855: boolean;    // Auto-send 855
    asnTiming: 'ON_SHIP' | 'ON_CARRIER_PICKUP' | 'MANUAL';
    invoiceTiming: 'ON_SHIP' | 'ON_DELIVERY' | 'WITH_ASN';
  };
}

interface TradingPartnerConfig {
  partnerId: string;
  partnerName: string;
  
  // Identifiers
  isaId: string;                   // ISA sender/receiver ID
  gsId: string;                    // GS sender/receiver ID
  
  // Supported documents
  supportedDocuments: {
    documentType: '850' | '855' | '856' | '810' | '860' | '862' | '830' | '846';
    direction: 'INBOUND' | 'OUTBOUND';
    version: string;               // e.g., "004010", "005010"
    enabled: boolean;
    
    // Document-specific settings
    settings?: Record<string, any>;
  }[];
  
  // Field mappings (partner-specific overrides)
  customMappings?: {
    documentType: string;
    mappingOverrides: FieldMapEntry[];
  }[];
  
  // Product cross-reference
  productXref: {
    ourSku: string;
    partnerSku: string;
    partnerDescription?: string;
    uomConversion?: number;
  }[];
  
  // Communication schedule
  schedule: {
    pollFrequency: number;         // Minutes (for VAN polling)
    sendWindow?: {
      startHour: number;
      endHour: number;
    };
  };
}
```

---

## 4. ERP INTEGRATION

### 4.1 SAP Integration

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    SAP S/4HANA INTEGRATION                                               │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                         │
│  INTEGRATION APPROACH                                                                                   │
│  ═══════════════════════════════════════════════════════════════════════════════════════════════════   │
│                                                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                                                 │   │
│  │  SAP S/4HANA Cloud: SAP BTP Integration Suite + OData APIs                                     │   │
│  │  SAP ECC (On-Prem): IDocs + RFC/BAPI                                                           │   │
│  │                                                                                                 │   │
│  └─────────────────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                                         │
│  DATA FLOW SCENARIOS                                                                                    │
│  ═══════════════════════════════════════════════════════════════════════════════════════════════════   │
│                                                                                                         │
│  SCENARIO 1: SALES ORDER INTEGRATION                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                                                 │   │
│  │  SAP SD                        SteelWise                        SAP SD                          │   │
│  │  ┌─────────────┐              ┌─────────────┐                  ┌─────────────┐                 │   │
│  │  │ Sales Order │──IDOC──────▶│ Work Order  │──────────────────│             │                 │   │
│  │  │ Created     │  ORDERS05    │ Created     │                  │             │                 │   │
│  │  └─────────────┘              └──────┬──────┘                  │             │                 │   │
│  │                                      │                         │             │                 │   │
│  │                                      ▼                         │             │                 │   │
│  │                               ┌─────────────┐                  │             │                 │   │
│  │                               │ Production  │                  │             │                 │   │
│  │                               │ Complete    │                  │             │                 │   │
│  │                               └──────┬──────┘                  │             │                 │   │
│  │                                      │                         │             │                 │   │
│  │                                      ▼                         │             │                 │   │
│  │  ┌─────────────┐              ┌─────────────┐  IDOC           │             │                 │   │
│  │  │ Goods Issue │◀─────────────│ Shipment    │──DESADV01──────▶│ Delivery    │                 │   │
│  │  │ Posted      │  MBGMCR01    │ Confirmed   │                  │ Created     │                 │   │
│  │  └─────────────┘              └─────────────┘                  └─────────────┘                 │   │
│  │                                                                                                 │   │
│  └─────────────────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                                         │
│  SCENARIO 2: INVENTORY SYNC                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                                                 │   │
│  │  SAP MM                                      SteelWise                                          │   │
│  │  ┌─────────────────┐                        ┌─────────────────┐                                │   │
│  │  │ Material Master │◀── Nightly Sync ───────│ Product Master  │                                │   │
│  │  │ (MARA/MARC)     │                        │ (Full catalog)  │                                │   │
│  │  └─────────────────┘                        └─────────────────┘                                │   │
│  │                                                                                                 │   │
│  │  ┌─────────────────┐                        ┌─────────────────┐                                │   │
│  │  │ Stock Overview  │◀── Real-time Event ────│ Inventory Txn   │                                │   │
│  │  │ (MMBE)          │     (Movement)         │ (Receive/Ship)  │                                │   │
│  │  └─────────────────┘                        └─────────────────┘                                │   │
│  │                                                                                                 │   │
│  │  Daily Reconciliation:                                                                          │   │
│  │  SAP MIGO balances vs SteelWise balances → Discrepancy report                                 │   │
│  │                                                                                                 │   │
│  └─────────────────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                                         │
│  SCENARIO 3: FINANCIAL POSTINGS                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                                                 │   │
│  │  SteelWise                                  SAP FI/CO                                           │   │
│  │  ┌─────────────────┐                        ┌─────────────────┐                                │   │
│  │  │ Invoice Created │─── INVOIC01 IDOC ────▶│ Customer Invoice│                                │   │
│  │  │                 │                        │ (VF01/VF04)     │                                │   │
│  │  └─────────────────┘                        └─────────────────┘                                │   │
│  │                                                                                                 │   │
│  │  ┌─────────────────┐                        ┌─────────────────┐                                │   │
│  │  │ Job Costing     │─── Cost Center ───────▶│ CO Posting      │                                │   │
│  │  │ Complete        │     Posting            │ (KB21N)         │                                │   │
│  │  └─────────────────┘                        └─────────────────┘                                │   │
│  │                                                                                                 │   │
│  │  ┌─────────────────┐                        ┌─────────────────┐                                │   │
│  │  │ Scrap Recorded  │─── Goods Movement ────▶│ Inventory       │                                │   │
│  │  │                 │     (MB1A)             │ Write-off       │                                │   │
│  │  └─────────────────┘                        └─────────────────┘                                │   │
│  │                                                                                                 │   │
│  └─────────────────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 SAP Adapter Implementation

```typescript
interface SAPAdapter extends IntegrationAdapter {
  adapterId: 'SAP';
  adapterType: 'ERP';
  systemName: string;  // e.g., "SAP S/4HANA 2023"
  
  // SAP-specific connection
  connection: SAPConnection;
  
  // IDoc types supported
  supportedIdocs: SAPIDocConfig[];
  
  // RFC/BAPI functions
  rfcFunctions: SAPRFCConfig[];
}

interface SAPConnection extends AdapterConnection {
  protocol: 'IDOC' | 'RFC' | 'ODATA';
  
  // For IDocs
  idocConfig?: {
    partnerNumber: string;
    partnerType: string;
    messageType: string;
    idocType: string;
    port: string;
  };
  
  // For RFC
  rfcConfig?: {
    asHost: string;
    sysnr: string;
    client: string;
    user: string;
    passwd: string;  // Encrypted
    lang: string;
  };
  
  // For OData (S/4HANA Cloud)
  odataConfig?: {
    baseUrl: string;
    authType: 'OAUTH2' | 'BASIC';
    clientId?: string;
    clientSecret?: string;
  };
}

interface SAPIDocConfig {
  messageType: string;           // e.g., "ORDERS", "DESADV"
  idocType: string;              // e.g., "ORDERS05", "DESADV01"
  direction: 'INBOUND' | 'OUTBOUND';
  
  // Segment mapping
  segmentMappings: SAPSegmentMapping[];
  
  // Processing rules
  processingRules: {
    createIfNotExists: boolean;
    updateIfExists: boolean;
    errorHandling: 'REJECT' | 'PARK' | 'MANUAL_REVIEW';
  };
}

interface SAPSegmentMapping {
  segmentName: string;           // e.g., "E1EDK01", "E1EDP01"
  qualifier?: string;            // For qualified segments
  fieldMappings: {
    sapField: string;
    steelwiseField: string;
    transformation?: string;
  }[];
}

// Example: SAP Sales Order IDoc processing
class SAPOrderProcessor {
  
  async processInboundOrder(idoc: string): Promise<Order> {
    // Parse IDoc
    const parsed = this.parseIdoc(idoc);
    
    // Validate IDoc structure
    if (parsed.IDOCTYP !== 'ORDERS05') {
      throw new IntegrationError('Unsupported IDoc type');
    }
    
    // Extract header from E1EDK01
    const header = parsed.segments.find(s => s.SEGNAM === 'E1EDK01');
    
    // Extract lines from E1EDP01
    const lines = parsed.segments.filter(s => s.SEGNAM === 'E1EDP01');
    
    // Map to canonical order
    const order: Order = {
      externalOrderId: header.BELNR,
      customerPO: this.findRef(parsed, 'ON'),  // Order number reference
      orderDate: this.parseDate(header.DATUM),
      
      // Customer from E1EDKA1 (AG = Sold-to)
      customerId: await this.resolveCustomer(
        parsed.segments.find(s => s.SEGNAM === 'E1EDKA1' && s.PARVW === 'AG')
      ),
      
      // Ship-to from E1EDKA1 (WE = Ship-to)
      shipToId: await this.resolveShipTo(
        parsed.segments.find(s => s.SEGNAM === 'E1EDKA1' && s.PARVW === 'WE')
      ),
      
      // Lines
      lines: await Promise.all(lines.map(line => this.mapOrderLine(line, parsed)))
    };
    
    return order;
  }
  
  async generateOutboundConfirmation(order: Order): Promise<string> {
    // Generate ORDRSP IDoc for order confirmation
    const idoc: IDocBuilder = new IDocBuilder('ORDRSP', 'ORDERS05');
    
    // Control record
    idoc.setControlRecord({
      MESTYP: 'ORDRSP',
      RCVPRN: order.sapPartnerNumber,
      RCVPRT: 'KU',  // Customer
      SNDPRN: this.config.ownPartnerNumber,
      SNDPRT: 'LS'   // Logical system
    });
    
    // E1EDK01 - Header
    idoc.addSegment('E1EDK01', {
      CURCY: order.currency,
      BSART: 'ZOR',  // Order type
      BELNR: order.orderNumber
    });
    
    // E1EDKA1 - Partner
    idoc.addSegment('E1EDKA1', {
      PARVW: 'AG',
      PARTN: order.sapCustomerNumber
    });
    
    // E1EDP01 - Line items
    for (const line of order.lines) {
      idoc.addSegment('E1EDP01', {
        POSEX: line.lineNumber.toString().padStart(6, '0'),
        MENGE: line.confirmedQty.toString(),
        MENEE: this.mapUom(line.uom),
        CURCY: order.currency,
        VPREI: line.unitPrice.toString()
      });
    }
    
    return idoc.build();
  }
}
```

### 4.3 Oracle/NetSuite Integration

```typescript
interface OracleNetSuiteAdapter extends IntegrationAdapter {
  adapterId: 'NETSUITE';
  adapterType: 'ERP';
  
  connection: NetSuiteConnection;
}

interface NetSuiteConnection extends AdapterConnection {
  protocol: 'REST';
  
  // SuiteScript / REST Web Services
  config: {
    accountId: string;
    consumerKey: string;
    consumerSecret: string;
    tokenId: string;
    tokenSecret: string;
    restletUrl?: string;
  };
}

// NetSuite integration mappings
const netSuiteOrderMapping = {
  // Inbound: NetSuite Sales Order → SteelWise Order
  inbound: {
    'tranId': 'order.externalOrderId',
    'otherRefNum': 'order.customerPO',
    'tranDate': { field: 'order.orderDate', transform: 'DATE_ISO' },
    'entity': { field: 'order.customerId', transform: 'LOOKUP_CUSTOMER_BY_NS_ID' },
    'shipAddress': 'order.shipToAddress',
    
    // Lines (from item sublist)
    'item[*].item': { field: 'line.productId', transform: 'LOOKUP_PRODUCT_BY_NS_ID' },
    'item[*].quantity': 'line.orderedQty',
    'item[*].rate': 'line.unitPrice',
    'item[*].amount': 'line.extendedPrice'
  },
  
  // Outbound: SteelWise → NetSuite
  outbound: {
    // Item fulfillment
    fulfillment: {
      'createdFrom': 'order.netsuiteOrderId',
      'shipStatus': { value: 'C', notes: 'Shipped' },
      'shipCarrier': { field: 'shipment.carrierName', transform: 'MAP_CARRIER' },
      'shipTrackingNumber': 'shipment.proNumber',
      
      'item[*].orderLine': 'line.netsuiteLineId',
      'item[*].quantity': 'line.shippedQty',
      'item[*].itemReceive': { value: true }
    },
    
    // Customer invoice
    invoice: {
      'createdFrom': 'order.netsuiteOrderId',
      'tranDate': { field: 'invoice.invoiceDate', transform: 'DATE_ISO' },
      
      'item[*].orderLine': 'line.netsuiteLineId',
      'item[*].quantity': 'line.invoicedQty',
      'item[*].rate': 'line.invoicePrice',
      'item[*].amount': 'line.extendedAmount'
    }
  }
};

class NetSuiteAdapter implements OracleNetSuiteAdapter {
  
  async syncOrder(nsOrderId: string): Promise<Order> {
    // Fetch from NetSuite
    const nsOrder = await this.fetch(`/salesOrder/${nsOrderId}`);
    
    // Transform
    const order = await this.transformer.transform(
      nsOrder, 
      netSuiteOrderMapping.inbound
    );
    
    // Store reference
    order.externalReferences = [{
      system: 'NETSUITE',
      type: 'SALES_ORDER',
      externalId: nsOrderId,
      syncedAt: new Date()
    }];
    
    return order;
  }
  
  async createFulfillment(shipment: Shipment): Promise<string> {
    // Build fulfillment payload
    const payload = await this.transformer.transform(
      shipment,
      netSuiteOrderMapping.outbound.fulfillment
    );
    
    // POST to NetSuite
    const result = await this.post('/itemFulfillment', payload);
    
    return result.id;
  }
}
```

### 4.4 Epicor Integration

```typescript
interface EpicorAdapter extends IntegrationAdapter {
  adapterId: 'EPICOR';
  adapterType: 'ERP';
  
  connection: EpicorConnection;
}

interface EpicorConnection extends AdapterConnection {
  protocol: 'REST' | 'SOAP';
  
  config: {
    baseUrl: string;
    company: string;
    site: string;
    apiKey: string;
    // Or basic auth
    username?: string;
    password?: string;
  };
}

// Epicor Business Objects
const epicorIntegrationPoints = {
  // Order entry
  'Erp.BO.SalesOrderSvc': {
    methods: ['GetList', 'GetByID', 'Update', 'Add'],
    steelwiseEntity: 'Order',
    direction: 'BIDIRECTIONAL'
  },
  
  // Customer master
  'Erp.BO.CustomerSvc': {
    methods: ['GetList', 'GetByID'],
    steelwiseEntity: 'Customer',
    direction: 'INBOUND'
  },
  
  // Inventory
  'Erp.BO.PartOnHandSvc': {
    methods: ['GetPartOnHandWhse'],
    steelwiseEntity: 'Inventory',
    direction: 'INBOUND'
  },
  
  // Shipment
  'Erp.BO.CustShipSvc': {
    methods: ['GetList', 'Update', 'ShipAll'],
    steelwiseEntity: 'Shipment',
    direction: 'OUTBOUND'
  },
  
  // Invoice
  'Erp.BO.ARInvoiceSvc': {
    methods: ['GetList', 'GetNewARInvoice', 'Update'],
    steelwiseEntity: 'Invoice',
    direction: 'OUTBOUND'
  }
};

class EpicorAdapter implements IntegrationAdapter {
  
  async pullOrders(since: Date): Promise<Order[]> {
    // Query Epicor for new/changed orders
    const response = await this.call('Erp.BO.SalesOrderSvc', 'GetList', {
      whereClause: `OrderDate >= '${since.toISOString()}' AND OrderType = 'F'`,
      pageSize: 100
    });
    
    // Transform each order
    return response.value.map(epicorOrder => this.transformOrder(epicorOrder));
  }
  
  async pushShipment(shipment: Shipment): Promise<void> {
    // Get Epicor packing slip for the order
    const packingSlip = await this.call('Erp.BO.CustShipSvc', 'GetNewCustShip', {
      ds: {},
      orderNum: shipment.order.epicorOrderNum
    });
    
    // Update with shipping details
    packingSlip.ShipHead.ShipVia = this.mapCarrier(shipment.carrier);
    packingSlip.ShipHead.TrackingNumber = shipment.proNumber;
    
    // Add shipped lines
    for (const line of shipment.lines) {
      const shipDtl = {
        OrderNum: line.order.epicorOrderNum,
        OrderLine: line.epicorLineNum,
        ShipQty: line.shippedQty
      };
      packingSlip.ShipDtl.push(shipDtl);
    }
    
    // Save
    await this.call('Erp.BO.CustShipSvc', 'Update', { ds: packingSlip });
    
    // Ship all
    await this.call('Erp.BO.CustShipSvc', 'ShipAll', { 
      ds: packingSlip,
      packNum: packingSlip.ShipHead.PackNum
    });
  }
}
```

---

## 5. MES INTEGRATION

### 5.1 MES Integration Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    MES INTEGRATION ARCHITECTURE                                          │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                         │
│  MES RELATIONSHIP MODELS                                                                                │
│  ═══════════════════════════════════════════════════════════════════════════════════════════════════   │
│                                                                                                         │
│  MODEL A: STEELWISE AS MES                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                                                 │   │
│  │  SteelWise IS the MES for metals processing                                                     │   │
│  │  • No separate MES system                                                                       │   │
│  │  • Shop floor execution fully handled by SteelWise                                              │   │
│  │  • Machine integration directly to SteelWise                                                    │   │
│  │                                                                                                 │   │
│  │  ERP ──────▶ SteelWise (MES) ──────▶ Machines/PLCs                                             │   │
│  │                                                                                                 │   │
│  └─────────────────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                                         │
│  MODEL B: STEELWISE ALONGSIDE MES                                                                       │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                                                 │   │
│  │  Enterprise MES for overall plant; SteelWise for metals-specific operations                    │   │
│  │  • MES handles: Machine scheduling, OEE, preventive maintenance                                │   │
│  │  • SteelWise handles: Metals BOM, cutting, coil tracking, MTR                                  │   │
│  │                                                                                                 │   │
│  │                     ┌─────────────────┐                                                         │   │
│  │  ERP ──────────────▶│  Enterprise MES │◀────────────────── Machines/PLCs                       │   │
│  │                     │  (AVEVA, etc.)  │                                                         │   │
│  │                     └────────┬────────┘                                                         │   │
│  │                              │                                                                  │   │
│  │                              ▼                                                                  │   │
│  │                     ┌─────────────────┐                                                         │   │
│  │                     │   SteelWise     │                                                         │   │
│  │                     │  (Metals Exec)  │                                                         │   │
│  │                     └─────────────────┘                                                         │   │
│  │                                                                                                 │   │
│  └─────────────────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                                         │
│  MES DATA EXCHANGE                                                                                      │
│  ═══════════════════════════════════════════════════════════════════════════════════════════════════   │
│                                                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                                                 │   │
│  │  FROM MES → STEELWISE                     FROM STEELWISE → MES                                 │   │
│  │  ─────────────────────────────────        ─────────────────────────────────                    │   │
│  │                                                                                                 │   │
│  │  • Work order release                     • Work order completion                              │   │
│  │  • Machine availability                   • Actual run times                                   │   │
│  │  • Scheduled maintenance windows          • Scrap/defect reporting                             │   │
│  │  • Operator assignments                   • Material consumption                               │   │
│  │  • Quality hold signals                   • Heat/lot traceability                              │   │
│  │                                           • Operator performance                               │   │
│  │                                                                                                 │   │
│  └─────────────────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 ISA-95 Alignment

```typescript
// ISA-95 / B2MML alignment for MES interoperability

interface ISA95WorkOrder {
  // Level 3 (MES) work order structure
  
  // Work order header
  workOrderId: string;
  workOrderType: 'PRODUCTION' | 'MAINTENANCE' | 'QUALITY';
  priority: number;
  
  // Operations schedule (from Level 4 ERP)
  operationsSchedule: {
    scheduleId: string;
    startDateTime: Date;
    endDateTime: Date;
    equipment: ISA95Equipment[];
  };
  
  // Operations definition (what to do)
  operationsDefinition: {
    operationId: string;
    operationType: string;
    parameters: ISA95Parameter[];
    materialRequirements: ISA95MaterialRequirement[];
    personnelRequirements: ISA95PersonnelRequirement[];
  }[];
  
  // Operations response (actual results)
  operationsResponse?: {
    actualStartDateTime: Date;
    actualEndDateTime: Date;
    actualEquipment: ISA95Equipment[];
    actualMaterialConsumed: ISA95MaterialLot[];
    actualPersonnel: ISA95Personnel[];
    productionData: ISA95ProductionData[];
    qualityData: ISA95QualityData[];
  };
}

interface ISA95Equipment {
  equipmentId: string;
  equipmentClass: string;           // Work center type
  equipmentLevel: 'ENTERPRISE' | 'SITE' | 'AREA' | 'WORK_CENTER' | 'WORK_UNIT';
}

interface ISA95MaterialRequirement {
  materialDefinitionId: string;      // Product/SKU
  materialLotId?: string;            // Specific lot/heat if assigned
  quantity: number;
  quantityUom: string;
  materialUse: 'CONSUMED' | 'PRODUCED' | 'CONSUMABLE';
}

interface ISA95MaterialLot {
  materialLotId: string;             // Heat number, coil ID
  materialDefinitionId: string;
  quantity: number;
  quantityUom: string;
  properties: ISA95Property[];       // Thickness, width, length, chemistry
}

// Mapping SteelWise to ISA-95
class ISA95Mapper {
  
  workOrderToISA95(workOrder: WorkOrder): ISA95WorkOrder {
    return {
      workOrderId: workOrder.workOrderNumber,
      workOrderType: 'PRODUCTION',
      priority: workOrder.priority,
      
      operationsSchedule: {
        scheduleId: workOrder.scheduleId,
        startDateTime: workOrder.scheduledStart,
        endDateTime: workOrder.scheduledEnd,
        equipment: workOrder.operations.map(op => ({
          equipmentId: op.workCenter.workCenterId,
          equipmentClass: op.workCenter.workCenterType,
          equipmentLevel: 'WORK_CENTER'
        }))
      },
      
      operationsDefinition: workOrder.operations.map(op => ({
        operationId: op.operationId,
        operationType: op.operationType,
        parameters: this.mapParameters(op),
        materialRequirements: this.mapMaterialRequirements(op),
        personnelRequirements: this.mapPersonnelRequirements(op)
      }))
    };
  }
  
  isa95ResponseToWorkOrder(response: ISA95WorkOrder): Partial<WorkOrder> {
    // Map ISA-95 response back to SteelWise work order completion
    return {
      actualStartTime: response.operationsResponse.actualStartDateTime,
      actualEndTime: response.operationsResponse.actualEndDateTime,
      completedOperations: response.operationsResponse.productionData.map(pd => ({
        operationId: pd.operationId,
        actualQty: pd.quantity,
        runTime: pd.duration,
        scrapQty: pd.defectQuantity
      })),
      materialConsumed: response.operationsResponse.actualMaterialConsumed.map(mat => ({
        materialLotId: mat.materialLotId,
        productId: mat.materialDefinitionId,
        consumedQty: mat.quantity
      }))
    };
  }
}
```

### 5.3 Machine Integration

```typescript
// Direct machine/PLC integration for real-time data

interface MachineIntegration {
  machineId: string;
  machineName: string;
  workCenterId: string;
  
  // Connection
  connection: MachineConnection;
  
  // Data points collected
  dataPoints: MachineDataPoint[];
  
  // Events published
  events: MachineEvent[];
}

interface MachineConnection {
  protocol: 'OPC_UA' | 'MODBUS' | 'MQTT' | 'REST' | 'CUSTOM_PLC';
  
  // OPC-UA
  opcuaConfig?: {
    endpointUrl: string;
    securityPolicy: string;
    certPath: string;
  };
  
  // Modbus
  modbusConfig?: {
    host: string;
    port: number;
    unitId: number;
  };
  
  // MQTT
  mqttConfig?: {
    brokerUrl: string;
    topic: string;
    qos: 0 | 1 | 2;
  };
  
  pollingInterval: number;  // ms
}

interface MachineDataPoint {
  pointId: string;
  pointName: string;
  dataType: 'BOOLEAN' | 'INTEGER' | 'FLOAT' | 'STRING';
  
  // Address (protocol-specific)
  address: string;
  
  // Mapping to SteelWise
  steelwiseMapping: {
    entity: 'WORK_ORDER' | 'OPERATION' | 'MACHINE_STATUS';
    field: string;
    transformation?: string;
  };
  
  // Alerting
  alertRules?: {
    condition: string;  // e.g., "value > 100"
    severity: 'INFO' | 'WARNING' | 'CRITICAL';
    message: string;
  }[];
}

interface MachineEvent {
  eventType: 'CYCLE_START' | 'CYCLE_COMPLETE' | 'FAULT' | 'MATERIAL_LOADED' | 'PART_PRODUCED';
  triggerCondition: string;
  
  // Payload to extract
  payload: {
    field: string;
    source: string;  // Data point or calculation
  }[];
  
  // Action in SteelWise
  action: {
    type: 'UPDATE_OPERATION' | 'LOG_PRODUCTION' | 'SEND_ALERT' | 'TRIGGER_QC';
    parameters: Record<string, any>;
  };
}

// Machine event processor
class MachineEventProcessor {
  
  async handleCycleComplete(event: MachineEvent, data: Record<string, any>): Promise<void> {
    // Extract work order from machine data
    const workOrderId = data['currentWorkOrder'];
    
    if (!workOrderId) {
      this.logger.warn('Cycle complete without work order context');
      return;
    }
    
    // Get current operation
    const workOrder = await this.workOrderRepo.getById(workOrderId);
    const currentOp = workOrder.operations.find(op => op.status === 'IN_PROGRESS');
    
    // Log production
    await this.productionLog.record({
      workOrderId,
      operationId: currentOp.operationId,
      machineId: event.machineId,
      timestamp: new Date(),
      cycleTime: data['cycleTime'],
      partsProduced: data['partsProduced'] || 1,
      scrapProduced: data['scrapCount'] || 0
    });
    
    // Update operation progress
    currentOp.completedQty += data['partsProduced'] || 1;
    currentOp.actualCycles += 1;
    
    // Check if operation complete
    if (currentOp.completedQty >= currentOp.requiredQty) {
      await this.completeOperation(workOrder, currentOp);
    } else {
      await this.workOrderRepo.update(workOrder);
    }
    
    // Publish event
    await this.eventBus.publish('operation.progress', {
      workOrderId,
      operationId: currentOp.operationId,
      completedQty: currentOp.completedQty,
      requiredQty: currentOp.requiredQty
    });
  }
}
```

---

## 6. EVENT CATALOG

### 6.1 Domain Events

```typescript
// Complete event catalog for integration

interface DomainEvent {
  eventId: string;
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  timestamp: Date;
  version: number;
  correlationId: string;
  causationId?: string;
  payload: Record<string, any>;
  metadata: EventMetadata;
}

interface EventMetadata {
  tenantId: string;
  userId: string;
  source: 'UI' | 'API' | 'INTEGRATION' | 'SYSTEM';
  sourceSystem?: string;
}

// Event catalog organized by domain

const eventCatalog = {
  
  // ═══════════════════════════════════════════════════════════════════════════
  // ORDER DOMAIN EVENTS
  // ═══════════════════════════════════════════════════════════════════════════
  
  order: {
    'order.created': {
      description: 'New order created',
      payload: {
        orderId: 'string',
        orderNumber: 'string',
        customerId: 'string',
        totalAmount: 'number',
        lineCount: 'number',
        source: 'UI | EDI | API | POS'
      },
      subscribers: ['ERP_ADAPTER', 'NOTIFICATION_SERVICE', 'ANALYTICS']
    },
    
    'order.confirmed': {
      description: 'Order confirmed and ready for production',
      payload: {
        orderId: 'string',
        confirmedBy: 'string',
        promisedDate: 'date'
      },
      subscribers: ['ERP_ADAPTER', 'PLANNING_SERVICE', 'CUSTOMER_PORTAL']
    },
    
    'order.line.added': {
      description: 'Line added to existing order',
      payload: {
        orderId: 'string',
        lineId: 'string',
        productId: 'string',
        quantity: 'number'
      },
      subscribers: ['ERP_ADAPTER', 'INVENTORY_SERVICE']
    },
    
    'order.line.changed': {
      description: 'Order line modified',
      payload: {
        orderId: 'string',
        lineId: 'string',
        changes: 'object'
      },
      subscribers: ['ERP_ADAPTER', 'PLANNING_SERVICE']
    },
    
    'order.canceled': {
      description: 'Order canceled',
      payload: {
        orderId: 'string',
        cancelReason: 'string',
        canceledBy: 'string'
      },
      subscribers: ['ERP_ADAPTER', 'INVENTORY_SERVICE', 'NOTIFICATION_SERVICE']
    }
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // PRODUCTION DOMAIN EVENTS
  // ═══════════════════════════════════════════════════════════════════════════
  
  production: {
    'workorder.created': {
      description: 'Work order created from order',
      payload: {
        workOrderId: 'string',
        workOrderNumber: 'string',
        orderId: 'string',
        productId: 'string',
        quantity: 'number',
        operationCount: 'number'
      },
      subscribers: ['MES_ADAPTER', 'SCHEDULING_SERVICE']
    },
    
    'workorder.released': {
      description: 'Work order released to floor',
      payload: {
        workOrderId: 'string',
        releaseDate: 'date',
        scheduledStart: 'date'
      },
      subscribers: ['MES_ADAPTER', 'SHOP_FLOOR_UI']
    },
    
    'operation.started': {
      description: 'Operation started on work order',
      payload: {
        workOrderId: 'string',
        operationId: 'string',
        workCenterId: 'string',
        operatorId: 'string',
        startTime: 'date'
      },
      subscribers: ['MES_ADAPTER', 'ANALYTICS', 'COSTING_SERVICE']
    },
    
    'operation.completed': {
      description: 'Operation completed',
      payload: {
        workOrderId: 'string',
        operationId: 'string',
        completedQty: 'number',
        scrapQty: 'number',
        actualTime: 'number',
        endTime: 'date'
      },
      subscribers: ['MES_ADAPTER', 'ERP_ADAPTER', 'COSTING_SERVICE', 'ANALYTICS']
    },
    
    'workorder.completed': {
      description: 'All operations complete, work order finished',
      payload: {
        workOrderId: 'string',
        completedQty: 'number',
        totalScrap: 'number',
        totalTime: 'number'
      },
      subscribers: ['ERP_ADAPTER', 'INVENTORY_SERVICE', 'ORDER_SERVICE']
    },
    
    'material.consumed': {
      description: 'Material consumed by operation',
      payload: {
        workOrderId: 'string',
        operationId: 'string',
        materialLotId: 'string',
        productId: 'string',
        quantity: 'number',
        heatNumber: 'string'
      },
      subscribers: ['INVENTORY_SERVICE', 'ERP_ADAPTER', 'TRACEABILITY_SERVICE']
    },
    
    'scrap.recorded': {
      description: 'Scrap generated',
      payload: {
        workOrderId: 'string',
        operationId: 'string',
        scrapQty: 'number',
        scrapReason: 'string',
        scrapWeight: 'number'
      },
      subscribers: ['INVENTORY_SERVICE', 'ERP_ADAPTER', 'COSTING_SERVICE']
    }
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // INVENTORY DOMAIN EVENTS
  // ═══════════════════════════════════════════════════════════════════════════
  
  inventory: {
    'inventory.received': {
      description: 'Material received into inventory',
      payload: {
        receiptId: 'string',
        productId: 'string',
        locationId: 'string',
        quantity: 'number',
        lotNumber: 'string',
        heatNumber: 'string',
        poNumber: 'string'
      },
      subscribers: ['ERP_ADAPTER', 'QUALITY_SERVICE']
    },
    
    'inventory.adjusted': {
      description: 'Inventory balance adjusted',
      payload: {
        productId: 'string',
        locationId: 'string',
        adjustmentType: 'string',
        quantity: 'number',
        reason: 'string'
      },
      subscribers: ['ERP_ADAPTER', 'ANALYTICS']
    },
    
    'inventory.transferred': {
      description: 'Inventory moved between locations',
      payload: {
        productId: 'string',
        fromLocationId: 'string',
        toLocationId: 'string',
        quantity: 'number'
      },
      subscribers: ['ERP_ADAPTER']
    },
    
    'inventory.allocated': {
      description: 'Inventory allocated to order',
      payload: {
        orderId: 'string',
        productId: 'string',
        quantity: 'number',
        lotNumber: 'string'
      },
      subscribers: ['ORDER_SERVICE']
    },
    
    'coil.slit': {
      description: 'Coil slit into child coils',
      payload: {
        parentCoilId: 'string',
        childCoils: 'array',
        slitWidths: 'array',
        scrapWeight: 'number'
      },
      subscribers: ['INVENTORY_SERVICE', 'TRACEABILITY_SERVICE']
    }
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // SHIPPING DOMAIN EVENTS
  // ═══════════════════════════════════════════════════════════════════════════
  
  shipping: {
    'shipment.created': {
      description: 'Shipment created',
      payload: {
        shipmentId: 'string',
        orderId: 'string',
        carrierId: 'string',
        estimatedShipDate: 'date'
      },
      subscribers: ['ORDER_SERVICE', 'NOTIFICATION_SERVICE']
    },
    
    'shipment.packed': {
      description: 'Items packed and ready',
      payload: {
        shipmentId: 'string',
        packageCount: 'number',
        totalWeight: 'number'
      },
      subscribers: ['CARRIER_SERVICE']
    },
    
    'shipment.shipped': {
      description: 'Shipment dispatched',
      payload: {
        shipmentId: 'string',
        orderId: 'string',
        carrierId: 'string',
        trackingNumber: 'string',
        bolNumber: 'string',
        shipDate: 'date'
      },
      subscribers: ['EDI_ADAPTER', 'ERP_ADAPTER', 'CUSTOMER_PORTAL', 'NOTIFICATION_SERVICE']
    },
    
    'shipment.delivered': {
      description: 'Shipment delivered (POD received)',
      payload: {
        shipmentId: 'string',
        deliveryDate: 'date',
        signedBy: 'string',
        podDocumentId: 'string'
      },
      subscribers: ['ORDER_SERVICE', 'BILLING_SERVICE', 'ERP_ADAPTER']
    }
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // BILLING DOMAIN EVENTS
  // ═══════════════════════════════════════════════════════════════════════════
  
  billing: {
    'invoice.created': {
      description: 'Invoice generated',
      payload: {
        invoiceId: 'string',
        invoiceNumber: 'string',
        orderId: 'string',
        customerId: 'string',
        totalAmount: 'number',
        currency: 'string'
      },
      subscribers: ['EDI_ADAPTER', 'ERP_ADAPTER', 'NOTIFICATION_SERVICE']
    },
    
    'invoice.sent': {
      description: 'Invoice sent to customer',
      payload: {
        invoiceId: 'string',
        sentVia: 'EMAIL | EDI | PORTAL',
        sentAt: 'date'
      },
      subscribers: ['ANALYTICS']
    },
    
    'payment.received': {
      description: 'Payment received',
      payload: {
        paymentId: 'string',
        invoiceId: 'string',
        amount: 'number',
        paymentMethod: 'string'
      },
      subscribers: ['ERP_ADAPTER', 'AR_SERVICE']
    }
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // QUALITY DOMAIN EVENTS
  // ═══════════════════════════════════════════════════════════════════════════
  
  quality: {
    'inspection.completed': {
      description: 'QC inspection finished',
      payload: {
        inspectionId: 'string',
        workOrderId: 'string',
        result: 'PASS | FAIL | CONDITIONAL',
        defectsFound: 'number'
      },
      subscribers: ['PRODUCTION_SERVICE', 'TRACEABILITY_SERVICE']
    },
    
    'ncr.created': {
      description: 'Non-conformance report created',
      payload: {
        ncrId: 'string',
        workOrderId: 'string',
        defectType: 'string',
        severity: 'string'
      },
      subscribers: ['NOTIFICATION_SERVICE', 'ANALYTICS']
    },
    
    'material.quarantined': {
      description: 'Material placed on QC hold',
      payload: {
        materialLotId: 'string',
        reason: 'string',
        quarantinedBy: 'string'
      },
      subscribers: ['INVENTORY_SERVICE', 'ORDER_SERVICE']
    }
  }
};
```

### 6.2 Event Subscription Management

```typescript
interface EventSubscription {
  subscriptionId: string;
  eventType: string;
  subscriberId: string;
  
  // Delivery
  delivery: {
    method: 'WEBHOOK' | 'QUEUE' | 'INTERNAL';
    
    // Webhook
    webhookUrl?: string;
    headers?: Record<string, string>;
    
    // Queue
    queueName?: string;
    
    // Internal handler
    handlerClass?: string;
  };
  
  // Filtering
  filter?: {
    expression: string;  // e.g., "payload.customerId == 'CUST-001'"
  };
  
  // Retry policy
  retryPolicy: {
    maxRetries: number;
    backoffType: 'FIXED' | 'EXPONENTIAL';
    initialDelayMs: number;
  };
  
  // Status
  status: 'ACTIVE' | 'PAUSED' | 'FAILED';
}

class EventBus {
  
  async publish(eventType: string, payload: any): Promise<void> {
    // Create event
    const event: DomainEvent = {
      eventId: uuid(),
      eventType,
      aggregateType: this.getAggregateType(eventType),
      aggregateId: payload.id || payload[this.getIdField(eventType)],
      timestamp: new Date(),
      version: 1,
      correlationId: this.context.correlationId,
      payload,
      metadata: {
        tenantId: this.context.tenantId,
        userId: this.context.userId,
        source: this.context.source
      }
    };
    
    // Store in event log
    await this.eventStore.append(event);
    
    // Get subscriptions
    const subscriptions = await this.subscriptionRepo.findByEventType(eventType);
    
    // Dispatch to each subscriber
    for (const sub of subscriptions) {
      await this.dispatch(event, sub);
    }
  }
  
  private async dispatch(event: DomainEvent, subscription: EventSubscription): Promise<void> {
    // Apply filter
    if (subscription.filter) {
      const match = this.evaluateFilter(event, subscription.filter.expression);
      if (!match) return;
    }
    
    // Dispatch based on method
    switch (subscription.delivery.method) {
      case 'WEBHOOK':
        await this.messageQueue.enqueue('webhook-delivery', {
          event,
          url: subscription.delivery.webhookUrl,
          headers: subscription.delivery.headers,
          retryPolicy: subscription.retryPolicy
        });
        break;
        
      case 'QUEUE':
        await this.messageQueue.enqueue(subscription.delivery.queueName, event);
        break;
        
      case 'INTERNAL':
        const handler = this.container.resolve(subscription.delivery.handlerClass);
        await handler.handle(event);
        break;
    }
  }
}
```

---

## 7. API CONTRACT SURFACES

### 7.1 Integration API Overview

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    INTEGRATION API SURFACES                                              │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                         │
│  API CATEGORIES                                                                                         │
│  ═══════════════════════════════════════════════════════════════════════════════════════════════════   │
│                                                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                                                 │   │
│  │  1. MASTER DATA APIs                                                                            │   │
│  │     /api/v1/integration/customers         Customer sync                                        │   │
│  │     /api/v1/integration/products          Product/material sync                                │   │
│  │     /api/v1/integration/pricing           Price list sync                                      │   │
│  │     /api/v1/integration/locations         Warehouse/location sync                              │   │
│  │                                                                                                 │   │
│  │  2. TRANSACTION APIs                                                                            │   │
│  │     /api/v1/integration/orders            Order import/export                                  │   │
│  │     /api/v1/integration/shipments         Shipment notifications                               │   │
│  │     /api/v1/integration/invoices          Invoice export                                       │   │
│  │     /api/v1/integration/inventory         Inventory transactions                               │   │
│  │                                                                                                 │   │
│  │  3. PRODUCTION APIs                                                                             │   │
│  │     /api/v1/integration/workorders        Work order sync                                      │   │
│  │     /api/v1/integration/production        Production reporting                                 │   │
│  │     /api/v1/integration/quality           QC results                                           │   │
│  │                                                                                                 │   │
│  │  4. EVENT APIs                                                                                  │   │
│  │     /api/v1/integration/events            Event stream                                         │   │
│  │     /api/v1/integration/webhooks          Webhook management                                   │   │
│  │                                                                                                 │   │
│  │  5. EDI APIs                                                                                    │   │
│  │     /api/v1/integration/edi/inbound       EDI document submission                              │   │
│  │     /api/v1/integration/edi/outbound      EDI document retrieval                               │   │
│  │     /api/v1/integration/edi/status        Transaction status                                   │   │
│  │                                                                                                 │   │
│  └─────────────────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 API Specifications

```typescript
// Order Integration API

/**
 * POST /api/v1/integration/orders
 * Import order from external system
 */
interface ImportOrderRequest {
  // External reference
  externalSystem: string;           // e.g., "SAP", "NETSUITE"
  externalOrderId: string;
  
  // Order header
  order: {
    customerPO: string;
    orderDate: string;              // ISO 8601
    requestedDeliveryDate?: string;
    
    // Customer
    customerId?: string;            // SteelWise customer ID
    externalCustomerId?: string;    // If not mapped, will lookup
    
    // Ship-to (if different from customer default)
    shipTo?: {
      name: string;
      address1: string;
      address2?: string;
      city: string;
      state: string;
      zip: string;
      country: string;
    };
    
    // Lines
    lines: {
      lineNumber: number;
      productId?: string;           // SteelWise product ID
      externalProductId?: string;   // External SKU
      quantity: number;
      uom: string;
      unitPrice?: number;
      requestedDate?: string;
      notes?: string;
    }[];
    
    // Totals
    orderTotal?: number;
    currency?: string;
    
    // Custom fields
    customFields?: Record<string, any>;
  };
  
  // Options
  options?: {
    createCustomerIfNotFound: boolean;
    validatePricing: boolean;
    autoConfirm: boolean;
  };
}

interface ImportOrderResponse {
  success: boolean;
  orderId?: string;
  orderNumber?: string;
  
  // Line mapping
  lineMappings?: {
    externalLineNumber: number;
    steelwiseLineId: string;
    productMatched: boolean;
    priceMatched: boolean;
  }[];
  
  // Warnings
  warnings?: {
    code: string;
    message: string;
    field?: string;
  }[];
  
  // Errors
  errors?: {
    code: string;
    message: string;
    field?: string;
  }[];
}

/**
 * GET /api/v1/integration/orders/{orderId}
 * Export order to external system
 */
interface ExportOrderResponse {
  orderId: string;
  orderNumber: string;
  externalReferences: {
    system: string;
    externalId: string;
    syncedAt: string;
  }[];
  
  status: string;
  
  // Header
  customerId: string;
  customerName: string;
  customerPO: string;
  orderDate: string;
  promisedDate?: string;
  
  // Ship-to
  shipTo: Address;
  
  // Lines
  lines: {
    lineId: string;
    lineNumber: number;
    productId: string;
    sku: string;
    description: string;
    orderedQty: number;
    shippedQty: number;
    uom: string;
    unitPrice: number;
    extendedPrice: number;
    status: string;
  }[];
  
  // Totals
  subtotal: number;
  tax: number;
  freight: number;
  total: number;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

/**
 * POST /api/v1/integration/orders/{orderId}/status
 * Update order status from external system
 */
interface UpdateOrderStatusRequest {
  status: 'CONFIRMED' | 'ON_HOLD' | 'CANCELED';
  reason?: string;
  externalReference?: string;
}

// Inventory Integration API

/**
 * POST /api/v1/integration/inventory/receive
 * Record inventory receipt
 */
interface ReceiveInventoryRequest {
  externalReceiptId?: string;
  
  receipts: {
    productId?: string;
    externalProductId?: string;
    locationId: string;
    quantity: number;
    uom: string;
    
    // Lot/heat tracking
    lotNumber?: string;
    heatNumber?: string;
    
    // Purchase order reference
    poNumber?: string;
    poLineNumber?: number;
    
    // Dimensions (for metals)
    dimensions?: {
      thickness?: number;
      width?: number;
      length?: number;
      weight?: number;
    };
    
    // Certification
    mtrDocumentId?: string;
  }[];
}

interface ReceiveInventoryResponse {
  success: boolean;
  receiptId: string;
  
  receivedItems: {
    itemId: string;
    productId: string;
    quantity: number;
    lotId?: string;
  }[];
}

/**
 * GET /api/v1/integration/inventory/balances
 * Get inventory balances for sync
 */
interface InventoryBalancesRequest {
  locationId?: string;
  productId?: string;
  modifiedSince?: string;           // Only items changed since
  pageSize?: number;
  pageToken?: string;
}

interface InventoryBalancesResponse {
  balances: {
    productId: string;
    sku: string;
    locationId: string;
    locationName: string;
    
    onHand: number;
    allocated: number;
    available: number;
    onOrder: number;
    uom: string;
    
    // By lot
    lots?: {
      lotId: string;
      lotNumber: string;
      heatNumber?: string;
      quantity: number;
      receivedDate: string;
    }[];
    
    lastUpdated: string;
  }[];
  
  nextPageToken?: string;
}

// Shipment Integration API

/**
 * POST /api/v1/integration/shipments/notify
 * Notify external system of shipment
 */
interface ShipmentNotificationRequest {
  shipmentId: string;
}

interface ShipmentNotificationResponse {
  shipmentId: string;
  shipmentNumber: string;
  
  // External confirmations
  ediTransmitted?: {
    documentType: '856';
    transmittedAt: string;
    isaControlNumber: string;
  };
  
  erpUpdated?: {
    system: string;
    documentId: string;
    updatedAt: string;
  };
}

/**
 * GET /api/v1/integration/shipments/{shipmentId}
 * Export shipment details
 */
interface ExportShipmentResponse {
  shipmentId: string;
  shipmentNumber: string;
  
  // Order reference
  orderId: string;
  orderNumber: string;
  customerPO: string;
  
  // Carrier
  carrier: {
    carrierId: string;
    carrierName: string;
    scac: string;
    serviceLevel: string;
  };
  
  // Tracking
  trackingNumber: string;
  bolNumber: string;
  proNumber?: string;
  
  // Dates
  shipDate: string;
  estimatedDeliveryDate?: string;
  actualDeliveryDate?: string;
  
  // Ship from/to
  shipFrom: Address;
  shipTo: Address;
  
  // Packages
  packages: {
    packageId: string;
    packageNumber: string;
    packageType: string;
    weight: number;
    weightUom: string;
    
    items: {
      lineId: string;
      productId: string;
      sku: string;
      quantity: number;
      uom: string;
    }[];
  }[];
  
  // Totals
  totalWeight: number;
  totalPackages: number;
  freightCost?: number;
}
```

### 7.3 Webhook Configuration

```typescript
/**
 * POST /api/v1/integration/webhooks
 * Register a webhook subscription
 */
interface RegisterWebhookRequest {
  name: string;
  description?: string;
  
  // Endpoint
  url: string;
  headers?: Record<string, string>;
  
  // Authentication
  auth?: {
    type: 'NONE' | 'BASIC' | 'BEARER' | 'HMAC';
    username?: string;
    password?: string;
    token?: string;
    secret?: string;              // For HMAC signing
  };
  
  // Events to subscribe
  events: string[];               // e.g., ["order.created", "shipment.shipped"]
  
  // Filtering
  filter?: {
    customerId?: string[];        // Only for specific customers
    productId?: string[];         // Only for specific products
    expression?: string;          // JSONPath filter expression
  };
  
  // Retry policy
  retryPolicy?: {
    maxRetries: number;
    backoffMultiplier: number;
  };
  
  // Active
  active: boolean;
}

interface WebhookDelivery {
  // Request headers
  headers: {
    'Content-Type': 'application/json';
    'X-SteelWise-Event': string;              // Event type
    'X-SteelWise-Delivery-Id': string;        // Unique delivery ID
    'X-SteelWise-Signature': string;          // HMAC signature
    'X-SteelWise-Timestamp': string;          // Unix timestamp
  };
  
  // Request body
  body: {
    id: string;                               // Event ID
    type: string;                             // Event type
    timestamp: string;                        // ISO 8601
    data: Record<string, any>;                // Event payload
  };
}

// Signature verification example
function verifySignature(payload: string, signature: string, secret: string): boolean {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  const expected = `sha256=${hmac.digest('hex')}`;
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}
```

### 7.4 Batch Sync API

```typescript
/**
 * POST /api/v1/integration/sync/products
 * Bulk product sync from external system
 */
interface ProductSyncRequest {
  mode: 'FULL' | 'INCREMENTAL';
  externalSystem: string;
  
  products: {
    externalProductId: string;
    sku: string;
    description: string;
    category?: string;
    
    // Attributes
    materialType?: string;
    grade?: string;
    
    // Dimensions (for dimensional products)
    dimensions?: {
      thickness?: number;
      width?: number;
      length?: number;
      unit: string;
    };
    
    // Weight
    weight?: {
      value: number;
      unit: string;
    };
    
    // Pricing
    listPrice?: number;
    priceUom?: string;
    
    // Status
    active: boolean;
    
    // Custom attributes
    customAttributes?: Record<string, any>;
  }[];
}

interface ProductSyncResponse {
  success: boolean;
  
  summary: {
    total: number;
    created: number;
    updated: number;
    skipped: number;
    errors: number;
  };
  
  results: {
    externalProductId: string;
    steelwiseProductId?: string;
    action: 'CREATED' | 'UPDATED' | 'SKIPPED' | 'ERROR';
    error?: string;
  }[];
}

/**
 * GET /api/v1/integration/sync/changelog
 * Get changes since last sync (for polling)
 */
interface ChangelogRequest {
  entityType: 'ORDER' | 'INVENTORY' | 'SHIPMENT' | 'INVOICE';
  since: string;                    // ISO 8601 timestamp
  limit?: number;                   // Max 1000
}

interface ChangelogResponse {
  changes: {
    changeId: string;
    entityType: string;
    entityId: string;
    changeType: 'CREATE' | 'UPDATE' | 'DELETE';
    changedAt: string;
    changedBy: string;
    changedFields?: string[];
  }[];
  
  // Pagination
  hasMore: boolean;
  nextSince?: string;               // Use as 'since' for next page
}
```

---

## 8. SUMMARY

### Integration Capabilities Matrix

| Capability | SAP | Oracle/NetSuite | Epicor | EDI | MES |
|------------|-----|-----------------|--------|-----|-----|
| **Order Import** | IDoc/OData | REST | REST/SOAP | 850/860 | ISA-95 |
| **Order Confirm** | IDoc | REST | REST | 855 | Event |
| **Shipment Notify** | IDoc | REST | REST | 856 | Event |
| **Invoice Export** | IDoc | REST | REST | 810 | N/A |
| **Inventory Sync** | IDoc/BAPI | REST | REST | 846 | Event |
| **Production Reporting** | BAPI | REST | REST | N/A | ISA-95 |

### Event-Driven vs Polling Strategy

| Scenario | Recommended Pattern | Rationale |
|----------|---------------------|-----------|
| Order status changes | **Event** | Real-time notification required |
| Shipment notifications | **Event** | EDI 856 timing critical |
| Inventory transactions | **Event** | Keep ERP in sync |
| Master data sync | **Scheduled Batch** | Bulk updates more efficient |
| Inventory reconciliation | **Scheduled Batch** | Daily full comparison |
| GL postings | **Scheduled Batch** | End-of-day posting |

### API Boundaries

| SteelWise Owns | External System Owns |
|----------------|----------------------|
| Shop floor execution | GL accounting |
| Metals-specific BOM | Customer credit |
| Heat/lot traceability | Consolidated invoicing |
| Work order scheduling | Tax calculation |
| Quality inspection | Commission calculation |
| Packaging/shipping | Consolidated reporting |

---

**End of ERP/MES/EDI Integration Architecture Specification**
