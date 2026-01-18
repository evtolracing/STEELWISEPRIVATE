# 48 — AI Multi-Tenant Architecture

> **Purpose:** SaaS multi-tenant architecture, isolation models, billing structures, and deployment topologies for AI-build.  
> **Version:** 1.0  
> **Last Updated:** 2026-01-17

---

## 1. Tenant Model — JSON

```json
{
  "tenant_model": {

    "tenant": {
      "tenant_id": "uuid",
      "tenant_code": "string (unique, 3-20 chars, alphanumeric)",
      "legal_name": "string",
      "dba_name": "string | null",
      "tenant_type": "enum(SINGLE_LOCATION, MULTI_LOCATION, ENTERPRISE, WHITE_LABEL)",
      "industry_vertical": "enum(SERVICE_CENTER, DISTRIBUTOR, FABRICATOR, MANUFACTURER, HYBRID)",
      "status": "enum(TRIAL, ACTIVE, SUSPENDED, CHURNED, ARCHIVED)",
      "created_at": "timestamp",
      "activated_at": "timestamp | null",
      "suspended_at": "timestamp | null",
      "churned_at": "timestamp | null",
      
      "subscription": {
        "subscription_id": "uuid",
        "tier": "enum(STARTER, PROFESSIONAL, ENTERPRISE, CUSTOM)",
        "billing_cycle": "enum(MONTHLY, ANNUAL)",
        "start_date": "date",
        "renewal_date": "date",
        "contract_end_date": "date | null",
        "auto_renew": "boolean",
        "payment_method": "enum(CREDIT_CARD, ACH, INVOICE, WIRE)",
        "payment_terms_days": "integer",
        "mrr": "decimal",
        "arr": "decimal",
        "discount_pct": "decimal | null",
        "promo_code": "string | null"
      },

      "limits": {
        "max_users": "integer | null",
        "max_locations": "integer | null",
        "max_products": "integer | null",
        "max_customers": "integer | null",
        "max_orders_per_month": "integer | null",
        "max_api_calls_per_month": "integer | null",
        "storage_gb": "integer | null",
        "retention_years": "integer"
      },

      "modules_enabled": [
        {
          "module_id": "string",
          "enabled": "boolean",
          "enabled_at": "timestamp",
          "features": [
            {
              "feature_id": "string",
              "enabled": "boolean",
              "config": "json | null"
            }
          ]
        }
      ],

      "integrations": [
        {
          "integration_id": "uuid",
          "integration_type": "enum(ERP, ACCOUNTING, TAX, CARRIER, EDI, COMMODITY, CRM)",
          "provider": "string",
          "status": "enum(CONFIGURED, ACTIVE, ERROR, DISABLED)",
          "config": "encrypted_json",
          "last_sync": "timestamp | null"
        }
      ],

      "settings": {
        "timezone": "string (IANA)",
        "locale": "string",
        "currency": "string (ISO 4217)",
        "date_format": "string",
        "number_format": "string",
        "weight_uom_default": "enum(LB, KG)",
        "length_uom_default": "enum(IN, MM)",
        "fiscal_year_start_month": "integer (1-12)",
        "week_start_day": "enum(SUNDAY, MONDAY)"
      },

      "security": {
        "password_policy": {
          "min_length": "integer",
          "require_uppercase": "boolean",
          "require_lowercase": "boolean",
          "require_number": "boolean",
          "require_special": "boolean",
          "max_age_days": "integer | null",
          "prevent_reuse_count": "integer"
        },
        "session_policy": {
          "max_concurrent_sessions": "integer",
          "session_timeout_minutes": "integer",
          "require_mfa": "boolean",
          "mfa_methods": ["TOTP", "SMS", "EMAIL"],
          "ip_whitelist": ["string"] | null,
          "allowed_domains": ["string"] | null
        },
        "sso_config": {
          "enabled": "boolean",
          "provider": "enum(SAML, OIDC, AZURE_AD, OKTA, GOOGLE) | null",
          "config": "encrypted_json | null"
        }
      },

      "contacts": {
        "primary": {
          "name": "string",
          "email": "string",
          "phone": "string",
          "role": "string"
        },
        "billing": {
          "name": "string",
          "email": "string",
          "phone": "string"
        },
        "technical": {
          "name": "string",
          "email": "string",
          "phone": "string"
        }
      },

      "addresses": {
        "billing_address": {
          "line1": "string",
          "line2": "string | null",
          "city": "string",
          "state": "string",
          "postal_code": "string",
          "country": "string"
        },
        "primary_location": "uuid (references location)"
      },

      "metadata": {
        "source": "enum(ORGANIC, REFERRAL, PARTNER, SALES)",
        "referral_code": "string | null",
        "partner_id": "uuid | null",
        "sales_rep": "string | null",
        "notes": "text | null",
        "tags": ["string"],
        "custom_fields": "json | null"
      }
    },

    "tenant_location": {
      "location_id": "uuid",
      "tenant_id": "uuid",
      "location_code": "string (unique within tenant)",
      "location_name": "string",
      "location_type": "enum(WAREHOUSE, SERVICE_CENTER, OFFICE, VIRTUAL)",
      "is_primary": "boolean",
      "status": "enum(ACTIVE, INACTIVE, CLOSED)",
      
      "address": {
        "line1": "string",
        "line2": "string | null",
        "city": "string",
        "state": "string",
        "postal_code": "string",
        "country": "string",
        "latitude": "decimal | null",
        "longitude": "decimal | null"
      },

      "contact": {
        "phone": "string",
        "fax": "string | null",
        "email": "string"
      },

      "operations": {
        "timezone": "string (IANA)",
        "operating_hours": {
          "monday": {"open": "time", "close": "time"},
          "tuesday": {"open": "time", "close": "time"},
          "wednesday": {"open": "time", "close": "time"},
          "thursday": {"open": "time", "close": "time"},
          "friday": {"open": "time", "close": "time"},
          "saturday": {"open": "time | null", "close": "time | null"},
          "sunday": {"open": "time | null", "close": "time | null"}
        },
        "holidays": ["date"],
        "ship_from_address": "address | null (if different)",
        "default_carrier_id": "uuid | null",
        "auto_assign_work_orders": "boolean"
      },

      "capabilities": {
        "can_receive": "boolean",
        "can_ship": "boolean",
        "can_process": "boolean",
        "processing_types": ["enum(CTL, SLITTING, BLANKING, etc)"],
        "work_centers": ["uuid"]
      }
    },

    "tenant_user": {
      "user_id": "uuid",
      "tenant_id": "uuid",
      "username": "string (unique within tenant)",
      "email": "string",
      "status": "enum(INVITED, ACTIVE, SUSPENDED, DEACTIVATED)",
      
      "profile": {
        "first_name": "string",
        "last_name": "string",
        "phone": "string | null",
        "avatar_url": "string | null",
        "job_title": "string | null"
      },

      "access": {
        "role_id": "uuid",
        "role_name": "string",
        "home_location_id": "uuid",
        "accessible_locations": ["uuid"],
        "permissions_override": "json | null"
      },

      "preferences": {
        "theme": "enum(LIGHT, DARK, SYSTEM)",
        "language": "string",
        "timezone": "string | null (override tenant)",
        "notifications": {
          "email_enabled": "boolean",
          "in_app_enabled": "boolean",
          "sms_enabled": "boolean",
          "digest_frequency": "enum(REALTIME, HOURLY, DAILY)"
        },
        "dashboard_config": "json | null"
      },

      "auth": {
        "password_hash": "string",
        "password_changed_at": "timestamp",
        "mfa_enabled": "boolean",
        "mfa_secret": "encrypted_string | null",
        "recovery_codes": "encrypted_json | null",
        "last_login_at": "timestamp | null",
        "last_login_ip": "string | null",
        "failed_login_count": "integer",
        "locked_until": "timestamp | null"
      },

      "employment": {
        "employee_id": "string | null",
        "department": "string | null",
        "manager_id": "uuid | null",
        "hire_date": "date | null",
        "termination_date": "date | null"
      }
    },

    "tenant_hierarchy": {
      "parent_tenant_id": "uuid | null",
      "child_tenants": ["uuid"],
      "hierarchy_type": "enum(FRANCHISE, HOLDING_COMPANY, RESELLER, NONE)",
      "shared_resources": {
        "share_products": "boolean",
        "share_customers": "boolean",
        "share_pricing": "boolean",
        "share_reports": "boolean"
      },
      "rollup_reporting": "boolean"
    },

    "tenant_api_access": {
      "api_key_id": "uuid",
      "tenant_id": "uuid",
      "key_name": "string",
      "key_hash": "string",
      "key_prefix": "string (first 8 chars for display)",
      "status": "enum(ACTIVE, REVOKED)",
      "scopes": ["string"],
      "allowed_ips": ["string"] | null,
      "rate_limit_per_minute": "integer",
      "rate_limit_per_day": "integer",
      "created_at": "timestamp",
      "last_used_at": "timestamp | null",
      "expires_at": "timestamp | null",
      "created_by": "uuid"
    }
  },

  "tenant_provisioning": {
    "workflow": [
      {
        "step": 1,
        "name": "tenant_record_creation",
        "actions": [
          "Generate tenant_id (UUID)",
          "Generate tenant_code (from company name)",
          "Create tenant record with TRIAL status",
          "Set default limits based on tier",
          "Create subscription record"
        ]
      },
      {
        "step": 2,
        "name": "database_setup",
        "actions": [
          "Create tenant schema (if schema-per-tenant)",
          "Run migrations for tenant tables",
          "Seed reference data (UoMs, grades, forms)",
          "Configure RLS policies"
        ]
      },
      {
        "step": 3,
        "name": "primary_location_setup",
        "actions": [
          "Create primary location record",
          "Configure default work centers (if processing enabled)",
          "Set up default zones/bins"
        ]
      },
      {
        "step": 4,
        "name": "admin_user_creation",
        "actions": [
          "Create admin user from signup form",
          "Assign SUPER_ADMIN role",
          "Send welcome email with activation link",
          "Generate initial API key (if tier allows)"
        ]
      },
      {
        "step": 5,
        "name": "default_configuration",
        "actions": [
          "Apply default settings based on industry vertical",
          "Enable default modules for tier",
          "Configure default document templates",
          "Set up default notification preferences"
        ]
      },
      {
        "step": 6,
        "name": "trial_activation",
        "actions": [
          "Mark tenant as TRIAL",
          "Set trial_end_date (typically +14 days)",
          "Schedule trial reminder emails",
          "Enable feature tracking for conversion analysis"
        ]
      }
    ],
    
    "deprovisioning": {
      "soft_delete": {
        "retention_days": 90,
        "actions": [
          "Set status to CHURNED",
          "Disable all user access",
          "Stop billing",
          "Archive active data",
          "Retain for recovery period"
        ]
      },
      "hard_delete": {
        "trigger": "90 days after churn OR explicit request with verification",
        "actions": [
          "Export final data backup",
          "Delete all tenant data",
          "Remove tenant schema (if applicable)",
          "Purge from all caches",
          "Log deletion for audit",
          "Notify compliance"
        ]
      }
    }
  }
}
```

