-- STEELWISE one-time database upgrade, for the Supabase SQL Editor.
--
-- Paste this whole file into Supabase > SQL Editor > New query and click Run.
-- Take a backup first (Database > Backups).
--
-- It runs as one transaction: if any statement fails, nothing is changed.
-- It does three things:
--   1. Converts list columns (text arrays) to JSON, keeping their values.
--   2. Creates the safety tables that the old schema did not have.
--   3. Records the 0_init baseline so future migrations apply normally.
--
-- Generated from the schema as of PR #2 against the previous main schema.

BEGIN;

-- ── 1. List columns to JSON ─────────────────────────────────────────────
DO $$
DECLARE
  col record;
BEGIN
  FOR col IN
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND data_type = 'ARRAY'
    ORDER BY table_name, column_name
  LOOP
    RAISE NOTICE 'Converting %.% to jsonb', col.table_name, col.column_name;
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN %I DROP DEFAULT', col.table_name, col.column_name);
    EXECUTE format(
      'ALTER TABLE public.%I ALTER COLUMN %I TYPE jsonb USING COALESCE(to_jsonb(%I), ''[]''::jsonb)',
      col.table_name, col.column_name, col.column_name
    );
    EXECUTE format('UPDATE public.%I SET %I = ''[]''::jsonb WHERE %I IS NULL', col.table_name, col.column_name, col.column_name);
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN %I SET DEFAULT ''[]''::jsonb', col.table_name, col.column_name);
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN %I SET NOT NULL', col.table_name, col.column_name);
  END LOOP;
END $$;

-- ── 2. New safety tables, types and indexes ───────────────────────────
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


-- ── 3. Record the baseline migration ────────────────────────────────────
CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
    "id"                  VARCHAR(36) PRIMARY KEY NOT NULL,
    "checksum"            VARCHAR(64) NOT NULL,
    "finished_at"         TIMESTAMPTZ,
    "migration_name"      VARCHAR(255) NOT NULL,
    "logs"                TEXT,
    "rolled_back_at"      TIMESTAMPTZ,
    "started_at"          TIMESTAMPTZ NOT NULL DEFAULT now(),
    "applied_steps_count" INTEGER NOT NULL DEFAULT 0
);

INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "applied_steps_count")
SELECT gen_random_uuid()::text, '05904fa848fb583ee244ccfc5069d5ae44a09797ac6f84928db1d86735f45539', now(), '0_init', 0
WHERE NOT EXISTS (SELECT 1 FROM "_prisma_migrations" WHERE "migration_name" = '0_init');

COMMIT;
