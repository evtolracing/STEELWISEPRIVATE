-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'ESCALATED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DecisionType" AS ENUM ('APPROVE', 'REJECT', 'ESCALATE');

-- CreateEnum
CREATE TYPE "OperatorStatus" AS ENUM ('ACTIVE', 'ON_LEAVE', 'SUSPENDED', 'TERMINATED', 'TRAINING');

-- CreateEnum
CREATE TYPE "SkillLevel" AS ENUM ('NOVICE', 'STANDARD', 'ADVANCED', 'EXPERT');

-- CreateEnum
CREATE TYPE "ShiftType" AS ENUM ('DAY', 'NIGHT', 'SWING', 'SPLIT', 'OVERTIME');

-- CreateEnum
CREATE TYPE "ShiftStatus" AS ENUM ('SCHEDULED', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "OrgType" AS ENUM ('MILL', 'SERVICE_CENTER', 'DISTRIBUTOR', 'BROKER', 'FABRICATOR', 'OEM');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'TENANT_OWNER', 'EXECUTIVE', 'CFO', 'COO', 'CIO', 'DIVISION_DIRECTOR', 'BRANCH_MANAGER', 'SALES_DIRECTOR', 'SALES_REP', 'CSR', 'ESTIMATOR', 'CREDIT_MANAGER', 'OPS_MANAGER', 'PRODUCTION_MANAGER', 'SCHEDULER', 'INVENTORY_MANAGER', 'BUYER', 'WORKCENTER_LEAD', 'OPERATOR_SAW', 'OPERATOR_ROUTER', 'OPERATOR_SHEAR', 'OPERATOR_PLASMA', 'OPERATOR_GENERAL', 'MATERIAL_HANDLER', 'RECEIVING_CLERK', 'SHIPPING_COORDINATOR', 'PACKAGING_LEAD', 'QC_MANAGER', 'QC_INSPECTOR', 'MAINTENANCE_MANAGER', 'INTEGRATION_ADMIN', 'DATA_ANALYST', 'SUPPORT_AGENT', 'AUDITOR', 'CUSTOMER_ADMIN', 'CUSTOMER_BUYER', 'CUSTOMER_VIEWER', 'SUPPLIER_USER', 'CARRIER_USER', 'ADMIN', 'MILL_OPERATOR', 'SERVICE_CENTER', 'SALES', 'QUALITY', 'LOGISTICS', 'FINANCE', 'VIEWER');

-- CreateEnum
CREATE TYPE "GradeFamily" AS ENUM ('CARBON', 'ALLOY', 'STAINLESS', 'TOOL', 'HSLA');

-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('FLAT', 'LONG', 'TUBE', 'STRUCTURAL');

-- CreateEnum
CREATE TYPE "ProductForm" AS ENUM ('COIL', 'SHEET', 'PLATE', 'BAR', 'TUBE', 'BEAM', 'REBAR', 'WIRE');

-- CreateEnum
CREATE TYPE "PriceUnit" AS ENUM ('CWT', 'LB', 'TON', 'EACH', 'LF');

-- CreateEnum
CREATE TYPE "MeltType" AS ENUM ('BOF', 'EAF', 'AOD');

-- CreateEnum
CREATE TYPE "CastType" AS ENUM ('CONTINUOUS', 'INGOT');