---

## 2. Isolation Rules — List

```yaml
isolation_rules:

  data_isolation:
    - rule_id: ISO-D-001
      name: "Tenant Data Segregation"
      description: "All tenant data physically or logically separated"
      implementation:
        strategy: "Row-Level Security (RLS) with tenant_id column"
        enforcement: "Database policy on all tenant-scoped tables"
        fallback: "Application middleware validates tenant context"
      tables_excluded:
        - system_settings
        - shared_reference_data (grades, UoMs)
        - audit_logs (separate partition)
      validation:
        - "Every query includes tenant_id filter"
        - "Cross-tenant joins prohibited at DB level"
        - "Penetration testing quarterly"

    - rule_id: ISO-D-002
      name: "Location Data Scoping"
      description: "Users see only assigned location data within tenant"
      implementation:
        - "user_location junction table"
        - "Additional RLS policy on location_id"
        - "Session context includes current_location"
      entities_affected:
        - inventory_items
        - work_orders
        - shipments
        - receiving

    - rule_id: ISO-D-003
      name: "Customer Portal Isolation"
      description: "Portal users see only their company's data"
      implementation:
        - "customer_id filter on all portal queries"
        - "division_id filter for multi-division customers"
        - "Separate authentication context from internal users"
      data_visible:
        - own_orders
        - own_shipments
        - own_invoices
        - own_documents

    - rule_id: ISO-D-004
      name: "Shared Reference Data"
      description: "Read-only access to system reference data"
      shared_data:
        - material_grades (ASTM, SAE standards)
        - unit_of_measure (system UoMs)
        - carrier_master (common carriers)
        - country_codes
        - tax_jurisdictions
      access_pattern: "Read from shared, write to tenant-specific overrides"

  compute_isolation:
    - rule_id: ISO-C-001
      name: "Request Context Isolation"
      description: "Each request bound to single tenant context"
      implementation:
        - "JWT contains tenant_id claim"
        - "Middleware extracts and validates tenant"
        - "Request context propagated through call stack"
        - "Async workers include tenant_id in job payload"
      validation:
        - "Cannot switch tenant mid-request"
        - "Background jobs validate tenant before execution"

    - rule_id: ISO-C-002
      name: "Resource Limits"
      description: "Per-tenant resource consumption limits"
      limits:
        api_rate_limit:
          starter: "1000 requests/hour"
          professional: "5000 requests/hour"
          enterprise: "20000 requests/hour"
        concurrent_users:
          starter: "10 simultaneous"
          professional: "50 simultaneous"
          enterprise: "unlimited"
        background_jobs:
          starter: "5 concurrent"
          professional: "20 concurrent"
          enterprise: "50 concurrent"
      enforcement: "Redis-based rate limiting per tenant"

    - rule_id: ISO-C-003
      name: "Report Generation Isolation"
      description: "Tenant reports queued separately"
      implementation:
        - "Per-tenant report queue"
        - "Resource allocation based on tier"
        - "Large reports scheduled off-peak"
      quotas:
        starter: "10 scheduled reports"
        professional: "50 scheduled reports"
        enterprise: "unlimited"

  storage_isolation:
    - rule_id: ISO-S-001
      name: "File Storage Segregation"
      description: "Tenant files stored in isolated containers"
      implementation:
        strategy: "Separate S3 prefix per tenant"
        pattern: "s3://steelwise-files/{tenant_id}/{entity_type}/{year}/{month}/{file_id}"
        encryption: "SSE-S3 with tenant-specific KMS key (Enterprise)"
      access_control:
        - "Signed URLs with tenant validation"
        - "CORS restricted to tenant domains"
        - "Audit logging of all access"

    - rule_id: ISO-S-002
      name: "Document Template Isolation"
      description: "Custom templates stored per tenant"
      implementation:
        - "Tenant can customize from system templates"
        - "Customized templates stored in tenant folder"
        - "Fallback to system template if not customized"
      template_types:
        - invoice
        - packing_list
        - bill_of_lading
        - mtr
        - quote
        - purchase_order

    - rule_id: ISO-S-003
      name: "Backup Isolation"
      description: "Tenant data backed up separately"
      implementation:
        - "Logical backups include tenant_id filter"
        - "Restore can target specific tenant"
        - "Enterprise: dedicated backup schedule option"
      retention:
        starter: "7 days"
        professional: "30 days"
        enterprise: "90 days + custom"

  network_isolation:
    - rule_id: ISO-N-001
      name: "Subdomain Isolation"
      description: "Each tenant accessed via unique subdomain"
      implementation:
        pattern: "{tenant_code}.steelwise.app"
        ssl: "Wildcard certificate *.steelwise.app"
        custom_domain: "Enterprise tier with CNAME verification"
      validation:
        - "Subdomain mapped to tenant_id at edge"
        - "Mismatch returns 404, not cross-tenant data"

    - rule_id: ISO-N-002
      name: "API Endpoint Isolation"
      description: "API calls scoped to tenant"
      implementation:
        - "API key encodes tenant_id"
        - "Request validated against key's tenant"
        - "Cross-tenant API calls rejected"
      patterns:
        - "api.steelwise.app/v1/{resource} (tenant from auth)"
        - "Webhook callbacks include tenant context"

    - rule_id: ISO-N-003
      name: "IP Whitelisting"
      description: "Optional IP restriction per tenant"
      implementation:
        availability: "Enterprise tier"
        config: "tenant.security.ip_whitelist"
        enforcement: "Edge firewall + application layer"
      bypass:
        - "Support access with audit logging"
        - "Temporary bypass with approval workflow"

  encryption_isolation:
    - rule_id: ISO-E-001
      name: "Encryption at Rest"
      description: "All tenant data encrypted"
      implementation:
        database: "TDE (Transparent Data Encryption)"
        files: "SSE-S3"
        backups: "Encrypted with tenant-aware keys"
      key_management:
        starter: "Shared encryption key"
        professional: "Shared encryption key"
        enterprise: "Dedicated KMS key per tenant"

    - rule_id: ISO-E-002
      name: "Encryption in Transit"
      description: "All communication encrypted"
      implementation:
        - "TLS 1.3 for all external connections"
        - "TLS 1.2+ for internal service communication"
        - "Certificate pinning for mobile apps"

    - rule_id: ISO-E-003
      name: "Sensitive Field Encryption"
      description: "PII and credentials encrypted at application layer"
      fields_encrypted:
        - api_key_secret
        - integration_credentials
        - mfa_secret
        - ssn (if stored)
      implementation: "AES-256 with tenant-scoped key"

  audit_isolation:
    - rule_id: ISO-A-001
      name: "Audit Log Segregation"
      description: "Tenant audit logs stored separately"
      implementation:
        - "Separate audit log partition per tenant"
        - "Immutable log entries"
        - "Tenant cannot delete own audit logs"
      retention:
        starter: "1 year"
        professional: "3 years"
        enterprise: "7 years + custom"

    - rule_id: ISO-A-002
      name: "Cross-Tenant Access Logging"
      description: "All administrative cross-tenant access logged"
      scenarios:
        - "Support accessing tenant for troubleshooting"
        - "System admin performing maintenance"
        - "Data migration or recovery operations"
      logging:
        - "Actor identity"
        - "Tenant accessed"
        - "Actions performed"
        - "Duration"
        - "Justification/ticket reference"

  cache_isolation:
    - rule_id: ISO-CACHE-001
      name: "Cache Key Namespacing"
      description: "All cache keys prefixed with tenant_id"
      implementation:
        pattern: "tenant:{tenant_id}:{entity}:{id}"
        examples:
          - "tenant:abc123:product:prod_456"
          - "tenant:abc123:user_session:sess_789"
      eviction:
        - "Tenant-specific cache clear on demand"
        - "Automatic eviction on tenant deactivation"

    - rule_id: ISO-CACHE-002
      name: "Session Isolation"
      description: "User sessions scoped to tenant"
      implementation:
        - "Session ID includes tenant context"
        - "Session validation checks tenant match"
        - "Cross-tenant session hijacking prevented"
```

