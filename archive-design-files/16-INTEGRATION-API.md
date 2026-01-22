# 16 - INTEGRATION & API LAYER

## Overview
External integrations, EDI support, webhooks, and API architecture.

## Integration Architecture
```
┌─────────────────────────────────────────────────────────────────┐
│                    STEELWISE API GATEWAY                        │
├─────────────────────────────────────────────────────────────────┤
│  REST API    │   GraphQL   │   EDI Translator   │   Webhooks   │
└──────┬───────┴──────┬──────┴─────────┬──────────┴───────┬──────┘
       │              │                │                  │
       ▼              ▼                ▼                  ▼
   Mobile Apps    Web Portal      ERP Systems        Event Subs
   3rd Party      BI Tools        Trading Partners   Notifications
```

## EDI Support
| Transaction | Description |
|-------------|-------------|
| 850 | Purchase Order |
| 855 | PO Acknowledgment |
| 856 | ASN / Ship Notice |
| 810 | Invoice |
| 997 | Functional Ack |

## Webhook Events
```
material.received
material.shipped
order.created
order.status_changed
quality.hold_placed
quality.hold_released
invoice.generated
payment.received
```

## External Integrations
| System | Purpose | Method |
|--------|---------|--------|
| QuickBooks/SAP | Accounting sync | API |
| Salesforce | CRM sync | API |
| LME/CME | Commodity feeds | WebSocket |
| Scales | Weight capture | Serial/API |
| Scanners | Barcode input | USB/BT |
| GPS/Telematics | Truck tracking | API |

## Authentication
- OAuth 2.0 for user sessions
- API Keys for service accounts
- JWT tokens with 1hr expiry
- Rate limiting: 1000 req/min

## API Versioning
```
/api/v1/...  (current)
/api/v2/...  (future)
```
