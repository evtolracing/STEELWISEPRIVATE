# 18 - UNIFIED SYSTEM DIAGRAM

## Complete Platform Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                   STEELWISE ERP                                          │
│                        Steel Manufacturing & Distribution Platform                       │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐    │
│  │                              PRESENTATION LAYER                                  │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐          │    │
│  │  │   Web    │  │  Mobile  │  │  Tablet  │  │  Driver  │  │ Customer │          │    │
│  │  │  Portal  │  │   App    │  │ Shop Flr │  │   App    │  │  Portal  │          │    │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘          │    │
│  └─────────────────────────────────────────────────────────────────────────────────┘    │
│                                         │                                                │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐    │
│  │                                API GATEWAY                                       │    │
│  │              REST  │  GraphQL  │  WebSocket  │  EDI Translator                  │    │
│  └─────────────────────────────────────────────────────────────────────────────────┘    │
│                                         │                                                │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐    │
│  │                            CORE MODULES (Microservices)                          │    │
│  │                                                                                   │    │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                │    │
│  │  │   Product   │ │  Inventory  │ │  Shop Floor │ │    QA/QC    │                │    │
│  │  │   Catalog   │ │  Warehouse  │ │ Work Orders │ │  Metallurgy │                │    │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘                │    │
│  │                                                                                   │    │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                │    │
│  │  │Traceability │ │   Orders    │ │  Commodity  │ │  Logistics  │                │    │
│  │  │   & Chain   │ │  & Quoting  │ │   Pricing   │ │  & Dispatch │                │    │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘                │    │
│  │                                                                                   │    │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                │    │
│  │  │   Billing   │ │  Analytics  │ │ Compliance  │ │     AI      │                │    │
│  │  │   Finance   │ │  Dashboards │ │  Documents  │ │Intelligence │                │    │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘                │    │
│  │                                                                                   │    │
│  └─────────────────────────────────────────────────────────────────────────────────┘    │
│                                         │                                                │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐    │
│  │                              DATA LAYER                                          │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐          │    │
│  │  │PostgreSQL│  │TimescaleDB│ │   Redis  │  │Elasticsrch│ │   S3     │          │    │
│  │  │ Primary  │  │Time Series│  │  Cache   │  │  Search  │  │ Docs/MTR │          │    │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘          │    │
│  └─────────────────────────────────────────────────────────────────────────────────┘    │
│                                         │                                                │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐    │
│  │                          EXTERNAL INTEGRATIONS                                   │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐          │    │
│  │  │  LME/CME │  │Accounting│  │   CRM    │  │   GPS    │  │  Scales  │          │    │
│  │  │  Feeds   │  │ERP Sync  │  │Salesforce│  │Telematics│  │ Scanners │          │    │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘          │    │
│  └─────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

## Data Flow: Order to Delivery

```
CUSTOMER REQUEST
      │
      ▼
┌───────────┐    ┌───────────┐    ┌───────────┐
│   RFQ     │───▶│   QUOTE   │───▶│  ORDER    │
│  Received │    │  Created  │    │ Confirmed │
└───────────┘    └───────────┘    └───────────┘
                                        │
      ┌─────────────────────────────────┼─────────────────────────────────┐
      │                                 │                                 │
      ▼                                 ▼                                 ▼
┌───────────┐                    ┌───────────┐                     ┌───────────┐
│  SOURCE   │                    │  PROCESS  │                     │   SHIP    │
│ Inventory │                    │ Work Order│                     │  Allocate │
└───────────┘                    └───────────┘                     └───────────┘
      │                                 │                                 │
      ▼                                 ▼                                 ▼
┌───────────┐                    ┌───────────┐                     ┌───────────┐
│    QC     │                    │  QC Check │                     │  DISPATCH │
│  Verify   │                    │   Pass    │                     │   Route   │
└───────────┘                    └───────────┘                     └───────────┘
                                                                          │
                                                                          ▼
                                                                   ┌───────────┐
                                                                   │  DELIVER  │
                                                                   │   + POD   │
                                                                   └───────────┘
                                                                          │
                                                                          ▼
                                                                   ┌───────────┐
                                                                   │  INVOICE  │
                                                                   │  & Collect│
                                                                   └───────────┘
```

## Technology Summary

| Layer | Technology |
|-------|------------|
| Frontend | React, TypeScript, Tailwind |
| API | Node.js/Go, REST/GraphQL |
| Database | PostgreSQL, TimescaleDB |
| Cache | Redis |
| Search | Elasticsearch |
| Storage | S3/MinIO |
| Queue | RabbitMQ/Kafka |
| Analytics | ClickHouse |
| ML/AI | Python, TensorFlow |

---

## Document Index

| # | Document | Description |
|---|----------|-------------|
| 00 | Architecture Index | Navigation & overview |
| 01 | Executive Vision | Platform goals & scope |
| 02 | User Personas | Roles & journeys |
| 03 | Data Model Core | Entities & relationships |
| 04 | Product Catalog | Grades & specs |
| 05 | Inventory | Stock & warehouse |
| 06 | Shop Floor | Work orders |
| 07 | QA/QC | Testing & holds |
| 08 | Traceability | Chain of custody |
| 09 | Orders | Quoting & sales |
| 10 | Commodity Pricing | Market feeds |
| 11 | Logistics | Dispatch & delivery |
| 12 | Billing | AR/AP & finance |
| 13 | Analytics | Dashboards & KPIs |
| 14 | Compliance | Documents & certs |
| 15 | AI Features | ML capabilities |
| 16 | Integration | APIs & EDI |
| 17 | UI Components | Design system |
| 18 | System Diagram | Architecture view |

---

**END OF STEELWISE ERP DESIGN SPECIFICATION**