---

## 3. Billing Model — Structured Options

```json
{
  "billing_model": {

    "subscription_tiers": [
      {
        "tier_id": "STARTER",
        "name": "Starter",
        "description": "For small service centers and distributors",
        "pricing": {
          "monthly": 499,
          "annual": 4990,
          "annual_discount_pct": 17,
          "currency": "USD"
        },
        "included": {
          "users": 5,
          "locations": 1,
          "products": 1000,
          "customers": 500,
          "orders_per_month": 500,
          "storage_gb": 10,
          "api_calls_per_month": 10000,
          "support": "email"
        },
        "features": {
          "processing_module": false,
          "customer_portal": false,
          "api_access": false,
          "custom_reports": false,
          "sso": false,
          "dedicated_support": false
        },
        "overages": {
          "additional_user": 25,
          "additional_1000_products": 50,
          "additional_1000_orders": 100
        }
      },
      {
        "tier_id": "PROFESSIONAL",
        "name": "Professional",
        "description": "For growing multi-location operations",
        "pricing": {
          "monthly": 1499,
          "annual": 14990,
          "annual_discount_pct": 17,
          "currency": "USD"
        },
        "included": {
          "users": 25,
          "locations": 3,
          "products": 10000,
          "customers": 2500,
          "orders_per_month": 2500,
          "storage_gb": 100,
          "api_calls_per_month": 100000,
          "support": "email_chat"
        },
        "features": {
          "processing_module": true,
          "customer_portal": true,
          "api_access": true,
          "custom_reports": true,
          "sso": false,
          "dedicated_support": false
        },
        "overages": {
          "additional_user": 20,
          "additional_location": 200,
          "additional_1000_products": 40,
          "additional_1000_orders": 80
        }
      },
      {
        "tier_id": "ENTERPRISE",
        "name": "Enterprise",
        "description": "For large operations with advanced requirements",
        "pricing": {
          "base_monthly": 4999,
          "custom_pricing": true,
          "volume_discounts": true,
          "multi_year_discounts": true,
          "currency": "USD"
        },
        "included": {
          "users": "unlimited",
          "locations": "unlimited",
          "products": "unlimited",
          "customers": "unlimited",
          "orders_per_month": "unlimited",
          "storage_gb": 1000,
          "api_calls_per_month": "unlimited",
          "support": "dedicated_csm"
        },
        "features": {
          "processing_module": true,
          "customer_portal": true,
          "api_access": true,
          "custom_reports": true,
          "sso": true,
          "dedicated_support": true,
          "custom_integrations": true,
          "sla_guarantee": true,
          "dedicated_infrastructure": "optional"
        },
        "overages": "N/A - unlimited base"
      }
    ],

    "add_on_modules": [
      {
        "module_id": "ADDON-PROCESSING",
        "name": "Processing Module",
        "description": "Cut-to-length, slitting, fabrication work orders",
        "pricing": {
          "monthly": 299,
          "annual": 2990
        },
        "available_tiers": ["STARTER"],
        "included_in_tiers": ["PROFESSIONAL", "ENTERPRISE"]
      },
      {
        "module_id": "ADDON-PORTAL",
        "name": "Customer Portal",
        "description": "Self-service customer portal for orders and tracking",
        "pricing": {
          "monthly": 199,
          "annual": 1990
        },
        "available_tiers": ["STARTER"],
        "included_in_tiers": ["PROFESSIONAL", "ENTERPRISE"]
      },
      {
        "module_id": "ADDON-API",
        "name": "API Access",
        "description": "REST API for integrations",
        "pricing": {
          "monthly": 149,
          "annual": 1490
        },
        "available_tiers": ["STARTER"],
        "included_in_tiers": ["PROFESSIONAL", "ENTERPRISE"]
      },
      {
        "module_id": "ADDON-MOBILE",
        "name": "Mobile Apps",
        "description": "Warehouse and shop floor mobile applications",
        "pricing": {
          "monthly": 199,
          "annual": 1990
        },
        "available_tiers": ["STARTER", "PROFESSIONAL"],
        "included_in_tiers": ["ENTERPRISE"]
      },
      {
        "module_id": "ADDON-EDI",
        "name": "EDI Integration",
        "description": "EDI order import and document exchange",
        "pricing": {
          "monthly": 399,
          "annual": 3990,
          "per_transaction": 0.10
        },
        "available_tiers": ["PROFESSIONAL"],
        "included_in_tiers": ["ENTERPRISE"]
      },
      {
        "module_id": "ADDON-AI",
        "name": "AI Features",
        "description": "Demand forecasting, dynamic pricing, smart scheduling",
        "pricing": {
          "monthly": 599,
          "annual": 5990
        },
        "available_tiers": [],
        "included_in_tiers": ["ENTERPRISE"]
      }
    ],

    "usage_based_pricing": {
      "api_calls": {
        "included_in_tier": true,
        "overage_rate": {
          "per_1000_calls": 0.50
        },
        "billing_frequency": "monthly"
      },
      "storage": {
        "included_in_tier": true,
        "overage_rate": {
          "per_gb_month": 0.25
        },
        "billing_frequency": "monthly"
      },
      "edi_transactions": {
        "included_count": 1000,
        "overage_rate": {
          "per_transaction": 0.10
        },
        "billing_frequency": "monthly"
      },
      "sms_notifications": {
        "included_count": 500,
        "overage_rate": {
          "per_message": 0.02
        },
        "billing_frequency": "monthly"
      }
    },

    "billing_events": [
      {
        "event_type": "SUBSCRIPTION_CREATED",
        "trigger": "New tenant signs up",
        "actions": [
          "Create subscription record",
          "Set trial_end_date if trial",
          "Schedule trial reminder emails"
        ]
      },
      {
        "event_type": "SUBSCRIPTION_ACTIVATED",
        "trigger": "Trial converts or direct purchase",
        "actions": [
          "Charge initial payment",
          "Set renewal_date",
          "Send receipt",
          "Update tenant status to ACTIVE"
        ]
      },
      {
        "event_type": "SUBSCRIPTION_RENEWED",
        "trigger": "Renewal date reached",
        "actions": [
          "Charge renewal payment",
          "Update renewal_date",
          "Send renewal receipt",
          "Apply any pending tier changes"
        ]
      },
      {
        "event_type": "TIER_UPGRADED",
        "trigger": "Tenant upgrades tier",
        "actions": [
          "Calculate prorated charge",
          "Charge difference immediately",
          "Enable new tier features",
          "Update limits"
        ]
      },
      {
        "event_type": "TIER_DOWNGRADED",
        "trigger": "Tenant downgrades tier",
        "actions": [
          "Schedule for next renewal",
          "Validate current usage fits new tier",
          "Notify of feature loss",
          "Apply credit if prepaid"
        ]
      },
      {
        "event_type": "ADDON_ADDED",
        "trigger": "Tenant adds module",
        "actions": [
          "Calculate prorated charge",
          "Charge immediately",
          "Enable module",
          "Send confirmation"
        ]
      },
      {
        "event_type": "PAYMENT_FAILED",
        "trigger": "Charge declined",
        "actions": [
          "Retry after 3 days",
          "Send payment failure notification",
          "After 3 failures, suspend tenant",
          "Grace period: 14 days"
        ]
      },
      {
        "event_type": "SUBSCRIPTION_CANCELLED",
        "trigger": "Tenant cancels",
        "actions": [
          "Schedule deactivation for period end",
          "Send cancellation confirmation",
          "Trigger exit survey",
          "Offer win-back promotion"
        ]
      }
    ],

    "invoice_structure": {
      "invoice": {
        "invoice_id": "string",
        "tenant_id": "uuid",
        "invoice_number": "string (formatted)",
        "invoice_date": "date",
        "due_date": "date",
        "period_start": "date",
        "period_end": "date",
        "status": "enum(DRAFT, SENT, PAID, OVERDUE, VOID)",
        "subtotal": "decimal",
        "tax": "decimal",
        "total": "decimal",
        "amount_paid": "decimal",
        "amount_due": "decimal",
        "currency": "string",
        "payment_method": "string",
        "lines": [
          {
            "line_type": "enum(SUBSCRIPTION, ADDON, OVERAGE, CREDIT, DISCOUNT)",
            "description": "string",
            "quantity": "decimal",
            "unit_price": "decimal",
            "amount": "decimal"
          }
        ]
      }
    },

    "payment_processing": {
      "processors": ["STRIPE"],
      "methods": {
        "credit_card": {
          "brands": ["VISA", "MASTERCARD", "AMEX", "DISCOVER"],
          "stored_securely": true,
          "auto_charge": true
        },
        "ach": {
          "available_tiers": ["PROFESSIONAL", "ENTERPRISE"],
          "verification_required": true,
          "processing_days": 3
        },
        "invoice": {
          "available_tiers": ["ENTERPRISE"],
          "terms": [15, 30, 45],
          "require_po": "optional"
        },
        "wire": {
          "available_tiers": ["ENTERPRISE"],
          "for_annual_only": true
        }
      }
    }
  }
}
```

