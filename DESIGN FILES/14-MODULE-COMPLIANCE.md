# 14 - COMPLIANCE & DOCUMENTATION MODULE

## Overview
Document vault, certification tracking, audit management, and regulatory compliance.

## Document Vault
```
┌─────────────────────────────────────────────────────────────────┐
│ DOCUMENT VAULT                              [+ Upload]         │
├─────────────────────────────────────────────────────────────────┤
│ Type: [All▼] Entity: [________] Date: [Last 30 days▼]          │
├─────────────────────────────────────────────────────────────────┤
│ TYPE │ NUMBER      │ ENTITY     │ DATE     │ EXPIRY   │ STATUS │
│ MTR  │ MTR-H89421  │ Heat H89421│ 01/02/26 │ -        │ ✓      │
│ BOL  │ BOL-445521  │ SO-10245   │ 01/16/26 │ -        │ ✓      │
│ CERT │ ISO-9001    │ Company    │ 03/15/24 │ 03/14/26 │ ⚠ 58d  │
│ COC  │ COC-10245   │ SO-10245   │ 01/17/26 │ -        │ ✓      │
│ MSDS │ MSDS-GAL    │ Product    │ 06/01/25 │ 06/01/27 │ ✓      │
└─────────────────────────────────────────────────────────────────┘
```

## Certificate Tracking
| Type | Renewal Period | Alert Days |
|------|----------------|------------|
| ISO 9001 | Annual | 90, 60, 30 |
| ISO 14001 | Annual | 90, 60, 30 |
| IATF 16949 | 3 Years | 180, 90, 60 |
| AS9100 | 3 Years | 180, 90, 60 |
| Mill Cert | Per Heat | N/A |

## Compliance Requirements
- MTR attached to every shipment
- COC generated on request
- Retain documents 7+ years
- Secure storage with encryption
- Audit trail on all access

## Auto-Generated Documents
- Certificate of Compliance (COC)
- Packing List
- Bill of Lading
- Commercial Invoice
- Traceability Report

## API Endpoints
```
POST   /api/v1/documents/upload
GET    /api/v1/documents
GET    /api/v1/documents/{id}/download
GET    /api/v1/certifications
POST   /api/v1/documents/generate/coc
```