-- CreateEnum
CREATE TYPE "HeatStatus" AS ENUM ('ACTIVE', 'CONSUMED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "EdgeCondition" AS ENUM ('MILL', 'SLIT', 'TRIMMED');

-- CreateEnum
CREATE TYPE "CoilStatus" AS ENUM ('AVAILABLE', 'ALLOCATED', 'IN_PROCESS', 'HOLD', 'SHIPPED', 'CONSUMED');

-- CreateEnum
CREATE TYPE "QCStatus" AS ENUM ('PENDING', 'PASSED', 'FAILED', 'HOLD');

-- CreateEnum
CREATE TYPE "LocationType" AS ENUM ('WAREHOUSE', 'YARD', 'RACK', 'BIN', 'FLOOR');

-- CreateEnum
CREATE TYPE "MovementType" AS ENUM ('RECEIVE', 'SHIP', 'TRANSFER', 'ADJUST', 'PROCESS', 'CONSUME', 'SCRAP', 'COUNT');

-- CreateEnum
CREATE TYPE "TestType" AS ENUM ('CHEMISTRY', 'MECHANICAL', 'DIMENSIONAL', 'SURFACE', 'COATING', 'OTHER');

-- CreateEnum
CREATE TYPE "PassFail" AS ENUM ('PASS', 'FAIL', 'CONDITIONAL');

-- CreateEnum
CREATE TYPE "HoldType" AS ENUM ('QUALITY', 'CUSTOMER', 'PENDING_TEST', 'DAMAGE', 'DISPUTE', 'OTHER');

-- CreateEnum
CREATE TYPE "HoldStatus" AS ENUM ('ACTIVE', 'RELEASED', 'SCRAPPED', 'RETURNED');

-- CreateEnum
CREATE TYPE "Disposition" AS ENUM ('USE_AS_IS', 'REWORK', 'SCRAP', 'RETURN', 'SELL_SECONDARY', 'PENDING');

-- CreateEnum
CREATE TYPE "RFQStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'IN_REVIEW', 'QUOTED', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'SENT', 'COUNTERED', 'ACCEPTED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('ORDERED', 'SCHEDULED', 'IN_PROCESS', 'WAITING_QC', 'PACKAGING', 'READY_TO_SHIP', 'SHIPPED', 'COMPLETED', 'CANCELLED', 'ON_HOLD');

-- CreateEnum
CREATE TYPE "OrderType" AS ENUM ('RFQ', 'QUOTE', 'SO', 'PO', 'RETURN');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('DRAFT', 'PENDING', 'CONFIRMED', 'PARTIAL', 'COMPLETE', 'CANCELLED', 'HOLD');

-- CreateEnum
CREATE TYPE "FreightTerms" AS ENUM ('PREPAID', 'COLLECT', 'THIRD_PARTY');

-- CreateEnum
CREATE TYPE "LineStatus" AS ENUM ('OPEN', 'PARTIAL', 'COMPLETE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "WOType" AS ENUM ('SLIT', 'CTL', 'BLANK', 'LEVELCUT', 'MULTIBLANKING', 'SHEAR');

-- CreateEnum
CREATE TYPE "WOStatus" AS ENUM ('DRAFT', 'READY', 'IN_PROGRESS', 'QC_HOLD', 'COMPLETE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ShipmentStatus" AS ENUM ('PENDING', 'LOADING', 'IN_TRANSIT', 'DELIVERED', 'EXCEPTION', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'SENT', 'PARTIAL', 'PAID', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('MTR', 'CERT', 'BOL', 'POD', 'INVOICE', 'SPEC', 'COA', 'MSDS', 'DRAWING', 'OTHER');

-- CreateEnum
CREATE TYPE "BomRecipeStatus" AS ENUM ('DRAFT', 'REVIEW', 'ACTIVE', 'DEPRECATED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('IN_SERVICE', 'OUT_OF_SERVICE', 'MAINTENANCE', 'SAFETY_HOLD', 'QUALITY_HOLD', 'PENDING_RETURN', 'DECOMMISSIONED');

-- CreateEnum
CREATE TYPE "AssetCriticality" AS ENUM ('A', 'B', 'C');

-- CreateEnum
CREATE TYPE "ComponentStatus" AS ENUM ('ACTIVE', 'WORN', 'FAILED', 'REPLACED');

-- CreateEnum
CREATE TYPE "MeterType" AS ENUM ('HOURS', 'CYCLES', 'MILES', 'UNITS_PRODUCED');

-- CreateEnum
CREATE TYPE "MaintenanceOrderType" AS ENUM ('PM', 'CORRECTIVE', 'BREAKDOWN', 'INSPECTION', 'CALIBRATION', 'MODIFICATION', 'SAFETY_RELATED', 'QUALITY_RELATED');

-- CreateEnum
CREATE TYPE "MaintenancePriority" AS ENUM ('EMERGENCY', 'HIGH', 'NORMAL', 'LOW', 'SCHEDULED');

-- CreateEnum
CREATE TYPE "MaintenanceOrderStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SCHEDULED', 'WAITING_PARTS', 'IN_PROGRESS', 'COMPLETED', 'VERIFIED', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "AttachmentType" AS ENUM ('PHOTO_BEFORE', 'PHOTO_AFTER', 'CHECKLIST', 'PERMIT', 'DOCUMENT', 'TEST_RESULT', 'SIGNATURE', 'OTHER');

-- CreateEnum
CREATE TYPE "PMIntervalType" AS ENUM ('TIME_BASED', 'METER_BASED', 'CONDITION_BASED', 'HYBRID');

-- CreateEnum
CREATE TYPE "PMScheduleStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OverdueAction" AS ENUM ('ALERT', 'ESCALATE', 'BLOCK');

-- CreateEnum
CREATE TYPE "PMComplianceStatus" AS ENUM ('CURRENT', 'DUE_SOON', 'OVERDUE', 'SEVERELY_OVERDUE');

-- CreateEnum
CREATE TYPE "DowntimeType" AS ENUM ('BREAKDOWN', 'PLANNED_MAINTENANCE', 'CORRECTIVE', 'SETUP_CHANGEOVER', 'QUALITY_HOLD', 'SAFETY_HOLD', 'NO_WORK', 'OTHER');

-- CreateEnum
CREATE TYPE "PartTransactionType" AS ENUM ('RECEIVE', 'ISSUE', 'RETURN', 'ADJUST', 'TRANSFER', 'SCRAP');

-- CreateEnum
CREATE TYPE "RFQSourceType" AS ENUM ('EMAIL', 'PHONE', 'PORTAL', 'EDI', 'MANUAL', 'ECOMMERCE');

-- CreateEnum
CREATE TYPE "DropTagStatus" AS ENUM ('DRAFT', 'READY_TO_PRINT', 'PRINTED', 'APPLIED', 'SEALED', 'STAGED', 'LOADED', 'SHIPPED', 'DELIVERED', 'VOID');

-- CreateEnum
CREATE TYPE "DropTagListingStatus" AS ENUM ('DRAFT', 'READY', 'PRINTED', 'LOADED', 'DEPARTED', 'DELIVERED', 'CLOSED');

-- CreateEnum
CREATE TYPE "PackageStatus" AS ENUM ('OPEN', 'PACKING', 'READY_FOR_QC', 'QC_RELEASED', 'QC_HOLD', 'SEALED', 'STAGED', 'LOADED', 'SHIPPED', 'DELIVERED');

-- CreateEnum
CREATE TYPE "PackageQCStatus" AS ENUM ('PENDING', 'RELEASED', 'CONDITIONAL', 'HOLD', 'REJECTED');

-- CreateEnum
CREATE TYPE "IdentifierType" AS ENUM ('BARCODE', 'QR', 'RFID', 'ETCH', 'DATAMATRIX');

-- CreateEnum
CREATE TYPE "PartnerType" AS ENUM ('CUSTOMER', 'SUPPLIER', 'CARRIER', 'STRATEGIC');

-- CreateEnum
CREATE TYPE "PartnerStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'REVOKED');

-- CreateEnum
CREATE TYPE "PartnerTier" AS ENUM ('STANDARD', 'STRATEGIC', 'INTERNAL');

-- CreateEnum
CREATE TYPE "ApiKeyStatus" AS ENUM ('ACTIVE', 'REVOKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "WebhookStatus" AS ENUM ('ACTIVE', 'PAUSED', 'DISABLED', 'FAILED');

-- CreateEnum
CREATE TYPE "WebhookDeliveryStatus" AS ENUM ('PENDING', 'DELIVERED', 'FAILED', 'RETRYING');

-- CreateEnum
CREATE TYPE "PolicyStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'PUBLISHED', 'SUPERSEDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PolicyType" AS ENUM ('SAFETY_PROGRAM', 'LOTO_PROGRAM', 'HOT_WORK', 'ELECTRICAL_SAFETY', 'CONFINED_SPACE', 'CHEMICAL_SAFETY', 'EMERGENCY_RESPONSE', 'PPE_POLICY', 'GENERAL_SAFETY', 'CONTRACTOR_SAFETY', 'ENVIRONMENTAL', 'OTHER');

-- CreateEnum
CREATE TYPE "TrainingCategory" AS ENUM ('ONBOARDING', 'LOTO', 'FORKLIFT', 'CRANE_RIGGING', 'HOT_WORK', 'ELECTRICAL', 'CONFINED_SPACE', 'CHEMICAL_HAZMAT', 'PPE', 'ERGONOMICS', 'FALL_PROTECTION', 'MACHINE_GUARDING', 'EMERGENCY_RESPONSE', 'FIRST_AID', 'SUPERVISOR', 'ANNUAL_REFRESHER', 'OTHER');

-- CreateEnum
CREATE TYPE "TrainingDeliveryMethod" AS ENUM ('IN_PERSON', 'VIRTUAL_LIVE', 'E_LEARNING', 'ON_THE_JOB', 'BLENDED', 'SELF_STUDY', 'EXTERNAL');

-- CreateEnum
CREATE TYPE "TrainingAssignmentStatus" AS ENUM ('ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE', 'ESCALATED', 'WAIVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "IncidentType" AS ENUM ('INJURY', 'ILLNESS', 'NEAR_MISS', 'PROPERTY_DAMAGE', 'ENVIRONMENTAL', 'VEHICLE', 'SECURITY', 'FIRE', 'OTHER');

-- CreateEnum
CREATE TYPE "IncidentSeverity" AS ENUM ('NEAR_MISS', 'FIRST_AID', 'MINOR', 'MODERATE', 'SERIOUS', 'SEVERE', 'FATALITY');

-- CreateEnum
CREATE TYPE "IncidentStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'TRIAGED', 'INVESTIGATING', 'CAPA_ASSIGNED', 'VERIFICATION', 'CLOSED', 'REOPENED');

-- CreateEnum
CREATE TYPE "OshaClassification" AS ENUM ('NOT_RECORDABLE', 'RECORDABLE_OTHER', 'RECORDABLE_RESTRICTED', 'RECORDABLE_DAW', 'FATALITY');

-- CreateEnum
CREATE TYPE "AffectedPersonType" AS ENUM ('EMPLOYEE', 'CONTRACTOR', 'VISITOR', 'CUSTOMER', 'OTHER');

-- CreateEnum
CREATE TYPE "CapaStatus" AS ENUM ('DRAFT', 'ASSIGNED', 'IN_PROGRESS', 'PENDING_VERIFICATION', 'VERIFIED', 'CLOSED', 'OVERDUE', 'ESCALATED');

-- CreateEnum
CREATE TYPE "CapaType" AS ENUM ('CORRECTIVE', 'PREVENTIVE');

-- CreateEnum
CREATE TYPE "CapaSourceType" AS ENUM ('INCIDENT', 'INSPECTION', 'AUDIT', 'OBSERVATION', 'MANAGEMENT_REVIEW', 'REGULATORY', 'OTHER');

-- CreateEnum
CREATE TYPE "CapaPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "VerificationResult" AS ENUM ('EFFECTIVE', 'PARTIALLY_EFFECTIVE', 'NOT_EFFECTIVE', 'NOT_VERIFIED');

-- CreateEnum
CREATE TYPE "InspectionType" AS ENUM ('FORKLIFT_DAILY', 'FORKLIFT_MONTHLY', 'CRANE_DAILY', 'CRANE_MONTHLY', 'CRANE_ANNUAL', 'FIRE_EXTINGUISHER', 'EYEWASH_SHOWER', 'GUARD_CHECK', 'HOUSEKEEPING', 'PPE_STATION', 'FIRST_AID', 'AED', 'GENERAL_AREA', 'ELECTRICAL_EQUIPMENT', 'LADDER', 'DOCK_LEVELER', 'OTHER');

-- CreateEnum
CREATE TYPE "InspectionStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'PENDING_REVIEW', 'COMPLETED', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DefectSeverity" AS ENUM ('MINOR', 'MODERATE', 'MAJOR', 'CRITICAL');

-- CreateEnum
CREATE TYPE "DefectStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'DEFERRED');

-- CreateEnum
CREATE TYPE "PermitType" AS ENUM ('LOTO', 'HOT_WORK', 'ELECTRICAL', 'CONFINED_SPACE', 'EXCAVATION', 'ELEVATED_WORK', 'CRANE_LIFT', 'OTHER');

-- CreateEnum
CREATE TYPE "PermitStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'ACTIVE', 'SUSPENDED', 'COMPLETED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ElectricalWorkType" AS ENUM ('DE_ENERGIZED', 'ENERGIZED');

-- CreateEnum
CREATE TYPE "ConfinedSpaceType" AS ENUM ('PERMIT_REQUIRED', 'NON_PERMIT');

-- CreateEnum
CREATE TYPE "StopWorkStatus" AS ENUM ('ISSUED', 'ACKNOWLEDGED', 'MITIGATION', 'RESUME_AUTHORIZED', 'CLOSED');

-- CreateEnum
CREATE TYPE "SafetyObservationType" AS ENUM ('SAFE_BEHAVIOR', 'AT_RISK_BEHAVIOR', 'HAZARD', 'POSITIVE_RECOGNITION');

-- CreateEnum
CREATE TYPE "ObservationCategory" AS ENUM ('PPE', 'BODY_MECHANICS', 'HOUSEKEEPING', 'TOOLS_EQUIPMENT', 'PROCEDURE_COMPLIANCE', 'COMMUNICATION', 'LINE_OF_FIRE', 'EYES_ON_TASK', 'OTHER');

-- CreateEnum
CREATE TYPE "EquipmentSafetyStatus" AS ENUM ('SAFE', 'REQUIRES_INSPECTION', 'DEFECT_REPORTED', 'OUT_OF_SERVICE_SAFETY', 'LOCKED_OUT');

-- CreateEnum
CREATE TYPE "AuditType" AS ENUM ('INTERNAL', 'EXTERNAL', 'REGULATORY', 'INSURANCE', 'CORPORATE');

-- CreateEnum
CREATE TYPE "AuditStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AuditFindingSeverity" AS ENUM ('OBSERVATION', 'MINOR', 'MAJOR', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AuditFindingStatus" AS ENUM ('OPEN', 'CAPA_ASSIGNED', 'CLOSED');

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "OrgType" NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postalCode" TEXT,
    "country" TEXT NOT NULL DEFAULT 'USA',
    "phone" TEXT,
    "email" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerPreference" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "preferredBranch" TEXT,
    "preferredShipMethod" TEXT,
    "defaultDivision" TEXT,
    "preferredCarrier" TEXT,
    "freightTerms" TEXT,
    "deliveryWindow" TEXT,
    "shipToAddress" JSONB,
    "defaultPriority" TEXT NOT NULL DEFAULT 'STANDARD',
    "rushDefault" BOOLEAN NOT NULL DEFAULT false,
    "defaultOwnership" TEXT NOT NULL DEFAULT 'HOUSE',
    "requirePONumber" BOOLEAN NOT NULL DEFAULT false,
    "autoApplyContract" BOOLEAN NOT NULL DEFAULT true,
    "autoApproveOrders" BOOLEAN NOT NULL DEFAULT false,
    "minOrderQty" DECIMAL(65,30),
    "minOrderValue" DECIMAL(65,30),
    "pricingTier" TEXT,
    "discountPct" DECIMAL(65,30),
    "fuelSurchargeExempt" BOOLEAN NOT NULL DEFAULT false,
    "paymentTerms" TEXT,
    "creditLimit" DECIMAL(65,30),
    "contractNotes" TEXT,
    "tolerancePreset" TEXT NOT NULL DEFAULT 'STANDARD',
    "thkTolerancePlus" DECIMAL(65,30) NOT NULL DEFAULT 0.010,
    "thkToleranceMinus" DECIMAL(65,30) NOT NULL DEFAULT 0.010,
    "lenTolerancePlus" DECIMAL(65,30) NOT NULL DEFAULT 0.125,
    "lenToleranceMinus" DECIMAL(65,30) NOT NULL DEFAULT 0.000,
    "widTolerancePlus" DECIMAL(65,30) NOT NULL DEFAULT 0.063,
    "widToleranceMinus" DECIMAL(65,30) NOT NULL DEFAULT 0.031,
    "approvedGrades" JSONB,
    "surfaceFinish" TEXT,
    "specialSpecs" TEXT,
    "certRequirements" JSONB,
    "autoSendMTR" BOOLEAN NOT NULL DEFAULT false,
    "autoSendInvoice" BOOLEAN NOT NULL DEFAULT false,
    "mtrEmail" TEXT,
    "invoiceEmail" TEXT,
    "bundleMaxWeight" DECIMAL(65,30),
    "bundleMaxPieces" INTEGER,
    "packagingType" TEXT,
    "labelTemplate" TEXT,
    "packagingNotes" TEXT,
    "specialInstructions" TEXT,
    "internalNotes" TEXT,
    "updatedBy" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "organizationId" TEXT NOT NULL,
    "homeLocationId" TEXT,
    "title" TEXT,
    "phone" TEXT,
    "avatarUrl" TEXT,
    "lastLoginAt" TIMESTAMP(3),
    "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "permissions" JSONB NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRoleAssignment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "grantedBy" TEXT,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "UserRoleAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserLocation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserDivision" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "divisionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserDivision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Division" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Division_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalRequest" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "requestType" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "requestData" JSONB NOT NULL,
    "justification" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApprovalRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalDecision" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "deciderId" TEXT NOT NULL,
    "decision" "DecisionType" NOT NULL,
    "comments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApprovalDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "category" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'INFO',
    "userId" TEXT,
    "targetUserId" TEXT,
    "resourceType" TEXT,
    "resourceId" TEXT,
    "action" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "sessionId" TEXT,
    "correlationId" TEXT,
    "requestPath" TEXT,
    "requestMethod" TEXT,
    "responseCode" INTEGER,
    "durationMs" INTEGER,
    "details" JSONB,
    "fieldChanges" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Grade" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "family" "GradeFamily" NOT NULL,
    "specStandard" TEXT,
    "chemistryMin" JSONB,
    "chemistryMax" JSONB,
    "tensileMin" DECIMAL(65,30),
    "tensileMax" DECIMAL(65,30),
    "yieldMin" DECIMAL(65,30),
    "yieldMax" DECIMAL(65,30),
    "elongationMin" DECIMAL(65,30),
    "hardnessMin" DECIMAL(65,30),
    "hardnessMax" DECIMAL(65,30),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Grade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "productType" "ProductType" NOT NULL,
    "form" "ProductForm" NOT NULL,
    "gradeId" TEXT,
    "specStandard" TEXT,
    "thicknessMin" DECIMAL(65,30),
    "thicknessMax" DECIMAL(65,30),
    "widthMin" DECIMAL(65,30),
    "widthMax" DECIMAL(65,30),
    "basePriceCwt" DECIMAL(65,30),
    "priceUnit" "PriceUnit" NOT NULL DEFAULT 'CWT',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Heat" (
    "id" TEXT NOT NULL,
    "heatNumber" TEXT NOT NULL,
    "millId" TEXT NOT NULL,
    "gradeId" TEXT NOT NULL,
    "castDate" TIMESTAMP(3) NOT NULL,
    "meltType" "MeltType",
    "castType" "CastType",
    "chemistry" JSONB,
    "mechanicalProps" JSONB,
    "totalWeightLb" DECIMAL(65,30),
    "status" "HeatStatus" NOT NULL DEFAULT 'ACTIVE',
    "mtrDocumentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Heat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Coil" (
    "id" TEXT NOT NULL,
    "coilNumber" TEXT NOT NULL,
    "heatId" TEXT NOT NULL,
    "parentCoilId" TEXT,
    "productId" TEXT,
    "gradeId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "form" "ProductForm" NOT NULL,
    "thicknessIn" DECIMAL(65,30),
    "widthIn" DECIMAL(65,30),
    "lengthIn" DECIMAL(65,30),
    "odIn" DECIMAL(65,30),
    "idIn" DECIMAL(65,30),
    "gauge" INTEGER,
    "grossWeightLb" DECIMAL(65,30) NOT NULL,
    "netWeightLb" DECIMAL(65,30) NOT NULL,
    "temper" TEXT,
    "finish" TEXT,
    "coating" TEXT,
    "coatingWeight" TEXT,
    "edgeCondition" "EdgeCondition",
    "status" "CoilStatus" NOT NULL DEFAULT 'AVAILABLE',
    "qcStatus" "QCStatus" NOT NULL DEFAULT 'PENDING',
    "holdCode" TEXT,
    "locationId" TEXT,
    "binLocation" TEXT,
    "unitCost" DECIMAL(65,30),
    "landedCost" DECIMAL(65,30),
    "originOrderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Coil_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "LocationType" NOT NULL,
    "parentId" TEXT,
    "ownerId" TEXT NOT NULL,
    "addressLine1" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postalCode" TEXT,
    "country" TEXT,
    "lat" DECIMAL(65,30),
    "lng" DECIMAL(65,30),
    "maxWeightLb" DECIMAL(65,30),
    "isOutdoor" BOOLEAN NOT NULL DEFAULT false,
    "hasCrane" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inventory" (
    "id" TEXT NOT NULL,
    "coilId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "qtyOnHand" DECIMAL(65,30) NOT NULL,
    "qtyAvailable" DECIMAL(65,30) NOT NULL,
    "qtyAllocated" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "qtyOnHold" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL DEFAULT 'LB',
    "unitCost" DECIMAL(65,30),
    "landedCost" DECIMAL(65,30),
    "avgCost" DECIMAL(65,30),
    "lastCountDate" TIMESTAMP(3),
    "lastMovement" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialMovement" (
    "id" TEXT NOT NULL,
    "coilId" TEXT NOT NULL,
    "movementType" "MovementType" NOT NULL,
    "fromLocationId" TEXT,
    "toLocationId" TEXT,
    "qtyMoved" DECIMAL(65,30) NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'LB',
    "orderId" TEXT,
    "workOrderId" TEXT,
    "shipmentId" TEXT,
    "reasonCode" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "MaterialMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestResult" (
    "id" TEXT NOT NULL,
    "coilId" TEXT,
    "heatId" TEXT NOT NULL,
    "testType" "TestType" NOT NULL,
    "testDate" TIMESTAMP(3) NOT NULL,
    "results" JSONB NOT NULL,
    "specLimits" JSONB,
    "passFail" "PassFail" NOT NULL,
    "equipmentId" TEXT,
    "labId" TEXT,
    "testedById" TEXT NOT NULL,
    "approvedById" TEXT,
    "certNumber" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TestResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QCHold" (
    "id" TEXT NOT NULL,
    "coilId" TEXT NOT NULL,
    "holdType" "HoldType" NOT NULL,
    "holdReason" TEXT NOT NULL,
    "holdDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "holdById" TEXT NOT NULL,
    "status" "HoldStatus" NOT NULL DEFAULT 'ACTIVE',
    "disposition" "Disposition",
    "resolvedDate" TIMESTAMP(3),
    "resolvedById" TEXT,
    "resolutionNotes" TEXT,
    "ncrId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QCHold_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RFQ" (
    "id" TEXT NOT NULL,
    "rfqNumber" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "status" "RFQStatus" NOT NULL DEFAULT 'DRAFT',
    "contactName" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "requestedDate" TIMESTAMP(3),
    "notes" TEXT,
    "submittedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RFQ_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RFQLine" (
    "id" TEXT NOT NULL,
    "rfqId" TEXT NOT NULL,
    "lineNumber" INTEGER NOT NULL,
    "materialCode" TEXT,
    "division" TEXT,
    "productId" TEXT,
    "description" TEXT,
    "requestedQty" DECIMAL(65,30) NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'LB',
    "specifications" JSONB,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RFQLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quote" (
    "id" TEXT NOT NULL,
    "quoteNumber" TEXT NOT NULL,
    "rfqId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "QuoteStatus" NOT NULL DEFAULT 'DRAFT',
    "subtotal" DECIMAL(65,30),
    "taxAmount" DECIMAL(65,30),
    "freightAmount" DECIMAL(65,30),
    "totalAmount" DECIMAL(65,30),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3),
    "paymentTerms" TEXT,
    "freightTerms" TEXT,
    "notes" TEXT,
    "internalNotes" TEXT,
    "createdById" TEXT,
    "sentAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "convertedOrderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteLine" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "rfqLineId" TEXT,
    "lineNumber" INTEGER NOT NULL,
    "productId" TEXT,
    "description" TEXT,
    "quantity" DECIMAL(65,30) NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'LB',
    "unitPrice" DECIMAL(65,30),
    "priceUnit" TEXT NOT NULL DEFAULT 'CWT',
    "extendedPrice" DECIMAL(65,30),
    "leadTimeDays" INTEGER,
    "notes" TEXT,
    "thicknessIn" DECIMAL(65,30),
    "widthIn" DECIMAL(65,30),
    "lengthIn" DECIMAL(65,30),
    "gradeOverride" TEXT,
    "surfaceFinish" TEXT,
    "tolerancePreset" TEXT,
    "thkTolerancePlus" DECIMAL(65,30),
    "thkToleranceMinus" DECIMAL(65,30),
    "lenTolerancePlus" DECIMAL(65,30),
    "lenToleranceMinus" DECIMAL(65,30),
    "widTolerancePlus" DECIMAL(65,30),
    "widToleranceMinus" DECIMAL(65,30),
    "certRequirements" JSONB,
    "specNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuoteLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Operator" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "employeeCode" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "homeLocationId" TEXT,
    "homeWorkCenterId" TEXT,
    "hireDate" TIMESTAMP(3),
    "status" "OperatorStatus" NOT NULL DEFAULT 'ACTIVE',
    "maxThicknessInches" DECIMAL(65,30),
    "hourlyRate" DECIMAL(65,30),
    "overtimeMultiplier" DECIMAL(65,30) DEFAULT 1.5,
    "notes" TEXT,
    "avatarUrl" TEXT,
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Operator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OperatorSkill" (
    "id" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "workCenterTypeId" TEXT NOT NULL,
    "skillLevel" "SkillLevel" NOT NULL DEFAULT 'STANDARD',
    "certifiedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "certificationRef" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OperatorSkill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shift" (
    "id" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "locationId" TEXT,
    "workCenterId" TEXT,
    "shiftDate" TIMESTAMP(3) NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "shiftType" "ShiftType" NOT NULL DEFAULT 'DAY',
    "breakMinutes" INTEGER NOT NULL DEFAULT 30,
    "status" "ShiftStatus" NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DispatchJob" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "jobNumber" TEXT NOT NULL,
    "orderId" TEXT,
    "materialCode" TEXT,
    "commodity" TEXT NOT NULL DEFAULT 'METALS',
    "form" TEXT NOT NULL DEFAULT 'PLATE',
    "grade" TEXT,
    "thickness" DECIMAL(65,30) NOT NULL DEFAULT 0.5,
    "division" TEXT NOT NULL DEFAULT 'METALS',
    "locationId" TEXT NOT NULL DEFAULT 'FWA',
    "dueDate" TIMESTAMP(3),
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "customerName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DispatchJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DispatchOperation" (
    "id" TEXT NOT NULL,
    "dispatchJobId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "requiredWorkCenterType" TEXT NOT NULL,
    "requiredDivision" TEXT NOT NULL DEFAULT 'METALS',
    "requiredSkillLevel" TEXT NOT NULL DEFAULT 'STANDARD',
    "specialization" TEXT,
    "thickness" DECIMAL(65,30) NOT NULL DEFAULT 0.5,
    "materialCode" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "assignedWorkCenterId" TEXT,
    "assignedOperatorId" TEXT,
    "scheduledStart" TIMESTAMP(3),
    "scheduledEnd" TIMESTAMP(3),
    "actualStart" TIMESTAMP(3),
    "actualEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DispatchOperation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DispatchTimeLog" (
    "id" TEXT NOT NULL,
    "dispatchOperationId" TEXT NOT NULL,
    "jobId" TEXT,
    "operatorId" TEXT,
    "workCenterId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'RUNNING',
    "startAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endAt" TIMESTAMP(3),
    "downtimeReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DispatchTimeLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobInspection" (
    "id" TEXT NOT NULL,
    "inspectionNumber" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "inspectorId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "overallResult" TEXT,
    "disposition" TEXT,
    "inspectionType" TEXT NOT NULL DEFAULT 'FINAL',
    "checklist" JSONB,
    "dimensionalChecks" JSONB,
    "visualNotes" TEXT,
    "defects" JSONB,
    "reworkInstructions" TEXT,
    "notes" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobInspection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkCenterType" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT 'Build',
    "color" TEXT NOT NULL DEFAULT '#1976d2',
    "description" TEXT,
    "divisions" JSONB NOT NULL DEFAULT '[]',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkCenterType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkCenter" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "type" TEXT,
    "capabilities" JSONB NOT NULL DEFAULT '[]',
    "capacity" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkCenter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "jobNumber" TEXT NOT NULL,
    "orderId" TEXT,
    "orderLineId" TEXT,
    "workCenterId" TEXT,
    "workOrderId" TEXT,
    "assignedToId" TEXT,
    "createdById" TEXT,
    "status" "JobStatus" NOT NULL DEFAULT 'SCHEDULED',
    "operationType" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 3,
    "scheduledStart" TIMESTAMP(3),
    "scheduledEnd" TIMESTAMP(3),
    "actualStart" TIMESTAMP(3),
    "actualEnd" TIMESTAMP(3),
    "inputWeightLb" DECIMAL(65,30),
    "outputWeightLb" DECIMAL(65,30),
    "scrapWeightLb" DECIMAL(65,30),
    "operatorId" TEXT,
    "instructions" TEXT,
    "notes" TEXT,
    "shippingCarrier" TEXT,
    "trackingNumber" TEXT,
    "shippedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "hasCustomRouting" BOOLEAN NOT NULL DEFAULT false,
    "recipeId" TEXT,
    "recipeVersion" INTEGER,
    "thicknessIn" DECIMAL(65,30),
    "widthIn" DECIMAL(65,30),
    "lengthIn" DECIMAL(65,30),
    "gradeOverride" TEXT,
    "surfaceFinish" TEXT,
    "tolerancePreset" TEXT,
    "thkTolerancePlus" DECIMAL(65,30),
    "thkToleranceMinus" DECIMAL(65,30),
    "lenTolerancePlus" DECIMAL(65,30),
    "lenToleranceMinus" DECIMAL(65,30),
    "widTolerancePlus" DECIMAL(65,30),
    "widToleranceMinus" DECIMAL(65,30),
    "certRequirements" JSONB,
    "specNotes" TEXT,
    "specsInherited" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "orderType" "OrderType" NOT NULL,
    "buyerId" TEXT,
    "sellerId" TEXT,
    "shipToAddress" TEXT,
    "shipToCity" TEXT,
    "shipToState" TEXT,
    "shipToZip" TEXT,
    "orderDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "requiredDate" TIMESTAMP(3),
    "promisedDate" TIMESTAMP(3),
    "expireDate" TIMESTAMP(3),
    "status" "OrderStatus" NOT NULL DEFAULT 'DRAFT',
    "subtotal" DECIMAL(65,30),
    "taxAmount" DECIMAL(65,30),
    "freightAmount" DECIMAL(65,30),
    "totalAmount" DECIMAL(65,30),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "paymentTerms" TEXT,
    "freightTerms" "FreightTerms",
    "poReference" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderLine" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "lineNumber" INTEGER NOT NULL,
    "productId" TEXT,
    "gradeId" TEXT,
    "description" TEXT,
    "thicknessIn" DECIMAL(65,30),
    "widthIn" DECIMAL(65,30),
    "lengthIn" DECIMAL(65,30),
    "finish" TEXT,
    "coating" TEXT,
    "qtyOrdered" DECIMAL(65,30) NOT NULL,
    "qtyShipped" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "qtyReceived" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL DEFAULT 'LB',
    "unitPrice" DECIMAL(65,30),
    "priceUnit" "PriceUnit" NOT NULL DEFAULT 'CWT',
    "discountPct" DECIMAL(65,30),
    "extendedPrice" DECIMAL(65,30),
    "lineStatus" "LineStatus" NOT NULL DEFAULT 'OPEN',
    "notes" TEXT,
    "gradeOverride" TEXT,
    "surfaceFinish" TEXT,
    "tolerancePreset" TEXT,
    "thkTolerancePlus" DECIMAL(65,30),
    "thkToleranceMinus" DECIMAL(65,30),
    "lenTolerancePlus" DECIMAL(65,30),
    "lenToleranceMinus" DECIMAL(65,30),
    "widTolerancePlus" DECIMAL(65,30),
    "widToleranceMinus" DECIMAL(65,30),
    "certRequirements" JSONB,
    "specNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderLineAllocation" (
    "id" TEXT NOT NULL,
    "orderLineId" TEXT NOT NULL,
    "coilId" TEXT NOT NULL,
    "qtyAllocated" DECIMAL(65,30) NOT NULL,
    "allocatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderLineAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkOrder" (
    "id" TEXT NOT NULL,
    "woNumber" TEXT NOT NULL,
    "woType" "WOType" NOT NULL,
    "status" "WOStatus" NOT NULL DEFAULT 'DRAFT',
    "sourceCoilId" TEXT NOT NULL,
    "lineId" TEXT,
    "salesOrderId" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 3,
    "scheduledDate" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "slitPattern" JSONB,
    "inputWeightLb" DECIMAL(65,30),
    "outputWeightLb" DECIMAL(65,30),
    "scrapWeightLb" DECIMAL(65,30),
    "yieldPct" DECIMAL(65,30),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkOrderOutput" (
    "id" TEXT NOT NULL,
    "workOrderId" TEXT NOT NULL,
    "outputCoilId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "targetWidth" DECIMAL(65,30),
    "actualWidth" DECIMAL(65,30),
    "actualWeight" DECIMAL(65,30),
    "destination" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkOrderOutput_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shipment" (
    "id" TEXT NOT NULL,
    "shipmentNumber" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "fromLocationId" TEXT NOT NULL,
    "carrierId" TEXT,
    "carrierName" TEXT,
    "truckNumber" TEXT,
    "driverName" TEXT,
    "driverPhone" TEXT,
    "status" "ShipmentStatus" NOT NULL DEFAULT 'PENDING',
    "scheduledDate" TIMESTAMP(3),
    "shippedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "totalWeightLb" DECIMAL(65,30),
    "bolNumber" TEXT,
    "podCaptured" BOOLEAN NOT NULL DEFAULT false,
    "podImageUrl" TEXT,
    "podSignature" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShipmentItem" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "orderLineId" TEXT NOT NULL,
    "qtyShipped" DECIMAL(65,30) NOT NULL,
    "weightLb" DECIMAL(65,30),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShipmentItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShipmentStop" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "stopNumber" INTEGER NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT,
    "scheduledTime" TIMESTAMP(3),
    "arrivedAt" TIMESTAMP(3),
    "departedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShipmentStop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "invoiceDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3),
    "subtotal" DECIMAL(65,30) NOT NULL,
    "taxAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "freightAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(65,30) NOT NULL,
    "paidAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paymentMethod" TEXT,
    "referenceNumber" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "documentType" "DocumentType" NOT NULL,
    "documentNumber" TEXT,
    "title" TEXT,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT,
    "fileSizeBytes" INTEGER,
    "storagePath" TEXT NOT NULL,
    "checksum" TEXT,
    "extractedData" JSONB,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "issueDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "ownerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentLink" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "linkType" TEXT NOT NULL DEFAULT 'PRIMARY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommodityPrice" (
    "id" TEXT NOT NULL,
    "indexCode" TEXT NOT NULL,
    "indexName" TEXT NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "unit" TEXT NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommodityPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BomRecipe" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "materialCode" TEXT,
    "commodity" TEXT,
    "form" TEXT,
    "grade" TEXT,
    "thicknessMin" DECIMAL(65,30),
    "thicknessMax" DECIMAL(65,30),
    "division" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "BomRecipeStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BomRecipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BomOperation" (
    "id" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "workCenterType" TEXT NOT NULL,
    "estimatedMachineMinutes" INTEGER NOT NULL DEFAULT 0,
    "estimatedLaborMinutes" INTEGER NOT NULL DEFAULT 0,
    "setupMinutes" INTEGER NOT NULL DEFAULT 0,
    "parameters" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BomOperation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "assetNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "assetTypeId" TEXT NOT NULL,
    "parentAssetId" TEXT,
    "siteId" TEXT NOT NULL,
    "areaCode" TEXT,
    "workCenterId" TEXT,
    "manufacturer" TEXT,
    "model" TEXT,
    "serialNumber" TEXT,
    "purchaseDate" TIMESTAMP(3),
    "installDate" TIMESTAMP(3),
    "warrantyExpires" TIMESTAMP(3),
    "expectedLifeYears" INTEGER,
    "replacementCost" DECIMAL(65,30),
    "criticality" "AssetCriticality" NOT NULL DEFAULT 'C',
    "safetyRelated" BOOLEAN NOT NULL DEFAULT false,
    "qualityRelated" BOOLEAN NOT NULL DEFAULT false,
    "status" "AssetStatus" NOT NULL DEFAULT 'IN_SERVICE',
    "statusReason" TEXT,
    "statusChangedAt" TIMESTAMP(3),
    "statusChangedBy" TEXT,
    "currentHours" DECIMAL(65,30),
    "currentCycles" INTEGER,
    "currentMiles" DECIMAL(65,30),
    "lastPMDate" TIMESTAMP(3),
    "nextPMDueDate" TIMESTAMP(3),
    "pmComplianceStatus" "PMComplianceStatus",
    "certificationRequired" BOOLEAN NOT NULL DEFAULT false,
    "certificationExpires" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetType" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "description" TEXT,
    "defaultCriticality" "AssetCriticality" NOT NULL DEFAULT 'C',
    "pmTemplateId" TEXT,
    "defaultPMIntervalDays" INTEGER,
    "defaultPMIntervalHours" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssetType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetComponent" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "partNumber" TEXT,
    "serialNumber" TEXT,
    "manufacturer" TEXT,
    "installDate" TIMESTAMP(3),
    "warrantyExpires" TIMESTAMP(3),
    "expectedLifeHours" INTEGER,
    "currentHours" DECIMAL(65,30),
    "status" "ComponentStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssetComponent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeterReading" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "meterType" "MeterType" NOT NULL,
    "reading" DECIMAL(65,30) NOT NULL,
    "readingDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recordedBy" TEXT NOT NULL,
    "source" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MeterReading_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceOrder" (
    "id" TEXT NOT NULL,
    "woNumber" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "type" "MaintenanceOrderType" NOT NULL,
    "priority" "MaintenancePriority" NOT NULL DEFAULT 'NORMAL',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "problemCode" TEXT,
    "failureCode" TEXT,
    "status" "MaintenanceOrderStatus" NOT NULL DEFAULT 'DRAFT',
    "scheduledStart" TIMESTAMP(3),
    "scheduledEnd" TIMESTAMP(3),
    "estimatedHours" DECIMAL(65,30),
    "actualStart" TIMESTAMP(3),
    "actualEnd" TIMESTAMP(3),
    "actualHours" DECIMAL(65,30),
    "assignedToId" TEXT,
    "assignedTeam" TEXT,
    "lotoRequired" BOOLEAN NOT NULL DEFAULT false,
    "permitRequired" BOOLEAN NOT NULL DEFAULT false,
    "hotWorkRequired" BOOLEAN NOT NULL DEFAULT false,
    "confinedSpaceRequired" BOOLEAN NOT NULL DEFAULT false,
    "safetyRelated" BOOLEAN NOT NULL DEFAULT false,
    "pmScheduleId" TEXT,
    "pmTemplateId" TEXT,
    "downtimeRecordId" TEXT,
    "stopWorkId" TEXT,
    "ncrId" TEXT,
    "spcViolationId" TEXT,
    "requiresFirstArticle" BOOLEAN NOT NULL DEFAULT false,
    "firstArticlePassed" BOOLEAN,
    "testRunPassed" BOOLEAN,
    "submittedAt" TIMESTAMP(3),
    "submittedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "completedAt" TIMESTAMP(3),
    "completedBy" TEXT,
    "completionNotes" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "verificationNotes" TEXT,
    "closedAt" TIMESTAMP(3),
    "closedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaintenanceOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceTask" (
    "id" TEXT NOT NULL,
    "maintenanceOrderId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "estimatedMinutes" INTEGER,
    "actualMinutes" INTEGER,
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "completedAt" TIMESTAMP(3),
    "completedBy" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaintenanceTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceOrderPart" (
    "id" TEXT NOT NULL,
    "maintenanceOrderId" TEXT NOT NULL,
    "sparePartId" TEXT,
    "partNumber" TEXT NOT NULL,
    "partDescription" TEXT,
    "quantityRequired" DECIMAL(65,30) NOT NULL,
    "quantityUsed" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "unitCost" DECIMAL(65,30),
    "issuedAt" TIMESTAMP(3),
    "issuedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaintenanceOrderPart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceOrderLabor" (
    "id" TEXT NOT NULL,
    "maintenanceOrderId" TEXT NOT NULL,
    "technicianId" TEXT NOT NULL,
    "technicianName" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "regularHours" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "overtimeHours" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "laborRate" DECIMAL(65,30),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MaintenanceOrderLabor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceAttachment" (
    "id" TEXT NOT NULL,
    "maintenanceOrderId" TEXT NOT NULL,
    "type" "AttachmentType" NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT,
    "fileSizeBytes" INTEGER,
    "storagePath" TEXT NOT NULL,
    "description" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploadedBy" TEXT NOT NULL,

    CONSTRAINT "MaintenanceAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PMTemplate" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "assetTypeId" TEXT,
    "intervalType" "PMIntervalType" NOT NULL,
    "intervalValue" INTEGER NOT NULL,
    "intervalUnit" TEXT,
    "triggerOnHours" BOOLEAN NOT NULL DEFAULT false,
    "triggerOnCalendar" BOOLEAN NOT NULL DEFAULT true,
    "triggerOnCondition" BOOLEAN NOT NULL DEFAULT false,
    "conditionThreshold" JSONB,
    "taskList" JSONB,
    "defaultParts" JSONB,
    "lotoRequired" BOOLEAN NOT NULL DEFAULT false,
    "permitRequired" BOOLEAN NOT NULL DEFAULT false,
    "estimatedHours" DECIMAL(65,30),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PMTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PMSchedule" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "pmTemplateId" TEXT,
    "intervalType" "PMIntervalType" NOT NULL,
    "intervalValue" INTEGER NOT NULL,
    "intervalUnit" TEXT,
    "lastCompletedDate" TIMESTAMP(3),
    "lastCompletedHours" DECIMAL(65,30),
    "nextDueDate" TIMESTAMP(3),
    "nextDueHours" DECIMAL(65,30),
    "overdueAction" "OverdueAction" NOT NULL DEFAULT 'ALERT',
    "overdueThresholdDays" INTEGER,
    "status" "PMScheduleStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PMSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DowntimeRecord" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "durationMinutes" INTEGER,
    "type" "DowntimeType" NOT NULL,
    "reasonCode" TEXT,
    "reasonDescription" TEXT,
    "impactedJobs" JSONB NOT NULL DEFAULT '[]',
    "productionLossUnits" DECIMAL(65,30),
    "estimatedCost" DECIMAL(65,30),
    "reportedBy" TEXT NOT NULL,
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "symptoms" TEXT,
    "resolvedBy" TEXT,
    "resolutionNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DowntimeRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SparePart" (
    "id" TEXT NOT NULL,
    "partNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "manufacturer" TEXT,
    "quantityOnHand" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "quantityReserved" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "quantityOnOrder" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "reorderPoint" INTEGER,
    "reorderQuantity" INTEGER,
    "unitOfMeasure" TEXT NOT NULL DEFAULT 'EACH',
    "unitCost" DECIMAL(65,30),
    "lastPurchasePrice" DECIMAL(65,30),
    "lastPurchaseDate" TIMESTAMP(3),
    "storageLocation" TEXT,
    "binNumber" TEXT,
    "assetId" TEXT,
    "assetTypeCode" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SparePart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SparePartTransaction" (
    "id" TEXT NOT NULL,
    "sparePartId" TEXT NOT NULL,
    "transactionType" "PartTransactionType" NOT NULL,
    "quantity" DECIMAL(65,30) NOT NULL,
    "unitCost" DECIMAL(65,30),
    "referenceType" TEXT,
    "referenceId" TEXT,
    "notes" TEXT,
    "performedBy" TEXT NOT NULL,
    "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SparePartTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceAuditLog" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "previousState" JSONB,
    "newState" JSONB,
    "changedFields" JSONB NOT NULL DEFAULT '[]',
    "userId" TEXT NOT NULL,
    "userRole" TEXT,
    "userName" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "reason" TEXT,

    CONSTRAINT "MaintenanceAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerPricingTier" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "tierCode" TEXT NOT NULL,
    "marginFloor" DECIMAL(65,30) NOT NULL,
    "marginTarget" DECIMAL(65,30) NOT NULL,
    "discountMaxPct" DECIMAL(65,30),
    "paymentTerms" TEXT,
    "freightTerms" TEXT,
    "creditLimit" DECIMAL(65,30),
    "creditRating" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveUntil" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerPricingTier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PricingRecommendation" (
    "id" TEXT NOT NULL,
    "quoteLineId" TEXT,
    "rfqLineId" TEXT,
    "productCode" TEXT,
    "grade" TEXT,
    "form" TEXT,
    "dimensions" JSONB,
    "quantity" DECIMAL(65,30) NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'LB',
    "materialCost" DECIMAL(65,30),
    "processingCost" DECIMAL(65,30),
    "laborCost" DECIMAL(65,30),
    "freightCost" DECIMAL(65,30),
    "yieldLossCost" DECIMAL(65,30),
    "packagingCost" DECIMAL(65,30),
    "overheadCost" DECIMAL(65,30),
    "totalCost" DECIMAL(65,30),
    "recommendedPrice" DECIMAL(65,30) NOT NULL,
    "minimumPrice" DECIMAL(65,30),
    "listPrice" DECIMAL(65,30),
    "marginPct" DECIMAL(65,30),
    "confidenceScore" DECIMAL(65,30),
    "customerId" TEXT,
    "customerTier" TEXT,
    "locationId" TEXT,
    "inventorySource" TEXT,
    "leadTimeDays" INTEGER,
    "alternatives" JSONB,
    "pricingModel" TEXT,
    "modelInputs" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PricingRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PricingOverride" (
    "id" TEXT NOT NULL,
    "quoteLineId" TEXT,
    "quoteId" TEXT,
    "originalPrice" DECIMAL(65,30) NOT NULL,
    "overridePrice" DECIMAL(65,30) NOT NULL,
    "originalMargin" DECIMAL(65,30),
    "overrideMargin" DECIMAL(65,30),
    "reason" TEXT NOT NULL,
    "justification" TEXT,
    "requestedById" TEXT NOT NULL,
    "approvedById" TEXT,
    "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PricingOverride_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteAcceptance" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedBy" TEXT,
    "acceptedByEmail" TEXT,
    "customerPO" TEXT,
    "termsAccepted" BOOLEAN NOT NULL DEFAULT true,
    "signatureData" TEXT,
    "ipAddress" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuoteAcceptance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RFQSource" (
    "id" TEXT NOT NULL,
    "rfqId" TEXT NOT NULL,
    "sourceType" "RFQSourceType" NOT NULL,
    "sourceChannel" TEXT,
    "rawContent" TEXT,
    "parsedData" JSONB,
    "parsingConfidence" DECIMAL(65,30),
    "parseErrors" JSONB,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RFQSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PricingAnalytics" (
    "id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "customerId" TEXT,
    "productCategory" TEXT,
    "locationId" TEXT,
    "quotesCreated" INTEGER NOT NULL DEFAULT 0,
    "quotesWon" INTEGER NOT NULL DEFAULT 0,
    "quotesLost" INTEGER NOT NULL DEFAULT 0,
    "winRate" DECIMAL(65,30),
    "avgMarginQuoted" DECIMAL(65,30),
    "avgMarginWon" DECIMAL(65,30),
    "avgResponseHours" DECIMAL(65,30),
    "avgCycleTimeDays" DECIMAL(65,30),
    "totalValueQuoted" DECIMAL(65,30),
    "totalValueWon" DECIMAL(65,30),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PricingAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DropTag" (
    "id" TEXT NOT NULL,
    "dropTagId" TEXT NOT NULL,
    "tenantId" TEXT,
    "packageId" TEXT NOT NULL,
    "shipmentId" TEXT,
    "listingId" TEXT,
    "orderId" TEXT NOT NULL,
    "orderLineId" TEXT NOT NULL,
    "jobId" TEXT,
    "customerId" TEXT NOT NULL,
    "customerPO" TEXT,
    "customerPartNo" TEXT,
    "division" TEXT NOT NULL,
    "form" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "specification" TEXT,
    "condition" TEXT,
    "dimensions" JSONB NOT NULL,
    "lengthInches" DECIMAL(65,30),
    "lengthFeet" DECIMAL(65,30),
    "heatNumber" TEXT,
    "lotId" TEXT,
    "inventoryLotId" TEXT,
    "supplierId" TEXT,
    "mtrDocId" TEXT,
    "cocDocId" TEXT,
    "pieces" INTEGER NOT NULL,
    "weightLbs" DECIMAL(65,30) NOT NULL,
    "uom" TEXT NOT NULL DEFAULT 'EA',
    "workCenters" JSONB NOT NULL DEFAULT '[]',
    "operationsSummary" TEXT,
    "completedAt" TIMESTAMP(3),
    "operatorIds" JSONB NOT NULL DEFAULT '[]',
    "bundleType" TEXT,
    "packagingNotes" TEXT,
    "specialInstructions" TEXT,
    "shipToAddress" JSONB,
    "routeStop" INTEGER,
    "requiredDate" TIMESTAMP(3),
    "status" "DropTagStatus" NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "reprintCount" INTEGER NOT NULL DEFAULT 0,
    "lastReprintReason" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "printedBy" TEXT,
    "printedAt" TIMESTAMP(3),
    "appliedBy" TEXT,
    "appliedAt" TIMESTAMP(3),
    "sealedAt" TIMESTAMP(3),
    "voidedBy" TEXT,
    "voidedAt" TIMESTAMP(3),
    "voidReason" TEXT,

    CONSTRAINT "DropTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DropTagListing" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "tenantId" TEXT,
    "shipmentId" TEXT NOT NULL,
    "originLocationId" TEXT NOT NULL,
    "routeId" TEXT,
    "loadId" TEXT,
    "stopSequence" JSONB NOT NULL,
    "totalPackages" INTEGER NOT NULL DEFAULT 0,
    "totalPieces" INTEGER NOT NULL DEFAULT 0,
    "totalWeightLbs" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "cocBundleId" TEXT,
    "mtrBundleId" TEXT,
    "packingListDocId" TEXT,
    "status" "DropTagListingStatus" NOT NULL DEFAULT 'DRAFT',
    "lockedAt" TIMESTAMP(3),
    "lockedBy" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "departedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "podDocId" TEXT,
    "podSignature" TEXT,
    "podSignedBy" TEXT,
    "podSignedAt" TIMESTAMP(3),

    CONSTRAINT "DropTagListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Package" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "tenantId" TEXT,
    "status" "PackageStatus" NOT NULL DEFAULT 'OPEN',
    "sealId" TEXT,
    "sealType" TEXT,
    "sealAppliedBy" TEXT,
    "sealAppliedAt" TIMESTAMP(3),
    "packageType" TEXT NOT NULL,
    "dimensions" JSONB,
    "tareWeightLbs" DECIMAL(65,30),
    "grossWeightLbs" DECIMAL(65,30),
    "netWeightLbs" DECIMAL(65,30),
    "currentLocationId" TEXT,
    "currentBinId" TEXT,
    "orderId" TEXT,
    "orderLineId" TEXT,
    "jobId" TEXT,
    "qcStatus" "PackageQCStatus" NOT NULL DEFAULT 'PENDING',
    "qcReleasedBy" TEXT,
    "qcReleasedAt" TIMESTAMP(3),
    "qcNotes" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "packedAt" TIMESTAMP(3),
    "stagedAt" TIMESTAMP(3),
    "loadedAt" TIMESTAMP(3),
    "shippedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),

    CONSTRAINT "Package_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackageItem" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "inventoryLotId" TEXT,
    "coilId" TEXT,
    "heatNumber" TEXT,
    "grade" TEXT NOT NULL,
    "form" TEXT NOT NULL,
    "dimensions" JSONB NOT NULL,
    "specification" TEXT,
    "condition" TEXT,
    "pieces" INTEGER NOT NULL,
    "weightLbs" DECIMAL(65,30) NOT NULL,
    "lengthFeet" DECIMAL(65,30),
    "pieceMarks" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PackageItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TagIdentifier" (
    "id" TEXT NOT NULL,
    "dropTagId" TEXT NOT NULL,
    "identifierType" "IdentifierType" NOT NULL,
    "identifierValue" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TagIdentifier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabelTemplate" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "templateType" TEXT NOT NULL,
    "mediaType" TEXT NOT NULL,
    "widthInches" DECIMAL(65,30) NOT NULL,
    "heightInches" DECIMAL(65,30) NOT NULL,
    "templateContent" TEXT NOT NULL,
    "barcodeType" TEXT NOT NULL DEFAULT 'QR',
    "barcodePosition" JSONB NOT NULL,
    "customerId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LabelTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TraceEvent" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventCategory" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "actorRole" TEXT NOT NULL,
    "actorName" TEXT,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "previousState" TEXT,
    "newState" TEXT,
    "locationId" TEXT,
    "stationId" TEXT,
    "beforeSnapshot" JSONB,
    "afterSnapshot" JSONB,
    "metadata" JSONB,
    "correlationId" TEXT,
    "orderId" TEXT,
    "shipmentId" TEXT,
    "dropTagId" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eventHash" TEXT,
    "previousHash" TEXT,

    CONSTRAINT "TraceEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerTagRequirement" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "requireHeatNumber" BOOLEAN NOT NULL DEFAULT true,
    "requireMtrReference" BOOLEAN NOT NULL DEFAULT true,
    "requireCocReference" BOOLEAN NOT NULL DEFAULT true,
    "requirePieceMarks" BOOLEAN NOT NULL DEFAULT false,
    "requireCustomerPartNo" BOOLEAN NOT NULL DEFAULT false,
    "requireCustomerPO" BOOLEAN NOT NULL DEFAULT true,
    "requireSpecification" BOOLEAN NOT NULL DEFAULT true,
    "requireCountryOfOrigin" BOOLEAN NOT NULL DEFAULT false,
    "templateCode" TEXT,
    "barcodeType" TEXT,
    "includeQRCode" BOOLEAN NOT NULL DEFAULT true,
    "allowMixedHeat" BOOLEAN NOT NULL DEFAULT false,
    "allowMixedLength" BOOLEAN NOT NULL DEFAULT false,
    "requireCertPerHeat" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerTagRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Partner" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "partnerType" "PartnerType" NOT NULL,
    "status" "PartnerStatus" NOT NULL DEFAULT 'PENDING',
    "tier" "PartnerTier" NOT NULL DEFAULT 'STANDARD',
    "contactName" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "ipAllowList" JSONB NOT NULL DEFAULT '[]',
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

-- CreateTable
CREATE TABLE "PartnerApiKey" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "keyName" TEXT NOT NULL,
    "clientSecret" TEXT NOT NULL,
    "scopes" JSONB NOT NULL DEFAULT '[]',
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

-- CreateTable
CREATE TABLE "PartnerWebhook" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "events" JSONB NOT NULL DEFAULT '[]',
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
CREATE TABLE "SafetyPolicyDocument" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "PolicyType" NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "PolicyStatus" NOT NULL DEFAULT 'DRAFT',
    "contentUrl" TEXT,
    "contentMarkdown" TEXT,
    "summary" TEXT,
    "scope" TEXT,
    "effectiveDate" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "supersededById" TEXT,
    "appliesToRoles" JSONB NOT NULL DEFAULT '[]',
    "appliesToLocations" JSONB NOT NULL DEFAULT '[]',
    "requiresAck" BOOLEAN NOT NULL DEFAULT true,
    "ackDueDays" INTEGER NOT NULL DEFAULT 30,
    "createdById" TEXT NOT NULL,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SafetyPolicyDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafetyPolicyAcknowledgement" (
    "id" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "acknowledgedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "signatureData" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "SafetyPolicyAcknowledgement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafetyTrainingCourse" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" "TrainingCategory" NOT NULL,
    "deliveryMethod" "TrainingDeliveryMethod" NOT NULL,
    "durationMinutes" INTEGER NOT NULL DEFAULT 60,
    "validityMonths" INTEGER,
    "passingScore" INTEGER,
    "hasAssessment" BOOLEAN NOT NULL DEFAULT false,
    "assessmentQuestions" JSONB,
    "contentUrl" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "requiredForRoles" JSONB NOT NULL DEFAULT '[]',
    "prerequisites" JSONB NOT NULL DEFAULT '[]',
    "externalCourseId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SafetyTrainingCourse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafetyTrainingAssignment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "TrainingAssignmentStatus" NOT NULL DEFAULT 'ASSIGNED',
    "assignedById" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "escalationLevel" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SafetyTrainingAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafetyTrainingCompletion" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "score" INTEGER,
    "passed" BOOLEAN NOT NULL DEFAULT true,
    "instructorId" TEXT,
    "instructorName" TEXT,
    "certificateUrl" TEXT,
    "certificateNumber" TEXT,
    "externalRecordId" TEXT,
    "signatureData" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SafetyTrainingCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafetyIncident" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "incidentNumber" TEXT NOT NULL,
    "type" "IncidentType" NOT NULL,
    "severity" "IncidentSeverity",
    "status" "IncidentStatus" NOT NULL DEFAULT 'DRAFT',
    "title" TEXT,
    "description" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "locationId" TEXT NOT NULL,
    "workCenterId" TEXT,
    "exactLocation" TEXT,
    "shiftId" TEXT,
    "reportedById" TEXT NOT NULL,
    "affectedPersonType" "AffectedPersonType",
    "affectedPersonId" TEXT,
    "affectedPersonName" TEXT,
    "affectedPersonCompany" TEXT,
    "witnessNames" JSONB NOT NULL DEFAULT '[]',
    "immediateActions" TEXT,
    "rootCauseDescription" TEXT,
    "oshaRecordable" BOOLEAN,
    "oshaClassification" "OshaClassification",
    "daysAwayFromWork" INTEGER,
    "daysRestricted" INTEGER,
    "estimatedCost" DECIMAL(65,30),
    "workersCompClaimId" TEXT,
    "triageNotes" TEXT,
    "triagedById" TEXT,
    "triagedAt" TIMESTAMP(3),
    "closedById" TEXT,
    "closedAt" TIMESTAMP(3),
    "closureNotes" TEXT,
    "reopenedAt" TIMESTAMP(3),
    "reopenReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SafetyIncident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafetyIncidentInvestigation" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "leadInvestigatorId" TEXT NOT NULL,
    "teamMemberIds" JSONB NOT NULL DEFAULT '[]',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "escalationLevel" INTEGER NOT NULL DEFAULT 0,
    "methodology" TEXT,
    "fiveWhysAnalysis" JSONB,
    "fishboneAnalysis" JSONB,
    "rootCauseCategories" JSONB NOT NULL DEFAULT '[]',
    "rootCauseDescription" TEXT,
    "contributingFactors" JSONB NOT NULL DEFAULT '[]',
    "findings" JSONB,
    "recommendations" JSONB NOT NULL DEFAULT '[]',
    "lessonsLearned" TEXT,
    "preventabilityRating" TEXT,
    "signoffUserId" TEXT,
    "signoffAt" TIMESTAMP(3),
    "signatureData" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SafetyIncidentInvestigation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafetyInjuryDetails" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "bodyPartAffected" JSONB NOT NULL DEFAULT '[]',
    "injuryNature" JSONB NOT NULL DEFAULT '[]',
    "treatmentType" TEXT NOT NULL,
    "treatedOnsite" BOOLEAN NOT NULL DEFAULT false,
    "medicalFacility" TEXT,
    "physicianName" TEXT,
    "returnToWorkDate" TIMESTAMP(3),
    "restrictionsNotes" TEXT,
    "hospitalizedOvernight" BOOLEAN NOT NULL DEFAULT false,
    "deathDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SafetyInjuryDetails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafetyCorrectiveAction" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "capaNumber" TEXT NOT NULL,
    "type" "CapaType" NOT NULL DEFAULT 'CORRECTIVE',
    "sourceType" "CapaSourceType" NOT NULL,
    "sourceId" TEXT,
    "incidentId" TEXT,
    "inspectionId" TEXT,
    "auditId" TEXT,
    "observationId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" "CapaPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "CapaStatus" NOT NULL DEFAULT 'DRAFT',
    "assignedToId" TEXT NOT NULL,
    "assignedById" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "escalationLevel" INTEGER NOT NULL DEFAULT 0,
    "implementationNotes" TEXT,
    "implementedAt" TIMESTAMP(3),
    "implementedById" TEXT,
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "verificationResult" "VerificationResult",
    "verificationNotes" TEXT,
    "effectivenessCheckDate" TIMESTAMP(3),
    "closedById" TEXT,
    "closedAt" TIMESTAMP(3),
    "closureNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SafetyCorrectiveAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafetyInspectionTemplate" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "InspectionType" NOT NULL,
    "description" TEXT,
    "frequency" TEXT,
    "estimatedMinutes" INTEGER NOT NULL DEFAULT 15,
    "sections" JSONB NOT NULL,
    "scoringMethod" TEXT,
    "passingThreshold" INTEGER,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "appliesToAssetTypes" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SafetyInspectionTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafetyInspection" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "inspectionNumber" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "type" "InspectionType" NOT NULL,
    "status" "InspectionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "scheduledById" TEXT,
    "assignedToId" TEXT,
    "locationId" TEXT NOT NULL,
    "workCenterId" TEXT,
    "assetId" TEXT,
    "assetNumber" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "completedById" TEXT,
    "responses" JSONB,
    "score" INTEGER,
    "passed" BOOLEAN,
    "findings" TEXT,
    "notes" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "signatureData" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SafetyInspection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafetyInspectionDefect" (
    "id" TEXT NOT NULL,
    "inspectionId" TEXT NOT NULL,
    "questionRef" TEXT,
    "severity" "DefectSeverity" NOT NULL,
    "status" "DefectStatus" NOT NULL DEFAULT 'OPEN',
    "description" TEXT NOT NULL,
    "photoUrls" JSONB NOT NULL DEFAULT '[]',
    "locationNotes" TEXT,
    "correctiveAction" TEXT,
    "resolvedById" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolutionNotes" TEXT,
    "causedAssetOOS" BOOLEAN NOT NULL DEFAULT false,
    "capaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SafetyInspectionDefect_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafetyPermit" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "permitNumber" TEXT NOT NULL,
    "type" "PermitType" NOT NULL,
    "status" "PermitStatus" NOT NULL DEFAULT 'DRAFT',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "locationId" TEXT NOT NULL,
    "workCenterId" TEXT,
    "exactLocation" TEXT,
    "equipmentAssetIds" JSONB NOT NULL DEFAULT '[]',
    "requestedById" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validFrom" TIMESTAMP(3),
    "validTo" TIMESTAMP(3),
    "activatedAt" TIMESTAMP(3),
    "activatedById" TEXT,
    "completedAt" TIMESTAMP(3),
    "completedById" TEXT,
    "suspendedAt" TIMESTAMP(3),
    "suspendedById" TEXT,
    "suspendReason" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "cancelledById" TEXT,
    "cancelReason" TEXT,
    "hazardsIdentified" JSONB NOT NULL DEFAULT '[]',
    "controlMeasures" JSONB NOT NULL DEFAULT '[]',
    "ppeRequired" JSONB NOT NULL DEFAULT '[]',
    "emergencyProcedure" TEXT,
    "workerIds" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SafetyPermit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafetyPermitLoto" (
    "id" TEXT NOT NULL,
    "permitId" TEXT NOT NULL,
    "procedureId" TEXT,
    "energySources" JSONB NOT NULL DEFAULT '[]',
    "verificationMethod" TEXT,
    "verificationNotes" TEXT,
    "locks" JSONB NOT NULL DEFAULT '[]',
    "groupLockboxId" TEXT,
    "tryStartCompleted" BOOLEAN NOT NULL DEFAULT false,
    "tryStartById" TEXT,
    "tryStartAt" TIMESTAMP(3),
    "allLocksRemoved" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "SafetyPermitLoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafetyPermitHotWork" (
    "id" TEXT NOT NULL,
    "permitId" TEXT NOT NULL,
    "workType" TEXT NOT NULL,
    "ignitionSources" JSONB NOT NULL DEFAULT '[]',
    "combustiblesCleared" BOOLEAN NOT NULL DEFAULT false,
    "clearanceRadius" INTEGER,
    "fireWatchRequired" BOOLEAN NOT NULL DEFAULT true,
    "fireWatchDuration" INTEGER,
    "fireWatcherId" TEXT,
    "fireWatcherName" TEXT,
    "fireExtinguisherLocation" TEXT,
    "fireExtinguisherType" TEXT,
    "sprinklerStatus" TEXT,
    "monitoringRequired" BOOLEAN NOT NULL DEFAULT false,
    "atmosphereTestedAt" TIMESTAMP(3),
    "atmosphereTestResults" JSONB,

    CONSTRAINT "SafetyPermitHotWork_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafetyPermitElectrical" (
    "id" TEXT NOT NULL,
    "permitId" TEXT NOT NULL,
    "workType" "ElectricalWorkType" NOT NULL,
    "voltage" INTEGER,
    "arcFlashBoundary" DECIMAL(65,30),
    "shockBoundary" DECIMAL(65,30),
    "arcFlashPPELevel" INTEGER,
    "arcFlashPPE" JSONB NOT NULL DEFAULT '[]',
    "arcFlashEnergy" DECIMAL(65,30),
    "equipmentInfo" TEXT,
    "secondPersonRequired" BOOLEAN NOT NULL DEFAULT false,
    "secondPersonId" TEXT,
    "testingRequired" BOOLEAN NOT NULL DEFAULT true,
    "testEquipment" TEXT,

    CONSTRAINT "SafetyPermitElectrical_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafetyPermitConfinedSpace" (
    "id" TEXT NOT NULL,
    "permitId" TEXT NOT NULL,
    "spaceType" "ConfinedSpaceType" NOT NULL,
    "spaceName" TEXT,
    "knownHazards" JSONB NOT NULL DEFAULT '[]',
    "atmosphereTestResults" JSONB NOT NULL DEFAULT '[]',
    "atmosphereContinuousMonitor" BOOLEAN NOT NULL DEFAULT false,
    "ventilationType" TEXT,
    "ventilationVerified" BOOLEAN NOT NULL DEFAULT false,
    "entryAttendantId" TEXT,
    "entryAttendantName" TEXT,
    "rescuePlanType" TEXT,
    "rescueTeamContact" TEXT,
    "communicationMethod" TEXT,
    "entrantIds" JSONB NOT NULL DEFAULT '[]',

    CONSTRAINT "SafetyPermitConfinedSpace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafetyPermitSignoff" (
    "id" TEXT NOT NULL,
    "permitId" TEXT NOT NULL,
    "signoffType" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "signedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "signatureData" TEXT,
    "attestationText" TEXT,
    "ipAddress" TEXT,
    "comments" TEXT,

    CONSTRAINT "SafetyPermitSignoff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafetyLotoProcedure" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "procedureNumber" TEXT NOT NULL,
    "equipmentAssetId" TEXT NOT NULL,
    "equipmentName" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "PolicyStatus" NOT NULL DEFAULT 'DRAFT',
    "energySources" JSONB NOT NULL DEFAULT '[]',
    "isolationSteps" JSONB NOT NULL DEFAULT '[]',
    "verificationSteps" JSONB NOT NULL DEFAULT '[]',
    "restorationSteps" JSONB NOT NULL DEFAULT '[]',
    "specialInstructions" TEXT,
    "estimatedMinutes" INTEGER,
    "requiredTraining" JSONB NOT NULL DEFAULT '[]',
    "ppeRequired" JSONB NOT NULL DEFAULT '[]',
    "authorizedByIds" JSONB NOT NULL DEFAULT '[]',
    "photoUrls" JSONB NOT NULL DEFAULT '[]',
    "reviewDate" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SafetyLotoProcedure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafetyObservation" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "observationNumber" TEXT NOT NULL,
    "type" "SafetyObservationType" NOT NULL,
    "category" "ObservationCategory" NOT NULL,
    "locationId" TEXT NOT NULL,
    "workCenterId" TEXT,
    "exactLocation" TEXT,
    "observedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observedById" TEXT NOT NULL,
    "observedPersonId" TEXT,
    "description" TEXT NOT NULL,
    "atRiskBehavior" TEXT,
    "safeBehavior" TEXT,
    "immediateDanger" BOOLEAN NOT NULL DEFAULT false,
    "coachingProvided" BOOLEAN NOT NULL DEFAULT false,
    "coachingNotes" TEXT,
    "requiresFollowUp" BOOLEAN NOT NULL DEFAULT false,
    "photoUrls" JSONB NOT NULL DEFAULT '[]',
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "closedAt" TIMESTAMP(3),
    "closureNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SafetyObservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafetyStopWorkEvent" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "stopWorkNumber" TEXT NOT NULL,
    "status" "StopWorkStatus" NOT NULL DEFAULT 'ISSUED',
    "issuedById" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "locationId" TEXT NOT NULL,
    "workCenterId" TEXT,
    "equipmentAssetIds" JSONB NOT NULL DEFAULT '[]',
    "affectedJobIds" JSONB NOT NULL DEFAULT '[]',
    "hazardDescription" TEXT NOT NULL,
    "immediateDanger" BOOLEAN NOT NULL DEFAULT false,
    "immediateActions" TEXT,
    "acknowledgedById" TEXT,
    "acknowledgedAt" TIMESTAMP(3),
    "mitigationPlan" TEXT,
    "mitigationById" TEXT,
    "mitigationAt" TIMESTAMP(3),
    "resumeAuthorizedById" TEXT,
    "resumeAuthorizedAt" TIMESTAMP(3),
    "resumeConditions" TEXT,
    "closedById" TEXT,
    "closedAt" TIMESTAMP(3),
    "closureNotes" TEXT,
    "duration" INTEGER,
    "rootCauseId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SafetyStopWorkEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafetyEquipmentAsset" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "assetNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "assetType" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "workCenterId" TEXT,
    "manufacturer" TEXT,
    "model" TEXT,
    "serialNumber" TEXT,
    "installDate" TIMESTAMP(3),
    "safetyStatus" "EquipmentSafetyStatus" NOT NULL DEFAULT 'SAFE',
    "lastInspectionDate" TIMESTAMP(3),
    "nextInspectionDue" TIMESTAMP(3),
    "inspectionFrequency" TEXT,
    "lotoProcedureId" TEXT,
    "requiredTraining" JSONB NOT NULL DEFAULT '[]',
    "ppeRequired" JSONB NOT NULL DEFAULT '[]',
    "hazards" JSONB NOT NULL DEFAULT '[]',
    "safetyFeatures" JSONB NOT NULL DEFAULT '[]',
    "guardingStatus" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SafetyEquipmentAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafetyEquipmentGuard" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "guardType" TEXT NOT NULL,
    "location" TEXT,
    "status" TEXT NOT NULL DEFAULT 'INSTALLED',
    "interlocked" BOOLEAN NOT NULL DEFAULT false,
    "interlockType" TEXT,
    "lastCheckedAt" TIMESTAMP(3),
    "lastCheckedById" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SafetyEquipmentGuard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafetySDSRecord" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "manufacturer" TEXT NOT NULL,
    "casNumber" TEXT,
    "unNumber" TEXT,
    "signalWord" TEXT,
    "hazardStatements" JSONB NOT NULL DEFAULT '[]',
    "precautionaryStatements" JSONB NOT NULL DEFAULT '[]',
    "pictogramCodes" JSONB NOT NULL DEFAULT '[]',
    "ghs_classification" JSONB,
    "storageClass" TEXT,
    "storageConditions" TEXT,
    "ppeRequired" JSONB NOT NULL DEFAULT '[]',
    "firstAidMeasures" JSONB,
    "firefightingMeasures" JSONB,
    "spillProcedures" TEXT,
    "disposalInfo" TEXT,
    "emergencyPhone" TEXT,
    "locations" JSONB NOT NULL DEFAULT '[]',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SafetySDSRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafetySDSRevision" (
    "id" TEXT NOT NULL,
    "sdsId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "documentUrl" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SafetySDSRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafetyMeeting" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "meetingNumber" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "topic" TEXT,
    "agenda" TEXT,
    "presenterId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "durationMinutes" INTEGER,
    "discussionNotes" TEXT,
    "actionItems" JSONB NOT NULL DEFAULT '[]',
    "materialsUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SafetyMeeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafetyMeetingAttendee" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "userId" TEXT,
    "attendeeName" TEXT,
    "attended" BOOLEAN NOT NULL DEFAULT false,
    "signedAt" TIMESTAMP(3),
    "signatureData" TEXT,

    CONSTRAINT "SafetyMeetingAttendee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafetyAudit" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "auditNumber" TEXT NOT NULL,
    "type" "AuditType" NOT NULL,
    "status" "AuditStatus" NOT NULL DEFAULT 'PLANNED',
    "title" TEXT NOT NULL,
    "scope" TEXT,
    "standard" TEXT,
    "locationIds" JSONB NOT NULL DEFAULT '[]',
    "leadAuditorId" TEXT,
    "leadAuditorName" TEXT,
    "auditTeam" JSONB NOT NULL DEFAULT '[]',
    "scheduledDate" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "reportUrl" TEXT,
    "executiveSummary" TEXT,
    "overallRating" TEXT,
    "nextAuditDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SafetyAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafetyAuditFinding" (
    "id" TEXT NOT NULL,
    "auditId" TEXT NOT NULL,
    "findingNumber" INTEGER NOT NULL,
    "severity" "AuditFindingSeverity" NOT NULL,
    "status" "AuditFindingStatus" NOT NULL DEFAULT 'OPEN',
    "clause" TEXT,
    "description" TEXT NOT NULL,
    "evidence" TEXT,
    "recommendation" TEXT,
    "capaId" TEXT,
    "closedAt" TIMESTAMP(3),
    "closureNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SafetyAuditFinding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafetyContractorCompany" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "insuranceExpiresAt" TIMESTAMP(3),
    "insuranceVerified" BOOLEAN NOT NULL DEFAULT false,
    "safetyProgramVerified" BOOLEAN NOT NULL DEFAULT false,
    "approvalStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SafetyContractorCompany_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafetyContractorWorker" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "badgeNumber" TEXT,
    "photoUrl" TEXT,
    "orientationCompletedAt" TIMESTAMP(3),
    "siteTrainingExpires" TIMESTAMP(3),
    "siteAccessApproved" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SafetyContractorWorker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafetyVisitorSignIn" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "visitorName" TEXT NOT NULL,
    "company" TEXT,
    "hostEmployeeId" TEXT,
    "hostName" TEXT,
    "purpose" TEXT,
    "badgeNumber" TEXT,
    "signedInAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "signedOutAt" TIMESTAMP(3),
    "orientationConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "nda_signed" BOOLEAN NOT NULL DEFAULT false,
    "photoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SafetyVisitorSignIn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafetyPPEMatrix" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "entries" JSONB NOT NULL,
    "effectiveDate" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SafetyPPEMatrix_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafetyAttachment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT,
    "fileSizeBytes" INTEGER,
    "storageUrl" TEXT NOT NULL,
    "storagePath" TEXT,
    "checksum" TEXT,
    "uploadedById" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT,
    "isEvidence" BOOLEAN NOT NULL DEFAULT false,
    "retainUntil" TIMESTAMP(3),

    CONSTRAINT "SafetyAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafetyAuditEvent" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "sequenceNumber" BIGSERIAL NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eventType" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "actorType" TEXT NOT NULL DEFAULT 'USER',
    "actorIpAddress" TEXT,
    "actorUserAgent" TEXT,
    "changes" JSONB,
    "previousState" JSONB,
    "newState" JSONB,
    "metadata" JSONB,
    "signatureData" TEXT,
    "previousHash" TEXT,
    "eventHash" TEXT NOT NULL,
    "integrityVerified" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "SafetyAuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafetyElectronicSignature" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "signerId" TEXT NOT NULL,
    "signerName" TEXT NOT NULL,
    "signerTitle" TEXT,
    "signedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "signatureType" TEXT NOT NULL,
    "attestationText" TEXT NOT NULL,
    "signatureMethod" TEXT NOT NULL DEFAULT 'PASSWORD',
    "signatureData" TEXT,
    "biometricHash" TEXT,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT,
    "deviceId" TEXT,
    "signatureHash" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "SafetyElectronicSignature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafetyJobHazardAnalysis" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "jhaNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "taskDescription" TEXT,
    "locationId" TEXT,
    "workCenterId" TEXT,
    "equipmentAssetIds" JSONB NOT NULL DEFAULT '[]',
    "status" "PolicyStatus" NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "steps" JSONB NOT NULL DEFAULT '[]',
    "overallRiskLevel" TEXT,
    "ppeRequired" JSONB NOT NULL DEFAULT '[]',
    "trainingRequired" JSONB NOT NULL DEFAULT '[]',
    "permitsRequired" JSONB NOT NULL DEFAULT '[]',
    "emergencyProcedure" TEXT,
    "reviewDate" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SafetyJobHazardAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_code_key" ON "Organization"("code");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerPreference_customerId_key" ON "CustomerPreference"("customerId");

-- CreateIndex
CREATE INDEX "CustomerPreference_customerId_idx" ON "CustomerPreference"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE INDEX "UserRoleAssignment_userId_idx" ON "UserRoleAssignment"("userId");

-- CreateIndex
CREATE INDEX "UserRoleAssignment_roleId_idx" ON "UserRoleAssignment"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "UserRoleAssignment_userId_roleId_key" ON "UserRoleAssignment"("userId", "roleId");

-- CreateIndex
CREATE INDEX "UserLocation_userId_idx" ON "UserLocation"("userId");

-- CreateIndex
CREATE INDEX "UserLocation_locationId_idx" ON "UserLocation"("locationId");

-- CreateIndex
CREATE UNIQUE INDEX "UserLocation_userId_locationId_key" ON "UserLocation"("userId", "locationId");

-- CreateIndex
CREATE INDEX "UserDivision_userId_idx" ON "UserDivision"("userId");

-- CreateIndex
CREATE INDEX "UserDivision_divisionId_idx" ON "UserDivision"("divisionId");

-- CreateIndex
CREATE UNIQUE INDEX "UserDivision_userId_divisionId_key" ON "UserDivision"("userId", "divisionId");

-- CreateIndex
CREATE UNIQUE INDEX "Division_code_key" ON "Division"("code");

-- CreateIndex
CREATE INDEX "ApprovalRequest_tenantId_status_idx" ON "ApprovalRequest"("tenantId", "status");

-- CreateIndex
CREATE INDEX "ApprovalRequest_requesterId_idx" ON "ApprovalRequest"("requesterId");

-- CreateIndex
CREATE INDEX "ApprovalDecision_requestId_idx" ON "ApprovalDecision"("requestId");

-- CreateIndex
CREATE INDEX "AuditLog_tenantId_timestamp_idx" ON "AuditLog"("tenantId", "timestamp");

-- CreateIndex
CREATE INDEX "AuditLog_userId_timestamp_idx" ON "AuditLog"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "AuditLog_category_eventType_idx" ON "AuditLog"("category", "eventType");

-- CreateIndex
CREATE INDEX "AuditLog_resourceType_resourceId_idx" ON "AuditLog"("resourceType", "resourceId");

-- CreateIndex
CREATE UNIQUE INDEX "Grade_code_key" ON "Grade"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "Heat_heatNumber_key" ON "Heat"("heatNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Coil_coilNumber_key" ON "Coil"("coilNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Location_code_key" ON "Location"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Inventory_coilId_key" ON "Inventory"("coilId");

-- CreateIndex
CREATE UNIQUE INDEX "RFQ_rfqNumber_key" ON "RFQ"("rfqNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Quote_quoteNumber_key" ON "Quote"("quoteNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Quote_convertedOrderId_key" ON "Quote"("convertedOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "Operator_userId_key" ON "Operator"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Operator_employeeCode_key" ON "Operator"("employeeCode");

-- CreateIndex
CREATE INDEX "Operator_homeLocationId_idx" ON "Operator"("homeLocationId");

-- CreateIndex
CREATE INDEX "Operator_status_idx" ON "Operator"("status");

-- CreateIndex
CREATE INDEX "OperatorSkill_workCenterTypeId_idx" ON "OperatorSkill"("workCenterTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "OperatorSkill_operatorId_workCenterTypeId_key" ON "OperatorSkill"("operatorId", "workCenterTypeId");

-- CreateIndex
CREATE INDEX "Shift_operatorId_shiftDate_idx" ON "Shift"("operatorId", "shiftDate");

-- CreateIndex
CREATE INDEX "Shift_locationId_shiftDate_idx" ON "Shift"("locationId", "shiftDate");

-- CreateIndex
CREATE UNIQUE INDEX "DispatchJob_jobId_key" ON "DispatchJob"("jobId");

-- CreateIndex
CREATE INDEX "DispatchJob_locationId_idx" ON "DispatchJob"("locationId");

-- CreateIndex
CREATE INDEX "DispatchJob_jobNumber_idx" ON "DispatchJob"("jobNumber");

-- CreateIndex
CREATE INDEX "DispatchOperation_dispatchJobId_idx" ON "DispatchOperation"("dispatchJobId");

-- CreateIndex
CREATE INDEX "DispatchOperation_assignedWorkCenterId_idx" ON "DispatchOperation"("assignedWorkCenterId");

-- CreateIndex
CREATE INDEX "DispatchOperation_status_idx" ON "DispatchOperation"("status");

-- CreateIndex
CREATE UNIQUE INDEX "DispatchOperation_dispatchJobId_sequence_key" ON "DispatchOperation"("dispatchJobId", "sequence");

-- CreateIndex
CREATE INDEX "DispatchTimeLog_dispatchOperationId_idx" ON "DispatchTimeLog"("dispatchOperationId");

-- CreateIndex
CREATE INDEX "DispatchTimeLog_operatorId_idx" ON "DispatchTimeLog"("operatorId");

-- CreateIndex
CREATE INDEX "DispatchTimeLog_status_idx" ON "DispatchTimeLog"("status");

-- CreateIndex
CREATE UNIQUE INDEX "JobInspection_inspectionNumber_key" ON "JobInspection"("inspectionNumber");

-- CreateIndex
CREATE INDEX "JobInspection_jobId_idx" ON "JobInspection"("jobId");

-- CreateIndex
CREATE INDEX "JobInspection_inspectorId_idx" ON "JobInspection"("inspectorId");

-- CreateIndex
CREATE INDEX "JobInspection_status_idx" ON "JobInspection"("status");

-- CreateIndex
CREATE UNIQUE INDEX "WorkCenter_code_key" ON "WorkCenter"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Job_jobNumber_key" ON "Job"("jobNumber");

-- CreateIndex
CREATE INDEX "Job_recipeId_idx" ON "Job"("recipeId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "WorkOrder_woNumber_key" ON "WorkOrder"("woNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Shipment_shipmentNumber_key" ON "Shipment"("shipmentNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");

-- CreateIndex
CREATE INDEX "CommodityPrice_indexCode_effectiveDate_idx" ON "CommodityPrice"("indexCode", "effectiveDate");

-- CreateIndex
CREATE INDEX "BomRecipe_code_version_idx" ON "BomRecipe"("code", "version");

-- CreateIndex
CREATE INDEX "BomRecipe_status_idx" ON "BomRecipe"("status");

-- CreateIndex
CREATE INDEX "BomRecipe_materialCode_idx" ON "BomRecipe"("materialCode");

-- CreateIndex
CREATE INDEX "BomRecipe_commodity_form_grade_idx" ON "BomRecipe"("commodity", "form", "grade");

-- CreateIndex
CREATE INDEX "BomOperation_recipeId_sequence_idx" ON "BomOperation"("recipeId", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "Asset_assetNumber_key" ON "Asset"("assetNumber");

-- CreateIndex
CREATE INDEX "Asset_assetNumber_idx" ON "Asset"("assetNumber");

-- CreateIndex
CREATE INDEX "Asset_siteId_idx" ON "Asset"("siteId");

-- CreateIndex
CREATE INDEX "Asset_status_idx" ON "Asset"("status");

-- CreateIndex
CREATE INDEX "Asset_criticality_idx" ON "Asset"("criticality");

-- CreateIndex
CREATE INDEX "Asset_assetTypeId_idx" ON "Asset"("assetTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "AssetType_code_key" ON "AssetType"("code");

-- CreateIndex
CREATE INDEX "AssetType_code_idx" ON "AssetType"("code");

-- CreateIndex
CREATE INDEX "AssetType_category_idx" ON "AssetType"("category");

-- CreateIndex
CREATE INDEX "AssetComponent_assetId_idx" ON "AssetComponent"("assetId");

-- CreateIndex
CREATE INDEX "MeterReading_assetId_meterType_idx" ON "MeterReading"("assetId", "meterType");

-- CreateIndex
CREATE INDEX "MeterReading_readingDate_idx" ON "MeterReading"("readingDate");

-- CreateIndex
CREATE UNIQUE INDEX "MaintenanceOrder_woNumber_key" ON "MaintenanceOrder"("woNumber");

-- CreateIndex
CREATE INDEX "MaintenanceOrder_woNumber_idx" ON "MaintenanceOrder"("woNumber");

-- CreateIndex
CREATE INDEX "MaintenanceOrder_assetId_idx" ON "MaintenanceOrder"("assetId");

-- CreateIndex
CREATE INDEX "MaintenanceOrder_status_idx" ON "MaintenanceOrder"("status");

-- CreateIndex
CREATE INDEX "MaintenanceOrder_type_idx" ON "MaintenanceOrder"("type");

-- CreateIndex
CREATE INDEX "MaintenanceOrder_priority_idx" ON "MaintenanceOrder"("priority");

-- CreateIndex
CREATE INDEX "MaintenanceOrder_scheduledStart_idx" ON "MaintenanceOrder"("scheduledStart");

-- CreateIndex
CREATE INDEX "MaintenanceTask_maintenanceOrderId_sequence_idx" ON "MaintenanceTask"("maintenanceOrderId", "sequence");

-- CreateIndex
CREATE INDEX "MaintenanceOrderPart_maintenanceOrderId_idx" ON "MaintenanceOrderPart"("maintenanceOrderId");

-- CreateIndex
CREATE INDEX "MaintenanceOrderLabor_maintenanceOrderId_idx" ON "MaintenanceOrderLabor"("maintenanceOrderId");

-- CreateIndex
CREATE INDEX "MaintenanceAttachment_maintenanceOrderId_idx" ON "MaintenanceAttachment"("maintenanceOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "PMTemplate_code_key" ON "PMTemplate"("code");

-- CreateIndex
CREATE INDEX "PMTemplate_code_idx" ON "PMTemplate"("code");

-- CreateIndex
CREATE INDEX "PMTemplate_assetTypeId_idx" ON "PMTemplate"("assetTypeId");

-- CreateIndex
CREATE INDEX "PMSchedule_assetId_idx" ON "PMSchedule"("assetId");

-- CreateIndex
CREATE INDEX "PMSchedule_nextDueDate_idx" ON "PMSchedule"("nextDueDate");

-- CreateIndex
CREATE INDEX "PMSchedule_status_idx" ON "PMSchedule"("status");

-- CreateIndex
CREATE INDEX "DowntimeRecord_assetId_idx" ON "DowntimeRecord"("assetId");

-- CreateIndex
CREATE INDEX "DowntimeRecord_startTime_idx" ON "DowntimeRecord"("startTime");

-- CreateIndex
CREATE INDEX "DowntimeRecord_type_idx" ON "DowntimeRecord"("type");

-- CreateIndex
CREATE UNIQUE INDEX "SparePart_partNumber_key" ON "SparePart"("partNumber");

-- CreateIndex
CREATE INDEX "SparePart_partNumber_idx" ON "SparePart"("partNumber");

-- CreateIndex
CREATE INDEX "SparePart_category_idx" ON "SparePart"("category");

-- CreateIndex
CREATE INDEX "SparePart_assetId_idx" ON "SparePart"("assetId");

-- CreateIndex
CREATE INDEX "SparePartTransaction_sparePartId_idx" ON "SparePartTransaction"("sparePartId");

-- CreateIndex
CREATE INDEX "SparePartTransaction_performedAt_idx" ON "SparePartTransaction"("performedAt");

-- CreateIndex
CREATE INDEX "MaintenanceAuditLog_entityType_entityId_idx" ON "MaintenanceAuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "MaintenanceAuditLog_userId_idx" ON "MaintenanceAuditLog"("userId");

-- CreateIndex
CREATE INDEX "MaintenanceAuditLog_occurredAt_idx" ON "MaintenanceAuditLog"("occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerPricingTier_customerId_key" ON "CustomerPricingTier"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "QuoteAcceptance_quoteId_key" ON "QuoteAcceptance"("quoteId");

-- CreateIndex
CREATE UNIQUE INDEX "RFQSource_rfqId_key" ON "RFQSource"("rfqId");

-- CreateIndex
CREATE UNIQUE INDEX "PricingAnalytics_period_customerId_productCategory_location_key" ON "PricingAnalytics"("period", "customerId", "productCategory", "locationId");

-- CreateIndex
CREATE UNIQUE INDEX "DropTag_dropTagId_key" ON "DropTag"("dropTagId");

-- CreateIndex
CREATE INDEX "DropTag_packageId_idx" ON "DropTag"("packageId");

-- CreateIndex
CREATE INDEX "DropTag_shipmentId_idx" ON "DropTag"("shipmentId");

-- CreateIndex
CREATE INDEX "DropTag_orderId_idx" ON "DropTag"("orderId");

-- CreateIndex
CREATE INDEX "DropTag_customerId_idx" ON "DropTag"("customerId");

-- CreateIndex
CREATE INDEX "DropTag_heatNumber_idx" ON "DropTag"("heatNumber");

-- CreateIndex
CREATE INDEX "DropTag_status_idx" ON "DropTag"("status");

-- CreateIndex
CREATE INDEX "DropTag_dropTagId_idx" ON "DropTag"("dropTagId");

-- CreateIndex
CREATE UNIQUE INDEX "DropTagListing_listingId_key" ON "DropTagListing"("listingId");

-- CreateIndex
CREATE INDEX "DropTagListing_shipmentId_idx" ON "DropTagListing"("shipmentId");

-- CreateIndex
CREATE INDEX "DropTagListing_originLocationId_idx" ON "DropTagListing"("originLocationId");

-- CreateIndex
CREATE INDEX "DropTagListing_status_idx" ON "DropTagListing"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Package_packageId_key" ON "Package"("packageId");

-- CreateIndex
CREATE INDEX "Package_status_idx" ON "Package"("status");

-- CreateIndex
CREATE INDEX "Package_orderId_idx" ON "Package"("orderId");

-- CreateIndex
CREATE INDEX "Package_currentLocationId_idx" ON "Package"("currentLocationId");

-- CreateIndex
CREATE INDEX "Package_packageId_idx" ON "Package"("packageId");

-- CreateIndex
CREATE INDEX "PackageItem_packageId_idx" ON "PackageItem"("packageId");

-- CreateIndex
CREATE INDEX "PackageItem_inventoryLotId_idx" ON "PackageItem"("inventoryLotId");

-- CreateIndex
CREATE INDEX "PackageItem_coilId_idx" ON "PackageItem"("coilId");

-- CreateIndex
CREATE INDEX "TagIdentifier_dropTagId_idx" ON "TagIdentifier"("dropTagId");

-- CreateIndex
CREATE UNIQUE INDEX "TagIdentifier_identifierType_identifierValue_key" ON "TagIdentifier"("identifierType", "identifierValue");

-- CreateIndex
CREATE UNIQUE INDEX "LabelTemplate_code_key" ON "LabelTemplate"("code");

-- CreateIndex
CREATE INDEX "LabelTemplate_code_idx" ON "LabelTemplate"("code");

-- CreateIndex
CREATE INDEX "LabelTemplate_customerId_idx" ON "LabelTemplate"("customerId");

-- CreateIndex
CREATE INDEX "LabelTemplate_templateType_idx" ON "LabelTemplate"("templateType");

-- CreateIndex
CREATE UNIQUE INDEX "TraceEvent_eventId_key" ON "TraceEvent"("eventId");

-- CreateIndex
CREATE INDEX "TraceEvent_resourceType_resourceId_idx" ON "TraceEvent"("resourceType", "resourceId");

-- CreateIndex
CREATE INDEX "TraceEvent_eventType_idx" ON "TraceEvent"("eventType");

-- CreateIndex
CREATE INDEX "TraceEvent_actorUserId_idx" ON "TraceEvent"("actorUserId");

-- CreateIndex
CREATE INDEX "TraceEvent_orderId_idx" ON "TraceEvent"("orderId");

-- CreateIndex
CREATE INDEX "TraceEvent_shipmentId_idx" ON "TraceEvent"("shipmentId");

-- CreateIndex
CREATE INDEX "TraceEvent_correlationId_idx" ON "TraceEvent"("correlationId");

-- CreateIndex
CREATE INDEX "TraceEvent_occurredAt_idx" ON "TraceEvent"("occurredAt");

-- CreateIndex
CREATE INDEX "TraceEvent_dropTagId_idx" ON "TraceEvent"("dropTagId");

-- CreateIndex
CREATE INDEX "CustomerTagRequirement_customerId_idx" ON "CustomerTagRequirement"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerTagRequirement_customerId_key" ON "CustomerTagRequirement"("customerId");

-- CreateIndex
CREATE INDEX "Partner_partnerType_idx" ON "Partner"("partnerType");

-- CreateIndex
CREATE INDEX "Partner_status_idx" ON "Partner"("status");

-- CreateIndex
CREATE INDEX "Partner_tier_idx" ON "Partner"("tier");

-- CreateIndex
CREATE UNIQUE INDEX "Partner_organizationId_partnerType_key" ON "Partner"("organizationId", "partnerType");

-- CreateIndex
CREATE INDEX "PartnerApiKey_partnerId_idx" ON "PartnerApiKey"("partnerId");

-- CreateIndex
CREATE INDEX "PartnerApiKey_status_idx" ON "PartnerApiKey"("status");

-- CreateIndex
CREATE INDEX "PartnerApiKey_environment_idx" ON "PartnerApiKey"("environment");

-- CreateIndex
CREATE INDEX "PartnerWebhook_partnerId_idx" ON "PartnerWebhook"("partnerId");

-- CreateIndex
CREATE INDEX "PartnerWebhook_status_idx" ON "PartnerWebhook"("status");

-- CreateIndex
CREATE INDEX "WebhookDelivery_webhookId_idx" ON "WebhookDelivery"("webhookId");

-- CreateIndex
CREATE INDEX "WebhookDelivery_eventId_idx" ON "WebhookDelivery"("eventId");

-- CreateIndex
CREATE INDEX "WebhookDelivery_status_idx" ON "WebhookDelivery"("status");

-- CreateIndex
CREATE INDEX "WebhookDelivery_nextRetryAt_idx" ON "WebhookDelivery"("nextRetryAt");

-- CreateIndex
CREATE INDEX "PartnerApiLog_partnerId_idx" ON "PartnerApiLog"("partnerId");

-- CreateIndex
CREATE INDEX "PartnerApiLog_endpoint_idx" ON "PartnerApiLog"("endpoint");

-- CreateIndex
CREATE INDEX "PartnerApiLog_statusCode_idx" ON "PartnerApiLog"("statusCode");

-- CreateIndex
CREATE INDEX "PartnerApiLog_createdAt_idx" ON "PartnerApiLog"("createdAt");

-- CreateIndex
CREATE INDEX "PartnerApiLog_apiKeyId_idx" ON "PartnerApiLog"("apiKeyId");

-- CreateIndex
CREATE INDEX "SafetyPolicyDocument_tenantId_status_idx" ON "SafetyPolicyDocument"("tenantId", "status");

-- CreateIndex
CREATE INDEX "SafetyPolicyDocument_type_idx" ON "SafetyPolicyDocument"("type");

-- CreateIndex
CREATE UNIQUE INDEX "SafetyPolicyDocument_tenantId_code_version_key" ON "SafetyPolicyDocument"("tenantId", "code", "version");

-- CreateIndex
CREATE INDEX "SafetyPolicyAcknowledgement_userId_idx" ON "SafetyPolicyAcknowledgement"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SafetyPolicyAcknowledgement_policyId_userId_key" ON "SafetyPolicyAcknowledgement"("policyId", "userId");

-- CreateIndex
CREATE INDEX "SafetyTrainingCourse_tenantId_category_idx" ON "SafetyTrainingCourse"("tenantId", "category");

-- CreateIndex
CREATE INDEX "SafetyTrainingCourse_isActive_idx" ON "SafetyTrainingCourse"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "SafetyTrainingCourse_tenantId_code_version_key" ON "SafetyTrainingCourse"("tenantId", "code", "version");

-- CreateIndex
CREATE INDEX "SafetyTrainingAssignment_tenantId_status_idx" ON "SafetyTrainingAssignment"("tenantId", "status");

-- CreateIndex
CREATE INDEX "SafetyTrainingAssignment_userId_status_idx" ON "SafetyTrainingAssignment"("userId", "status");

-- CreateIndex
CREATE INDEX "SafetyTrainingAssignment_dueDate_idx" ON "SafetyTrainingAssignment"("dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "SafetyTrainingAssignment_courseId_userId_dueDate_key" ON "SafetyTrainingAssignment"("courseId", "userId", "dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "SafetyTrainingCompletion_assignmentId_key" ON "SafetyTrainingCompletion"("assignmentId");

-- CreateIndex
CREATE INDEX "SafetyTrainingCompletion_userId_courseId_idx" ON "SafetyTrainingCompletion"("userId", "courseId");

-- CreateIndex
CREATE INDEX "SafetyTrainingCompletion_expiresAt_idx" ON "SafetyTrainingCompletion"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "SafetyIncident_incidentNumber_key" ON "SafetyIncident"("incidentNumber");

-- CreateIndex
CREATE INDEX "SafetyIncident_tenantId_status_idx" ON "SafetyIncident"("tenantId", "status");

-- CreateIndex
CREATE INDEX "SafetyIncident_locationId_idx" ON "SafetyIncident"("locationId");

-- CreateIndex
CREATE INDEX "SafetyIncident_occurredAt_idx" ON "SafetyIncident"("occurredAt");

-- CreateIndex
CREATE INDEX "SafetyIncident_oshaRecordable_idx" ON "SafetyIncident"("oshaRecordable");

-- CreateIndex
CREATE INDEX "SafetyIncident_type_idx" ON "SafetyIncident"("type");

-- CreateIndex
CREATE UNIQUE INDEX "SafetyIncidentInvestigation_incidentId_key" ON "SafetyIncidentInvestigation"("incidentId");

-- CreateIndex
CREATE INDEX "SafetyIncidentInvestigation_leadInvestigatorId_idx" ON "SafetyIncidentInvestigation"("leadInvestigatorId");

-- CreateIndex
CREATE INDEX "SafetyIncidentInvestigation_dueDate_idx" ON "SafetyIncidentInvestigation"("dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "SafetyInjuryDetails_incidentId_key" ON "SafetyInjuryDetails"("incidentId");

-- CreateIndex
CREATE UNIQUE INDEX "SafetyCorrectiveAction_capaNumber_key" ON "SafetyCorrectiveAction"("capaNumber");

-- CreateIndex
CREATE INDEX "SafetyCorrectiveAction_tenantId_status_idx" ON "SafetyCorrectiveAction"("tenantId", "status");

-- CreateIndex
CREATE INDEX "SafetyCorrectiveAction_assignedToId_status_idx" ON "SafetyCorrectiveAction"("assignedToId", "status");

-- CreateIndex
CREATE INDEX "SafetyCorrectiveAction_dueDate_idx" ON "SafetyCorrectiveAction"("dueDate");

-- CreateIndex
CREATE INDEX "SafetyCorrectiveAction_priority_idx" ON "SafetyCorrectiveAction"("priority");

-- CreateIndex
CREATE INDEX "SafetyInspectionTemplate_tenantId_type_idx" ON "SafetyInspectionTemplate"("tenantId", "type");

-- CreateIndex
CREATE INDEX "SafetyInspectionTemplate_isActive_idx" ON "SafetyInspectionTemplate"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "SafetyInspectionTemplate_tenantId_code_version_key" ON "SafetyInspectionTemplate"("tenantId", "code", "version");

-- CreateIndex
CREATE UNIQUE INDEX "SafetyInspection_inspectionNumber_key" ON "SafetyInspection"("inspectionNumber");

-- CreateIndex
CREATE INDEX "SafetyInspection_tenantId_status_idx" ON "SafetyInspection"("tenantId", "status");

-- CreateIndex
CREATE INDEX "SafetyInspection_scheduledDate_idx" ON "SafetyInspection"("scheduledDate");

-- CreateIndex
CREATE INDEX "SafetyInspection_locationId_idx" ON "SafetyInspection"("locationId");

-- CreateIndex
CREATE INDEX "SafetyInspection_assetId_idx" ON "SafetyInspection"("assetId");

-- CreateIndex
CREATE INDEX "SafetyInspection_type_idx" ON "SafetyInspection"("type");

-- CreateIndex
CREATE INDEX "SafetyInspectionDefect_inspectionId_idx" ON "SafetyInspectionDefect"("inspectionId");

-- CreateIndex
CREATE INDEX "SafetyInspectionDefect_severity_status_idx" ON "SafetyInspectionDefect"("severity", "status");

-- CreateIndex
CREATE UNIQUE INDEX "SafetyPermit_permitNumber_key" ON "SafetyPermit"("permitNumber");

-- CreateIndex
CREATE INDEX "SafetyPermit_tenantId_status_idx" ON "SafetyPermit"("tenantId", "status");

-- CreateIndex
CREATE INDEX "SafetyPermit_type_idx" ON "SafetyPermit"("type");

-- CreateIndex
CREATE INDEX "SafetyPermit_locationId_idx" ON "SafetyPermit"("locationId");

-- CreateIndex
CREATE INDEX "SafetyPermit_validTo_idx" ON "SafetyPermit"("validTo");

-- CreateIndex
CREATE UNIQUE INDEX "SafetyPermitLoto_permitId_key" ON "SafetyPermitLoto"("permitId");

-- CreateIndex
CREATE UNIQUE INDEX "SafetyPermitHotWork_permitId_key" ON "SafetyPermitHotWork"("permitId");

-- CreateIndex
CREATE UNIQUE INDEX "SafetyPermitElectrical_permitId_key" ON "SafetyPermitElectrical"("permitId");

-- CreateIndex
CREATE UNIQUE INDEX "SafetyPermitConfinedSpace_permitId_key" ON "SafetyPermitConfinedSpace"("permitId");

-- CreateIndex
CREATE INDEX "SafetyPermitSignoff_permitId_idx" ON "SafetyPermitSignoff"("permitId");

-- CreateIndex
CREATE INDEX "SafetyPermitSignoff_userId_idx" ON "SafetyPermitSignoff"("userId");

-- CreateIndex
CREATE INDEX "SafetyLotoProcedure_equipmentAssetId_idx" ON "SafetyLotoProcedure"("equipmentAssetId");

-- CreateIndex
CREATE INDEX "SafetyLotoProcedure_tenantId_status_idx" ON "SafetyLotoProcedure"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "SafetyLotoProcedure_tenantId_procedureNumber_version_key" ON "SafetyLotoProcedure"("tenantId", "procedureNumber", "version");

-- CreateIndex
CREATE UNIQUE INDEX "SafetyObservation_observationNumber_key" ON "SafetyObservation"("observationNumber");

-- CreateIndex
CREATE INDEX "SafetyObservation_tenantId_type_idx" ON "SafetyObservation"("tenantId", "type");

-- CreateIndex
CREATE INDEX "SafetyObservation_locationId_idx" ON "SafetyObservation"("locationId");

-- CreateIndex
CREATE INDEX "SafetyObservation_observedAt_idx" ON "SafetyObservation"("observedAt");

-- CreateIndex
CREATE INDEX "SafetyObservation_category_idx" ON "SafetyObservation"("category");

-- CreateIndex
CREATE UNIQUE INDEX "SafetyStopWorkEvent_stopWorkNumber_key" ON "SafetyStopWorkEvent"("stopWorkNumber");

-- CreateIndex
CREATE INDEX "SafetyStopWorkEvent_tenantId_status_idx" ON "SafetyStopWorkEvent"("tenantId", "status");

-- CreateIndex
CREATE INDEX "SafetyStopWorkEvent_locationId_idx" ON "SafetyStopWorkEvent"("locationId");

-- CreateIndex
CREATE INDEX "SafetyStopWorkEvent_issuedAt_idx" ON "SafetyStopWorkEvent"("issuedAt");

-- CreateIndex
CREATE INDEX "SafetyEquipmentAsset_locationId_idx" ON "SafetyEquipmentAsset"("locationId");

-- CreateIndex
CREATE INDEX "SafetyEquipmentAsset_safetyStatus_idx" ON "SafetyEquipmentAsset"("safetyStatus");

-- CreateIndex
CREATE INDEX "SafetyEquipmentAsset_nextInspectionDue_idx" ON "SafetyEquipmentAsset"("nextInspectionDue");

-- CreateIndex
CREATE UNIQUE INDEX "SafetyEquipmentAsset_tenantId_assetNumber_key" ON "SafetyEquipmentAsset"("tenantId", "assetNumber");

-- CreateIndex
CREATE INDEX "SafetyEquipmentGuard_assetId_idx" ON "SafetyEquipmentGuard"("assetId");

-- CreateIndex
CREATE INDEX "SafetySDSRecord_tenantId_productName_idx" ON "SafetySDSRecord"("tenantId", "productName");

-- CreateIndex
CREATE INDEX "SafetySDSRecord_casNumber_idx" ON "SafetySDSRecord"("casNumber");

-- CreateIndex
CREATE INDEX "SafetySDSRecord_isActive_idx" ON "SafetySDSRecord"("isActive");

-- CreateIndex
CREATE INDEX "SafetySDSRevision_effectiveDate_idx" ON "SafetySDSRevision"("effectiveDate");

-- CreateIndex
CREATE UNIQUE INDEX "SafetySDSRevision_sdsId_version_key" ON "SafetySDSRevision"("sdsId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "SafetyMeeting_meetingNumber_key" ON "SafetyMeeting"("meetingNumber");

-- CreateIndex
CREATE INDEX "SafetyMeeting_tenantId_scheduledAt_idx" ON "SafetyMeeting"("tenantId", "scheduledAt");

-- CreateIndex
CREATE INDEX "SafetyMeeting_locationId_idx" ON "SafetyMeeting"("locationId");

-- CreateIndex
CREATE INDEX "SafetyMeeting_type_idx" ON "SafetyMeeting"("type");

-- CreateIndex
CREATE INDEX "SafetyMeetingAttendee_userId_idx" ON "SafetyMeetingAttendee"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SafetyMeetingAttendee_meetingId_userId_key" ON "SafetyMeetingAttendee"("meetingId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "SafetyAudit_auditNumber_key" ON "SafetyAudit"("auditNumber");

-- CreateIndex
CREATE INDEX "SafetyAudit_tenantId_status_idx" ON "SafetyAudit"("tenantId", "status");

-- CreateIndex
CREATE INDEX "SafetyAudit_type_idx" ON "SafetyAudit"("type");

-- CreateIndex
CREATE INDEX "SafetyAudit_scheduledDate_idx" ON "SafetyAudit"("scheduledDate");

-- CreateIndex
CREATE INDEX "SafetyAuditFinding_auditId_idx" ON "SafetyAuditFinding"("auditId");

-- CreateIndex
CREATE INDEX "SafetyAuditFinding_severity_status_idx" ON "SafetyAuditFinding"("severity", "status");

-- CreateIndex
CREATE INDEX "SafetyContractorCompany_tenantId_approvalStatus_idx" ON "SafetyContractorCompany"("tenantId", "approvalStatus");

-- CreateIndex
CREATE INDEX "SafetyContractorCompany_insuranceExpiresAt_idx" ON "SafetyContractorCompany"("insuranceExpiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "SafetyContractorCompany_tenantId_companyName_key" ON "SafetyContractorCompany"("tenantId", "companyName");

-- CreateIndex
CREATE INDEX "SafetyContractorWorker_companyId_idx" ON "SafetyContractorWorker"("companyId");

-- CreateIndex
CREATE INDEX "SafetyContractorWorker_siteTrainingExpires_idx" ON "SafetyContractorWorker"("siteTrainingExpires");

-- CreateIndex
CREATE INDEX "SafetyVisitorSignIn_tenantId_locationId_signedInAt_idx" ON "SafetyVisitorSignIn"("tenantId", "locationId", "signedInAt");

-- CreateIndex
CREATE INDEX "SafetyVisitorSignIn_signedOutAt_idx" ON "SafetyVisitorSignIn"("signedOutAt");

-- CreateIndex
CREATE UNIQUE INDEX "SafetyPPEMatrix_tenantId_name_version_key" ON "SafetyPPEMatrix"("tenantId", "name", "version");

-- CreateIndex
CREATE INDEX "SafetyAttachment_entityType_entityId_idx" ON "SafetyAttachment"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "SafetyAttachment_tenantId_idx" ON "SafetyAttachment"("tenantId");

-- CreateIndex
CREATE INDEX "SafetyAttachment_retainUntil_idx" ON "SafetyAttachment"("retainUntil");

-- CreateIndex
CREATE INDEX "SafetyAuditEvent_tenantId_timestamp_idx" ON "SafetyAuditEvent"("tenantId", "timestamp");

-- CreateIndex
CREATE INDEX "SafetyAuditEvent_resourceType_resourceId_idx" ON "SafetyAuditEvent"("resourceType", "resourceId");

-- CreateIndex
CREATE INDEX "SafetyAuditEvent_actorId_idx" ON "SafetyAuditEvent"("actorId");

-- CreateIndex
CREATE INDEX "SafetyAuditEvent_eventType_idx" ON "SafetyAuditEvent"("eventType");

-- CreateIndex
CREATE INDEX "SafetyAuditEvent_sequenceNumber_idx" ON "SafetyAuditEvent"("sequenceNumber");

-- CreateIndex
CREATE INDEX "SafetyElectronicSignature_resourceType_resourceId_idx" ON "SafetyElectronicSignature"("resourceType", "resourceId");

-- CreateIndex
CREATE INDEX "SafetyElectronicSignature_signerId_idx" ON "SafetyElectronicSignature"("signerId");

-- CreateIndex
CREATE INDEX "SafetyElectronicSignature_signedAt_idx" ON "SafetyElectronicSignature"("signedAt");

-- CreateIndex
CREATE UNIQUE INDEX "SafetyJobHazardAnalysis_jhaNumber_key" ON "SafetyJobHazardAnalysis"("jhaNumber");

-- CreateIndex
CREATE INDEX "SafetyJobHazardAnalysis_tenantId_status_idx" ON "SafetyJobHazardAnalysis"("tenantId", "status");

-- CreateIndex
CREATE INDEX "SafetyJobHazardAnalysis_workCenterId_idx" ON "SafetyJobHazardAnalysis"("workCenterId");

-- CreateIndex
CREATE UNIQUE INDEX "SafetyJobHazardAnalysis_tenantId_jhaNumber_version_key" ON "SafetyJobHazardAnalysis"("tenantId", "jhaNumber", "version");

-- AddForeignKey
ALTER TABLE "CustomerPreference" ADD CONSTRAINT "CustomerPreference_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_homeLocationId_fkey" FOREIGN KEY ("homeLocationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRoleAssignment" ADD CONSTRAINT "UserRoleAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRoleAssignment" ADD CONSTRAINT "UserRoleAssignment_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserLocation" ADD CONSTRAINT "UserLocation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserLocation" ADD CONSTRAINT "UserLocation_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDivision" ADD CONSTRAINT "UserDivision_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDivision" ADD CONSTRAINT "UserDivision_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "Division"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalDecision" ADD CONSTRAINT "ApprovalDecision_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "ApprovalRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalDecision" ADD CONSTRAINT "ApprovalDecision_deciderId_fkey" FOREIGN KEY ("deciderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "Grade"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Heat" ADD CONSTRAINT "Heat_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Heat" ADD CONSTRAINT "Heat_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "Grade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Heat" ADD CONSTRAINT "Heat_millId_fkey" FOREIGN KEY ("millId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Heat" ADD CONSTRAINT "Heat_mtrDocumentId_fkey" FOREIGN KEY ("mtrDocumentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Coil" ADD CONSTRAINT "Coil_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Coil" ADD CONSTRAINT "Coil_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "Grade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Coil" ADD CONSTRAINT "Coil_heatId_fkey" FOREIGN KEY ("heatId") REFERENCES "Heat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Coil" ADD CONSTRAINT "Coil_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Coil" ADD CONSTRAINT "Coil_originOrderId_fkey" FOREIGN KEY ("originOrderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Coil" ADD CONSTRAINT "Coil_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Coil" ADD CONSTRAINT "Coil_parentCoilId_fkey" FOREIGN KEY ("parentCoilId") REFERENCES "Coil"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Coil" ADD CONSTRAINT "Coil_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_coilId_fkey" FOREIGN KEY ("coilId") REFERENCES "Coil"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialMovement" ADD CONSTRAINT "MaterialMovement_coilId_fkey" FOREIGN KEY ("coilId") REFERENCES "Coil"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialMovement" ADD CONSTRAINT "MaterialMovement_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialMovement" ADD CONSTRAINT "MaterialMovement_fromLocationId_fkey" FOREIGN KEY ("fromLocationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialMovement" ADD CONSTRAINT "MaterialMovement_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialMovement" ADD CONSTRAINT "MaterialMovement_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialMovement" ADD CONSTRAINT "MaterialMovement_toLocationId_fkey" FOREIGN KEY ("toLocationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialMovement" ADD CONSTRAINT "MaterialMovement_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestResult" ADD CONSTRAINT "TestResult_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestResult" ADD CONSTRAINT "TestResult_coilId_fkey" FOREIGN KEY ("coilId") REFERENCES "Coil"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestResult" ADD CONSTRAINT "TestResult_heatId_fkey" FOREIGN KEY ("heatId") REFERENCES "Heat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestResult" ADD CONSTRAINT "TestResult_testedById_fkey" FOREIGN KEY ("testedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QCHold" ADD CONSTRAINT "QCHold_coilId_fkey" FOREIGN KEY ("coilId") REFERENCES "Coil"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QCHold" ADD CONSTRAINT "QCHold_holdById_fkey" FOREIGN KEY ("holdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QCHold" ADD CONSTRAINT "QCHold_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFQ" ADD CONSTRAINT "RFQ_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFQLine" ADD CONSTRAINT "RFQLine_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "RFQ"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_convertedOrderId_fkey" FOREIGN KEY ("convertedOrderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "RFQ"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteLine" ADD CONSTRAINT "QuoteLine_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteLine" ADD CONSTRAINT "QuoteLine_rfqLineId_fkey" FOREIGN KEY ("rfqLineId") REFERENCES "RFQLine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Operator" ADD CONSTRAINT "Operator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Operator" ADD CONSTRAINT "Operator_homeLocationId_fkey" FOREIGN KEY ("homeLocationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Operator" ADD CONSTRAINT "Operator_homeWorkCenterId_fkey" FOREIGN KEY ("homeWorkCenterId") REFERENCES "WorkCenter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperatorSkill" ADD CONSTRAINT "OperatorSkill_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "Operator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "Operator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispatchJob" ADD CONSTRAINT "DispatchJob_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispatchOperation" ADD CONSTRAINT "DispatchOperation_dispatchJobId_fkey" FOREIGN KEY ("dispatchJobId") REFERENCES "DispatchJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispatchTimeLog" ADD CONSTRAINT "DispatchTimeLog_dispatchOperationId_fkey" FOREIGN KEY ("dispatchOperationId") REFERENCES "DispatchOperation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobInspection" ADD CONSTRAINT "JobInspection_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobInspection" ADD CONSTRAINT "JobInspection_inspectorId_fkey" FOREIGN KEY ("inspectorId") REFERENCES "Operator"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkCenter" ADD CONSTRAINT "WorkCenter_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "BomRecipe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_workCenterId_fkey" FOREIGN KEY ("workCenterId") REFERENCES "WorkCenter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderLine" ADD CONSTRAINT "OrderLine_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "Grade"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderLine" ADD CONSTRAINT "OrderLine_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderLine" ADD CONSTRAINT "OrderLine_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderLineAllocation" ADD CONSTRAINT "OrderLineAllocation_coilId_fkey" FOREIGN KEY ("coilId") REFERENCES "Coil"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderLineAllocation" ADD CONSTRAINT "OrderLineAllocation_orderLineId_fkey" FOREIGN KEY ("orderLineId") REFERENCES "OrderLine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrder" ADD CONSTRAINT "WorkOrder_sourceCoilId_fkey" FOREIGN KEY ("sourceCoilId") REFERENCES "Coil"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrderOutput" ADD CONSTRAINT "WorkOrderOutput_outputCoilId_fkey" FOREIGN KEY ("outputCoilId") REFERENCES "Coil"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrderOutput" ADD CONSTRAINT "WorkOrderOutput_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_fromLocationId_fkey" FOREIGN KEY ("fromLocationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShipmentItem" ADD CONSTRAINT "ShipmentItem_orderLineId_fkey" FOREIGN KEY ("orderLineId") REFERENCES "OrderLine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShipmentItem" ADD CONSTRAINT "ShipmentItem_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShipmentStop" ADD CONSTRAINT "ShipmentStop_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentLink" ADD CONSTRAINT "DocumentLink_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentLink" ADD CONSTRAINT "document_coil_link" FOREIGN KEY ("entityId") REFERENCES "Coil"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BomOperation" ADD CONSTRAINT "BomOperation_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "BomRecipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_assetTypeId_fkey" FOREIGN KEY ("assetTypeId") REFERENCES "AssetType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_parentAssetId_fkey" FOREIGN KEY ("parentAssetId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_workCenterId_fkey" FOREIGN KEY ("workCenterId") REFERENCES "WorkCenter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetComponent" ADD CONSTRAINT "AssetComponent_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeterReading" ADD CONSTRAINT "MeterReading_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceOrder" ADD CONSTRAINT "MaintenanceOrder_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceOrder" ADD CONSTRAINT "MaintenanceOrder_pmScheduleId_fkey" FOREIGN KEY ("pmScheduleId") REFERENCES "PMSchedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceOrder" ADD CONSTRAINT "MaintenanceOrder_pmTemplateId_fkey" FOREIGN KEY ("pmTemplateId") REFERENCES "PMTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceOrder" ADD CONSTRAINT "MaintenanceOrder_downtimeRecordId_fkey" FOREIGN KEY ("downtimeRecordId") REFERENCES "DowntimeRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceTask" ADD CONSTRAINT "MaintenanceTask_maintenanceOrderId_fkey" FOREIGN KEY ("maintenanceOrderId") REFERENCES "MaintenanceOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceOrderPart" ADD CONSTRAINT "MaintenanceOrderPart_maintenanceOrderId_fkey" FOREIGN KEY ("maintenanceOrderId") REFERENCES "MaintenanceOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceOrderPart" ADD CONSTRAINT "MaintenanceOrderPart_sparePartId_fkey" FOREIGN KEY ("sparePartId") REFERENCES "SparePart"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceOrderLabor" ADD CONSTRAINT "MaintenanceOrderLabor_maintenanceOrderId_fkey" FOREIGN KEY ("maintenanceOrderId") REFERENCES "MaintenanceOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceAttachment" ADD CONSTRAINT "MaintenanceAttachment_maintenanceOrderId_fkey" FOREIGN KEY ("maintenanceOrderId") REFERENCES "MaintenanceOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PMTemplate" ADD CONSTRAINT "PMTemplate_assetTypeId_fkey" FOREIGN KEY ("assetTypeId") REFERENCES "AssetType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PMSchedule" ADD CONSTRAINT "PMSchedule_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PMSchedule" ADD CONSTRAINT "PMSchedule_pmTemplateId_fkey" FOREIGN KEY ("pmTemplateId") REFERENCES "PMTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DowntimeRecord" ADD CONSTRAINT "DowntimeRecord_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SparePart" ADD CONSTRAINT "SparePart_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SparePartTransaction" ADD CONSTRAINT "SparePartTransaction_sparePartId_fkey" FOREIGN KEY ("sparePartId") REFERENCES "SparePart"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerPricingTier" ADD CONSTRAINT "CustomerPricingTier_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DropTag" ADD CONSTRAINT "DropTag_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DropTag" ADD CONSTRAINT "DropTag_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DropTag" ADD CONSTRAINT "DropTag_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "DropTagListing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DropTag" ADD CONSTRAINT "DropTag_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DropTag" ADD CONSTRAINT "DropTag_orderLineId_fkey" FOREIGN KEY ("orderLineId") REFERENCES "OrderLine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DropTag" ADD CONSTRAINT "DropTag_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DropTag" ADD CONSTRAINT "DropTag_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DropTagListing" ADD CONSTRAINT "DropTagListing_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DropTagListing" ADD CONSTRAINT "DropTagListing_originLocationId_fkey" FOREIGN KEY ("originLocationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Package" ADD CONSTRAINT "Package_currentLocationId_fkey" FOREIGN KEY ("currentLocationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Package" ADD CONSTRAINT "Package_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Package" ADD CONSTRAINT "Package_orderLineId_fkey" FOREIGN KEY ("orderLineId") REFERENCES "OrderLine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Package" ADD CONSTRAINT "Package_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackageItem" ADD CONSTRAINT "PackageItem_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TagIdentifier" ADD CONSTRAINT "TagIdentifier_dropTagId_fkey" FOREIGN KEY ("dropTagId") REFERENCES "DropTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TraceEvent" ADD CONSTRAINT "TraceEvent_dropTagId_fkey" FOREIGN KEY ("dropTagId") REFERENCES "DropTag"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerTagRequirement" ADD CONSTRAINT "CustomerTagRequirement_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Partner" ADD CONSTRAINT "Partner_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerApiKey" ADD CONSTRAINT "PartnerApiKey_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerWebhook" ADD CONSTRAINT "PartnerWebhook_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookDelivery" ADD CONSTRAINT "WebhookDelivery_webhookId_fkey" FOREIGN KEY ("webhookId") REFERENCES "PartnerWebhook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerApiLog" ADD CONSTRAINT "PartnerApiLog_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyPolicyDocument" ADD CONSTRAINT "SafetyPolicyDocument_supersededById_fkey" FOREIGN KEY ("supersededById") REFERENCES "SafetyPolicyDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyPolicyAcknowledgement" ADD CONSTRAINT "SafetyPolicyAcknowledgement_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "SafetyPolicyDocument"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyTrainingAssignment" ADD CONSTRAINT "SafetyTrainingAssignment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "SafetyTrainingCourse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyTrainingCompletion" ADD CONSTRAINT "SafetyTrainingCompletion_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "SafetyTrainingAssignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyTrainingCompletion" ADD CONSTRAINT "SafetyTrainingCompletion_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "SafetyTrainingCourse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyIncidentInvestigation" ADD CONSTRAINT "SafetyIncidentInvestigation_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "SafetyIncident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyInjuryDetails" ADD CONSTRAINT "SafetyInjuryDetails_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "SafetyIncident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyCorrectiveAction" ADD CONSTRAINT "SafetyCorrectiveAction_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "SafetyIncident"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyCorrectiveAction" ADD CONSTRAINT "SafetyCorrectiveAction_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "SafetyInspection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyCorrectiveAction" ADD CONSTRAINT "SafetyCorrectiveAction_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "SafetyAudit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyCorrectiveAction" ADD CONSTRAINT "SafetyCorrectiveAction_observationId_fkey" FOREIGN KEY ("observationId") REFERENCES "SafetyObservation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyInspection" ADD CONSTRAINT "SafetyInspection_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "SafetyInspectionTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyInspectionDefect" ADD CONSTRAINT "SafetyInspectionDefect_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "SafetyInspection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyPermitLoto" ADD CONSTRAINT "SafetyPermitLoto_permitId_fkey" FOREIGN KEY ("permitId") REFERENCES "SafetyPermit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyPermitHotWork" ADD CONSTRAINT "SafetyPermitHotWork_permitId_fkey" FOREIGN KEY ("permitId") REFERENCES "SafetyPermit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyPermitElectrical" ADD CONSTRAINT "SafetyPermitElectrical_permitId_fkey" FOREIGN KEY ("permitId") REFERENCES "SafetyPermit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyPermitConfinedSpace" ADD CONSTRAINT "SafetyPermitConfinedSpace_permitId_fkey" FOREIGN KEY ("permitId") REFERENCES "SafetyPermit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyPermitSignoff" ADD CONSTRAINT "SafetyPermitSignoff_permitId_fkey" FOREIGN KEY ("permitId") REFERENCES "SafetyPermit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyEquipmentGuard" ADD CONSTRAINT "SafetyEquipmentGuard_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "SafetyEquipmentAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetySDSRevision" ADD CONSTRAINT "SafetySDSRevision_sdsId_fkey" FOREIGN KEY ("sdsId") REFERENCES "SafetySDSRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyMeetingAttendee" ADD CONSTRAINT "SafetyMeetingAttendee_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "SafetyMeeting"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyAuditFinding" ADD CONSTRAINT "SafetyAuditFinding_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "SafetyAudit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyContractorWorker" ADD CONSTRAINT "SafetyContractorWorker_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "SafetyContractorCompany"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyAttachment" ADD CONSTRAINT "attachment_incident" FOREIGN KEY ("entityId") REFERENCES "SafetyIncident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyAttachment" ADD CONSTRAINT "attachment_capa" FOREIGN KEY ("entityId") REFERENCES "SafetyCorrectiveAction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyAttachment" ADD CONSTRAINT "attachment_inspection" FOREIGN KEY ("entityId") REFERENCES "SafetyInspection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyAttachment" ADD CONSTRAINT "attachment_permit" FOREIGN KEY ("entityId") REFERENCES "SafetyPermit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