---

## 4. Branding Model

```yaml
branding_model:

  branding_config:
    schema:
      branding_id: uuid
      tenant_id: uuid
      brand_name: string
      tagline: string | null
      
      logo:
        primary_url: string
        primary_dimensions: { width: int, height: int }
        alternate_url: string | null
        favicon_url: string
        email_header_url: string | null
        print_logo_url: string | null
        
      colors:
        primary: string (hex)
        primary_dark: string (hex)
        primary_light: string (hex)
        secondary: string (hex)
        accent: string (hex)
        success: string (hex)
        warning: string (hex)
        error: string (hex)
        background: string (hex)
        surface: string (hex)
        text_primary: string (hex)
        text_secondary: string (hex)
        
      typography:
        font_family_heading: string
        font_family_body: string
        font_family_mono: string
        font_size_base: string (e.g., "14px")
        font_weight_normal: int
        font_weight_bold: int
        
      custom_css:
        enabled: boolean
        css_content: text | null
        
      contact_display:
        company_name: string
        address_line1: string
        address_line2: string | null
        phone: string
        fax: string | null
        email: string
        website: string | null
        
      legal:
        terms_url: string | null
        privacy_url: string | null
        footer_text: string | null
        copyright_text: string

  document_branding:
    templates:
      - template_type: INVOICE
        customizable_elements:
          - logo_placement: top_left | top_center | top_right
          - header_background: color
          - accent_color: color
          - footer_content: rich_text
          - custom_fields: array
          - terms_text: rich_text
          - bank_details: structured
          
      - template_type: PACKING_LIST
        customizable_elements:
          - logo_placement
          - header_background
          - include_pricing: boolean
          - include_weights: boolean
          - custom_fields: array
          - footer_notes: text
          
      - template_type: BILL_OF_LADING
        customizable_elements:
          - logo_placement
          - shipper_info_format
          - special_instructions_block
          - hazmat_section: boolean
          - signature_blocks: array
          
      - template_type: QUOTE
        customizable_elements:
          - logo_placement
          - header_style
          - terms_and_conditions: rich_text
          - validity_statement: text
          - signature_block: boolean
          
      - template_type: PURCHASE_ORDER
        customizable_elements:
          - logo_placement
          - terms_and_conditions: rich_text
          - delivery_instructions_default: text
          - approval_signatures: array
          
      - template_type: MTR
        customizable_elements:
          - logo_placement
          - certification_text: text
          - signatory_info: structured

  email_branding:
    templates:
      - template_type: TRANSACTIONAL
        elements:
          - header_logo: image
          - header_background: color
          - body_background: color
          - button_color: color
          - footer_content: rich_text
          - social_links: array
          - unsubscribe_text: text
          
      - template_type: NOTIFICATION
        elements:
          - icon_set: default | custom
          - accent_color: color
          - action_button_style: filled | outlined
          
      - template_type: MARKETING
        availability: PROFESSIONAL+
        elements:
          - full_custom_html: boolean
          - custom_template_upload: boolean

  portal_branding:
    customer_portal:
      - login_page:
          - logo: image
          - background_image: image | null
          - background_color: color
          - welcome_text: text
          - custom_footer: text
          
      - portal_header:
          - logo: image
          - navigation_style: horizontal | vertical
          - primary_color: color
          - account_menu_position: right | left
          
      - portal_dashboard:
          - welcome_message: text
          - featured_content: array | null
          - quick_actions: array
          
      - portal_footer:
          - content: rich_text
          - links: array
          - social_icons: array

  white_label:
    availability: ENTERPRISE
    features:
      - remove_steelwise_branding: boolean
      - custom_domain: string
      - custom_email_domain: string
      - custom_mobile_app_branding: boolean
      - custom_documentation: boolean
      
    custom_domain_config:
      domain: string
      ssl_certificate: automatic | custom
      dns_records:
        - type: CNAME
          name: app
          value: tenant.steelwise-edge.com
        - type: TXT
          name: _steelwise-verify
          value: verification_token
          
    email_domain_config:
      domain: string
      spf_record: required
      dkim_record: required
      dmarc_record: recommended
      sending_address: noreply@{domain}

  branding_tiers:
    STARTER:
      - logo_upload: true
      - color_customization: primary_only
      - document_logo: true
      - email_branding: basic
      - custom_css: false
      - custom_domain: false
      
    PROFESSIONAL:
      - logo_upload: true
      - color_customization: full_palette
      - document_templates: full_customization
      - email_branding: full
      - custom_css: limited
      - custom_domain: false
      - portal_branding: true
      
    ENTERPRISE:
      - logo_upload: true
      - color_customization: full_palette
      - document_templates: full_customization
      - email_branding: full
      - custom_css: full
      - custom_domain: true
      - portal_branding: true
      - white_label: true
      - custom_mobile_branding: true

  branding_api:
    endpoints:
      - GET /api/v1/branding
        returns: current branding config
        
      - PUT /api/v1/branding
        body: branding config updates
        
      - POST /api/v1/branding/logo
        body: multipart file upload
        validations:
          - max_size: 2MB
          - formats: [PNG, JPG, SVG]
          - dimensions: min 200x50, max 2000x500
          
      - POST /api/v1/branding/preview
        body: branding config
        returns: preview URLs for each element
        
      - GET /api/v1/branding/css
        returns: compiled CSS for tenant
```

