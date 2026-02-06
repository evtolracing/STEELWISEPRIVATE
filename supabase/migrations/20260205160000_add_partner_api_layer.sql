-- External Partner API Layer
-- Migration: Add Partner, PartnerApiKey, PartnerWebhook, WebhookDelivery, PartnerApiLog tables

-- Partner Type Enum
CREATE TYPE "PartnerType" AS ENUM ('CUSTOMER', 'SUPPLIER', 'CARRIER', 'STRATEGIC');

-- Partner Status Enum
CREATE TYPE "PartnerStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'REVOKED');

-- Partner Tier Enum
CREATE TYPE "PartnerTier" AS ENUM ('STANDARD', 'STRATEGIC', 'INTERNAL');

-- API Key Status Enum
CREATE TYPE "ApiKeyStatus" AS ENUM ('ACTIVE', 'REVOKED', 'EXPIRED');

-- Webhook Status Enum
CREATE TYPE "WebhookStatus" AS ENUM ('ACTIVE', 'PAUSED', 'DISABLED', 'FAILED');

-- Webhook Delivery Status Enum
CREATE TYPE "WebhookDeliveryStatus" AS ENUM ('PENDING', 'DELIVERED', 'FAILED', 'RETRYING');

-- Partner table
CREATE TABLE "Partner" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "partnerType" "PartnerType" NOT NULL,
    "status" "PartnerStatus" NOT NULL DEFAULT 'PENDING',
    "tier" "PartnerTier" NOT NULL DEFAULT 'STANDARD',
    "contactName" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "ipAllowList" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sandboxEnabled" BOOLEAN NOT NULL DEFAULT true,
    "productionEnabled" BOOLEAN NOT NULL DEFAULT false,
    "rateLimitPerMin" INTEGER,
    "rateLimitPerHour" INTEGER,
    "burstLimit" INTEGER,
    "notes" TEXT,
    "onboardedAt" TIMESTAMP(3),
    "lastActiveAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Partner_pkey" PRIMARY KEY ("id")
);

-- PartnerApiKey table
CREATE TABLE "PartnerApiKey" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "keyName" TEXT NOT NULL,
    "clientSecret" TEXT NOT NULL,
    "scopes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "ApiKeyStatus" NOT NULL DEFAULT 'ACTIVE',
    "environment" TEXT NOT NULL DEFAULT 'sandbox',
    "expiresAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "revokedBy" TEXT,
    "revokeReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnerApiKey_pkey" PRIMARY KEY ("id")
);

-- PartnerWebhook table
CREATE TABLE "PartnerWebhook" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "events" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "WebhookStatus" NOT NULL DEFAULT 'ACTIVE',
    "consecutiveFailures" INTEGER NOT NULL DEFAULT 0,
    "lastDeliveredAt" TIMESTAMP(3),
    "lastFailedAt" TIMESTAMP(3),
    "disabledAt" TIMESTAMP(3),
    "disableReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnerWebhook_pkey" PRIMARY KEY ("id")
);

-- WebhookDelivery table
CREATE TABLE "WebhookDelivery" (
    "id" TEXT NOT NULL,
    "webhookId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "WebhookDeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "httpStatus" INTEGER,
    "responseBody" TEXT,
    "responseTimeMs" INTEGER,
    "errorMessage" TEXT,
    "nextRetryAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookDelivery_pkey" PRIMARY KEY ("id")
);

-- PartnerApiLog table
CREATE TABLE "PartnerApiLog" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "apiKeyId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "requestBody" JSONB,
    "responseTimeMs" INTEGER,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "resourceType" TEXT,
    "resourceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PartnerApiLog_pkey" PRIMARY KEY ("id")
);

-- Unique constraints
CREATE UNIQUE INDEX "Partner_organizationId_partnerType_key" ON "Partner"("organizationId", "partnerType");

-- Indexes for Partner
CREATE INDEX "Partner_partnerType_idx" ON "Partner"("partnerType");
CREATE INDEX "Partner_status_idx" ON "Partner"("status");
CREATE INDEX "Partner_tier_idx" ON "Partner"("tier");

-- Indexes for PartnerApiKey
CREATE INDEX "PartnerApiKey_partnerId_idx" ON "PartnerApiKey"("partnerId");
CREATE INDEX "PartnerApiKey_status_idx" ON "PartnerApiKey"("status");
CREATE INDEX "PartnerApiKey_environment_idx" ON "PartnerApiKey"("environment");

-- Indexes for PartnerWebhook
CREATE INDEX "PartnerWebhook_partnerId_idx" ON "PartnerWebhook"("partnerId");
CREATE INDEX "PartnerWebhook_status_idx" ON "PartnerWebhook"("status");

-- Indexes for WebhookDelivery
CREATE INDEX "WebhookDelivery_webhookId_idx" ON "WebhookDelivery"("webhookId");
CREATE INDEX "WebhookDelivery_eventId_idx" ON "WebhookDelivery"("eventId");
CREATE INDEX "WebhookDelivery_status_idx" ON "WebhookDelivery"("status");
CREATE INDEX "WebhookDelivery_nextRetryAt_idx" ON "WebhookDelivery"("nextRetryAt");

-- Indexes for PartnerApiLog
CREATE INDEX "PartnerApiLog_partnerId_idx" ON "PartnerApiLog"("partnerId");
CREATE INDEX "PartnerApiLog_endpoint_idx" ON "PartnerApiLog"("endpoint");
CREATE INDEX "PartnerApiLog_statusCode_idx" ON "PartnerApiLog"("statusCode");
CREATE INDEX "PartnerApiLog_createdAt_idx" ON "PartnerApiLog"("createdAt");
CREATE INDEX "PartnerApiLog_apiKeyId_idx" ON "PartnerApiLog"("apiKeyId");

-- Foreign Keys
ALTER TABLE "Partner" ADD CONSTRAINT "Partner_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PartnerApiKey" ADD CONSTRAINT "PartnerApiKey_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PartnerWebhook" ADD CONSTRAINT "PartnerWebhook_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WebhookDelivery" ADD CONSTRAINT "WebhookDelivery_webhookId_fkey" FOREIGN KEY ("webhookId") REFERENCES "PartnerWebhook"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PartnerApiLog" ADD CONSTRAINT "PartnerApiLog_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