---

## 5. Deployment Topologies — Diagrams (Text)

### Topology 1: Shared Multi-Tenant (Default)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              SHARED INFRASTRUCTURE                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         CDN / Edge Layer                             │    │
│  │    ┌─────────────────────────────────────────────────────────┐      │    │
│  │    │  *.steelwise.app   →   Edge Routing by Subdomain        │      │    │
│  │    │  tenant-a.steelwise.app → Tenant A                      │      │    │
│  │    │  tenant-b.steelwise.app → Tenant B                      │      │    │
│  │    │  tenant-c.steelwise.app → Tenant C                      │      │    │
│  │    └─────────────────────────────────────────────────────────┘      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                      Load Balancer (ALB)                             │    │
│  │           ┌──────────────┬──────────────┬──────────────┐            │    │
│  │           │   /api/*     │   /ws/*      │   /*         │            │    │
│  │           │   API Target │   WS Target  │   Web Target │            │    │
│  │           └──────────────┴──────────────┴──────────────┘            │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                         │
│           ┌────────────────────────┼────────────────────────┐               │
│           ▼                        ▼                        ▼               │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐         │
│  │   API Service   │    │   Web Service   │    │   WS Service    │         │
│  │   (Auto-scale)  │    │   (Auto-scale)  │    │   (Auto-scale)  │         │
│  │  ┌───────────┐  │    │  ┌───────────┐  │    │  ┌───────────┐  │         │
│  │  │ Pod │ Pod │  │    │  │ Pod │ Pod │  │    │  │ Pod │ Pod │  │         │
│  │  └───────────┘  │    │  └───────────┘  │    │  └───────────┘  │         │
│  │  3-20 replicas  │    │  2-10 replicas  │    │  2-8 replicas   │         │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘         │
│           │                        │                        │               │
│           └────────────────────────┼────────────────────────┘               │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                       Shared Data Layer                              │    │
│  │                                                                      │    │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐   │    │
│  │  │   PostgreSQL     │  │     Redis        │  │   Elasticsearch  │   │    │
│  │  │   (RDS Multi-AZ) │  │   (ElastiCache)  │  │   (OpenSearch)   │   │    │
│  │  │                  │  │                  │  │                  │   │    │
│  │  │ ┌──────────────┐ │  │ Session + Cache  │  │ Full-Text Search │   │    │
│  │  │ │ tenant_id    │ │  │ Rate Limiting    │  │ Logs & Analytics │   │    │
│  │  │ │ RLS Policies │ │  │ Pub/Sub          │  │                  │   │    │
│  │  │ └──────────────┘ │  │                  │  │                  │   │    │
│  │  └──────────────────┘  └──────────────────┘  └──────────────────┘   │    │
│  │                                                                      │    │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐   │    │
│  │  │       S3         │  │       SQS        │  │    CloudWatch    │   │    │
│  │  │  (File Storage)  │  │  (Job Queues)    │  │   (Monitoring)   │   │    │
│  │  │                  │  │                  │  │                  │   │    │
│  │  │ /tenant-a/...    │  │ tenant-prefixed  │  │ Metrics + Logs   │   │    │
│  │  │ /tenant-b/...    │  │ job routing      │  │ Alerts           │   │    │
│  │  │ /tenant-c/...    │  │                  │  │                  │   │    │
│  │  └──────────────────┘  └──────────────────┘  └──────────────────┘   │    │
│  │                                                                      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

TENANT ISOLATION: Row-Level Security (RLS)
DATABASE: Shared database, shared schema, tenant_id column on all tables
SCALE: 100-500 tenants per cluster
COST: $$$  (most economical)
USE CASE: Starter, Professional tiers
```

### Topology 2: Schema-Per-Tenant

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SCHEMA-PER-TENANT INFRASTRUCTURE                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    Shared Application Layer                          │    │
│  │         (Same as Topology 1 - API, Web, WS Services)                 │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    PostgreSQL (RDS Multi-AZ)                         │    │
│  │                                                                      │    │
│  │  ┌─────────────────────────────────────────────────────────────┐    │    │
│  │  │                    steelwise_db                              │    │    │
│  │  │                                                              │    │    │
│  │  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │    │    │
│  │  │  │  Schema:    │ │  Schema:    │ │  Schema:    │            │    │    │
│  │  │  │  tenant_a   │ │  tenant_b   │ │  tenant_c   │   ...      │    │    │
│  │  │  │             │ │             │ │             │            │    │    │
│  │  │  │ - orders    │ │ - orders    │ │ - orders    │            │    │    │
│  │  │  │ - customers │ │ - customers │ │ - customers │            │    │    │
│  │  │  │ - inventory │ │ - inventory │ │ - inventory │            │    │    │
│  │  │  │ - ...       │ │ - ...       │ │ - ...       │            │    │    │
│  │  │  └─────────────┘ └─────────────┘ └─────────────┘            │    │    │
│  │  │                                                              │    │    │
│  │  │  ┌─────────────────────────────────────────────┐            │    │    │
│  │  │  │  Schema: shared                             │            │    │    │
│  │  │  │  - grades, uoms, carriers (reference data)  │            │    │    │
│  │  │  └─────────────────────────────────────────────┘            │    │    │
│  │  │                                                              │    │    │
│  │  └─────────────────────────────────────────────────────────────┘    │    │
│  │                                                                      │    │
│  │  Connection Management:                                              │    │
│  │  - SET search_path = 'tenant_X, shared, public'                     │    │
│  │  - Connection pool per tenant (small)                               │    │
│  │  - Or connection pool with dynamic schema switching                  │    │
│  │                                                                      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  BENEFITS:                                                                   │
│  - Simpler backup/restore per tenant                                        │
│  - Easier data export for tenant offboarding                               │
│  - Logical isolation without separate instances                             │
│  - Can migrate individual tenant to dedicated DB                            │
│                                                                              │
│  DRAWBACKS:                                                                  │
│  - Schema migration complexity (N schemas to update)                        │
│  - Connection pool overhead                                                  │
│  - Cross-tenant queries require explicit schema references                  │
│                                                                              │
│  SCALE: 50-200 tenants per database instance                                │
│  COST: $$$$                                                                  │
│  USE CASE: Professional tier tenants wanting better isolation               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Topology 3: Dedicated Database (Enterprise)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    DEDICATED DATABASE INFRASTRUCTURE                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    Shared Application Layer                          │    │
│  │                                                                      │    │
│  │  ┌───────────────────────────────────────────────────────────────┐  │    │
│  │  │                  Tenant Router Service                         │  │    │
│  │  │                                                                │  │    │
│  │  │   tenant_id → database_connection_string mapping              │  │    │
│  │  │   Cached in Redis, refreshed on config change                 │  │    │
│  │  │                                                                │  │    │
│  │  └───────────────────────────────────────────────────────────────┘  │    │
│  │                           │                                         │    │
│  └───────────────────────────┼─────────────────────────────────────────┘    │
│                              │                                               │
│         ┌────────────────────┼────────────────────┐                         │
│         │                    │                    │                         │
│         ▼                    ▼                    ▼                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │   Tenant A DB   │  │   Tenant B DB   │  │   Tenant C DB   │             │
│  │   (RDS)         │  │   (RDS)         │  │   (RDS)         │             │
│  │                 │  │                 │  │                 │             │
│  │  Instance:      │  │  Instance:      │  │  Instance:      │             │
│  │  db.r5.large    │  │  db.r5.xlarge   │  │  db.r5.2xlarge  │             │
│  │                 │  │                 │  │                 │             │
│  │  Storage:       │  │  Storage:       │  │  Storage:       │             │
│  │  100 GB         │  │  500 GB         │  │  2 TB           │             │
│  │                 │  │                 │  │                 │             │
│  │  Backup:        │  │  Backup:        │  │  Backup:        │             │
│  │  Standard       │  │  Custom window  │  │  Cross-region   │             │
│  │                 │  │                 │  │                 │             │
│  │  KMS Key:       │  │  KMS Key:       │  │  KMS Key:       │             │
│  │  Tenant-A       │  │  Tenant-B       │  │  Tenant-C       │             │
│  │                 │  │                 │  │                 │             │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘             │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    Shared Services (Still Shared)                    │    │
│  │                                                                      │    │
│  │  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐            │    │
│  │  │    Redis      │  │     SQS       │  │  CloudWatch   │            │    │
│  │  │  (Clustered)  │  │  (Per-tenant  │  │               │            │    │
│  │  │               │  │   queues)     │  │               │            │    │
│  │  └───────────────┘  └───────────────┘  └───────────────┘            │    │
│  │                                                                      │    │
│  │  ┌───────────────────────────────────────────────────────────────┐  │    │
│  │  │                      S3 (Tenant Prefixes)                      │  │    │
│  │  │  s3://steelwise-files/tenant-a/  (Tenant-A KMS)               │  │    │
│  │  │  s3://steelwise-files/tenant-b/  (Tenant-B KMS)               │  │    │
│  │  │  s3://steelwise-files/tenant-c/  (Tenant-C KMS)               │  │    │
│  │  └───────────────────────────────────────────────────────────────┘  │    │
│  │                                                                      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  SCALE: 1 tenant per database instance                                       │
│  COST: $$$$$$  (passed to tenant)                                           │
│  USE CASE: Enterprise tier, compliance requirements, large data volumes     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Topology 4: Fully Dedicated (Single-Tenant)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              FULLY DEDICATED SINGLE-TENANT INFRASTRUCTURE                    │
│                     (Enterprise + Compliance Package)                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                      Tenant's AWS Account / VPC                      │    │
│  │                     (Or dedicated VPC in shared account)             │    │
│  │                                                                      │    │
│  │  ┌─────────────────────────────────────────────────────────────┐    │    │
│  │  │                     Dedicated VPC                            │    │    │
│  │  │                     10.X.0.0/16                              │    │    │
│  │  │                                                              │    │    │
│  │  │  ┌───────────────────────────────────────────────────────┐  │    │    │
│  │  │  │              Public Subnets (10.X.1.0/24)             │  │    │    │
│  │  │  │                                                       │  │    │    │
│  │  │  │  ┌─────────────┐    ┌─────────────┐                  │  │    │    │
│  │  │  │  │     ALB     │    │   NAT GW    │                  │  │    │    │
│  │  │  │  │             │    │             │                  │  │    │    │
│  │  │  │  └─────────────┘    └─────────────┘                  │  │    │    │
│  │  │  │                                                       │  │    │    │
│  │  │  └───────────────────────────────────────────────────────┘  │    │    │
│  │  │                            │                                 │    │    │
│  │  │  ┌───────────────────────────────────────────────────────┐  │    │    │
│  │  │  │            Private Subnets (10.X.2.0/24)              │  │    │    │
│  │  │  │                                                       │  │    │    │
│  │  │  │  ┌───────────────┐  ┌───────────────┐                │  │    │    │
│  │  │  │  │  EKS Cluster  │  │  EKS Cluster  │                │  │    │    │
│  │  │  │  │  (API Pods)   │  │  (Worker Pods)│                │  │    │    │
│  │  │  │  │   AZ-1        │  │    AZ-2       │                │  │    │    │
│  │  │  │  └───────────────┘  └───────────────┘                │  │    │    │
│  │  │  │                                                       │  │    │    │
│  │  │  │  ┌─────────────────────────────────────────────────┐ │  │    │    │
│  │  │  │  │               Dedicated RDS                      │ │  │    │    │
│  │  │  │  │               Multi-AZ                           │ │  │    │    │
│  │  │  │  │               db.r5.2xlarge                      │ │  │    │    │
│  │  │  │  │               Encrypted (Customer CMK)           │ │  │    │    │
│  │  │  │  └─────────────────────────────────────────────────┘ │  │    │    │
│  │  │  │                                                       │  │    │    │
│  │  │  │  ┌───────────────┐  ┌───────────────┐                │  │    │    │
│  │  │  │  │  ElastiCache  │  │ OpenSearch    │                │  │    │    │
│  │  │  │  │  (Redis)      │  │ (Logs)        │                │  │    │    │
│  │  │  │  └───────────────┘  └───────────────┘                │  │    │    │
│  │  │  │                                                       │  │    │    │
│  │  │  └───────────────────────────────────────────────────────┘  │    │    │
│  │  │                                                              │    │    │
│  │  │  ┌───────────────────────────────────────────────────────┐  │    │    │
│  │  │  │            Data Subnets (10.X.3.0/24)                 │  │    │    │
│  │  │  │                                                       │  │    │    │
│  │  │  │  ┌─────────────────────────────────────────────────┐ │  │    │    │
│  │  │  │  │                Dedicated S3                      │ │  │    │    │
│  │  │  │  │  s3://tenant-x-steelwise-files/                 │ │  │    │    │
│  │  │  │  │  VPC Endpoint (no internet transit)             │ │  │    │    │
│  │  │  │  │  Customer-managed KMS key                       │ │  │    │    │
│  │  │  │  └─────────────────────────────────────────────────┘ │  │    │    │
│  │  │  │                                                       │  │    │    │
│  │  │  └───────────────────────────────────────────────────────┘  │    │    │
│  │  │                                                              │    │    │
│  │  └─────────────────────────────────────────────────────────────┘    │    │
│  │                                                                      │    │
│  │  ┌───────────────────────────────────────────────────────────────┐  │    │
│  │  │                    VPC Peering / PrivateLink                   │  │    │
│  │  │            (To SteelWise Management Plane)                     │  │    │
│  │  │                                                                │  │    │
│  │  │  - Software updates                                           │  │    │
│  │  │  - Centralized monitoring (opt-in)                           │  │    │
│  │  │  - Support access (controlled)                                │  │    │
│  │  │                                                                │  │    │
│  │  └───────────────────────────────────────────────────────────────┘  │    │
│  │                                                                      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ISOLATION: Complete network and data isolation                              │
│  COMPLIANCE: SOC 2, HIPAA, custom compliance requirements                   │
│  SCALE: Unlimited (tenant-specific sizing)                                  │
│  COST: $$$$$$$$ (significant premium, often $10K+/month)                    │
│  USE CASE: Large enterprise, government, regulated industries              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Topology 5: Hybrid / Regional Distribution

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    HYBRID REGIONAL DEPLOYMENT                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────┐     │
│  │                      Global Traffic Management                      │     │
│  │                                                                     │     │
│  │    ┌─────────────────────────────────────────────────────────┐     │     │
│  │    │              Route 53 (Geolocation Routing)              │     │     │
│  │    │                                                          │     │     │
│  │    │  *.steelwise.app                                        │     │     │
│  │    │    │                                                     │     │     │
│  │    │    ├── US users    → us-east-1 cluster                  │     │     │
│  │    │    ├── EU users    → eu-west-1 cluster                  │     │     │
│  │    │    └── APAC users  → ap-southeast-1 cluster             │     │     │
│  │    │                                                          │     │     │
│  │    └─────────────────────────────────────────────────────────┘     │     │
│  │                                                                     │     │
│  └────────────────────────────────────────────────────────────────────┘     │
│                                                                              │
│         ┌─────────────────────────────────────────────────┐                 │
│         │                                                  │                 │
│         ▼                                                  ▼                 │
│  ┌─────────────────────────────┐        ┌─────────────────────────────┐     │
│  │      US-EAST-1 REGION       │        │      EU-WEST-1 REGION       │     │
│  │                             │        │                             │     │
│  │  ┌───────────────────────┐  │        │  ┌───────────────────────┐  │     │
│  │  │   Shared Cluster      │  │        │  │   Shared Cluster      │  │     │
│  │  │   (US Tenants)        │  │        │  │   (EU Tenants)        │  │     │
│  │  │                       │  │        │  │                       │  │     │
│  │  │  - 300 tenants        │  │        │  - 150 tenants        │  │     │
│  │  │  - RDS Multi-AZ       │  │        │  │  - RDS Multi-AZ       │  │     │
│  │  │  - S3 regional        │  │        │  │  - S3 regional        │  │     │
│  │  │                       │  │        │  │  - GDPR compliant     │  │     │
│  │  └───────────────────────┘  │        │  └───────────────────────┘  │     │
│  │                             │        │                             │     │
│  │  ┌───────────────────────┐  │        │  ┌───────────────────────┐  │     │
│  │  │  Dedicated Tenants    │  │        │  │  Dedicated Tenants    │  │     │
│  │  │                       │  │        │  │                       │  │     │
│  │  │  ┌─────┐  ┌─────┐    │  │        │  │  ┌─────┐              │  │     │
│  │  │  │ T-A │  │ T-B │    │  │        │  │  │ T-X │              │  │     │
│  │  │  └─────┘  └─────┘    │  │        │  │  └─────┘              │  │     │
│  │  │                       │  │        │  │                       │  │     │
│  │  └───────────────────────┘  │        │  └───────────────────────┘  │     │
│  │                             │        │                             │     │
│  └─────────────────────────────┘        └─────────────────────────────┘     │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    Global Management Plane                           │    │
│  │                                                                      │    │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐         │    │
│  │  │  Tenant        │  │  Billing       │  │  Monitoring    │         │    │
│  │  │  Registry      │  │  (Centralized) │  │  (Global)      │         │    │
│  │  │                │  │                │  │                │         │    │
│  │  │  tenant → region  │  │  Stripe       │  │  Datadog      │         │    │
│  │  │  mapping       │  │  integration   │  │  Centralized   │         │    │
│  │  │                │  │                │  │                │         │    │
│  │  └────────────────┘  └────────────────┘  └────────────────┘         │    │
│  │                                                                      │    │
│  │  ┌────────────────────────────────────────────────────────────────┐ │    │
│  │  │                 Cross-Region Data Sync (Optional)               │ │    │
│  │  │                                                                 │ │    │
│  │  │  - Reference data sync (grades, carriers)                      │ │    │
│  │  │  - Multi-region tenant: active-active replication              │ │    │
│  │  │  - Disaster recovery: async replication to secondary           │ │    │
│  │  │                                                                 │ │    │
│  │  └────────────────────────────────────────────────────────────────┘ │    │
│  │                                                                      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  DATA RESIDENCY: Tenant data stays in assigned region                       │
│  LATENCY: <50ms for regional users                                          │
│  COMPLIANCE: GDPR (EU), data sovereignty requirements                       │
│  COST: $$$$$ (per-region infrastructure)                                    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Topology Selection Matrix

| Factor | Shared (T1) | Schema (T2) | Dedicated DB (T3) | Single-Tenant (T4) | Regional (T5) |
|--------|:-----------:|:-----------:|:-----------------:|:------------------:|:-------------:|
| **Tier Fit** | Starter | Professional | Enterprise | Enterprise+ | Any |
| **Max Tenants/Cluster** | 500 | 200 | 50 | 1 | Per region |
| **Data Isolation** | Logical (RLS) | Logical (Schema) | Physical (DB) | Complete | Physical |
| **Performance Isolation** | None | Partial | Good | Complete | Good |
| **Backup Granularity** | Per-row export | Per-schema | Per-DB | Complete | Per-tenant |
| **Compliance Fit** | Basic | Standard | Enhanced | Maximum | Regional |
| **Monthly Cost/Tenant** | $50-100 | $100-200 | $500-1000 | $3000+ | Varies |
| **Migration Path** | → T2, T3 | → T3, T4 | → T4 | N/A | Any |
| **Provisioning Time** | Minutes | Minutes | Hours | Days | Hours |

---

*Document generated for AI-build Phase 13: Multi-Tenant Architecture*
