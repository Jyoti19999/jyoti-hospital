--
-- PostgreSQL database dump
--

-- Dumped from database version 16.10 (Ubuntu 16.10-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: tanuj
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO tanuj;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: tanuj
--

COMMENT ON SCHEMA public IS '';


--
-- Name: testbackup; Type: SCHEMA; Schema: -; Owner: tanuj
--

CREATE SCHEMA testbackup;


ALTER SCHEMA testbackup OWNER TO tanuj;

--
-- Name: AppointmentStatus; Type: TYPE; Schema: public; Owner: tanuj
--

CREATE TYPE public."AppointmentStatus" AS ENUM (
    'SCHEDULED',
    'CHECKED_IN',
    'RESCHEDULED',
    'CANCELLED',
    'NO_SHOW',
    'COMPLETED'
);


ALTER TYPE public."AppointmentStatus" OWNER TO tanuj;

--
-- Name: AttendanceStatus; Type: TYPE; Schema: public; Owner: tanuj
--

CREATE TYPE public."AttendanceStatus" AS ENUM (
    'PRESENT',
    'ABSENT',
    'LATE',
    'HALF_DAY',
    'LEAVE',
    'HOLIDAY'
);


ALTER TYPE public."AttendanceStatus" OWNER TO tanuj;

--
-- Name: BillStatus; Type: TYPE; Schema: public; Owner: tanuj
--

CREATE TYPE public."BillStatus" AS ENUM (
    'DRAFT',
    'PENDING',
    'PARTIALLY_PAID',
    'PAID',
    'OVERDUE',
    'CANCELLED',
    'REFUNDED'
);


ALTER TYPE public."BillStatus" OWNER TO tanuj;

--
-- Name: ColumnType; Type: TYPE; Schema: public; Owner: tanuj
--

CREATE TYPE public."ColumnType" AS ENUM (
    'TEXT',
    'NUMBER',
    'LONG_NUMBER',
    'DATE',
    'TIME',
    'DATETIME',
    'IMAGE',
    'EMAIL',
    'MOBILE',
    'URL',
    'PDF_DOCUMENT',
    'DROPDOWN',
    'MULTI_SELECT'
);


ALTER TYPE public."ColumnType" OWNER TO tanuj;

--
-- Name: FitnessReqType; Type: TYPE; Schema: public; Owner: tanuj
--

CREATE TYPE public."FitnessReqType" AS ENUM (
    'MANDATORY',
    'RECOMMENDED',
    'CONDITIONAL',
    'AGE_SPECIFIC'
);


ALTER TYPE public."FitnessReqType" OWNER TO tanuj;

--
-- Name: FitnessStatus; Type: TYPE; Schema: public; Owner: tanuj
--

CREATE TYPE public."FitnessStatus" AS ENUM (
    'PENDING',
    'FIT_FOR_SURGERY',
    'NOT_FIT',
    'CONDITIONAL_FIT',
    'REQUIRES_CLEARANCE'
);


ALTER TYPE public."FitnessStatus" OWNER TO tanuj;

--
-- Name: InvestigationStatus; Type: TYPE; Schema: public; Owner: tanuj
--

CREATE TYPE public."InvestigationStatus" AS ENUM (
    'PENDING',
    'IN_PROGRESS',
    'COMPLETED',
    'ABNORMAL',
    'CRITICAL',
    'CANCELLED',
    'EXPIRED'
);


ALTER TYPE public."InvestigationStatus" OWNER TO tanuj;

--
-- Name: IpdStatus; Type: TYPE; Schema: public; Owner: tanuj
--

CREATE TYPE public."IpdStatus" AS ENUM (
    'ADMITTED',
    'SURGERY_SCHEDULED',
    'PRE_OP_ASSESSMENT',
    'SURGERY_DAY',
    'POST_OP',
    'RECOVERY',
    'DISCHARGED',
    'CANCELLED',
    'TRANSFERRED',
    'SURGERY_SUGGESTED',
    'RECEPTIONIST2_CONSULTED'
);


ALTER TYPE public."IpdStatus" OWNER TO tanuj;

--
-- Name: ItemType; Type: TYPE; Schema: public; Owner: tanuj
--

CREATE TYPE public."ItemType" AS ENUM (
    'CONSULTATION',
    'PROCEDURE',
    'MEDICINE',
    'DIAGNOSTIC_TEST',
    'ROOM_CHARGES',
    'EQUIPMENT_USAGE',
    'OTHER'
);


ALTER TYPE public."ItemType" OWNER TO tanuj;

--
-- Name: LensCategory; Type: TYPE; Schema: public; Owner: tanuj
--

CREATE TYPE public."LensCategory" AS ENUM (
    'MONOFOCAL',
    'MULTIFOCAL',
    'TORIC',
    'ACCOMMODATING',
    'EXTENDED_DEPTH_FOCUS',
    'LIGHT_ADJUSTABLE',
    'CUSTOM'
);


ALTER TYPE public."LensCategory" OWNER TO tanuj;

--
-- Name: LensType; Type: TYPE; Schema: public; Owner: tanuj
--

CREATE TYPE public."LensType" AS ENUM (
    'IOL',
    'TORIC_IOL',
    'MULTIFOCAL_IOL',
    'ACCOMMODATING_IOL',
    'CONTACT_LENS',
    'SPECIALTY_LENS'
);


ALTER TYPE public."LensType" OWNER TO tanuj;

--
-- Name: PaymentMethod; Type: TYPE; Schema: public; Owner: tanuj
--

CREATE TYPE public."PaymentMethod" AS ENUM (
    'CASH',
    'CARD',
    'UPI',
    'NET_BANKING',
    'INSURANCE',
    'CHEQUE'
);


ALTER TYPE public."PaymentMethod" OWNER TO tanuj;

--
-- Name: PriorityLabel; Type: TYPE; Schema: public; Owner: tanuj
--

CREATE TYPE public."PriorityLabel" AS ENUM (
    'PRIORITY',
    'EMERGENCY',
    'CHILDREN',
    'SENIORS',
    'LONGWAIT',
    'REFERRAL',
    'FOLLOWUP',
    'ROUTINE',
    'PREPOSTOP'
);


ALTER TYPE public."PriorityLabel" OWNER TO tanuj;

--
-- Name: QueueFor; Type: TYPE; Schema: public; Owner: tanuj
--

CREATE TYPE public."QueueFor" AS ENUM (
    'OPTOMETRIST',
    'OPHTHALMOLOGIST',
    'DIAGNOSTICS',
    'SURGERY',
    'BILLING',
    'PHARMACY'
);


ALTER TYPE public."QueueFor" OWNER TO tanuj;

--
-- Name: QueueStatus; Type: TYPE; Schema: public; Owner: tanuj
--

CREATE TYPE public."QueueStatus" AS ENUM (
    'WAITING',
    'CALLED',
    'IN_PROGRESS',
    'ON_HOLD',
    'COMPLETED'
);


ALTER TYPE public."QueueStatus" OWNER TO tanuj;

--
-- Name: SurgeryTypeCategory; Type: TYPE; Schema: public; Owner: tanuj
--

CREATE TYPE public."SurgeryTypeCategory" AS ENUM (
    'CATARACT',
    'GLAUCOMA',
    'RETINAL',
    'CORNEAL',
    'OCULOPLASTIC',
    'EMERGENCY'
);


ALTER TYPE public."SurgeryTypeCategory" OWNER TO tanuj;

--
-- Name: VisitStatus; Type: TYPE; Schema: public; Owner: tanuj
--

CREATE TYPE public."VisitStatus" AS ENUM (
    'CHECKED_IN',
    'WITH_OPTOMETRIST',
    'AWAITING_DOCTOR',
    'WITH_DOCTOR',
    'DIAGNOSTICS_PENDING',
    'SURGERY_SCHEDULED',
    'BILLING',
    'PHARMACY',
    'COMPLETED',
    'DISCHARGED'
);


ALTER TYPE public."VisitStatus" OWNER TO tanuj;

--
-- Name: VisitType; Type: TYPE; Schema: public; Owner: tanuj
--

CREATE TYPE public."VisitType" AS ENUM (
    'OPD',
    'IPD',
    'EMERGENCY',
    'FOLLOWUP'
);


ALTER TYPE public."VisitType" OWNER TO tanuj;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: tanuj
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO tanuj;

--
-- Name: appointments; Type: TABLE; Schema: public; Owner: tanuj
--

CREATE TABLE public.appointments (
    id text NOT NULL,
    "patientId" text NOT NULL,
    "doctorId" text,
    "appointmentDate" timestamp(3) without time zone NOT NULL,
    "appointmentTime" text,
    "tokenNumber" text NOT NULL,
    "qrCode" text,
    "estimatedDuration" integer,
    status public."AppointmentStatus" DEFAULT 'SCHEDULED'::public."AppointmentStatus" NOT NULL,
    "appointmentType" text,
    purpose text,
    notes text,
    "roomId" text,
    "estimatedCost" double precision,
    "cancelReason" text,
    "rescheduledFrom" text,
    "rescheduledTo" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.appointments OWNER TO tanuj;

--
-- Name: bed_types; Type: TABLE; Schema: public; Owner: tanuj
--

CREATE TABLE public.bed_types (
    id text NOT NULL,
    "typeName" text NOT NULL,
    "typeCode" text,
    category text,
    "dailyCharge" double precision
);


ALTER TABLE public.bed_types OWNER TO tanuj;

--
-- Name: beds; Type: TABLE; Schema: public; Owner: tanuj
--

CREATE TABLE public.beds (
    id text NOT NULL,
    "roomId" text,
    "bedTypeId" text,
    "bedNumber" text NOT NULL,
    status text DEFAULT 'available'::text NOT NULL,
    "patientId" text,
    "admissionDate" timestamp(3) without time zone,
    "expectedDischargeDate" timestamp(3) without time zone,
    "dailyRate" double precision,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.beds OWNER TO tanuj;

--
-- Name: bill_items; Type: TABLE; Schema: public; Owner: tanuj
--

CREATE TABLE public.bill_items (
    id text NOT NULL,
    "billId" text NOT NULL,
    "itemType" public."ItemType" NOT NULL,
    "itemCode" text,
    "itemName" text NOT NULL,
    description text,
    quantity double precision DEFAULT 1 NOT NULL,
    "unitPrice" double precision NOT NULL,
    "totalPrice" double precision NOT NULL,
    "taxRate" double precision DEFAULT 0,
    "taxAmount" double precision DEFAULT 0,
    "discountRate" double precision DEFAULT 0,
    "discountAmount" double precision DEFAULT 0,
    "serviceId" text,
    "examinationId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.bill_items OWNER TO tanuj;

--
-- Name: bills; Type: TABLE; Schema: public; Owner: tanuj
--

CREATE TABLE public.bills (
    id text NOT NULL,
    "billNumber" text NOT NULL,
    "patientId" text NOT NULL,
    "patientVisitId" text,
    "hospitalId" text NOT NULL,
    "billDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "dueDate" timestamp(3) without time zone,
    status public."BillStatus" DEFAULT 'DRAFT'::public."BillStatus" NOT NULL,
    "subTotal" double precision DEFAULT 0 NOT NULL,
    "taxAmount" double precision DEFAULT 0 NOT NULL,
    "discountAmount" double precision DEFAULT 0 NOT NULL,
    "totalAmount" double precision DEFAULT 0 NOT NULL,
    "paidAmount" double precision DEFAULT 0 NOT NULL,
    "balanceAmount" double precision DEFAULT 0 NOT NULL,
    "billedBy" text,
    "approvedBy" text,
    "insuranceClaimId" text,
    "estimatedInsuranceCover" double precision DEFAULT 0,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.bills OWNER TO tanuj;

--
-- Name: diagnoses; Type: TABLE; Schema: public; Owner: tanuj
--

CREATE TABLE public.diagnoses (
    id text NOT NULL,
    "visitId" text NOT NULL,
    "examinationId" text,
    "diseaseId" text,
    "doctorId" text NOT NULL,
    "diagnosisType" text,
    "diagnosisDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "confidenceLevel" double precision,
    "eyeAffected" text,
    "visualImpact" text,
    severity text,
    stage text,
    "onsetDate" timestamp(3) without time zone,
    progression text,
    "diagnosticEvidence" jsonb,
    "supportingFindings" jsonb,
    "treatmentRecommended" jsonb,
    "surgeryRequired" boolean DEFAULT false NOT NULL,
    "urgencyLevel" text,
    "isPrimary" boolean DEFAULT false NOT NULL,
    billable boolean DEFAULT true NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "ophthalmologistExaminationId" text
);


ALTER TABLE public.diagnoses OWNER TO tanuj;

--
-- Name: digital_register_columns; Type: TABLE; Schema: public; Owner: tanuj
--

CREATE TABLE public.digital_register_columns (
    id text NOT NULL,
    "registerId" text NOT NULL,
    "columnName" text NOT NULL,
    "columnType" public."ColumnType" NOT NULL,
    "isRequired" boolean DEFAULT false NOT NULL,
    "displayOrder" integer NOT NULL,
    "minLength" integer,
    "maxLength" integer,
    "minValue" double precision,
    "maxValue" double precision,
    pattern text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    options jsonb
);


ALTER TABLE public.digital_register_columns OWNER TO tanuj;

--
-- Name: digital_register_definitions; Type: TABLE; Schema: public; Owner: tanuj
--

CREATE TABLE public.digital_register_definitions (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "allowedStaffTypes" text[] DEFAULT ARRAY[]::text[]
);


ALTER TABLE public.digital_register_definitions OWNER TO tanuj;

--
-- Name: digital_register_records; Type: TABLE; Schema: public; Owner: tanuj
--

CREATE TABLE public.digital_register_records (
    id text NOT NULL,
    "registerId" text NOT NULL,
    "createdBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.digital_register_records OWNER TO tanuj;

--
-- Name: digital_register_values; Type: TABLE; Schema: public; Owner: tanuj
--

CREATE TABLE public.digital_register_values (
    id text NOT NULL,
    "recordId" text NOT NULL,
    "columnId" text NOT NULL,
    "textValue" text,
    "numberValue" double precision,
    "dateValue" timestamp(3) without time zone,
    "imageValue" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.digital_register_values OWNER TO tanuj;

--
-- Name: diseases; Type: TABLE; Schema: public; Owner: tanuj
--

CREATE TABLE public.diseases (
    id text NOT NULL,
    "icd11CodeId" text,
    "diseaseName" jsonb,
    "commonNames" jsonb,
    "ophthalmologyCategory" text,
    "affectedStructure" text,
    "eyeAffected" text,
    symptoms jsonb,
    signs jsonb,
    "diagnosticCriteria" jsonb,
    "treatmentProtocols" jsonb,
    "surgicalOptions" jsonb,
    prognosis jsonb,
    "visualImpactLevel" text,
    "urgencyLevel" text,
    "isChronic" boolean DEFAULT false NOT NULL,
    "requiresSurgery" boolean DEFAULT false NOT NULL,
    "affectsVision" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.diseases OWNER TO tanuj;

--
-- Name: dosage_schedules; Type: TABLE; Schema: public; Owner: tanuj
--

CREATE TABLE public.dosage_schedules (
    id text NOT NULL,
    name text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.dosage_schedules OWNER TO tanuj;

--
-- Name: drug_groups; Type: TABLE; Schema: public; Owner: tanuj
--

CREATE TABLE public.drug_groups (
    id text NOT NULL,
    name text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.drug_groups OWNER TO tanuj;

--
-- Name: emergency_register; Type: TABLE; Schema: public; Owner: tanuj
--

CREATE TABLE public.emergency_register (
    id text NOT NULL,
    "srNo" integer NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    "time" text NOT NULL,
    "patientName" text NOT NULL,
    age integer,
    sex text,
    "prnNo" text,
    "ipdNo" text,
    complaints text,
    "treatmentGiven" text,
    "mlcYesNo" text,
    "mlcNo" text,
    "doctorSign" text,
    "staffSign" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdBy" text
);


ALTER TABLE public.emergency_register OWNER TO tanuj;

--
-- Name: equipment_stock_register; Type: TABLE; Schema: public; Owner: tanuj
--

CREATE TABLE public.equipment_stock_register (
    id text NOT NULL,
    "srNo" integer NOT NULL,
    "medicineName" text NOT NULL,
    "dailyStock" jsonb NOT NULL,
    month integer NOT NULL,
    year integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdBy" text
);


ALTER TABLE public.equipment_stock_register OWNER TO tanuj;

--
-- Name: eto_register; Type: TABLE; Schema: public; Owner: tanuj
--

CREATE TABLE public.eto_register (
    id text NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    "nameOfItem" text NOT NULL,
    batch text,
    "loadNo" text,
    "chargeInTime" text,
    "switchOff" text,
    "otInHrs" double precision,
    "indicatorSlnp" text,
    "biSeparate" text,
    "yesNo" text,
    "passedFailed" text,
    "integratedStnp" text,
    "signCssd" text,
    "signIdd" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdBy" text
);


ALTER TABLE public.eto_register OWNER TO tanuj;

--
-- Name: examination_templates; Type: TABLE; Schema: public; Owner: tanuj
--

CREATE TABLE public.examination_templates (
    id text NOT NULL,
    "templateName" text NOT NULL,
    "examinationType" text,
    "ophthalmologyType" text,
    "requiredEquipment" text[],
    "templateStructure" jsonb,
    "formFields" jsonb,
    "normalRanges" jsonb,
    "visualAcuitySection" jsonb,
    "refractionSection" jsonb,
    "slitLampSection" jsonb,
    "fundoscopySection" jsonb,
    "iopSection" jsonb,
    "visualFieldSection" jsonb,
    version text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.examination_templates OWNER TO tanuj;

--
-- Name: examinations; Type: TABLE; Schema: public; Owner: tanuj
--

CREATE TABLE public.examinations (
    id text NOT NULL,
    "visitId" text NOT NULL,
    "templateId" text,
    "doctorId" text NOT NULL,
    "examinationType" text,
    "examinationDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "vitalSigns" jsonb,
    "visualAcuity" jsonb,
    refraction jsonb,
    "intraocularPressure" jsonb,
    "slitLampFindings" jsonb,
    "fundoscopyFindings" jsonb,
    "visualFieldResults" jsonb,
    "colorVisionTest" jsonb,
    "octFindings" jsonb,
    "fundusPhotography" jsonb,
    "fluoresceinAngiography" jsonb,
    ultrasonography jsonb,
    "clinicalImpressions" text,
    assessment jsonb,
    "treatmentPlan" jsonb,
    images jsonb,
    reports jsonb,
    "followUpRequired" boolean DEFAULT false NOT NULL,
    "followUpDate" timestamp(3) without time zone,
    status text DEFAULT 'completed'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.examinations OWNER TO tanuj;

--
-- Name: eye_drop_reasons; Type: TABLE; Schema: public; Owner: tanuj
--

CREATE TABLE public.eye_drop_reasons (
    id text NOT NULL,
    reason text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.eye_drop_reasons OWNER TO tanuj;

--
-- Name: fitness_investigation_results; Type: TABLE; Schema: public; Owner: tanuj
--

CREATE TABLE public.fitness_investigation_results (
    id text NOT NULL,
    "ipdAdmissionId" text NOT NULL,
    "investigationId" text NOT NULL,
    "resultValue" text,
    "resultStatus" public."InvestigationStatus" DEFAULT 'PENDING'::public."InvestigationStatus" NOT NULL,
    "isNormal" boolean,
    interpretation text,
    "testDate" timestamp(3) without time zone,
    "reportDate" timestamp(3) without time zone,
    "labName" text,
    "referenceNumber" text,
    "uploadedBy" text,
    "uploadedAt" timestamp(3) without time zone,
    "clinicalNotes" text,
    recommendations text,
    "requiresFollowUp" boolean DEFAULT false NOT NULL,
    "followUpDate" timestamp(3) without time zone,
    "clearanceGiven" boolean DEFAULT false NOT NULL,
    "clearanceBy" text,
    "clearanceDate" timestamp(3) without time zone,
    "clearanceNotes" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "documentPaths" text[] DEFAULT ARRAY[]::text[]
);


ALTER TABLE public.fitness_investigation_results OWNER TO tanuj;

--
-- Name: fitness_investigations; Type: TABLE; Schema: public; Owner: tanuj
--

CREATE TABLE public.fitness_investigations (
    id text NOT NULL,
    "investigationName" text NOT NULL,
    "investigationCode" text,
    category text,
    description text,
    "normalRanges" jsonb,
    "criticalValues" jsonb,
    units text,
    "validityDays" integer,
    "processingTime" text,
    "fastingRequired" boolean DEFAULT false NOT NULL,
    cost double precision,
    "isOutsourced" boolean DEFAULT false NOT NULL,
    "labPartner" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.fitness_investigations OWNER TO tanuj;

--
-- Name: fitness_reports; Type: TABLE; Schema: public; Owner: tanuj
--

CREATE TABLE public.fitness_reports (
    id text NOT NULL,
    "ipdAdmissionId" text NOT NULL,
    "fitnessStatus" public."FitnessStatus" DEFAULT 'PENDING'::public."FitnessStatus" NOT NULL,
    "assessedBy" text NOT NULL,
    "assessmentDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "bloodPressure" text,
    "heartRate" text,
    temperature text,
    "oxygenSaturation" text,
    "ecgReport" text,
    "chestXrayReport" text,
    "bloodTestReports" jsonb,
    "fitnessNotes" text,
    contraindications text,
    "specialInstructions" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.fitness_reports OWNER TO tanuj;

--
-- Name: floors; Type: TABLE; Schema: public; Owner: tanuj
--

CREATE TABLE public.floors (
    id text NOT NULL,
    "floorNumber" integer NOT NULL,
    "floorName" text,
    "floorType" text,
    accessible boolean DEFAULT true NOT NULL,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.floors OWNER TO tanuj;

--
-- Name: fridge_stock_medicines_register; Type: TABLE; Schema: public; Owner: tanuj
--

CREATE TABLE public.fridge_stock_medicines_register (
    id text NOT NULL,
    "srNo" integer NOT NULL,
    "nameOfInjection" text NOT NULL,
    "expectedStock" integer,
    "entryDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdBy" text
);


ALTER TABLE public.fridge_stock_medicines_register OWNER TO tanuj;

--
-- Name: generic_medicines; Type: TABLE; Schema: public; Owner: tanuj
--

CREATE TABLE public.generic_medicines (
    id text NOT NULL,
    name text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.generic_medicines OWNER TO tanuj;

--
-- Name: hospital; Type: TABLE; Schema: public; Owner: tanuj
--

CREATE TABLE public.hospital (
    id text NOT NULL,
    "hospitalName" text NOT NULL,
    "hospitalCode" text,
    "registrationNumber" text,
    "licenseNumber" text,
    address jsonb,
    phone text,
    email text,
    website text,
    "establishedDate" timestamp(3) without time zone,
    "hospitalType" text,
    accreditation jsonb,
    "totalBeds" integer,
    "totalRooms" integer,
    "totalFloors" integer,
    "operatingHours" jsonb,
    "emergencyServices" boolean DEFAULT false NOT NULL,
    logo text,
    timezone text DEFAULT 'Asia/Kolkata'::text NOT NULL,
    currency text DEFAULT 'INR'::text NOT NULL,
    "supportedLanguages" text[] DEFAULT ARRAY['en'::text, 'hi'::text],
    configuration jsonb,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "taxSettings" jsonb
);


ALTER TABLE public.hospital OWNER TO tanuj;

--
-- Name: icd11_codes; Type: TABLE; Schema: public; Owner: tanuj
--

CREATE TABLE public.icd11_codes (
    id text NOT NULL,
    "foundationId" text NOT NULL,
    code text,
    title jsonb,
    definition jsonb,
    chapter text,
    "isEyeRelated" boolean DEFAULT false NOT NULL,
    "ophthalmologyCategory" text,
    "inclusionTerms" jsonb,
    "exclusionTerms" jsonb,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.icd11_codes OWNER TO tanuj;

--
-- Name: insurance; Type: TABLE; Schema: public; Owner: tanuj
--

CREATE TABLE public.insurance (
    id text NOT NULL,
    "insuranceName" text NOT NULL,
    "insuranceType" text NOT NULL,
    "policyNumber" text,
    "coverageAmount" double precision,
    "deductibleAmount" double precision,
    "copayPercentage" double precision,
    "validFrom" timestamp(3) without time zone,
    "validTo" timestamp(3) without time zone,
    "contactNumber" text,
    email text,
    address jsonb,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.insurance OWNER TO tanuj;

--
-- Name: insurance_claims; Type: TABLE; Schema: public; Owner: tanuj
--

CREATE TABLE public.insurance_claims (
    id text NOT NULL,
    "claimNumber" text NOT NULL,
    "patientId" text NOT NULL,
    "insuranceId" text NOT NULL,
    "claimAmount" double precision NOT NULL,
    "approvedAmount" double precision DEFAULT 0,
    "settledAmount" double precision DEFAULT 0,
    status text DEFAULT 'submitted'::text NOT NULL,
    documents jsonb,
    "submittedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "processedAt" timestamp(3) without time zone,
    "settledAt" timestamp(3) without time zone,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.insurance_claims OWNER TO tanuj;

--
-- Name: ipd_admissions; Type: TABLE; Schema: public; Owner: tanuj
--

CREATE TABLE public.ipd_admissions (
    id text NOT NULL,
    "admissionNumber" text NOT NULL,
    "patientId" text NOT NULL,
    "admittedBy" text NOT NULL,
    "admissionDate" timestamp(3) without time zone NOT NULL,
    "expectedDischarge" timestamp(3) without time zone,
    "actualDischarge" timestamp(3) without time zone,
    "surgeryDate" timestamp(3) without time zone,
    "surgeonId" text,
    "surgeryPackage" text,
    "iolType" text,
    "tentativeTime" text,
    "expectedDuration" integer,
    "priorityLevel" text,
    status public."IpdStatus" DEFAULT 'SURGERY_SUGGESTED'::public."IpdStatus" NOT NULL,
    "surgeryDayVisitId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "anesthesiologistId" text,
    blockers text,
    "currentStage" text,
    discharged boolean DEFAULT false NOT NULL,
    "dischargedAt" timestamp(3) without time zone,
    "dischargedBy" text,
    "fitnessAssessmentAt" timestamp(3) without time zone,
    "fitnessAssessmentBy" text,
    "fitnessAssessmentStarted" boolean DEFAULT false NOT NULL,
    "fitnessCleared" boolean DEFAULT false NOT NULL,
    "fitnessClearedAt" timestamp(3) without time zone,
    "fitnessClearedBy" text,
    "investigationsCompleted" boolean DEFAULT false NOT NULL,
    "investigationsCompletedAt" timestamp(3) without time zone,
    "investigationsSuggested" boolean DEFAULT false NOT NULL,
    "investigationsSuggestedAt" timestamp(3) without time zone,
    "investigationsSuggestedBy" text,
    "journeyNotes" jsonb,
    "nextAction" text,
    "patientVisitId" text,
    "postOpCompleted" boolean DEFAULT false NOT NULL,
    "postOpCompletedAt" timestamp(3) without time zone,
    "preOpCompleted" boolean DEFAULT false NOT NULL,
    "preOpCompletedAt" timestamp(3) without time zone,
    "preOpCompletedBy" text,
    "sisterId" text,
    "surgeryCompleted" boolean DEFAULT false NOT NULL,
    "surgeryCompletedAt" timestamp(3) without time zone,
    "surgeryPackageId" text,
    "surgeryTypeId" text,
    "lensId" text,
    "lensRequired" boolean,
    "investigationDocumentPath" text[] DEFAULT '{}'::text[]
);


ALTER TABLE public.ipd_admissions OWNER TO tanuj;

--
-- Name: lens_packages; Type: TABLE; Schema: public; Owner: tanuj
--

CREATE TABLE public.lens_packages (
    id text NOT NULL,
    "packageId" text NOT NULL,
    "lensId" text NOT NULL,
    "isDefault" boolean DEFAULT false NOT NULL,
    "additionalCost" double precision DEFAULT 0 NOT NULL,
    "isUpgrade" boolean DEFAULT false NOT NULL,
    "upgradeLevel" text,
    "isAvailable" boolean DEFAULT true NOT NULL,
    "availabilityNotes" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.lens_packages OWNER TO tanuj;

--
-- Name: lenses; Type: TABLE; Schema: public; Owner: tanuj
--

CREATE TABLE public.lenses (
    id text NOT NULL,
    "lensName" text NOT NULL,
    "lensCode" text,
    manufacturer text,
    model text,
    "lensType" public."LensType" NOT NULL,
    "lensCategory" public."LensCategory" NOT NULL,
    material text,
    power text,
    diameter text,
    features jsonb,
    benefits jsonb,
    "suitableFor" jsonb,
    contraindications jsonb,
    "lensoCost" double precision NOT NULL,
    "patientCost" double precision NOT NULL,
    "insuranceCoverage" double precision DEFAULT 0,
    "isAvailable" boolean DEFAULT true NOT NULL,
    "stockQuantity" integer DEFAULT 0,
    "reorderLevel" integer DEFAULT 5,
    "fdaApproved" boolean DEFAULT false NOT NULL,
    "ceMarked" boolean DEFAULT false NOT NULL,
    "qualityCertification" jsonb,
    "totalImplants" integer DEFAULT 0 NOT NULL,
    "successRate" double precision,
    "complicationRate" double precision,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.lenses OWNER TO tanuj;

--
-- Name: letterhead_templates; Type: TABLE; Schema: public; Owner: tanuj
--

CREATE TABLE public.letterhead_templates (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    elements jsonb NOT NULL,
    "pageSettings" jsonb,
    "isDefault" boolean DEFAULT false NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.letterhead_templates OWNER TO tanuj;

--
-- Name: medicine_types; Type: TABLE; Schema: public; Owner: tanuj
--

CREATE TABLE public.medicine_types (
    id text NOT NULL,
    name text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.medicine_types OWNER TO tanuj;

--
-- Name: medicines; Type: TABLE; Schema: public; Owner: tanuj
--

CREATE TABLE public.medicines (
    id text NOT NULL,
    code text,
    name text NOT NULL,
    "typeId" text,
    "genericMedicineId" text,
    "drugGroupId" text,
    "dosageScheduleId" text,
    dosage text,
    information text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.medicines OWNER TO tanuj;

--
-- Name: o2_n2_pressure_check_register; Type: TABLE; Schema: public; Owner: tanuj
--

CREATE TABLE public.o2_n2_pressure_check_register (
    id text NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    "time" text NOT NULL,
    "o2Big" double precision,
    "o2Small" double precision,
    n2 double precision,
    sign text,
    remark text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdBy" text
);


ALTER TABLE public.o2_n2_pressure_check_register OWNER TO tanuj;

--
-- Name: ophthalmologist_examinations; Type: TABLE; Schema: public; Owner: tanuj
--

CREATE TABLE public.ophthalmologist_examinations (
    id text NOT NULL,
    "patientVisitId" text NOT NULL,
    "doctorId" text NOT NULL,
    "examinationSequence" integer DEFAULT 1 NOT NULL,
    "slitLampFindings" jsonb,
    "fundoscopyFindings" jsonb,
    "visualFieldResults" jsonb,
    "octFindings" jsonb,
    "fundusPhotography" jsonb,
    "angiographyFindings" jsonb,
    ultrasonography jsonb,
    "clinicalImpressions" text,
    assessment jsonb,
    "treatmentPlan" jsonb,
    "surgeryRecommended" boolean DEFAULT false NOT NULL,
    "urgencyLevel" text,
    "followUpRequired" boolean DEFAULT false NOT NULL,
    "followUpDate" timestamp(3) without time zone,
    "followUpInstructions" jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "acdOD" text,
    "acdOS" text,
    "additionalNotes" text,
    "additionalOrders" jsonb,
    "additionalTests" jsonb,
    "additionalTestsLegacy" jsonb,
    "additionalTestsOrdered" jsonb,
    "anteriorSegment" jsonb,
    "anyOtherDetailsOD" text,
    "anyOtherDetailsOS" text,
    "assignedDoctor" text,
    "axlOD" text,
    "axlOS" text,
    "bcvaOD" text,
    "bcvaOS" text,
    "clinicalDetails" jsonb,
    "clinicalNotes" text,
    "colorVision" text,
    "completedAt" timestamp(3) without time zone,
    "conjunctivaOD" text,
    "conjunctivaOS" text,
    "corneaOD" text,
    "corneaOS" text,
    "coverTest" text,
    "distanceBinocular" text,
    "distanceOD" text,
    "distanceOS" text,
    "examinationNotes" text,
    "examinationStatus" text DEFAULT 'completed'::text NOT NULL,
    "extraocularMovements" text,
    "eyeAlignment" text,
    "eyelidsOD" text,
    "eyelidsOS" text,
    "flatAxisOD" text,
    "flatAxisOS" text,
    "followUpDays" integer,
    "followUpPeriod" text,
    "iolImplantedOD" text,
    "iolImplantedOS" text,
    "iolPowerPlannedOD" text,
    "iolPowerPlannedOS" text,
    "iopMethod" text,
    "iopOD" double precision,
    "iopOS" double precision,
    "k1OD" text,
    "k1OS" text,
    "k2OD" text,
    "k2OS" text,
    "knownAllergies" jsonb,
    "lensOD" text,
    "lensOS" text,
    "nearBinocular" text,
    "nearOD" text,
    "nearOS" text,
    "preliminaryDiagnosis" text,
    "proceedToDoctor" boolean DEFAULT true NOT NULL,
    "pupilReaction" text,
    "receptionist2Notes" text,
    "receptionist2Reviewed" boolean DEFAULT false NOT NULL,
    "receptionist2ReviewedAt" timestamp(3) without time zone,
    "receptionist2ReviewedBy" text,
    refraction jsonb,
    "refractionAddOD" double precision,
    "refractionAddOS" double precision,
    "refractionAxisOD" integer,
    "refractionAxisOS" integer,
    "refractionCylinderOD" double precision,
    "refractionCylinderOS" double precision,
    "refractionPD" double precision,
    "refractionSphereOD" double precision,
    "refractionSphereOS" double precision,
    "requiresDilation" boolean DEFAULT false NOT NULL,
    tonometry jsonb,
    "ucvaOD" text,
    "ucvaOS" text,
    "visualAcuity" jsonb,
    "surgeryTypeId" text
);


ALTER TABLE public.ophthalmologist_examinations OWNER TO tanuj;

--
-- Name: optometrist_examinations; Type: TABLE; Schema: public; Owner: tanuj
--

CREATE TABLE public.optometrist_examinations (
    id text NOT NULL,
    "patientVisitId" text NOT NULL,
    "optometristId" text NOT NULL,
    "ucvaOD" text,
    "ucvaOS" text,
    "bcvaOD" text,
    "bcvaOS" text,
    "refractionSphereOD" double precision,
    "refractionCylinderOD" double precision,
    "refractionAxisOD" integer,
    "refractionSphereOS" double precision,
    "refractionCylinderOS" double precision,
    "refractionAxisOS" integer,
    "iopOD" double precision,
    "iopOS" double precision,
    "iopMethod" text,
    "colorVision" text,
    "pupilReaction" text,
    "eyeAlignment" text,
    "anteriorSegment" jsonb,
    "preliminaryDiagnosis" text,
    "urgencyLevel" text,
    "additionalNotes" text,
    "proceedToDoctor" boolean DEFAULT true NOT NULL,
    "requiresDilation" boolean DEFAULT false NOT NULL,
    "additionalTests" jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "additionalOrders" jsonb,
    "additionalTestsLegacy" jsonb,
    "assignedDoctor" text,
    "clinicalDetails" jsonb,
    "clinicalNotes" text,
    "completedAt" timestamp(3) without time zone,
    "examinationStatus" text DEFAULT 'completed'::text NOT NULL,
    "knownAllergies" jsonb,
    refraction jsonb,
    tonometry jsonb,
    "visualAcuity" jsonb,
    "receptionist2Notes" text,
    "receptionist2Reviewed" boolean DEFAULT false NOT NULL,
    "receptionist2ReviewedAt" timestamp(3) without time zone,
    "receptionist2ReviewedBy" text
);


ALTER TABLE public.optometrist_examinations OWNER TO tanuj;

--
-- Name: ot_emergency_stock_register; Type: TABLE; Schema: public; Owner: tanuj
--

CREATE TABLE public.ot_emergency_stock_register (
    id text NOT NULL,
    "srNo" integer NOT NULL,
    "nameOfInjection" text NOT NULL,
    "expectedStock" integer,
    "brandName" text,
    "batchNo" text,
    "marginDate" timestamp(3) without time zone,
    "expiryDate" timestamp(3) without time zone,
    sign text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdBy" text
);


ALTER TABLE public.ot_emergency_stock_register OWNER TO tanuj;

--
-- Name: ot_temperature_register; Type: TABLE; Schema: public; Owner: tanuj
--

CREATE TABLE public.ot_temperature_register (
    id text NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    "temperature9Am" double precision,
    "temperature12Pm" double precision,
    "temperature3Pm" double precision,
    "temperature6Pm" double precision,
    "humidity9Am" double precision,
    "humidity12Pm" double precision,
    "humidity3Pm" double precision,
    "humidity6Pm" double precision,
    "pressure9Am" double precision,
    "pressure12Pm" double precision,
    "pressure3Pm" double precision,
    "pressure6Pm" double precision,
    sign text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdBy" text
);


ALTER TABLE public.ot_temperature_register OWNER TO tanuj;

--
-- Name: otps; Type: TABLE; Schema: public; Owner: tanuj
--

CREATE TABLE public.otps (
    id text NOT NULL,
    identifier text NOT NULL,
    otp text NOT NULL,
    purpose text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    attempts integer DEFAULT 0 NOT NULL,
    "maxAttempts" integer DEFAULT 3 NOT NULL,
    "isUsed" boolean DEFAULT false NOT NULL,
    "ipAddress" text,
    "userAgent" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.otps OWNER TO tanuj;

--
-- Name: patient_queue; Type: TABLE; Schema: public; Owner: tanuj
--

CREATE TABLE public.patient_queue (
    id text NOT NULL,
    "patientVisitId" text NOT NULL,
    "queueFor" public."QueueFor" NOT NULL,
    "queueNumber" integer NOT NULL,
    priority integer DEFAULT 0 NOT NULL,
    status public."QueueStatus" DEFAULT 'WAITING'::public."QueueStatus" NOT NULL,
    "assignedStaffId" text,
    "estimatedWaitTime" integer,
    "joinedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "calledAt" timestamp(3) without time zone,
    "inProgressAt" timestamp(3) without time zone,
    "completedAt" timestamp(3) without time zone,
    notes text,
    "transferReason" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "priorityLabel" public."PriorityLabel" DEFAULT 'ROUTINE'::public."PriorityLabel" NOT NULL,
    "patientId" text NOT NULL,
    "doctorQueuePosition" integer,
    "actualHoldDuration" integer,
    "estimatedResumeTime" timestamp(3) without time zone,
    "holdReason" text,
    "onHoldAt" timestamp(3) without time zone,
    "receptionist2Notes" text,
    "receptionist2Reviewed" boolean DEFAULT false NOT NULL,
    "receptionist2ReviewedAt" timestamp(3) without time zone,
    "receptionist2ReviewedBy" text,
    "resumedAt" timestamp(3) without time zone,
    "dilationRound" integer DEFAULT 0,
    "lastDilationCheckAt" timestamp(3) without time zone,
    "markedReadyForResume" boolean DEFAULT false NOT NULL,
    "customWaitMinutes" integer
);


ALTER TABLE public.patient_queue OWNER TO tanuj;

--
-- Name: patient_visits; Type: TABLE; Schema: public; Owner: tanuj
--

CREATE TABLE public.patient_visits (
    id text NOT NULL,
    "patientId" text NOT NULL,
    "doctorId" text,
    "visitDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "chiefComplaint" text,
    "presentingSymptoms" jsonb,
    "visionComplaints" jsonb,
    "eyeSymptoms" jsonb,
    "onsetDuration" text,
    "priorityLevel" text,
    "admissionDate" timestamp(3) without time zone,
    "dischargeDate" timestamp(3) without time zone,
    "estimatedCost" double precision,
    "insuranceCoverage" double precision,
    "visitOutcome" text,
    "followUpInstructions" jsonb,
    "nextAppointmentDate" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "appointmentId" text NOT NULL,
    "billingInitiatedAt" timestamp(3) without time zone,
    "checkedInAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "completedAt" timestamp(3) without time zone,
    "doctorCalledAt" timestamp(3) without time zone,
    "doctorSeenAt" timestamp(3) without time zone,
    "followUpDate" timestamp(3) without time zone,
    "followUpRequired" boolean DEFAULT false NOT NULL,
    "optometristCalledAt" timestamp(3) without time zone,
    "optometristSeenAt" timestamp(3) without time zone,
    "totalActualCost" double precision DEFAULT 0,
    "totalEstimatedCost" double precision DEFAULT 0,
    status public."VisitStatus" DEFAULT 'CHECKED_IN'::public."VisitStatus" NOT NULL,
    "visitNumber" integer,
    "receptionist2Notes" text,
    "visitType" public."VisitType" DEFAULT 'OPD'::public."VisitType"
);


ALTER TABLE public.patient_visits OWNER TO tanuj;

--
-- Name: patients; Type: TABLE; Schema: public; Owner: tanuj
--

CREATE TABLE public.patients (
    id text NOT NULL,
    mrn text,
    "firstName" text NOT NULL,
    "lastName" text NOT NULL,
    "dateOfBirth" timestamp(3) without time zone,
    gender text,
    phone text,
    email text,
    address jsonb,
    "emergencyContacts" jsonb,
    "bloodGroup" text,
    allergies jsonb,
    "chronicConditions" jsonb,
    "familyHistory" jsonb,
    "eyeHistory" jsonb,
    "visionHistory" jsonb,
    "currentMedications" jsonb,
    "riskFactors" jsonb,
    "insuranceDetails" jsonb,
    "patientStatus" text DEFAULT 'active'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "lastLogin" timestamp(3) without time zone,
    "passwordHash" text,
    "defaultInsuranceId" text,
    "patientNumber" integer,
    "isReferred" boolean DEFAULT false NOT NULL,
    "referredBy" text,
    "previousSurgeries" jsonb,
    "profilePhoto" text,
    lifestyle jsonb
);


ALTER TABLE public.patients OWNER TO tanuj;

--
-- Name: payments; Type: TABLE; Schema: public; Owner: tanuj
--

CREATE TABLE public.payments (
    id text NOT NULL,
    "billId" text NOT NULL,
    "patientId" text NOT NULL,
    "paymentDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "paymentMethod" public."PaymentMethod" NOT NULL,
    amount double precision NOT NULL,
    "transactionId" text,
    "referenceNumber" text,
    "bankName" text,
    "cardLast4" text,
    status text DEFAULT 'completed'::text NOT NULL,
    notes text,
    "processedBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.payments OWNER TO tanuj;

--
-- Name: pre_op_assessments; Type: TABLE; Schema: public; Owner: tanuj
--

CREATE TABLE public.pre_op_assessments (
    id text NOT NULL,
    "ipdAdmissionId" text NOT NULL,
    "assessedBy" text NOT NULL,
    "assessmentDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "visualAcuity" jsonb,
    refraction jsonb,
    iop jsonb,
    "slitLampFindings" jsonb,
    "fundusFindings" jsonb,
    "surgicalPlan" text,
    "iolPower" jsonb,
    "anesthesiaType" text,
    "specialConsiderations" text,
    "riskAssessment" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.pre_op_assessments OWNER TO tanuj;

--
-- Name: prescription_items; Type: TABLE; Schema: public; Owner: tanuj
--

CREATE TABLE public.prescription_items (
    id text NOT NULL,
    "prescriptionId" text NOT NULL,
    "medicineName" text NOT NULL,
    dosage text NOT NULL,
    frequency text NOT NULL,
    duration text NOT NULL,
    instructions text,
    quantity integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "medicineId" text
);


ALTER TABLE public.prescription_items OWNER TO tanuj;

--
-- Name: prescriptions; Type: TABLE; Schema: public; Owner: tanuj
--

CREATE TABLE public.prescriptions (
    id text NOT NULL,
    "prescriptionNumber" text NOT NULL,
    "patientVisitId" text NOT NULL,
    "examinationId" text,
    "doctorId" text NOT NULL,
    "prescriptionDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "validTill" timestamp(3) without time zone,
    "generalInstructions" text,
    "followUpInstructions" text,
    status text DEFAULT 'active'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.prescriptions OWNER TO tanuj;

--
-- Name: refrigerator_temperature_register; Type: TABLE; Schema: public; Owner: tanuj
--

CREATE TABLE public.refrigerator_temperature_register (
    id text NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    "temperature12Pm" double precision,
    "temperature3Pm" double precision,
    "temperature6Pm" double precision,
    sign text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdBy" text
);


ALTER TABLE public.refrigerator_temperature_register OWNER TO tanuj;

--
-- Name: room_types; Type: TABLE; Schema: public; Owner: tanuj
--

CREATE TABLE public.room_types (
    id text NOT NULL,
    "typeName" text NOT NULL,
    "typeCode" text,
    category text,
    "defaultCapacity" integer,
    "equipmentRequirements" jsonb,
    "costPerHour" double precision
);


ALTER TABLE public.room_types OWNER TO tanuj;

--
-- Name: rooms; Type: TABLE; Schema: public; Owner: tanuj
--

CREATE TABLE public.rooms (
    id text NOT NULL,
    "floorId" text,
    "roomTypeId" text,
    "roomNumber" text NOT NULL,
    "roomName" text,
    capacity integer,
    "equipmentInstalled" jsonb,
    status text DEFAULT 'available'::text NOT NULL,
    "dailyRate" double precision,
    "hourlyRate" double precision,
    "lastCleaned" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "assignedStaffId" text
);


ALTER TABLE public.rooms OWNER TO tanuj;

--
-- Name: staff; Type: TABLE; Schema: public; Owner: tanuj
--

CREATE TABLE public.staff (
    id text NOT NULL,
    "employeeId" text,
    "firstName" text NOT NULL,
    "lastName" text NOT NULL,
    email text,
    phone text,
    "dateOfBirth" timestamp(3) without time zone,
    gender text,
    address jsonb,
    department text,
    "staffType" text NOT NULL,
    "employmentStatus" text DEFAULT 'active'::text NOT NULL,
    "joiningDate" timestamp(3) without time zone,
    qualifications jsonb,
    certifications jsonb,
    "languagesSpoken" text[],
    "passwordHash" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "lastLogin" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "adminProfile" jsonb,
    "doctorProfile" jsonb,
    "emergencyContact" jsonb,
    "nurseProfile" jsonb,
    "optometristProfile" jsonb,
    "receptionistProfile" jsonb,
    "technicianProfile" jsonb,
    "accountantProfile" jsonb,
    documents text[],
    "patientSafetyOfficerProfile" jsonb,
    "profilePhoto" text,
    "qualityCoordinatorProfile" jsonb,
    "tpaProfile" jsonb,
    "receptionist2Profile" jsonb,
    "anesthesiologistProfile" jsonb,
    "otAdminProfile" jsonb,
    "sisterProfile" jsonb,
    "surgeonProfile" jsonb
);


ALTER TABLE public.staff OWNER TO tanuj;

--
-- Name: staff_attendance; Type: TABLE; Schema: public; Owner: tanuj
--

CREATE TABLE public.staff_attendance (
    id text NOT NULL,
    "staffId" text NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    "checkInTime" timestamp(3) without time zone,
    "checkOutTime" timestamp(3) without time zone,
    "workingHours" double precision,
    "isPresent" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    status public."AttendanceStatus" DEFAULT 'ABSENT'::public."AttendanceStatus" NOT NULL
);


ALTER TABLE public.staff_attendance OWNER TO tanuj;

--
-- Name: staff_types; Type: TABLE; Schema: public; Owner: tanuj
--

CREATE TABLE public.staff_types (
    id text NOT NULL,
    type text NOT NULL
);


ALTER TABLE public.staff_types OWNER TO tanuj;

--
-- Name: super_admins; Type: TABLE; Schema: public; Owner: tanuj
--

CREATE TABLE public.super_admins (
    id text NOT NULL,
    "firstName" text NOT NULL,
    "lastName" text NOT NULL,
    email text NOT NULL,
    "passwordHash" text NOT NULL,
    phone text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.super_admins OWNER TO tanuj;

--
-- Name: surgery_fitness_requirements; Type: TABLE; Schema: public; Owner: tanuj
--

CREATE TABLE public.surgery_fitness_requirements (
    id text NOT NULL,
    "surgeryTypeId" text NOT NULL,
    "requirementName" text NOT NULL,
    "requirementType" public."FitnessReqType" NOT NULL,
    description text,
    "testParameters" jsonb,
    "normalRanges" jsonb,
    "criticalValues" jsonb,
    "validityPeriod" integer,
    "minimumGap" integer,
    "minAge" integer,
    "maxAge" integer,
    "specificConditions" jsonb,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.surgery_fitness_requirements OWNER TO tanuj;

--
-- Name: surgery_metrics; Type: TABLE; Schema: public; Owner: tanuj
--

CREATE TABLE public.surgery_metrics (
    id text NOT NULL,
    "ipdAdmissionId" text NOT NULL,
    "surgeryStartTime" timestamp(3) without time zone NOT NULL,
    "surgeryEndTime" timestamp(3) without time zone,
    "surgeonId" text NOT NULL,
    "anesthesiaType" text,
    complications text,
    "iolImplanted" text,
    "surgicalNotes" text,
    "intraOperativeFindings" jsonb,
    "immediateComplications" text,
    "postOpInstructions" text,
    "followUpSchedule" text,
    "visualOutcome" jsonb,
    "surgeryDuration" integer,
    "bloodLoss" text,
    "patientTolerance" text,
    "surgicalComplexity" text,
    "equipmentUsed" jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "implantedLensId" text
);


ALTER TABLE public.surgery_metrics OWNER TO tanuj;

--
-- Name: surgery_packages; Type: TABLE; Schema: public; Owner: tanuj
--

CREATE TABLE public.surgery_packages (
    id text NOT NULL,
    "surgeryTypeId" text,
    "packageName" text NOT NULL,
    "packageCode" text,
    description text,
    "includedServices" jsonb,
    "excludedServices" jsonb,
    "defaultLensId" text,
    "packageCost" double precision NOT NULL,
    "lensUpgradeCost" double precision DEFAULT 0,
    "additionalCharges" jsonb,
    "discountEligible" boolean DEFAULT true NOT NULL,
    "warrantyPeriod" integer,
    "followUpVisits" integer,
    "emergencySupport" boolean DEFAULT false NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "isRecommended" boolean DEFAULT false NOT NULL,
    priority integer DEFAULT 0 NOT NULL,
    "createdBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "relatedSurgeryNames" text[],
    "surgeryCategory" public."SurgeryTypeCategory"
);


ALTER TABLE public.surgery_packages OWNER TO tanuj;

--
-- Name: surgery_types; Type: TABLE; Schema: public; Owner: tanuj
--

CREATE TABLE public.surgery_types (
    id text NOT NULL,
    name text NOT NULL,
    code text,
    category public."SurgeryTypeCategory" NOT NULL,
    description text,
    "averageDuration" integer,
    "complexityLevel" text,
    "requiresAnesthesia" text,
    "isOutpatient" boolean DEFAULT true NOT NULL,
    "requiresAdmission" boolean DEFAULT false NOT NULL,
    "requiredEquipment" jsonb,
    "preOpRequirements" jsonb,
    "postOpInstructions" jsonb,
    "followUpSchedule" jsonb,
    "baseCost" double precision,
    "additionalCharges" jsonb,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "investigationIds" text[]
);


ALTER TABLE public.surgery_types OWNER TO tanuj;

--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: tanuj
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
60f293ff-3fbd-4cfc-8f64-6249f2973205	b4781368addcbfc08184e053878a74b491ac914f27da061cc36e4c1509b96bc7	\N	0_init	A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 0_init\n\nDatabase error code: 42601\n\nDatabase error:\nERROR: syntax error at or near "﻿"\n\nPosition:\n[1m  0[0m\n[1m  1[1;31m ﻿-- CreateSchema[0m\n\nDbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42601), message: "syntax error at or near \\"\\u{feff}\\"", detail: None, hint: None, position: Some(Original(1)), where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("scan.l"), line: Some(1244), routine: Some("scanner_yyerror") }\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name="0_init"\n             at schema-engine\\connectors\\sql-schema-connector\\src\\apply_migration.rs:113\n   1: schema_commands::commands::apply_migrations::Applying migration\n           with migration_name="0_init"\n             at schema-engine\\commands\\src\\commands\\apply_migrations.rs:95\n   2: schema_core::state::ApplyMigrations\n             at schema-engine\\core\\src\\state.rs:236	\N	2025-11-26 19:18:57.544314+05:30	0
78dca1dc-a8cd-4f4c-b5d2-ac3ecf03cd0d	2336ba8b10a491891f1a11e286c31d6d94b51d134873ff12f4e06999e86c05f2	2025-11-26 11:38:19.952555+05:30	20250911071817_init_with_otp	\N	\N	2025-11-26 11:38:19.853394+05:30	1
876614de-0d35-494e-9411-29aa1146ab9e	d21c76f63c17fb8b46f846ddc1388d976ad781e4a3f7db09c05e8bef4d38ce09	2025-11-26 11:38:20.555372+05:30	20251023_add_previous_surgeries_field	\N	\N	2025-11-26 11:38:20.523698+05:30	1
ece1a4d2-034d-4379-bcb0-3df6565810dd	7653f546b82733cfe68044c92c4669a669718403f9bc8cce9ac2ae4a54913f21	2025-11-26 11:38:19.998426+05:30	20250912075343_add_role_specific_profiles_to_staff	\N	\N	2025-11-26 11:38:19.963908+05:30	1
1ed35d52-1182-4491-9880-7064a46549d5	298f4ccd8a24f842f149695a8e7fde836fbc8117a04fec800a0bc808b3b10fbd	2025-11-26 11:38:20.044215+05:30	20250915091851_add_new_staff_roles_and_file_upload	\N	\N	2025-11-26 11:38:20.013477+05:30	1
8b0ca101-f16e-4a8e-af83-f708110619fe	3e52470bfb9383a59617264d4536e1100657fd723d5475e329663d45382364a8	2025-11-26 11:38:20.086782+05:30	20250922064617_add_patient_authentication	\N	\N	2025-11-26 11:38:20.056866+05:30	1
e5d0a225-1897-4cd2-9562-8dbacd388fd8	b229f5f5629e66cbc88f4661befe4703be328f17d1931d4ca9e54b813322c23c	2025-11-26 11:38:20.599579+05:30	20251023120000_add_profile_photo_to_patient	\N	\N	2025-11-26 11:38:20.568508+05:30	1
f15c9602-b054-4a76-95ba-032bb11df9cb	210a01c7702068e5a883dfe8f923ed8dfcf211a8d118caea648481f5a49f52b4	2025-11-26 11:38:20.193265+05:30	20250924112010_add_comprehensive_hospital_features	\N	\N	2025-11-26 11:38:20.099563+05:30	1
cf9601b5-001c-4ad0-9095-461fe32a5c7e	8ec202d9b8e84bd0264b62e6eaabbf2d4028fec7f5f5e65030b54fae98810fbf	2025-11-26 11:38:20.238315+05:30	20250925061314_change_patient_number_to_int	\N	\N	2025-11-26 11:38:20.204535+05:30	1
979d827b-06c9-4f03-acb3-bb9950a6fd5a	f1f79b3e12924e40d5a4926165da898918fc126c7e7aaf317a77620ae1195f33	2025-11-26 11:38:20.278541+05:30	20250927053108_add_tpa_profile_to_staff	\N	\N	2025-11-26 11:38:20.250345+05:30	1
17c31310-4056-451e-ab90-e7a0d5bd9690	a450ca557fd14beb54f492e60ba2535e8bb58a0e358e3df5ffd104759edcef67	2025-11-26 11:38:20.642564+05:30	20251023165100_add_lifestyle_field_to_patient	\N	\N	2025-11-26 11:38:20.613162+05:30	1
243087be-318c-493f-996d-f951d0116e9f	6a01377c5930cbf667a2c47b8f927cdb2729d9111a0df7d8b41c2c5c568fefc1	2025-11-26 11:38:20.333295+05:30	20250930102327_add_priority_label_and_clean_patient_visit	\N	\N	2025-11-26 11:38:20.298375+05:30	1
8d0a7a70-cbe4-4272-8018-919fb089f66f	6ce7cad4f9cc5f59a248429f8f6287e1ea1de83be50d77b854c905188ab15ccf	2025-11-26 11:38:20.372976+05:30	20251001081625_fix_visit_number_unique_per_patient	\N	\N	2025-11-26 11:38:20.343834+05:30	1
e740cd21-6e60-464e-a74d-ee244e909e18	88310c5bd1dd108d9b146e6323f91340da6c63ea1719a88ac3ca8579d4a79583	2025-11-26 11:38:20.420126+05:30	20251001111814_remove_transferred_status	\N	\N	2025-11-26 11:38:20.384383+05:30	1
fae2ce43-ceb6-4c50-8c11-de179cddf78a	c79451e828dafb3b19aa71621eb9a13371ed36d2c779c63a67fc3245de38fb47	2025-11-26 11:38:20.686366+05:30	20251103_161920_add_doctor_queue_position	\N	\N	2025-11-26 11:38:20.653578+05:30	1
b992f730-84a3-4e89-9210-5aec610f5f8e	29f05f703bf4ac91a26504f053737c9442a3569bf468232675e2aa00fe994306	2025-11-26 11:38:20.460476+05:30	20251010073711_enhance_optometrist_examination_schema	\N	\N	2025-11-26 11:38:20.431212+05:30	1
ea96edb9-a663-44ef-8660-280b4dd95d9c	195d461bbd1c17b0413009ba1a438f9fe211a1c803a013b8eee7933082cc9993	2025-11-26 11:38:20.511218+05:30	20251015072702_add_patient_referral_system	\N	\N	2025-11-26 11:38:20.472306+05:30	1
810d9c8e-63eb-4e64-ae74-06fa454097d7	7c24c2e2ea2bd08a4903dcdb3dc58d43ca7c2e3e812ea165e3764240b7166061	2025-11-26 11:38:20.80657+05:30	20251110123507_add_surgery_details_to_ipd	\N	\N	2025-11-26 11:38:20.697878+05:30	1
054d73d7-add0-48b9-bb2b-d9d47c0894bd	8384cb78f75f6401a0f971d0f46284278ca847946f27643e5f029ce105f028c8	2025-11-26 11:38:20.862198+05:30	20251112084252_add_staff_attendance_system	\N	\N	2025-11-26 11:38:20.818892+05:30	1
4145ded1-b897-4aba-8b26-7c5623651712	cccfda9cf817e0fcc7a111a8a998684d2a45211a95aec4ecdaa41e72571bbcf1	2025-11-26 11:38:20.907253+05:30	20251114111416_add_granular_ipd_status_tracking	\N	\N	2025-11-26 11:38:20.872355+05:30	1
82ed46cf-53e6-440f-8705-5ea081ad64d4	bd9bf958408ce3306c5a07f6afab5e54c9fcc07ef42ecf8aa5a6d01924d076b3	2025-11-26 11:39:13.854492+05:30	20251126060913_add_lens_fields_to_ipd_admission	\N	\N	2025-11-26 11:39:13.722607+05:30	1
\.


--
-- Data for Name: appointments; Type: TABLE DATA; Schema: public; Owner: tanuj
--

COPY public.appointments (id, "patientId", "doctorId", "appointmentDate", "appointmentTime", "tokenNumber", "qrCode", "estimatedDuration", status, "appointmentType", purpose, notes, "roomId", "estimatedCost", "cancelReason", "rescheduledFrom", "rescheduledTo", "createdAt", "updatedAt") FROM stdin;
cmiipozad000p7kvwbxcnui1z	cmid4ke80000t7kuo25jo31bt	\N	2025-11-28 10:20:39.203	03:50 PM	3846	\N	30	CHECKED_IN	Post-Op Checkup	Post-Op Checkup appointment	Instant appointment booked by Receptionist One (receptionist)	\N	\N	\N	\N	\N	2025-11-28 10:20:39.205	2025-11-28 10:20:41.111
cmiiujt7800017kwgrhg9vtyh	cmid1gref0007lh2o4lyiui4h	\N	2025-11-28 12:36:36.095	06:06 PM	1923	\N	30	CHECKED_IN	Post-Op Checkup	Post-Op Checkup appointment	Instant appointment booked by Receptionist One (receptionist)	\N	\N	\N	\N	\N	2025-11-28 12:36:36.116	2025-11-28 12:36:37.641
cmifm8qb700017kt8x7vhtfum	cmid4j13f000f7kuojk83el5r	\N	2025-11-26 06:20:43.664	11:50 AM	6337	\N	30	CHECKED_IN	Post-Op Checkup	Post-Op Checkup appointment	Instant appointment booked by Receptionist One (receptionist)	\N	\N	\N	\N	\N	2025-11-26 06:20:43.685	2025-11-26 06:20:45.615
cmifn1ibx0001lh2cswqwpdv5	cmid4i0bj00087kuoin675c9t	\N	2025-11-26 06:43:06.318	12:13 PM	9036	\N	30	CHECKED_IN	Emergency	Emergency appointment	Instant appointment booked by Receptionist One (receptionist)	\N	\N	\N	\N	\N	2025-11-26 06:43:06.382	2025-11-26 06:43:07.662
cmifn1njd0007lh2cj7ct4map	cmid4ke80000t7kuo25jo31bt	\N	2025-11-26 06:43:13.128	12:13 PM	8379	\N	30	CHECKED_IN	Emergency	Emergency appointment	Instant appointment booked by Receptionist One (receptionist)	\N	\N	\N	\N	\N	2025-11-26 06:43:13.129	2025-11-26 06:43:14.166
cmiforhz700027kns3udvv4vp	cmiforhuz00007knsf1bj4bff	\N	2025-11-26 07:31:18.539	01:01 PM	9383	\N	30	CHECKED_IN	routine	Initial Consultation - New Patient Registration	Patient registered by staff. No email provided - manual credential sharing required.	\N	\N	\N	\N	\N	2025-11-26 07:31:18.595	2025-11-26 07:31:20.777
cmifospaq00097knsim09j1ev	cmifosp9000077knsrc85belr	\N	2025-11-26 07:32:14.726	01:02 PM	3794	\N	30	CHECKED_IN	routine	Initial Consultation - New Patient Registration	Patient registered by staff. No email provided - manual credential sharing required.	\N	\N	\N	\N	\N	2025-11-26 07:32:14.738	2025-11-26 07:32:16.339
cmifoudzv000g7knsxlnlcqpc	cmifoudy5000e7knsp79gvllm	\N	2025-11-26 07:33:33.389	01:03 PM	6491	\N	30	CHECKED_IN	routine	Initial Consultation - New Patient Registration	Patient registered by staff. No email provided - manual credential sharing required.	\N	\N	\N	\N	\N	2025-11-26 07:33:33.403	2025-11-26 07:33:35.462
cmifovdue000n7kns2lcvryk9	cmifovdsp000l7kns1ayir9mv	\N	2025-11-26 07:34:19.848	01:04 PM	8375	\N	30	CHECKED_IN	routine	Initial Consultation - New Patient Registration	Patient registered by staff. No email provided - manual credential sharing required.	\N	\N	\N	\N	\N	2025-11-26 07:34:19.862	2025-11-26 07:34:21.599
cmifovvik000t7knso998y43n	cmifovdsp000l7kns1ayir9mv	\N	2025-11-26 07:34:42.761	01:04 PM	7710	\N	30	CHECKED_IN	Post-Op Checkup	Post-Op Checkup appointment	Instant appointment booked by Receptionist One (receptionist)	\N	\N	\N	\N	\N	2025-11-26 07:34:42.764	2025-11-26 07:34:44.485
cmifowh38000z7knsbc4kl6is	cmifosp9000077knsrc85belr	\N	2025-11-26 07:35:10.72	01:05 PM	7300	\N	30	CHECKED_IN	Post-Op Checkup	Post-Op Checkup appointment	Instant appointment booked by Receptionist One (receptionist)	\N	\N	\N	\N	\N	2025-11-26 07:35:10.723	2025-11-26 07:35:12.319
cmifp0uyr00177kns5y7vpzgf	cmifovdsp000l7kns1ayir9mv	\N	2025-11-26 07:38:35.328	01:08 PM	4735	\N	30	CHECKED_IN	Post-Op Checkup	Post-Op Checkup appointment	Instant appointment booked by Receptionist One (receptionist)	\N	\N	\N	\N	\N	2025-11-26 07:38:35.331	2025-11-26 07:38:37.447
cmig3o8w000017kpcufxtxph3	cmifoudy5000e7knsp79gvllm	\N	2025-11-26 14:28:41.063	07:58 PM	9311	\N	30	CHECKED_IN	Routine	Routine appointment	Instant appointment booked by Receptionist One (receptionist)	\N	\N	\N	\N	\N	2025-11-26 14:28:41.084	2025-11-26 14:28:42.891
cmig3ogg800077kpcu7t0zlgs	cmid4jpr6000m7kuonfbhpf5p	\N	2025-11-26 14:28:50.887	07:58 PM	6308	\N	30	CHECKED_IN	Routine	Routine appointment	Instant appointment booked by Receptionist One (receptionist)	\N	\N	\N	\N	\N	2025-11-26 14:28:50.888	2025-11-26 14:28:52.723
cmig3onsz000d7kpczpr1gj8z	cmid1gref0007lh2o4lyiui4h	\N	2025-11-26 14:29:00.418	07:59 PM	8612	\N	30	CHECKED_IN	Post-Op Checkup	Post-Op Checkup appointment	Instant appointment booked by Receptionist One (receptionist)	\N	\N	\N	\N	\N	2025-11-26 14:29:00.42	2025-11-26 14:29:02.185
cmig4fn3u00017k94ozvipu8v	cmifovdsp000l7kns1ayir9mv	\N	2025-11-26 14:49:59.205	08:19 PM	6224	\N	30	CHECKED_IN	Routine	Routine appointment	Instant appointment booked by Receptionist One (receptionist)	\N	\N	\N	\N	\N	2025-11-26 14:49:59.226	2025-11-26 14:50:00.874
cmig4ft6o00077k94wp3o5pv2	cmifoudy5000e7knsp79gvllm	\N	2025-11-26 14:50:07.103	08:20 PM	7654	\N	30	CHECKED_IN	Emergency	Emergency appointment	Instant appointment booked by Receptionist One (receptionist)	\N	\N	\N	\N	\N	2025-11-26 14:50:07.105	2025-11-26 14:50:08.617
cmig4g0b9000d7k94hhrf4czi	cmifosp9000077knsrc85belr	\N	2025-11-26 14:50:16.34	08:20 PM	5225	\N	30	CHECKED_IN	Routine	Routine appointment	Instant appointment booked by Receptionist One (receptionist)	\N	\N	\N	\N	\N	2025-11-26 14:50:16.342	2025-11-26 14:50:17.75
cmig4g65d000j7k94cyicl3ky	cmiforhuz00007knsf1bj4bff	\N	2025-11-26 14:50:23.903	08:20 PM	4546	\N	30	CHECKED_IN	Follow-up	Follow-up appointment	Instant appointment booked by Receptionist One (receptionist)	\N	\N	\N	\N	\N	2025-11-26 14:50:23.905	2025-11-26 14:50:25.251
cmig4wifq000x7k94m9x9ketu	cmifoudy5000e7knsp79gvllm	\N	2025-11-26 15:03:06.324	08:33 PM	6573	\N	30	CHECKED_IN	Routine	Routine appointment	Instant appointment booked by Receptionist One (receptionist)	\N	\N	\N	\N	\N	2025-11-26 15:03:06.326	2025-11-26 15:03:08.075
cmig4wooi00137k94z3h50255	cmid4ke80000t7kuo25jo31bt	\N	2025-11-26 15:03:14.416	08:33 PM	8473	\N	30	CHECKED_IN	Routine	Routine appointment	Instant appointment booked by Receptionist One (receptionist)	\N	\N	\N	\N	\N	2025-11-26 15:03:14.418	2025-11-26 15:03:16.028
cmig4wu9r00197k944apj60hu	cmid4i0bj00087kuoin675c9t	\N	2025-11-26 15:03:21.661	08:33 PM	2749	\N	30	CHECKED_IN	Routine	Routine appointment	Instant appointment booked by Receptionist One (receptionist)	\N	\N	\N	\N	\N	2025-11-26 15:03:21.663	2025-11-26 15:03:23.644
cmig5aa1m001l7k94cvw7t26r	cmifovdsp000l7kns1ayir9mv	\N	2025-11-26 15:13:48.632	08:43 PM	9062	\N	30	CHECKED_IN	Post-Op Checkup	Post-Op Checkup appointment	Instant appointment booked by Receptionist One (receptionist)	\N	\N	\N	\N	\N	2025-11-26 15:13:48.634	2025-11-26 15:13:50.372
cmig5ag1k001r7k94vbtg8ldc	cmifosp9000077knsrc85belr	\N	2025-11-26 15:13:56.406	08:43 PM	2447	\N	30	CHECKED_IN	Routine	Routine appointment	Instant appointment booked by Receptionist One (receptionist)	\N	\N	\N	\N	\N	2025-11-26 15:13:56.408	2025-11-26 15:13:57.877
cmig5alte001x7k94usxems9j	cmid4ke80000t7kuo25jo31bt	\N	2025-11-26 15:14:03.888	08:44 PM	9027	\N	30	CHECKED_IN	Routine	Routine appointment	Instant appointment booked by Receptionist One (receptionist)	\N	\N	\N	\N	\N	2025-11-26 15:14:03.89	2025-11-26 15:14:05.187
cmig5arn700237k94jlhzixh4	cmid4i0bj00087kuoin675c9t	\N	2025-11-26 15:14:11.441	08:44 PM	2100	\N	30	CHECKED_IN	Consultation	Consultation appointment	Instant appointment booked by Receptionist One (receptionist)	\N	\N	\N	\N	\N	2025-11-26 15:14:11.443	2025-11-26 15:14:12.839
cmig5axvs00297k9400ypulzn	cmid1g2fc0000lh2oexmdgcjs	\N	2025-11-26 15:14:19.526	08:44 PM	5564	\N	30	CHECKED_IN	Routine	Routine appointment	Instant appointment booked by Receptionist One (receptionist)	\N	\N	\N	\N	\N	2025-11-26 15:14:19.529	2025-11-26 15:14:20.96
cmig87qdw00017kl8a3w9xtl9	cmifovdsp000l7kns1ayir9mv	\N	2025-11-26 16:35:48.652	10:05 PM	5427	\N	30	CHECKED_IN	Routine	Routine appointment	Instant appointment booked by Receptionist One (receptionist)	\N	\N	\N	\N	\N	2025-11-26 16:35:48.691	2025-11-26 16:35:50.183
cmig87v8q00077kl8ulee85wu	cmid4jpr6000m7kuonfbhpf5p	\N	2025-11-26 16:35:54.984	10:05 PM	7926	\N	30	CHECKED_IN	Emergency	Emergency appointment	Instant appointment booked by Receptionist One (receptionist)	\N	\N	\N	\N	\N	2025-11-26 16:35:54.986	2025-11-26 16:35:56.428
cmiiq0pq8000v7kvws3xult5d	cmid4jpr6000m7kuonfbhpf5p	\N	2025-11-28 10:29:46.685	03:59 PM	2165	\N	30	CHECKED_IN	Routine	Routine appointment	Instant appointment booked by Receptionist One (receptionist)	\N	\N	\N	\N	\N	2025-11-28 10:29:46.688	2025-11-28 10:29:48.415
cmiiy7plp00037kd4999wpn1n	cmifosp9000077knsrc85belr	\N	2025-11-28 14:19:10.026	07:49 PM	3956	\N	30	CHECKED_IN	Routine	Routine appointment	Instant appointment booked by Receptionist One (receptionist)	\N	\N	\N	\N	\N	2025-11-28 14:19:10.046	2025-11-28 14:19:11.628
cmigz92i9001c7kusn64wno3b	cmigyrzyp00067kusikwq7ypy	\N	2025-11-27 05:12:40.686	10:42 AM	3752	\N	30	CHECKED_IN	Post-Op Checkup	Post-Op Checkup appointment	Instant appointment booked by Receptionist One (receptionist)	\N	\N	\N	\N	\N	2025-11-27 05:12:40.689	2025-11-27 05:12:42.196
cmigz98m0001i7kusyp8ko495	cmifovdsp000l7kns1ayir9mv	\N	2025-11-27 05:12:48.597	10:42 AM	3235	\N	30	CHECKED_IN	Post-Op Checkup	Post-Op Checkup appointment	Instant appointment booked by Receptionist One (receptionist)	\N	\N	\N	\N	\N	2025-11-27 05:12:48.601	2025-11-27 05:12:51.603
cmigz9fiu001o7kusmucnh6cg	cmifoudy5000e7knsp79gvllm	\N	2025-11-27 05:12:57.556	10:42 AM	1854	\N	30	CHECKED_IN	Consultation	Consultation appointment	Instant appointment booked by Receptionist One (receptionist)	\N	\N	\N	\N	\N	2025-11-27 05:12:57.558	2025-11-27 05:12:59.315
cmigz9m8z001u7kus9vkgnbkx	cmifosp9000077knsrc85belr	\N	2025-11-27 05:13:06.274	10:43 AM	3363	\N	30	CHECKED_IN	Routine	Routine appointment	Instant appointment booked by Receptionist One (receptionist)	\N	\N	\N	\N	\N	2025-11-27 05:13:06.276	2025-11-27 05:13:07.678
cmigz9s1h00207kus5eee2p37	cmiforhuz00007knsf1bj4bff	\N	2025-11-27 05:13:13.779	10:43 AM	4185	\N	30	CHECKED_IN	Routine	Routine appointment	Instant appointment booked by Receptionist One (receptionist)	\N	\N	\N	\N	\N	2025-11-27 05:13:13.781	2025-11-27 05:13:15.284
cmigz9y5o00267kusc2mbyfmd	cmid4ke80000t7kuo25jo31bt	\N	2025-11-27 05:13:21.706	10:43 AM	3896	\N	30	CHECKED_IN	Consultation	Consultation appointment	Instant appointment booked by Receptionist One (receptionist)	\N	\N	\N	\N	\N	2025-11-27 05:13:21.708	2025-11-27 05:13:23.159
cmigza4dx002c7kus4nmvs4s0	cmid4j13f000f7kuojk83el5r	\N	2025-11-27 05:13:29.779	10:43 AM	3737	\N	30	CHECKED_IN	Routine	Routine appointment	Instant appointment booked by Receptionist One (receptionist)	\N	\N	\N	\N	\N	2025-11-27 05:13:29.781	2025-11-27 05:13:31.097
cmigza9w5002i7kusog859le7	cmid4i0bj00087kuoin675c9t	\N	2025-11-27 05:13:36.915	10:43 AM	2980	\N	30	CHECKED_IN	Routine	Routine appointment	Instant appointment booked by Receptionist One (receptionist)	\N	\N	\N	\N	\N	2025-11-27 05:13:36.917	2025-11-27 05:13:38.315
cmigzag2m002o7kusbtodz1f3	cmid1gref0007lh2o4lyiui4h	\N	2025-11-27 05:13:44.924	10:43 AM	9732	\N	30	CHECKED_IN	Routine	Routine appointment	Instant appointment booked by Receptionist One (receptionist)	\N	\N	\N	\N	\N	2025-11-27 05:13:44.926	2025-11-27 05:13:46.291
cmigzanko002u7kusg6rl8jn9	cmid1g2fc0000lh2oexmdgcjs	\N	2025-11-27 05:13:54.646	10:43 AM	4602	\N	30	CHECKED_IN	Post-Op Checkup	Post-Op Checkup appointment	Instant appointment booked by Receptionist One (receptionist)	\N	\N	\N	\N	\N	2025-11-27 05:13:54.648	2025-11-27 05:13:55.901
cmiipgron00017kvwb3z5ul9n	cmifoudy5000e7knsp79gvllm	\N	2025-11-28 10:14:16.067	03:44 PM	4284	\N	30	CHECKED_IN	Routine	Routine appointment	Instant appointment booked by Receptionist One (receptionist)	\N	\N	\N	\N	\N	2025-11-28 10:14:16.089	2025-11-28 10:14:17.782
cmiipgzpr00077kvw5srvzvf6	cmiforhuz00007knsf1bj4bff	\N	2025-11-28 10:14:26.509	03:44 PM	4297	\N	30	CHECKED_IN	Routine	Routine appointment	Instant appointment booked by Receptionist One (receptionist)	\N	\N	\N	\N	\N	2025-11-28 10:14:26.511	2025-11-28 10:14:27.98
cmiiph6mg000d7kvw1105mqlh	cmid1g2fc0000lh2oexmdgcjs	\N	2025-11-28 10:14:35.463	03:44 PM	6196	\N	30	CHECKED_IN	Post-Op Checkup	Post-Op Checkup appointment	Instant appointment booked by Receptionist One (receptionist)	\N	\N	\N	\N	\N	2025-11-28 10:14:35.465	2025-11-28 10:14:37.201
\.


--
-- Data for Name: bed_types; Type: TABLE DATA; Schema: public; Owner: tanuj
--

COPY public.bed_types (id, "typeName", "typeCode", category, "dailyCharge") FROM stdin;
\.


--
-- Data for Name: beds; Type: TABLE DATA; Schema: public; Owner: tanuj
--

COPY public.beds (id, "roomId", "bedTypeId", "bedNumber", status, "patientId", "admissionDate", "expectedDischargeDate", "dailyRate", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: bill_items; Type: TABLE DATA; Schema: public; Owner: tanuj
--

COPY public.bill_items (id, "billId", "itemType", "itemCode", "itemName", description, quantity, "unitPrice", "totalPrice", "taxRate", "taxAmount", "discountRate", "discountAmount", "serviceId", "examinationId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: bills; Type: TABLE DATA; Schema: public; Owner: tanuj
--

COPY public.bills (id, "billNumber", "patientId", "patientVisitId", "hospitalId", "billDate", "dueDate", status, "subTotal", "taxAmount", "discountAmount", "totalAmount", "paidAmount", "balanceAmount", "billedBy", "approvedBy", "insuranceClaimId", "estimatedInsuranceCover", notes, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: diagnoses; Type: TABLE DATA; Schema: public; Owner: tanuj
--

COPY public.diagnoses (id, "visitId", "examinationId", "diseaseId", "doctorId", "diagnosisType", "diagnosisDate", "confidenceLevel", "eyeAffected", "visualImpact", severity, stage, "onsetDate", progression, "diagnosticEvidence", "supportingFindings", "treatmentRecommended", "surgeryRequired", "urgencyLevel", "isPrimary", billable, notes, "createdAt", "updatedAt", "ophthalmologistExaminationId") FROM stdin;
\.


--
-- Data for Name: digital_register_columns; Type: TABLE DATA; Schema: public; Owner: tanuj
--

COPY public.digital_register_columns (id, "registerId", "columnName", "columnType", "isRequired", "displayOrder", "minLength", "maxLength", "minValue", "maxValue", pattern, "createdAt", "updatedAt", options) FROM stdin;
\.


--
-- Data for Name: digital_register_definitions; Type: TABLE DATA; Schema: public; Owner: tanuj
--

COPY public.digital_register_definitions (id, name, description, "isActive", "createdBy", "createdAt", "updatedAt", "allowedStaffTypes") FROM stdin;
cmid4ckqv00007kuoeei3lp5y	test register	test with data	t	cmicwemnf00007kmwiu8va9id	2025-11-24 12:24:17.671	2025-11-24 12:24:17.671	{ot_admin}
\.


--
-- Data for Name: digital_register_records; Type: TABLE DATA; Schema: public; Owner: tanuj
--

COPY public.digital_register_records (id, "registerId", "createdBy", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: digital_register_values; Type: TABLE DATA; Schema: public; Owner: tanuj
--

COPY public.digital_register_values (id, "recordId", "columnId", "textValue", "numberValue", "dateValue", "imageValue", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: diseases; Type: TABLE DATA; Schema: public; Owner: tanuj
--

COPY public.diseases (id, "icd11CodeId", "diseaseName", "commonNames", "ophthalmologyCategory", "affectedStructure", "eyeAffected", symptoms, signs, "diagnosticCriteria", "treatmentProtocols", "surgicalOptions", prognosis, "visualImpactLevel", "urgencyLevel", "isChronic", "requiresSurgery", "affectsVision", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: dosage_schedules; Type: TABLE DATA; Schema: public; Owner: tanuj
--

COPY public.dosage_schedules (id, name, "isActive", "createdAt", "updatedAt") FROM stdin;
cmid1tsn6001hlhe85r1l5t1p	Once Daily (OD)	t	2025-11-24 11:13:42.21	2025-11-24 11:13:42.21
cmid1tsoq001ilhe8mrxhgjyq	Twice Daily (BD)	t	2025-11-24 11:13:42.267	2025-11-24 11:13:42.267
cmid1tspi001jlhe82wm9bqri	Three Times Daily (TDS)	t	2025-11-24 11:13:42.294	2025-11-24 11:13:42.294
cmid1tsq8001klhe8qtd9950b	Four Times Daily (QID)	t	2025-11-24 11:13:42.321	2025-11-24 11:13:42.321
cmid1tsr1001llhe8il0pbqfq	Every 2 Hours	t	2025-11-24 11:13:42.35	2025-11-24 11:13:42.35
cmid1tsrr001mlhe8o6e5suoy	Every 4 Hours	t	2025-11-24 11:13:42.376	2025-11-24 11:13:42.376
cmid1tssi001nlhe8waf8tacu	Every 6 Hours	t	2025-11-24 11:13:42.402	2025-11-24 11:13:42.402
cmid1tstd001olhe8rhygwb2m	At Bedtime (HS)	t	2025-11-24 11:13:42.433	2025-11-24 11:13:42.433
cmid1tsua001plhe8ac905gml	As Needed (PRN)	t	2025-11-24 11:13:42.466	2025-11-24 11:13:42.466
cmid1tsv3001qlhe86f7b5jwq	Before Meals	t	2025-11-24 11:13:42.496	2025-11-24 11:13:42.496
cmid1tsvy001rlhe8oas5wjsd	After Meals	t	2025-11-24 11:13:42.526	2025-11-24 11:13:42.526
cmid1tsws001slhe8rcf3mr5x	Morning Only	t	2025-11-24 11:13:42.556	2025-11-24 11:13:42.556
cmid1tsxm001tlhe8wf0030eg	Evening Only	t	2025-11-24 11:13:42.587	2025-11-24 11:13:42.587
cmid1tsye001ulhe8treqfhjb	Twice Weekly	t	2025-11-24 11:13:42.615	2025-11-24 11:13:42.615
cmid1tszb001vlhe8pe3w3tfb	Once Weekly	t	2025-11-24 11:13:42.647	2025-11-24 11:13:42.647
\.


--
-- Data for Name: drug_groups; Type: TABLE DATA; Schema: public; Owner: tanuj
--

COPY public.drug_groups (id, name, "isActive", "createdAt", "updatedAt") FROM stdin;
cmid1tsaj0011lhe8zidch0oi	Beta Blockers	t	2025-11-24 11:13:41.756	2025-11-24 11:13:41.756
cmid1tsbp0012lhe8g22769l8	Prostaglandin Analogues	t	2025-11-24 11:13:41.798	2025-11-24 11:13:41.798
cmid1tscj0013lhe8z6iot4kf	Alpha Agonists	t	2025-11-24 11:13:41.827	2025-11-24 11:13:41.827
cmid1tsda0014lhe8kvnstm4l	Carbonic Anhydrase Inhibitors	t	2025-11-24 11:13:41.854	2025-11-24 11:13:41.854
cmid1tse30015lhe8l2mavnv3	Mydriatics	t	2025-11-24 11:13:41.883	2025-11-24 11:13:41.883
cmid1tset0016lhe8tdbopyo5	Cycloplegics	t	2025-11-24 11:13:41.909	2025-11-24 11:13:41.909
cmid1tsfj0017lhe8e0zg6dna	Corticosteroids	t	2025-11-24 11:13:41.935	2025-11-24 11:13:41.935
cmid1tsga0018lhe8yi9qac34	Antibiotics	t	2025-11-24 11:13:41.962	2025-11-24 11:13:41.962
cmid1tsh30019lhe8lbtsf7cv	NSAIDs (Non-Steroidal Anti-Inflammatory)	t	2025-11-24 11:13:41.992	2025-11-24 11:13:41.992
cmid1tshs001alhe8fmlnexqp	Artificial Tears	t	2025-11-24 11:13:42.017	2025-11-24 11:13:42.017
cmid1tsij001blhe87rog2wm7	Antiglaucoma Agents	t	2025-11-24 11:13:42.044	2025-11-24 11:13:42.044
cmid1tsjb001clhe86r4mczfn	Antihistamines	t	2025-11-24 11:13:42.072	2025-11-24 11:13:42.072
cmid1tsk2001dlhe843seuxo0	Mast Cell Stabilizers	t	2025-11-24 11:13:42.098	2025-11-24 11:13:42.098
cmid1tskt001elhe81lkrxtes	Decongestants	t	2025-11-24 11:13:42.126	2025-11-24 11:13:42.126
cmid1tslm001flhe8ndt7i72e	Antiviral	t	2025-11-24 11:13:42.154	2025-11-24 11:13:42.154
cmid1tsmd001glhe8dgpeh2lt	Antifungal	t	2025-11-24 11:13:42.181	2025-11-24 11:13:42.181
\.


--
-- Data for Name: emergency_register; Type: TABLE DATA; Schema: public; Owner: tanuj
--

COPY public.emergency_register (id, "srNo", date, "time", "patientName", age, sex, "prnNo", "ipdNo", complaints, "treatmentGiven", "mlcYesNo", "mlcNo", "doctorSign", "staffSign", "createdAt", "updatedAt", "createdBy") FROM stdin;
\.


--
-- Data for Name: equipment_stock_register; Type: TABLE DATA; Schema: public; Owner: tanuj
--

COPY public.equipment_stock_register (id, "srNo", "medicineName", "dailyStock", month, year, "createdAt", "updatedAt", "createdBy") FROM stdin;
\.


--
-- Data for Name: eto_register; Type: TABLE DATA; Schema: public; Owner: tanuj
--

COPY public.eto_register (id, date, "nameOfItem", batch, "loadNo", "chargeInTime", "switchOff", "otInHrs", "indicatorSlnp", "biSeparate", "yesNo", "passedFailed", "integratedStnp", "signCssd", "signIdd", "createdAt", "updatedAt", "createdBy") FROM stdin;
\.


--
-- Data for Name: examination_templates; Type: TABLE DATA; Schema: public; Owner: tanuj
--

COPY public.examination_templates (id, "templateName", "examinationType", "ophthalmologyType", "requiredEquipment", "templateStructure", "formFields", "normalRanges", "visualAcuitySection", "refractionSection", "slitLampSection", "fundoscopySection", "iopSection", "visualFieldSection", version, "isActive", "createdBy", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: examinations; Type: TABLE DATA; Schema: public; Owner: tanuj
--

COPY public.examinations (id, "visitId", "templateId", "doctorId", "examinationType", "examinationDate", "vitalSigns", "visualAcuity", refraction, "intraocularPressure", "slitLampFindings", "fundoscopyFindings", "visualFieldResults", "colorVisionTest", "octFindings", "fundusPhotography", "fluoresceinAngiography", ultrasonography, "clinicalImpressions", assessment, "treatmentPlan", images, reports, "followUpRequired", "followUpDate", status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: eye_drop_reasons; Type: TABLE DATA; Schema: public; Owner: tanuj
--

COPY public.eye_drop_reasons (id, reason, "createdAt", "updatedAt") FROM stdin;
cmid09dbn00007k8oawkqbj2k	Dilated Fundus Examination	2025-11-24 10:29:49.619	2025-11-24 10:29:49.619
cmid09dd800017k8oib4v9820	Retinal Assessment	2025-11-24 10:29:49.676	2025-11-24 10:29:49.676
cmid09ddf00027k8oerbhk612	Optic Nerve Evaluation	2025-11-24 10:29:49.684	2025-11-24 10:29:49.684
cmid09ddo00037k8os6h1donx	Macular Examination	2025-11-24 10:29:49.693	2025-11-24 10:29:49.693
cmid09ddx00047k8ob22i6oqv	Peripheral Retina Check	2025-11-24 10:29:49.701	2025-11-24 10:29:49.701
cmid09de600057k8ohx1cq9gp	Diabetic Retinopathy Screening	2025-11-24 10:29:49.71	2025-11-24 10:29:49.71
cmid09dee00067k8o47435xv3	Glaucoma Assessment	2025-11-24 10:29:49.719	2025-11-24 10:29:49.719
cmid09den00077k8oa6549djp	Visual Field Test	2025-11-24 10:29:49.727	2025-11-24 10:29:49.727
cmid09dew00087k8oou7n044q	Blood Pressure Check	2025-11-24 10:29:49.736	2025-11-24 10:29:49.736
cmid09df500097k8oazsyjwgu	Contact Lens Fitting	2025-11-24 10:29:49.745	2025-11-24 10:29:49.745
cmid09dfd000a7k8ooarhr8z8	Photography of Eye	2025-11-24 10:29:49.753	2025-11-24 10:29:49.753
cmid09dfn000b7k8o7rrqly5p	Other	2025-11-24 10:29:49.764	2025-11-24 10:29:49.764
cmifw593f00007kgk7ja1cynr	Eye Drop	2025-11-26 10:57:57.567	2025-11-26 10:57:57.567
\.


--
-- Data for Name: fitness_investigation_results; Type: TABLE DATA; Schema: public; Owner: tanuj
--

COPY public.fitness_investigation_results (id, "ipdAdmissionId", "investigationId", "resultValue", "resultStatus", "isNormal", interpretation, "testDate", "reportDate", "labName", "referenceNumber", "uploadedBy", "uploadedAt", "clinicalNotes", recommendations, "requiresFollowUp", "followUpDate", "clearanceGiven", "clearanceBy", "clearanceDate", "clearanceNotes", "createdAt", "updatedAt", "documentPaths") FROM stdin;
\.


--
-- Data for Name: fitness_investigations; Type: TABLE DATA; Schema: public; Owner: tanuj
--

COPY public.fitness_investigations (id, "investigationName", "investigationCode", category, description, "normalRanges", "criticalValues", units, "validityDays", "processingTime", "fastingRequired", cost, "isOutsourced", "labPartner", "isActive", "createdAt", "updatedAt") FROM stdin;
cmid1pju20000lhzwn3xpqnq8	CBC	CBC001	Blood Test	Complete Blood Count - Measures different blood cells and components	\N	\N	\N	7	2-4 hours	f	150	f	\N	t	2025-11-24 11:10:24.17	2025-11-24 11:10:24.17
cmid1pjup0001lhzwefs5cya7	HIV	HIV001	Blood Test	Human Immunodeficiency Virus test	\N	\N	\N	90	Same day	f	300	f	\N	t	2025-11-24 11:10:24.193	2025-11-24 11:10:24.193
cmid1pjv10002lhzwhfsc5b2r	HBSAG	HBSAG001	Blood Test	Hepatitis B Surface Antigen test	\N	\N	\N	90	Same day	f	250	f	\N	t	2025-11-24 11:10:24.205	2025-11-24 11:10:24.205
cmid1pjvd0003lhzwv4zh3dov	BSL	BSL001	Blood Test	Blood Sugar Level - Fasting and Random	\N	\N	\N	3	1-2 hours	t	100	f	\N	t	2025-11-24 11:10:24.217	2025-11-24 11:10:24.217
cmid1pjvr0004lhzwsc14n2kv	Urine Routine	URINE001	Urine Test	Routine urine examination for proteins, glucose, cells	\N	\N	\N	7	1-2 hours	f	80	f	\N	t	2025-11-24 11:10:24.231	2025-11-24 11:10:24.231
cmid1pjw10005lhzwau23av4h	ECG	ECG001	Cardiac Test	Electrocardiogram - Heart rhythm and electrical activity	\N	\N	\N	30	Immediate	f	200	f	\N	t	2025-11-24 11:10:24.241	2025-11-24 11:10:24.241
cmid1pjwl0006lhzwfbbzo6u8	Physician Fitness	PHYS001	Physical Examination	Physician fitness assessment for surgery clearance	\N	\N	\N	30	Same day	f	500	f	\N	t	2025-11-24 11:10:24.261	2025-11-24 11:10:24.261
\.


--
-- Data for Name: fitness_reports; Type: TABLE DATA; Schema: public; Owner: tanuj
--

COPY public.fitness_reports (id, "ipdAdmissionId", "fitnessStatus", "assessedBy", "assessmentDate", "bloodPressure", "heartRate", temperature, "oxygenSaturation", "ecgReport", "chestXrayReport", "bloodTestReports", "fitnessNotes", contraindications, "specialInstructions", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: floors; Type: TABLE DATA; Schema: public; Owner: tanuj
--

COPY public.floors (id, "floorNumber", "floorName", "floorType", accessible, description, "createdAt") FROM stdin;
\.


--
-- Data for Name: fridge_stock_medicines_register; Type: TABLE DATA; Schema: public; Owner: tanuj
--

COPY public.fridge_stock_medicines_register (id, "srNo", "nameOfInjection", "expectedStock", "entryDate", "createdAt", "updatedAt", "createdBy") FROM stdin;
\.


--
-- Data for Name: generic_medicines; Type: TABLE DATA; Schema: public; Owner: tanuj
--

COPY public.generic_medicines (id, name, "isActive", "createdAt", "updatedAt") FROM stdin;
cmid1trgi0007lhe85x38budf	Timolol	t	2025-11-24 11:13:40.675	2025-11-24 11:13:40.675
cmid1trhy0008lhe8pdboykex	Latanoprost	t	2025-11-24 11:13:40.726	2025-11-24 11:13:40.726
cmid1trit0009lhe8fdvjcu5n	Brimonidine	t	2025-11-24 11:13:40.758	2025-11-24 11:13:40.758
cmid1trjs000alhe8v6cpgliz	Dorzolamide	t	2025-11-24 11:13:40.792	2025-11-24 11:13:40.792
cmid1trkl000blhe8bukgbepc	Brinzolamide	t	2025-11-24 11:13:40.821	2025-11-24 11:13:40.821
cmid1trle000clhe8eejyzlxw	Travoprost	t	2025-11-24 11:13:40.85	2025-11-24 11:13:40.85
cmid1trm6000dlhe82bmsqihw	Bimatoprost	t	2025-11-24 11:13:40.878	2025-11-24 11:13:40.878
cmid1trmv000elhe8x5errn6g	Tropicamide	t	2025-11-24 11:13:40.903	2025-11-24 11:13:40.903
cmid1trnn000flhe8zvq211dr	Phenylephrine	t	2025-11-24 11:13:40.931	2025-11-24 11:13:40.931
cmid1troe000glhe87b7v3pkc	Cyclopentolate	t	2025-11-24 11:13:40.958	2025-11-24 11:13:40.958
cmid1trpe000hlhe8riorpkuj	Atropine	t	2025-11-24 11:13:40.994	2025-11-24 11:13:40.994
cmid1trq5000ilhe85fsdtx5i	Homatropine	t	2025-11-24 11:13:41.021	2025-11-24 11:13:41.021
cmid1trqv000jlhe8pj34lsrh	Prednisolone	t	2025-11-24 11:13:41.047	2025-11-24 11:13:41.047
cmid1trrm000klhe8rgkqcofm	Dexamethasone	t	2025-11-24 11:13:41.074	2025-11-24 11:13:41.074
cmid1trsa000llhe834xdacj0	Fluorometholone	t	2025-11-24 11:13:41.098	2025-11-24 11:13:41.098
cmid1trt4000mlhe8z4fejknx	Loteprednol	t	2025-11-24 11:13:41.128	2025-11-24 11:13:41.128
cmid1trtx000nlhe8kq7w498m	Moxifloxacin	t	2025-11-24 11:13:41.157	2025-11-24 11:13:41.157
cmid1trun000olhe8h9e0j2kq	Gatifloxacin	t	2025-11-24 11:13:41.184	2025-11-24 11:13:41.184
cmid1trvg000plhe8zsglelen	Ofloxacin	t	2025-11-24 11:13:41.212	2025-11-24 11:13:41.212
cmid1trw5000qlhe8utq05e3q	Ciprofloxacin	t	2025-11-24 11:13:41.237	2025-11-24 11:13:41.237
cmid1trwu000rlhe8aodpbvhn	Tobramycin	t	2025-11-24 11:13:41.262	2025-11-24 11:13:41.262
cmid1trxk000slhe8eos6ezkp	Gentamicin	t	2025-11-24 11:13:41.288	2025-11-24 11:13:41.288
cmid1tryb000tlhe8n2oryk4z	Chloramphenicol	t	2025-11-24 11:13:41.316	2025-11-24 11:13:41.316
cmid1trz5000ulhe8a8gc88k2	Ketorolac	t	2025-11-24 11:13:41.345	2025-11-24 11:13:41.345
cmid1trzv000vlhe8w7svtfhl	Diclofenac	t	2025-11-24 11:13:41.371	2025-11-24 11:13:41.371
cmid1ts0m000wlhe8ky27dvw8	Nepafenac	t	2025-11-24 11:13:41.398	2025-11-24 11:13:41.398
cmid1ts1c000xlhe8lvap1raq	Carboxymethylcellulose	t	2025-11-24 11:13:41.425	2025-11-24 11:13:41.425
cmid1ts4d000ylhe8x9uuwf6h	Hypromellose	t	2025-11-24 11:13:41.533	2025-11-24 11:13:41.533
cmid1ts92000zlhe8muefqlz9	Polyethylene Glycol	t	2025-11-24 11:13:41.702	2025-11-24 11:13:41.702
cmid1ts9s0010lhe8ienesof4	Sodium Hyaluronate	t	2025-11-24 11:13:41.728	2025-11-24 11:13:41.728
\.


--
-- Data for Name: hospital; Type: TABLE DATA; Schema: public; Owner: tanuj
--

COPY public.hospital (id, "hospitalName", "hospitalCode", "registrationNumber", "licenseNumber", address, phone, email, website, "establishedDate", "hospitalType", accreditation, "totalBeds", "totalRooms", "totalFloors", "operatingHours", "emergencyServices", logo, timezone, currency, "supportedLanguages", configuration, "isActive", "createdAt", "updatedAt", "taxSettings") FROM stdin;
cmiit1r8l00007kvoebdpu330	Dr. Abhijeet Agre Eye Institute	AAEI001	\N	\N	{"city": "Pune", "state": "Maharashtra", "street": "Agre Vision Care Centre", "country": "India"}	+91-1234567890	info@agreeyeinstitute.com	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	Asia/Kolkata	INR	{en,hi}	{"departmentInfo": {"name": "Ophthalmology Department", "floor": "First Floor", "doctors": ["Dr. Abhijeet Agre", "Dr. Siddharth Deshmukh", "Dr. Vikram Jadhav"]}}	t	2025-11-28 11:54:34.149	2025-11-28 11:54:34.149	\N
\.


--
-- Data for Name: icd11_codes; Type: TABLE DATA; Schema: public; Owner: tanuj
--

COPY public.icd11_codes (id, "foundationId", code, title, definition, chapter, "isEyeRelated", "ophthalmologyCategory", "inclusionTerms", "exclusionTerms", "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: insurance; Type: TABLE DATA; Schema: public; Owner: tanuj
--

COPY public.insurance (id, "insuranceName", "insuranceType", "policyNumber", "coverageAmount", "deductibleAmount", "copayPercentage", "validFrom", "validTo", "contactNumber", email, address, "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: insurance_claims; Type: TABLE DATA; Schema: public; Owner: tanuj
--

COPY public.insurance_claims (id, "claimNumber", "patientId", "insuranceId", "claimAmount", "approvedAmount", "settledAmount", status, documents, "submittedAt", "processedAt", "settledAt", notes, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ipd_admissions; Type: TABLE DATA; Schema: public; Owner: tanuj
--

COPY public.ipd_admissions (id, "admissionNumber", "patientId", "admittedBy", "admissionDate", "expectedDischarge", "actualDischarge", "surgeryDate", "surgeonId", "surgeryPackage", "iolType", "tentativeTime", "expectedDuration", "priorityLevel", status, "surgeryDayVisitId", "createdAt", "updatedAt", "anesthesiologistId", blockers, "currentStage", discharged, "dischargedAt", "dischargedBy", "fitnessAssessmentAt", "fitnessAssessmentBy", "fitnessAssessmentStarted", "fitnessCleared", "fitnessClearedAt", "fitnessClearedBy", "investigationsCompleted", "investigationsCompletedAt", "investigationsSuggested", "investigationsSuggestedAt", "investigationsSuggestedBy", "journeyNotes", "nextAction", "patientVisitId", "postOpCompleted", "postOpCompletedAt", "preOpCompleted", "preOpCompletedAt", "preOpCompletedBy", "sisterId", "surgeryCompleted", "surgeryCompletedAt", "surgeryPackageId", "surgeryTypeId", "lensId", "lensRequired", "investigationDocumentPath") FROM stdin;
cmih683n0000elhv8fral8apj	IPD-1764232072809-0QSM	cmifoudy5000e7knsp79gvllm	cmicwersg00037k48j2wmqv52	2025-11-27 08:27:52.809	\N	\N	2025-12-02 00:00:00	cmicwerzv00067k48ttdux05d	\N	\N	\N	\N	\N	SURGERY_SCHEDULED	\N	2025-11-27 08:27:52.811	2025-12-01 08:22:06.141	cmicwerxj00057k488pq5hg0m	\N	\N	f	\N	\N	\N	\N	f	f	\N	\N	f	\N	f	\N	\N	\N	\N	cmigz9gvy001q7kus838587bf	f	\N	f	\N	\N	cmicwes2800077k4890xub85z	f	\N	cmid1sju80003lhy85tql3c4e	cmid1pjwx0007lhzw8v4phg4s	\N	f	{}
cmih7jh1f000ulhv8fzr8fgsk	IPD-1764234283009-BKIF	cmid4ke80000t7kuo25jo31bt	cmicwersg00037k48j2wmqv52	2025-11-27 09:04:43.009	\N	\N	2025-12-02 00:00:00	cmicwerzv00067k48ttdux05d	\N	\N	\N	\N	\N	SURGERY_SCHEDULED	\N	2025-11-27 09:04:43.011	2025-12-01 08:22:42.491	cmicwerxj00057k488pq5hg0m	\N	\N	f	\N	\N	\N	\N	f	f	\N	\N	f	\N	f	\N	\N	\N	\N	cmigz9zac00287kusdvsmah8q	f	\N	f	\N	\N	cmicwes2800077k4890xub85z	f	\N	cmid1sjqo0000lhy8887cdopo	cmid1pjzs000flhzwrj9gv5ac	cmifmdd130000lhgsqcuwdku0	t	{}
cmih22kzi00037kbkmltghxf3	IPD-1764225096891-KTJ2	cmifovdsp000l7kns1ayir9mv	cmicwersg00037k48j2wmqv52	2025-11-27 06:31:36.892	\N	\N	2025-12-02 00:00:00	cmicwerzv00067k48ttdux05d	\N	\N	03:55	\N	\N	SURGERY_SCHEDULED	\N	2025-11-27 06:31:36.894	2025-12-01 08:22:50.783	cmicwerxj00057k488pq5hg0m	\N	\N	f	\N	\N	\N	\N	f	f	\N	\N	f	\N	f	\N	\N	\N	\N	cmigz9axq001k7kusrjo4f10g	f	\N	f	\N	\N	cmicwes2800077k4890xub85z	f	\N	\N	cmid1pk0g000hlhzwotpr08fd	cmifmd67m000jlhes6faibyrw	t	{}
cmin38lp500037kfw7c609czv	IPD-1764589854423-M931	cmid1gref0007lh2o4lyiui4h	cmicwersg00037k48j2wmqv52	2025-12-01 11:50:54.423	\N	\N	\N	\N	\N	\N	\N	\N	\N	SURGERY_SUGGESTED	\N	2025-12-01 11:50:54.425	2025-12-01 11:50:54.425	\N	\N	\N	f	\N	\N	\N	\N	f	f	\N	\N	f	\N	f	\N	\N	\N	\N	cmiiujue700037kwgs7sxz5ug	f	\N	f	\N	\N	\N	f	\N	\N	cmifm85qa0003lh7koo1rbkpu	\N	\N	{}
cmihbbn380012lhv8huvh7zhx	IPD-1764240636066-RNA8	cmiforhuz00007knsf1bj4bff	cmicwersg00037k48j2wmqv52	2025-11-27 10:50:36.067	\N	\N	2025-12-03 00:00:00	cmicwerzv00067k48ttdux05d	\N	\N	06:29	\N	\N	SURGERY_SCHEDULED	\N	2025-11-27 10:50:36.068	2025-12-02 07:22:23.435	cmicwerxj00057k488pq5hg0m	\N	\N	f	\N	\N	\N	\N	f	f	\N	\N	f	\N	f	\N	\N	\N	\N	cmigz9t7k00227kusdi09r5gh	f	\N	f	\N	\N	cmicwes2800077k4890xub85z	f	\N	cmid1sjx30009lhy8yw8ehd9r	cmifm85py0002lh7kxn3lgt4c	cmifmd66f000flhesghty38u7	t	{}
cmih69b7p000mlhv8huz5bfky	IPD-1764232129283-HP47	cmifosp9000077knsrc85belr	cmicwersg00037k48j2wmqv52	2025-11-27 08:28:49.284	\N	\N	2025-12-02 00:00:00	cmicwerzv00067k48ttdux05d	\N	\N	04:06	\N	\N	SURGERY_SCHEDULED	\N	2025-11-27 08:28:49.285	2025-12-02 09:07:24.981	cmicwerxj00057k488pq5hg0m	\N	\N	f	\N	\N	\N	\N	f	f	\N	\N	f	\N	f	\N	\N	\N	\N	cmigz9nca001w7kusxwkoanoz	f	\N	f	\N	\N	cmicwes2800077k4890xub85z	f	\N	cmid1sju80003lhy85tql3c4e	cmid1pjzs000flhzwrj9gv5ac	cmifmd66f000flhesghty38u7	t	{uploads/860783/IPD-1764232129283-HP47/investigation_1764666444952-674740284_Virtual_Round_Result__Odoo_x_SPIT_Hacakthon_25_-_Google_Sheets.pdf}
\.


--
-- Data for Name: lens_packages; Type: TABLE DATA; Schema: public; Owner: tanuj
--

COPY public.lens_packages (id, "packageId", "lensId", "isDefault", "additionalCost", "isUpgrade", "upgradeLevel", "isAvailable", "availabilityNotes", "createdAt", "updatedAt") FROM stdin;
cmifmd68k000llheslwkolir5	cmid1sjqo0000lhy8887cdopo	cmifmd5zv0000lhesgfpr8b6m	t	0	f	\N	t	\N	2025-11-26 06:24:10.964	2025-11-26 06:24:10.964
cmifmd691000nlhesu8p0fghz	cmid1sjtf0001lhy8bq1km2gg	cmifmd5zv0000lhesgfpr8b6m	t	0	f	\N	t	\N	2025-11-26 06:24:10.981	2025-11-26 06:24:10.981
cmifmd69b000plhesfwc36e75	cmid1sjqo0000lhy8887cdopo	cmifmd60p0001lhes35ay92k2	f	10000	t	Premium	t	\N	2025-11-26 06:24:10.991	2025-11-26 06:24:10.991
cmifmd69i000rlhes8fes6by4	cmid1sjtf0001lhy8bq1km2gg	cmifmd60p0001lhes35ay92k2	f	10000	t	Premium	t	\N	2025-11-26 06:24:10.999	2025-11-26 06:24:10.999
cmifmd69q000tlhes7vk8x2lh	cmid1sjqo0000lhy8887cdopo	cmifmd6130002lhesvoi65hdz	f	30000	t	Luxury	t	\N	2025-11-26 06:24:11.006	2025-11-26 06:24:11.006
cmifmd69z000vlhesa7soajkd	cmid1sjtf0001lhy8bq1km2gg	cmifmd6130002lhesvoi65hdz	f	30000	t	Luxury	t	\N	2025-11-26 06:24:11.015	2025-11-26 06:24:11.015
cmifmd6a9000xlhesy2s4mzrm	cmid1sjqo0000lhy8887cdopo	cmifmd61m0003lhesqe4p5okh	f	20000	t	Ultra-Premium	t	\N	2025-11-26 06:24:11.025	2025-11-26 06:24:11.025
cmifmd6aj000zlhes4yhfp137	cmid1sjtf0001lhy8bq1km2gg	cmifmd61m0003lhesqe4p5okh	f	20000	t	Ultra-Premium	t	\N	2025-11-26 06:24:11.035	2025-11-26 06:24:11.035
cmifmd6ar0011lhesabnimzlg	cmid1sjqo0000lhy8887cdopo	cmifmd6200004lhesfjvrtdno	f	0	f	\N	t	\N	2025-11-26 06:24:11.043	2025-11-26 06:24:11.043
cmifmd6az0013lhes2ivbb1ex	cmid1sjtf0001lhy8bq1km2gg	cmifmd6200004lhesfjvrtdno	f	0	f	\N	t	\N	2025-11-26 06:24:11.051	2025-11-26 06:24:11.051
cmifmd6b70015lhesn2hqv74o	cmid1sjqo0000lhy8887cdopo	cmifmd62d0005lheswhelcyk6	f	13000	t	Premium	t	\N	2025-11-26 06:24:11.059	2025-11-26 06:24:11.059
cmifmd6be0017lhesc0n4eppm	cmid1sjtf0001lhy8bq1km2gg	cmifmd62d0005lheswhelcyk6	f	13000	t	Premium	t	\N	2025-11-26 06:24:11.066	2025-11-26 06:24:11.066
cmifmd6bl0019lhesgwlar1ly	cmid1sjqo0000lhy8887cdopo	cmifmd62t0006lhesfhg9v827	f	27000	t	Luxury	t	\N	2025-11-26 06:24:11.074	2025-11-26 06:24:11.074
cmifmd6bs001blheshsdcwkig	cmid1sjtf0001lhy8bq1km2gg	cmifmd62t0006lhesfhg9v827	f	27000	t	Luxury	t	\N	2025-11-26 06:24:11.08	2025-11-26 06:24:11.08
cmifmd6c1001dlhesoyczqrx1	cmid1sjqo0000lhy8887cdopo	cmifmd6380007lhesx1szutz1	f	13000	t	Ultra-Premium	t	\N	2025-11-26 06:24:11.089	2025-11-26 06:24:11.089
cmifmd6c9001flhes0hl942vk	cmid1sjtf0001lhy8bq1km2gg	cmifmd6380007lhesx1szutz1	f	13000	t	Ultra-Premium	t	\N	2025-11-26 06:24:11.097	2025-11-26 06:24:11.097
cmifmd6cg001hlhes0q3nsbvu	cmid1sjqo0000lhy8887cdopo	cmifmd63l0008lhes7rrd3o89	f	0	f	\N	t	\N	2025-11-26 06:24:11.105	2025-11-26 06:24:11.105
cmifmd6cp001jlhesdr8btg97	cmid1sjtf0001lhy8bq1km2gg	cmifmd63l0008lhes7rrd3o89	f	0	f	\N	t	\N	2025-11-26 06:24:11.114	2025-11-26 06:24:11.114
cmifmd6cy001llhesltqnytk4	cmid1sjqo0000lhy8887cdopo	cmifmd63z0009lheskzz0ba99	f	9000	t	Premium	t	\N	2025-11-26 06:24:11.122	2025-11-26 06:24:11.122
cmifmd6d4001nlhes86czfpya	cmid1sjtf0001lhy8bq1km2gg	cmifmd63z0009lheskzz0ba99	f	9000	t	Premium	t	\N	2025-11-26 06:24:11.128	2025-11-26 06:24:11.128
cmifmd6da001plhestcd3vjon	cmid1sjqo0000lhy8887cdopo	cmifmd64g000alhes0m88w37i	f	0	f	\N	t	\N	2025-11-26 06:24:11.134	2025-11-26 06:24:11.134
cmifmd6dh001rlhesnwkn1lxw	cmid1sjtf0001lhy8bq1km2gg	cmifmd64g000alhes0m88w37i	f	0	f	\N	t	\N	2025-11-26 06:24:11.141	2025-11-26 06:24:11.141
cmifmd6dn001tlhesl11r7c02	cmid1sjqo0000lhy8887cdopo	cmifmd64y000blhesty9ggjvf	f	28000	t	Luxury	t	\N	2025-11-26 06:24:11.148	2025-11-26 06:24:11.148
cmifmd6du001vlheskd52dvcy	cmid1sjtf0001lhy8bq1km2gg	cmifmd64y000blhesty9ggjvf	f	28000	t	Luxury	t	\N	2025-11-26 06:24:11.154	2025-11-26 06:24:11.154
cmifmd6e1001xlhesmgnshd6c	cmid1sjqo0000lhy8887cdopo	cmifmd65c000clhessup3597h	f	0	f	\N	t	\N	2025-11-26 06:24:11.161	2025-11-26 06:24:11.161
cmifmd6e8001zlhesxckp7qfj	cmid1sjtf0001lhy8bq1km2gg	cmifmd65c000clhessup3597h	f	0	f	\N	t	\N	2025-11-26 06:24:11.168	2025-11-26 06:24:11.168
cmifmd6eg0021lhes1wjj5uv9	cmid1sjqo0000lhy8887cdopo	cmifmd65s000dlhes1icw3hm9	f	0	f	\N	t	\N	2025-11-26 06:24:11.176	2025-11-26 06:24:11.176
cmifmd6eo0023lhes3ddbmvs1	cmid1sjtf0001lhy8bq1km2gg	cmifmd65s000dlhes1icw3hm9	f	0	f	\N	t	\N	2025-11-26 06:24:11.184	2025-11-26 06:24:11.184
cmifmd6ev0025lhesjau3nvqe	cmid1sjqo0000lhy8887cdopo	cmifmd662000elhesscoqy3rp	f	50000	t	Ultra-Premium	f	Temporarily out of stock	2025-11-26 06:24:11.191	2025-11-26 06:24:11.191
cmifmd6f20027lhesuh9zowi4	cmid1sjtf0001lhy8bq1km2gg	cmifmd662000elhesscoqy3rp	f	50000	t	Ultra-Premium	f	Temporarily out of stock	2025-11-26 06:24:11.198	2025-11-26 06:24:11.198
cmifmd6f80029lhes1x52avty	cmid1sjqo0000lhy8887cdopo	cmifmd66f000flhesghty38u7	f	25000	t	Luxury	t	\N	2025-11-26 06:24:11.205	2025-11-26 06:24:11.205
cmifmd6fg002blhes38vxwm6r	cmid1sjtf0001lhy8bq1km2gg	cmifmd66f000flhesghty38u7	f	25000	t	Luxury	t	\N	2025-11-26 06:24:11.212	2025-11-26 06:24:11.212
cmifmd6fo002dlhes948v36to	cmid1sjqo0000lhy8887cdopo	cmifmd66p000glhesy4o4qnzx	f	0	f	\N	t	\N	2025-11-26 06:24:11.221	2025-11-26 06:24:11.221
cmifmd6fv002flhesx6vri2hh	cmid1sjtf0001lhy8bq1km2gg	cmifmd66p000glhesy4o4qnzx	f	0	f	\N	t	\N	2025-11-26 06:24:11.227	2025-11-26 06:24:11.227
cmifmd6g2002hlhesnm3jqr3g	cmid1sjqo0000lhy8887cdopo	cmifmd671000hlhescfkknc3r	f	0	f	\N	t	\N	2025-11-26 06:24:11.234	2025-11-26 06:24:11.234
cmifmd6ga002jlhes7aln2wm8	cmid1sjtf0001lhy8bq1km2gg	cmifmd671000hlhescfkknc3r	f	0	f	\N	t	\N	2025-11-26 06:24:11.242	2025-11-26 06:24:11.242
cmifmd6gi002llhesodq8yi5n	cmid1sjqo0000lhy8887cdopo	cmifmd67c000ilhesyebq77o2	f	33000	t	Luxury	t	\N	2025-11-26 06:24:11.25	2025-11-26 06:24:11.25
cmifmd6gp002nlhes36v1h0tg	cmid1sjtf0001lhy8bq1km2gg	cmifmd67c000ilhesyebq77o2	f	33000	t	Luxury	t	\N	2025-11-26 06:24:11.257	2025-11-26 06:24:11.257
cmifmd6gw002plhesoh2fbex2	cmid1sjqo0000lhy8887cdopo	cmifmd67m000jlhes6faibyrw	f	0	f	\N	t	\N	2025-11-26 06:24:11.265	2025-11-26 06:24:11.265
cmifmd6h4002rlhesrsrkixyc	cmid1sjtf0001lhy8bq1km2gg	cmifmd67m000jlhes6faibyrw	f	0	f	\N	t	\N	2025-11-26 06:24:11.272	2025-11-26 06:24:11.272
\.


--
-- Data for Name: lenses; Type: TABLE DATA; Schema: public; Owner: tanuj
--

COPY public.lenses (id, "lensName", "lensCode", manufacturer, model, "lensType", "lensCategory", material, power, diameter, features, benefits, "suitableFor", contraindications, "lensoCost", "patientCost", "insuranceCoverage", "isAvailable", "stockQuantity", "reorderLevel", "fdaApproved", "ceMarked", "qualityCertification", "totalImplants", "successRate", "complicationRate", "isActive", "createdBy", "createdAt", "updatedAt") FROM stdin;
cmifmd5zv0000lhesgfpr8b6m	AcrySof IQ	ACRY-IQ-MON	Alcon	SN60WF	IOL	MONOFOCAL	Hydrophobic Acrylic	+6.00D to +30.00D (0.5D steps)	13.0mm	{"aspheric": true, "filterUV": true, "hapticAngle": "0 degrees", "hapticLength": "13.0mm", "opticDiameter": "6.0mm", "filterBlueLight": true, "yellowChromophore": true}	{"reducedGlare": true, "protectsMacula": true, "reducedSphericalAberration": true, "improvedContrastSensitivity": true}	{"ageGroup": "18+ years", "cataractSurgery": true, "cornealAstigmatism": "< 1.00D", "postRefractiveSurgery": false}	["Active ocular infection", "Uncontrolled glaucoma", "Microphthalmos"]	2800	15000	12000	t	25	5	t	t	{"ce": "CE 0123", "iso": "ISO 11979"}	509	97.5	1.2	t	system_seed	2025-11-26 06:24:10.651	2025-11-26 06:24:10.651
cmifmd60p0001lhes35ay92k2	AcrySof IQ Toric	ACRY-IQ-TOR	Alcon	SN6AT	TORIC_IOL	TORIC	Hydrophobic Acrylic	+6.00D to +30.00D	13.0mm	{"aspheric": true, "opticDiameter": "6.0mm", "toricCylinder": "1.00D to 6.00D", "yellowChromophore": true, "rotationalStability": true}	{"correctsAstigmatism": true, "rotationalStability": true, "improvedUncorrectedVision": true, "reducedSphericalAberration": true}	{"ageGroup": "18+ years", "cataractSurgery": true, "cornealAstigmatism": ">= 1.00D", "regularAstigmatism": true}	["Irregular astigmatism", "Active ocular infection", "Zonular weakness"]	4200	25000	15000	t	20	5	t	t	{"ce": "CE 0123", "iso": "ISO 11979"}	378	95.8	1.8	t	system_seed	2025-11-26 06:24:10.681	2025-11-26 06:24:10.681
cmifmd6130002lhesvoi65hdz	PanOptix Trifocal	PANOP-TRI	Alcon	TFNT00	MULTIFOCAL_IOL	MULTIFOCAL	Hydrophobic Acrylic	+6.00D to +30.00D	13.0mm	{"nearAdd": "+2.17D", "trifocal": true, "diffractive": true, "intermediateAdd": "+3.25D", "lightTransmission": "88%", "enlightenTechnology": true}	{"nearVision": true, "distanceVision": true, "intermediateVision": true, "improvedQualityOfLife": true, "reducedGlassesependence": true}	{"premiumIOL": true, "lowAstigmatism": "< 1.00D", "activeLifestyle": true, "cataractSurgery": true}	["High astigmatism", "Irregular pupils", "Macular disease"]	8500	45000	0	t	15	3	t	t	{"ce": "CE 0123", "iso": "ISO 11979"}	185	92.3	3.2	t	system_seed	2025-11-26 06:24:10.696	2025-11-26 06:24:10.696
cmifmd61m0003lhesqe4p5okh	Vivity Extended Depth of Focus	VIV-EDOF	Alcon	DFT015	IOL	EXTENDED_DEPTH_FOCUS	Hydrophobic Acrylic	+6.00D to +30.00D	13.0mm	{"xVavefront": true, "reducedHalos": true, "nonDiffractive": true, "wavefrontShaping": true, "extendedDepthOfFocus": true}	{"goodDistanceVision": true, "functionalNearVision": true, "reducedVisualDisturbances": true, "improvedIntermediateVision": true}	{"computerUsers": true, "lowAstigmatism": "< 0.75D", "activeLifestyle": true, "cataractSurgery": true}	["Irregular pupils", "Previous refractive surgery complications"]	6800	35000	0	t	12	3	t	t	{"ce": "CE 0123", "iso": "ISO 11979"}	759	94.1	2.3	t	system_seed	2025-11-26 06:24:10.714	2025-11-26 06:24:10.714
cmifmd6200004lhesfjvrtdno	Tecnis Monofocal	TECN-MONO	Johnson & Johnson Vision	ZCB00	IOL	MONOFOCAL	Hydrophobic Acrylic	+6.00D to +30.00D	13.0mm	{"aspheric": true, "uvBlocking": true, "opticDiameter": "6.0mm", "wavefrontDesigned": true, "negativeSphericalAberration": true}	{"sharpDistance": true, "betterNightVision": true, "reducedSphericalAberration": true, "improvedContrastSensitivity": true}	{"ageGroup": "18+ years", "allPupilSizes": true, "cataractSurgery": true, "postRefractiveSurgery": true}	["Active ocular infection", "Unhealed corneal incisions"]	2900	16000	13000	t	30	6	t	t	{"ce": "CE 0086", "iso": "ISO 11979"}	115	97.8	1.1	t	system_seed	2025-11-26 06:24:10.728	2025-11-26 06:24:10.728
cmifmd62d0005lheswhelcyk6	Tecnis Toric	TECN-TOR	Johnson & Johnson Vision	ZCT	TORIC_IOL	TORIC	Hydrophobic Acrylic	+6.00D to +30.00D	13.0mm	{"aspheric": true, "toricCylinder": "1.00D to 6.00D", "frostedHaptics": true, "optimizedToric": true, "rotationalStability": true}	{"predictableResults": true, "correctsAstigmatism": true, "rotationalStability": true, "improvedUncorrectedVision": true}	{"ageGroup": "18+ years", "cataractSurgery": true, "cornealAstigmatism": ">= 0.75D", "regularAstigmatism": true}	["Irregular astigmatism", "Zonular dialysis", "Microphthalmos"]	4500	28000	16000	t	18	4	t	t	{"ce": "CE 0086", "iso": "ISO 11979"}	304	96.2	1.6	t	system_seed	2025-11-26 06:24:10.741	2025-11-26 06:24:10.741
cmifmd62t0006lhesfhg9v827	Tecnis Multifocal	TECN-MULTI	Johnson & Johnson Vision	ZMB00	MULTIFOCAL_IOL	MULTIFOCAL	Hydrophobic Acrylic	+6.00D to +30.00D	13.0mm	{"nearAdd": "+4.00D", "aspheric": true, "diffractive": true, "fullDiffractive": true, "pupilIndependent": true}	{"nearVision": true, "distanceVision": true, "goodLowLightPerformance": true, "reducedGlassesDependence": true}	{"premiumIOL": true, "readingTasks": true, "lowAstigmatism": "< 0.75D", "cataractSurgery": true}	["Macular degeneration", "Glaucoma with field defects", "Amblyopia"]	7800	42000	0	t	10	2	t	t	{"ce": "CE 0086", "iso": "ISO 11979"}	176	91.7	3.8	t	system_seed	2025-11-26 06:24:10.757	2025-11-26 06:24:10.757
cmifmd6380007lhesx1szutz1	Tecnis Eyhance	TECN-EYH	Johnson & Johnson Vision	ICB00	IOL	EXTENDED_DEPTH_FOCUS	Hydrophobic Acrylic	+6.00D to +30.00D	13.0mm	{"extendedVision": true, "monofocalBased": true, "higherOrderAspheric": true, "improvedIntermediate": true}	{"reducedHalos": true, "maintainsDistance": true, "betterFunctionalVision": true, "improvedIntermediateVision": true}	{"computerWork": true, "allPupilSizes": true, "activeLifestyle": true, "cataractSurgery": true}	["Active inflammation", "Previous complications"]	4800	28000	0	t	15	3	t	t	{"ce": "CE 0086", "iso": "ISO 11979"}	544	95.4	2.1	t	system_seed	2025-11-26 06:24:10.772	2025-11-26 06:24:10.772
cmifmd63l0008lhes7rrd3o89	enVista Monofocal	ENV-MONO	Bausch + Lomb	MX60	IOL	MONOFOCAL	Hydrophobic Acrylic	+6.00D to +30.00D	13.0mm	{"glistening": false, "stableVision": true, "opticDiameter": "6.0mm", "highRefractive": true, "aberrationNeutral": true}	{"clearVision": true, "stableOptics": true, "glisteningFree": true, "predictableResults": true}	{"ageGroup": "18+ years", "allPatients": true, "cataractSurgery": true, "longTermStability": true}	["Ocular infection", "Inflammation"]	2600	14500	12000	t	22	5	t	t	{"ce": "CE 0086", "iso": "ISO 11979"}	880	97.2	1.3	t	system_seed	2025-11-26 06:24:10.786	2025-11-26 06:24:10.786
cmifmd63z0009lheskzz0ba99	enVista Toric	ENV-TOR	Bausch + Lomb	MX60T	TORIC_IOL	TORIC	Hydrophobic Acrylic	+6.00D to +30.00D	13.0mm	{"glistening": false, "toricCylinder": "1.00D to 6.00D", "steplessDesign": true, "rotationalStability": true}	{"clearVision": true, "glisteningFree": true, "correctsAstigmatism": true, "rotationalStability": true}	{"cataractSurgery": true, "longTermStability": true, "cornealAstigmatism": ">= 0.75D", "regularAstigmatism": true}	["Irregular astigmatism", "Zonular weakness"]	4100	24000	15000	t	16	4	t	t	{"ce": "CE 0086", "iso": "ISO 11979"}	620	95.9	1.7	t	system_seed	2025-11-26 06:24:10.799	2025-11-26 06:24:10.799
cmifmd64g000alhes0m88w37i	CT Asphina	ZEISS-ASPH	Carl Zeiss	CT ASPHINA 509M	IOL	MONOFOCAL	Hydrophobic Acrylic	+6.00D to +30.00D	13.0mm	{"aspheric": true, "optimizedPCO": true, "opticDiameter": "6.0mm", "aberrationCorrecting": true}	{"reducedPCO": true, "clearVision": true, "reducedAberrations": true, "improvedContrastSensitivity": true}	{"ageGroup": "18+ years", "allPatients": true, "qualityVision": true, "cataractSurgery": true}	["Active infection", "Severe inflammation"]	3200	18000	13500	t	20	4	t	t	{"ce": "CE 0123", "iso": "ISO 11979"}	522	96.8	1.4	t	system_seed	2025-11-26 06:24:10.816	2025-11-26 06:24:10.816
cmifmd64y000blhesty9ggjvf	AT Lisa tri	ZEISS-TRI	Carl Zeiss	AT LISA tri 839MP	MULTIFOCAL_IOL	MULTIFOCAL	Hydrophobic Acrylic	+6.00D to +30.00D	13.0mm	{"nearAdd": "+3.33D", "aspheric": true, "trifocal": true, "diffractive": true, "intermediateAdd": "+1.66D"}	{"nearVision": true, "distanceVision": true, "smoothTransition": true, "intermediateVision": true}	{"premiumIOL": true, "computerWork": true, "activeLifestyle": true, "cataractSurgery": true}	["Macular disease", "Severe dry eye", "Irregular pupils"]	8200	43000	0	t	8	2	t	t	{"ce": "CE 0123", "iso": "ISO 11979"}	408	90.8	4.1	t	system_seed	2025-11-26 06:24:10.834	2025-11-26 06:24:10.834
cmifmd65c000clhessup3597h	iSert 250	HOYA-ISERT	HOYA	PY-60AD	IOL	MONOFOCAL	Hydrophobic Acrylic	+6.00D to +30.00D	13.2mm	{"aspheric": true, "fourPoint": true, "yellowFilter": true, "opticDiameter": "6.0mm"}	{"uvProtection": true, "goodCentering": true, "stablePosition": true, "improvedContrast": true}	{"allPatients": true, "standardCare": true, "costEffective": true, "cataractSurgery": true}	["Active infection", "Uncontrolled inflammation"]	2400	13000	11000	t	25	6	t	t	{"ce": "CE 0086", "iso": "ISO 11979"}	964	96.5	1.5	t	system_seed	2025-11-26 06:24:10.847	2025-11-26 06:24:10.847
cmifmd65s000dlhes1icw3hm9	RayOne	RAY-ONE	Rayner	RAO600C	IOL	MONOFOCAL	Hydrophobic Acrylic	+6.00D to +30.00D	13.0mm	{"aspheric": true, "rayacryl": true, "opticDiameter": "6.0mm", "aberrationNeutral": true}	{"easySurgery": true, "stableVision": true, "biocompatible": true, "excellentOptics": true}	{"allPatients": true, "costEffective": true, "globalStandard": true, "cataractSurgery": true}	["Ocular infection", "Severe inflammation"]	2200	12000	10000	t	30	6	t	t	{"ce": "CE 0086", "iso": "ISO 11979"}	337	96.2	1.6	t	system_seed	2025-11-26 06:24:10.864	2025-11-26 06:24:10.864
cmifmd662000elhesscoqy3rp	Light Adjustable Lens	LAL-ADJ	RxSight	LAL	IOL	LIGHT_ADJUSTABLE	Silicone with Photosensitive Macromers	+16.0D to +25.0D	13.0mm	{"lockIn": true, "customizable": true, "postOpAdjustment": true, "lightDeliveryDevice": true}	{"optimalOutcome": true, "perfectRefraction": true, "treatmentSpecific": true, "postOpCustomization": true}	{"premiumCataract": true, "preciseCorrection": true, "specializedCenters": true, "postRefractivePatients": true}	["UV light exposure restrictions", "Compliance issues"]	15000	65000	0	f	2	1	t	f	{"fda": "FDA Approved", "iso": "ISO 11979"}	342	98.5	0.8	t	system_seed	2025-11-26 06:24:10.874	2025-11-26 06:24:10.874
cmifmd66f000flhesghty38u7	AcrySof IQ ReSTOR +3.0D	ACRY-REST3	Alcon	SN6AD1	MULTIFOCAL_IOL	MULTIFOCAL	Hydrophobic Acrylic	+6.00D to +30.00D	13.0mm	{"nearAdd": "+3.0D", "apodized": true, "diffractive": true, "distanceOptimized": true}	{"nearVision": true, "reducedHalos": true, "naturalVision": true, "distanceVision": true}	{"premiumIOL": true, "readingTasks": true, "lowAstigmatism": "< 0.75D", "cataractSurgery": true}	["Macular pathology", "Irregular pupils"]	7500	40000	0	t	12	3	t	t	{"ce": "CE 0123", "iso": "ISO 11979"}	954	93.2	3.1	t	system_seed	2025-11-26 06:24:10.887	2025-11-26 06:24:10.887
cmifmd66p000glhesy4o4qnzx	SofPort Advanced Optics	SOFP-AO	Bausch + Lomb	LI61AO	IOL	MONOFOCAL	Silicone	+6.00D to +30.00D	13.5mm	{"foldable": true, "silicone": true, "uvAbsorbing": true, "opticDiameter": "6.0mm"}	{"softMaterial": true, "uvProtection": true, "biocompatible": true, "foldableInsertion": true}	{"routineCases": true, "standardCare": true, "costEffective": true, "cataractSurgery": true}	["Silicone oil use", "Severe inflammation"]	2000	11000	9500	t	35	8	t	t	{"ce": "CE 0086", "iso": "ISO 11979"}	716	95.8	1.8	t	system_seed	2025-11-26 06:24:10.898	2025-11-26 06:24:10.898
cmifmd671000hlhescfkknc3r	Sensar OptiEdge	SENS-OPT	Johnson & Johnson Vision	AR40e	IOL	MONOFOCAL	Hydrophobic Acrylic	+6.00D to +30.00D	13.0mm	{"optiEdge": true, "squareEdge": true, "opticDiameter": "6.0mm", "pcoPrevention": true}	{"reducedPCO": true, "sharpVision": true, "durableResults": true, "longTermClarity": true}	{"allAges": true, "standardCare": true, "pcoPrevention": true, "cataractSurgery": true}	["Active infection", "Severe uveitis"]	2300	12500	10500	t	28	6	t	t	{"ce": "CE 0086", "iso": "ISO 11979"}	45	96.1	1.7	t	system_seed	2025-11-26 06:24:10.909	2025-11-26 06:24:10.909
cmifmd67c000ilhesyebq77o2	FineVision Trifocal	PHYS-FINE	PhysIOL	POD F	MULTIFOCAL_IOL	MULTIFOCAL	Hydrophilic Acrylic	+6.00D to +30.00D	11.40mm	{"microF": true, "nearAdd": "+3.50D", "trifocal": true, "intermediateAdd": "+1.75D", "combinationDiffractive": true}	{"nearVision": true, "microIncision": true, "distanceVision": true, "intermediateVision": true}	{"premiumIOL": true, "microIncision": true, "activeLifestyle": true, "cataractSurgery": true}	["Corneal pathology", "Retinal disease"]	9200	48000	0	t	6	2	t	t	{"ce": "CE 0123", "iso": "ISO 11979"}	429	89.5	4.8	t	system_seed	2025-11-26 06:24:10.92	2025-11-26 06:24:10.92
cmifmd67m000jlhes6faibyrw	STABIBAG	MEDI-STAB	Medicontur	SB-30AL	IOL	MONOFOCAL	Hydrophilic Acrylic	+6.00D to +30.00D	11.50mm	{"uvFilter": true, "bagInTheLens": true, "microIncision": true, "stablePosition": true}	{"goodQuality": true, "stableOptics": true, "costEffective": true, "excellentCentering": true}	{"standardCare": true, "costSensitive": true, "globalMarkets": true, "cataractSurgery": true}	["Severe inflammation", "Zonular weakness"]	1800	10000	8500	t	40	10	f	t	{"ce": "CE 0123", "iso": "ISO 11979"}	430	95.2	2.1	t	system_seed	2025-11-26 06:24:10.931	2025-11-26 06:24:10.931
cmifmdd130000lhgsqcuwdku0	AcrySof IQ ReSTOR +2.5D	ACRY-REST25	Alcon	SN6AD2	MULTIFOCAL_IOL	MULTIFOCAL	Hydrophobic Acrylic	+6.00D to +30.00D	13.0mm	{"nearAdd": "+2.5D", "apodized": true, "diffractive": true, "distanceOptimized": true}	{"nearVision": true, "naturalVision": true, "distanceVision": true, "intermediateVision": true}	{"premiumIOL": true, "computerWork": true, "lowAstigmatism": "< 0.75D", "cataractSurgery": true}	["Macular pathology", "Irregular pupils", "Unrealistic expectations"]	7200	38000	0	t	10	3	t	t	{"ce": "CE 0123", "iso": "ISO 11979"}	55	92.8	3.4	t	system_seed_additional	2025-11-26 06:24:19.767	2025-11-26 06:24:19.767
cmifmdd2z0001lhgsd03zy95m	AcrySof Natural	ACRY-NAT	Alcon	SN60AT	IOL	MONOFOCAL	Hydrophobic Acrylic	+6.00D to +30.00D	13.0mm	{"uvBlocking": true, "naturalTint": true, "opticDiameter": "6.0mm", "yellowChromophore": true}	{"clearVision": true, "uvProtection": true, "protectsMacula": true, "naturalColorPerception": true}	{"ageGroup": "50+ years", "standardCare": true, "outdoorWorkers": true, "cataractSurgery": true}	["Active infection", "Severe inflammation"]	2500	14000	11500	t	30	6	t	t	{"ce": "CE 0123", "iso": "ISO 11979"}	175	96.8	1.4	t	system_seed_additional	2025-11-26 06:24:19.835	2025-11-26 06:24:19.835
cmifmdd3c0002lhgsit9yaimp	Tecnis Synergy	TECN-SYN	Johnson & Johnson Vision	ZXROO	MULTIFOCAL_IOL	EXTENDED_DEPTH_FOCUS	Hydrophobic Acrylic	+6.00D to +30.00D	13.0mm	{"extendedRange": true, "continuousRange": true, "combinedTechnology": true, "diffractiveContinuous": true}	{"reducedHalos": true, "fullRangeVision": true, "continuousVision": true, "improvedIntermediate": true}	{"premiumIOL": true, "allDistances": true, "activeLifestyle": true, "cataractSurgery": true}	["Macular disease", "Severe dry eye"]	9500	50000	0	t	8	2	t	t	{"ce": "CE 0086", "iso": "ISO 11979"}	121	93.5	2.8	t	system_seed_additional	2025-11-26 06:24:19.848	2025-11-26 06:24:19.848
cmifmdd3t0003lhgsiafo9sq1	Tecnis ZA9003	TECN-ZA9003	Johnson & Johnson Vision	ZA9003	IOL	MONOFOCAL	Silicone	+5.00D to +30.00D	13.0mm	{"prolate": true, "anterior": true, "silicone": true, "threePoint": true}	{"longHistory": true, "biocompatible": true, "costEffective": true, "provenPerformance": true}	{"routineCases": true, "standardCare": true, "budgetConscious": true, "cataractSurgery": true}	["Silicone oil planned", "Active inflammation"]	1900	10500	9000	t	40	8	t	t	{"ce": "CE 0086", "iso": "ISO 11979"}	481	95.5	1.9	t	system_seed_additional	2025-11-26 06:24:19.865	2025-11-26 06:24:19.865
cmifmdd470004lhgsdq2k7f5w	Crystalens AO	CRYS-AO	Bausch + Lomb	AT-50AO	ACCOMMODATING_IOL	ACCOMMODATING	Silicone	+16.00D to +25.00D	11.5mm	{"biconvex": true, "hingeDesign": true, "accommodating": true, "flexibleHaptics": true}	{"naturalFocus": true, "reducedGlasses": true, "intermediateVision": true, "accommodativeAmplitude": true}	{"premiumIOL": true, "cataractSurgery": true, "functionalVision": true, "accommodativeDemand": true}	["Weak zonules", "Previous vitrectomy", "Macular disease"]	6500	35000	0	f	0	2	t	t	{"ce": "CE 0086", "iso": "ISO 11979"}	495	88.2	5.1	t	system_seed_additional	2025-11-26 06:24:19.879	2025-11-26 06:24:19.879
cmifmdd4m0005lhgsn6g0y5vq	SofPort LI61U	SOFP-61U	Bausch + Lomb	LI61U	IOL	MONOFOCAL	Silicone	+6.00D to +30.00D	13.5mm	{"modified": true, "silicone": true, "uvAbsorbing": true, "opticDiameter": "6.0mm"}	{"proven": true, "foldable": true, "uvProtection": true, "biocompatible": true}	{"allAges": true, "standardCare": true, "costEffective": true, "cataractSurgery": true}	["Silicone oil use", "Severe uveitis"]	1800	10000	8500	t	45	10	t	t	{"ce": "CE 0086", "iso": "ISO 11979"}	357	95.1	2	t	system_seed_additional	2025-11-26 06:24:19.894	2025-11-26 06:24:19.894
cmifmdd510006lhgsif0d773b	Aspira-aA	HO-ASPIRA	HumanOptics	Aspira-aA	IOL	MONOFOCAL	Hydrophobic Acrylic	+6.00D to +30.00D	13.0mm	{"aspheric": true, "uvFilter": true, "opticDiameter": "6.0mm", "aberrationFree": true}	{"sharpVision": true, "qualityOptics": true, "improvedContrast": true, "reducedAberrations": true}	{"costEffective": true, "qualityVision": true, "europeanMarket": true, "cataractSurgery": true}	["Active infection", "Severe inflammation"]	2100	11500	9500	t	20	5	f	t	{"ce": "CE 0123", "iso": "ISO 11979"}	194	95.8	1.7	t	system_seed_additional	2025-11-26 06:24:19.909	2025-11-26 06:24:19.909
cmifmdd5e0007lhgsh1j6tmos	FEMTIS Comfort	VSY-FEMTIS	VSY Biotechnology	FEMTIS-C	IOL	EXTENDED_DEPTH_FOCUS	Hydrophobic Acrylic	+10.00D to +30.00D	10.7mm	{"extendedDepth": true, "microIncision": true, "continuousVision": true, "innovativeDesign": true}	{"fastRecovery": true, "reducedHalos": true, "microIncision": true, "extendedVision": true}	{"microIncision": true, "premiumVision": true, "advancedCenters": true, "cataractSurgery": true}	["Irregular pupils", "Corneal pathology"]	5500	30000	0	t	5	2	f	t	{"ce": "CE 0123", "iso": "ISO 11979"}	167	92.1	3.2	t	system_seed_additional	2025-11-26 06:24:19.922	2025-11-26 06:24:19.922
cmifmdd5s0008lhgspdl32y72	Appasamy AIOL	APPA-AIOL	Appasamy Associates	AA-AIOL	IOL	MONOFOCAL	PMMA	+8.00D to +30.00D	13.0mm	{"pmma": true, "rigid": true, "proven": true, "costEffective": true}	{"proven": true, "durable": true, "costEffective": true, "wideAvailability": true}	{"largePupils": true, "budgetSegment": true, "cataractSurgery": true, "developingMarkets": true}	["Small incision preference", "Foldable requirement"]	800	4500	4000	t	50	15	f	f	{"iso": "ISO 11979"}	465	94.2	2.5	t	system_seed_additional	2025-11-26 06:24:19.937	2025-11-26 06:24:19.937
cmifmdd670009lhgsqz6r19ks	Auroflex	AURO-FLEX	Aurolab	AUROFLEX-F	IOL	MONOFOCAL	Hydrophobic Acrylic	+6.00D to +30.00D	13.0mm	{"aspheric": true, "foldable": true, "hydrophobic": true, "costEffective": true}	{"affordable": true, "goodQuality": true, "wideAvailability": true, "provenPerformance": true}	{"massMarket": true, "globalHealth": true, "standardCare": true, "cataractSurgery": true}	["Active infection", "Severe inflammation"]	1200	6000	5500	t	60	20	f	t	{"ce": "CE 0123", "iso": "ISO 11979"}	403	95.5	1.8	t	system_seed_additional	2025-11-26 06:24:19.951	2025-11-26 06:24:19.951
cmifmdd6m000alhgsd5gl5in5	EVO Visian ICL	STAAR-EVO	Staar Surgical	EVO-ICL	CONTACT_LENS	CUSTOM	Collamer	-0.50D to -18.00D	Variable	{"collamer": true, "reversible": true, "uvBlocking": true, "centralHole": true, "biocompatible": true}	{"reversible": true, "uvProtection": true, "excellentVision": true, "preserveAccommodation": true}	{"highMyopia": true, "thinCorneas": true, "youngPatients": true, "refractiveCorrection": true}	["Cataract", "Glaucoma", "Pregnancy"]	25000	80000	0	t	3	1	t	t	{"ce": "CE 0123", "fda": "FDA Approved"}	462	98.1	0.9	t	system_seed_additional	2025-11-26 06:24:19.966	2025-11-26 06:24:19.966
cmifmdd6y000blhgsrynpar70	Mplus	OCUL-MPLUS	OCULENTIS	LS-313 MF30	MULTIFOCAL_IOL	MULTIFOCAL	Hydrophilic Acrylic	+10.00D to +32.00D	11.0mm	{"nearAdd": "+3.00D", "rotationally": false, "sectorShaped": true, "microIncision": true}	{"reducedHalos": true, "microIncision": true, "goodIntermediate": true, "rotationallyAsymmetric": true}	{"premiumIOL": true, "microIncision": true, "cataractSurgery": true, "specificCenters": true}	["Irregular pupils", "Macular disease"]	7800	41000	0	t	4	1	f	t	{"ce": "CE 0123", "iso": "ISO 11979"}	316	90.8	4.2	t	system_seed_additional	2025-11-26 06:24:19.978	2025-11-26 06:24:19.978
cmifmdd78000clhgsvn2me041	AcrySof IQ SN60WF	ACRY-WF-VAR	Alcon	SN60WF-25	IOL	MONOFOCAL	Hydrophobic Acrylic	+6.00D to +30.00D (0.25D steps)	13.0mm	{"aspheric": true, "highPrecision": true, "yellowChromophore": true}	{"improvedContrast": true, "preciseCorrection": true}	{"premiumOutcomes": true, "preciseRefractive": true}	["Active infection"]	3000	16000	12500	t	15	3	t	t	{"ce": "CE 0123", "iso": "ISO 11979"}	82	97.2	1.1	t	system_seed_additional	2025-11-26 06:24:19.989	2025-11-26 06:24:19.989
cmifmdiou0000lh209q2k5907	Menicon Soft S	MENI-SOFTS	Menicon	MS-30	IOL	MONOFOCAL	Hydrophobic Acrylic	+6.00D to +30.00D	13.0mm	{"aspheric": true, "foldable": true, "uvBlocking": true}	{"clearVision": true, "biocompatible": true, "smoothInsertion": true}	{"asianEyes": true, "standardCare": true, "cataractSurgery": true}	["Active infection", "Severe inflammation"]	2200	12000	10000	t	25	5	f	t	{"ce": "CE 0123", "iso": "ISO 11979"}	78	96.1	1.6	t	system_seed_final	2025-11-26 06:24:27.102	2025-11-26 06:24:27.102
cmifmdiqw0001lh20v1pavorc	PC IOL	OPHTEC-PC	Ophtec	PC-IOL-311	IOL	MONOFOCAL	PMMA	+5.00D to +30.00D	13.0mm	{"pmma": true, "rigid": true, "proven": true, "uvFilter": true}	{"stable": true, "durable": true, "longTerm": true, "costEffective": true}	{"budgetCare": true, "largePupils": true, "cataractSurgery": true}	["Small incision preference", "Premium expectations"]	900	5000	4500	t	40	10	f	t	{"ce": "CE 0123", "iso": "ISO 11979"}	778	94.8	2.2	t	system_seed_final	2025-11-26 06:24:27.176	2025-11-26 06:24:27.176
cmifmdire0002lh20az8w4mhy	AdaptIOL	TEL-ADAPT	Teleon Surgical	ADAPT-AO	ACCOMMODATING_IOL	ACCOMMODATING	Hydrophobic Acrylic	+16.00D to +25.00D	11.5mm	{"adaptive": true, "accommodating": true, "flexibleOptic": true}	{"functionalNear": true, "intermediateVision": true, "accommodativeAmplitude": true}	{"premiumCataract": true, "youngerPatients": true, "accommodativeDemand": true}	["Zonular weakness", "Previous vitrectomy", "Unrealistic expectations"]	7200	38000	0	f	2	1	f	t	{"ce": "CE 0123", "iso": "ISO 11979"}	389	87.5	5.8	t	system_seed_final	2025-11-26 06:24:27.194	2025-11-26 06:24:27.194
cmifmdirs0003lh20ef2qhfjb	AcrySof MA30BA	ACRY-MA30	Alcon	MA30BA	IOL	MONOFOCAL	Hydrophobic Acrylic	+6.00D to +30.00D	13.0mm	{"anterior": true, "biconvex": true, "squareEdge": true}	{"proven": true, "sharpVision": true, "pcoPrevention": true}	{"standardCare": true, "pcoPrevention": true, "cataractSurgery": true}	["Active infection", "Severe uveitis"]	2400	13000	11000	t	35	7	t	t	{"ce": "CE 0123", "iso": "ISO 11979"}	156	96.5	1.5	t	system_seed_final	2025-11-26 06:24:27.208	2025-11-26 06:24:27.208
cmifmdis50004lh202ginzkz3	AcrySof SA30AL	ACRY-SA30	Alcon	SA30AL	IOL	MONOFOCAL	Hydrophobic Acrylic	+6.00D to +30.00D	13.0mm	{"modified": true, "squareEdge": true, "singlePiece": true}	{"easyInsertion": true, "pcoPrevention": true, "stablePosition": true}	{"allAges": true, "routineCases": true, "cataractSurgery": true}	["Active infection", "Severe inflammation"]	2300	12500	10500	t	30	6	t	t	{"ce": "CE 0123", "iso": "ISO 11979"}	233	96.3	1.6	t	system_seed_final	2025-11-26 06:24:27.221	2025-11-26 06:24:27.221
cmifmdisj0005lh20n69iu537	Akreos Adapt AO	AKRE-ADAPT	Bausch + Lomb	AO60	IOL	MONOFOCAL	Hydrophilic Acrylic	+6.00D to +30.00D	11.0mm	{"hydrophilic": true, "openLoopHaptics": true, "aberrationNeutral": true}	{"costEffective": true, "goodCentering": true, "microIncision": true}	{"standardCare": true, "microIncision": true, "cataractSurgery": true}	["Active inflammation", "Zonular dialysis"]	1900	10500	9000	t	40	8	t	t	{"ce": "CE 0086", "iso": "ISO 11979"}	645	95.7	1.8	t	system_seed_final	2025-11-26 06:24:27.235	2025-11-26 06:24:27.235
cmifmdisy0006lh20y5tltdsl	Akreos MICS	AKRE-MICS	Bausch + Lomb	MI60	IOL	MONOFOCAL	Hydrophilic Acrylic	+6.00D to +30.00D	10.0mm	{"mics": true, "hydrophilic": true, "microIncision": true}	{"fastHealing": true, "smallIncision": true, "goodVisualOutcomes": true}	{"fastRecovery": true, "premiumTechnique": true, "microIncisionSurgery": true}	["Large pupils", "Zonular weakness"]	2500	14000	11500	t	20	4	t	t	{"ce": "CE 0086", "iso": "ISO 11979"}	458	96	1.7	t	system_seed_final	2025-11-26 06:24:27.25	2025-11-26 06:24:27.25
cmifmditc0007lh209m2ktucb	Phacoflex SI30NB	AMO-PHACO	Johnson & Johnson Vision	SI30NB	IOL	MONOFOCAL	Silicone	+6.00D to +30.00D	13.0mm	{"silicone": true, "threePoint": true, "biocompatible": true}	{"foldable": true, "provenSafety": true, "easyInsertion": true}	{"standardCare": true, "costEffective": true, "cataractSurgery": true}	["Silicone oil planned", "Severe inflammation"]	1800	10000	8500	t	35	7	t	t	{"ce": "CE 0086", "iso": "ISO 11979"}	54	95.3	1.9	t	system_seed_final	2025-11-26 06:24:27.264	2025-11-26 06:24:27.264
cmifmditr0008lh20i1p3dtki	Lentis Mplus Comfort	LENT-MPLUS	OCULENTIS	LS-313 MF15	MULTIFOCAL_IOL	MULTIFOCAL	Hydrophilic Acrylic	+10.00D to +32.00D	11.0mm	{"nearAdd": "+1.50D", "rotationally": false, "sectorShaped": true}	{"reducedHalos": true, "microIncision": true, "goodIntermediate": true}	{"computerWork": true, "microIncision": true, "cataractSurgery": true}	["Irregular pupils", "Macular disease"]	6800	36000	0	t	6	2	f	t	{"ce": "CE 0123", "iso": "ISO 11979"}	751	91.2	3.8	t	system_seed_final	2025-11-26 06:24:27.279	2025-11-26 06:24:27.279
cmifmdiu80009lh20vnlwasy9	CT Lucia 602	ZEISS-LUC	Carl Zeiss	CT LUCIA 602	IOL	MONOFOCAL	Hydrophobic Acrylic	+6.00D to +30.00D	13.0mm	{"biconvex": true, "uvFilter": true, "aberrationNeutral": true}	{"proven": true, "naturalVision": true, "excellentOptics": true}	{"allPatients": true, "qualityVision": true, "cataractSurgery": true}	["Active infection", "Severe inflammation"]	2800	15500	12500	t	25	5	t	t	{"ce": "CE 0123", "iso": "ISO 11979"}	379	96.7	1.4	t	system_seed_final	2025-11-26 06:24:27.296	2025-11-26 06:24:27.296
cmifmdiul000alh20pus3ruxx	iSert 255	HOYA-255	HOYA	PY-60MV	IOL	MONOFOCAL	Hydrophobic Acrylic	+6.00D to +30.00D	13.2mm	{"aspheric": true, "microVolumetric": true}	{"preciseInjection": true, "consistentPerformance": true}	{"preciseSurgery": true, "cataractSurgery": true}	["Active infection"]	2600	14000	11500	t	20	4	t	t	{"ce": "CE 0086", "iso": "ISO 11979"}	701	96.4	1.5	t	system_seed_final	2025-11-26 06:24:27.309	2025-11-26 06:24:27.309
cmifmdrwm0000lh8wuu0lmqam	IOLAB Clear-6	IOLAB-C6	IOLAB	Clear-6	IOL	MONOFOCAL	PMMA	+8.00D to +30.00D	12.0mm	{"pmma": true, "rigid": true, "durable": true}	{"longTerm": true, "reliable": true, "costEffective": true}	{"largePupils": true, "emergencyUse": true, "budgetSurgery": true}	["Small incision preference"]	600	3500	3200	t	50	15	f	f	{"iso": "ISO 11979"}	802	93.5	3.1	t	system_seed_topup	2025-11-26 06:24:39.046	2025-11-26 06:24:39.046
cmifmdryg0001lh8w3rzezg94	Symphony Extended Range	AMO-SYMPH	Johnson & Johnson Vision	ZXR00	IOL	EXTENDED_DEPTH_FOCUS	Hydrophobic Acrylic	+6.00D to +30.00D	13.0mm	{"chromatic": true, "echelette": true, "extendedRange": true}	{"reducedHalos": true, "extendedVision": true, "intermediateVision": true}	{"computerWork": true, "activeLifestyle": true, "cataractSurgery": true}	["Irregular pupils", "Macular disease"]	5800	32000	0	t	12	3	t	t	{"ce": "CE 0086", "iso": "ISO 11979"}	1028	94.2	2.4	t	system_seed_topup	2025-11-26 06:24:39.112	2025-11-26 06:24:39.112
cmifmdrys0002lh8w0v6d3j84	AT Torbi 709M	ZEISS-TOR	Carl Zeiss	AT TORBI 709M	TORIC_IOL	TORIC	Hydrophobic Acrylic	+6.00D to +30.00D	13.0mm	{"toric": true, "aspheric": true, "rotationalStability": true}	{"improvedVision": true, "stablePosition": true, "astigmatismCorrection": true}	{"astigmatism": ">= 1.00D", "premiumCare": true, "cataractSurgery": true}	["Irregular astigmatism", "Zonular weakness"]	4300	26000	16000	t	15	3	t	t	{"ce": "CE 0123", "iso": "ISO 11979"}	1174	95.1	1.9	t	system_seed_topup	2025-11-26 06:24:39.124	2025-11-26 06:24:39.124
cmifmdrzb0003lh8wpo4ghcp7	Rayner RayOne Aspheric	RAY-ASPH	Rayner	RAO600A	IOL	MONOFOCAL	Hydrophobic Acrylic	+6.00D to +30.00D	13.0mm	{"aspheric": true, "rayacryl": true, "aberrationCorrecting": true}	{"sharperVision": true, "improvedContrast": true, "betterNightVision": true}	{"nightDrivers": true, "qualityVision": true, "cataractSurgery": true}	["Active infection", "Severe inflammation"]	2500	13500	11000	t	28	6	t	t	{"ce": "CE 0086", "iso": "ISO 11979"}	169	96.5	1.4	t	system_seed_topup	2025-11-26 06:24:39.144	2025-11-26 06:24:39.144
cmifmdrzr0004lh8w1zmekyq2	Bausch + Lomb Soflex	BL-SOFLEX	Bausch + Lomb	SF30SE	IOL	MONOFOCAL	Silicone	+6.00D to +30.00D	13.5mm	{"proven": true, "foldable": true, "silicone": true}	{"longHistory": true, "biocompatible": true, "softInsertion": true}	{"allAges": true, "standardCare": true, "cataractSurgery": true}	["Silicone oil use", "Active inflammation"]	1700	9500	8000	t	35	8	t	t	{"ce": "CE 0086", "iso": "ISO 11979"}	56	95	2.1	t	system_seed_topup	2025-11-26 06:24:39.159	2025-11-26 06:24:39.159
cmifmds080005lh8wb8xqmnmn	HumanOptics Aspira-aA Toric	HO-ASPTOR	HumanOptics	Aspira-aAT	TORIC_IOL	TORIC	Hydrophobic Acrylic	+6.00D to +30.00D	13.0mm	{"toric": true, "aspheric": true, "rotationalStability": true}	{"improvedVision": true, "affordablePrice": true, "astigmatismCorrection": true}	{"astigmatism": ">= 1.00D", "costEffective": true, "cataractSurgery": true}	["Irregular astigmatism", "Zonular dialysis"]	3200	18000	14000	t	12	3	f	t	{"ce": "CE 0123", "iso": "ISO 11979"}	677	94.8	2.3	t	system_seed_topup	2025-11-26 06:24:39.176	2025-11-26 06:24:39.176
cmifmds0p0006lh8w31e9a0jo	Medicontur ACUNEX Vario	MEDI-VARIO	Medicontur	ACUNEX-V	MULTIFOCAL_IOL	MULTIFOCAL	Hydrophilic Acrylic	+10.00D to +30.00D	11.00mm	{"multifocal": true, "diffractive": true, "variableAdd": true}	{"microIncision": true, "adaptiveVision": true, "multipleDistances": true}	{"premiumVision": true, "activeLifestyle": true, "cataractSurgery": true}	["Macular disease", "Irregular pupils"]	6200	33000	0	t	8	2	f	t	{"ce": "CE 0123", "iso": "ISO 11979"}	637	89.8	4.5	t	system_seed_topup	2025-11-26 06:24:39.193	2025-11-26 06:24:39.193
cmifmds140007lh8w9koa9am3	Lenstec Softec HD	LENS-SOFT	Lenstec	SoftecHD	IOL	MONOFOCAL	Hydrophobic Acrylic	+6.00D to +30.00D	13.0mm	{"aspheric": true, "aberrationFree": true, "highDefinition": true}	{"clearVision": true, "costEffective": true, "improvedContrast": true}	{"standardCare": true, "qualityVision": true, "cataractSurgery": true}	["Active infection", "Severe inflammation"]	2000	11000	9500	t	25	5	f	t	{"ce": "CE 0123", "iso": "ISO 11979"}	759	95.8	1.6	t	system_seed_topup	2025-11-26 06:24:39.208	2025-11-26 06:24:39.208
\.


--
-- Data for Name: letterhead_templates; Type: TABLE DATA; Schema: public; Owner: tanuj
--

COPY public.letterhead_templates (id, name, description, elements, "pageSettings", "isDefault", "isActive", "createdBy", "createdAt", "updatedAt") FROM stdin;
cmid170s100417kp4f9qwljnh	r_t		[{"x": 42, "y": 21, "id": "element-1763981697893", "type": "logo", "align": "left", "color": "#000000", "width": 699.515625, "height": 102, "content": "data:image/jpeg;base64,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", "fontSize": 16, "fontStyle": "normal", "fontFamily": "Arial", "fontWeight": "normal", "textDecoration": "none", "backgroundColor": "transparent"}]	{"size": "A4", "paperSize": "A4", "canvasWidth": 794, "orientation": "portrait", "canvasHeight": 400}	f	t	cmicwemnf00007kmwiu8va9id	2025-11-24 10:55:59.665	2025-11-24 10:55:59.665
\.


--
-- Data for Name: medicine_types; Type: TABLE DATA; Schema: public; Owner: tanuj
--

COPY public.medicine_types (id, name, "isActive", "createdAt", "updatedAt") FROM stdin;
cmid1tr7q0000lhe80xbp3wmi	Eye Drops	t	2025-11-24 11:13:40.359	2025-11-24 11:13:40.359
cmid1tran0001lhe805ohrsqx	Ointment	t	2025-11-24 11:13:40.464	2025-11-24 11:13:40.464
cmid1trbu0002lhe8wqjqsx2t	Tablet	t	2025-11-24 11:13:40.507	2025-11-24 11:13:40.507
cmid1trcv0003lhe834184o7l	Capsule	t	2025-11-24 11:13:40.544	2025-11-24 11:13:40.544
cmid1trdw0004lhe8d6ljycp9	Injection	t	2025-11-24 11:13:40.58	2025-11-24 11:13:40.58
cmid1trer0005lhe8f15q36zl	Gel	t	2025-11-24 11:13:40.611	2025-11-24 11:13:40.611
cmid1trfl0006lhe8b1vmat6j	Solution	t	2025-11-24 11:13:40.642	2025-11-24 11:13:40.642
\.


--
-- Data for Name: medicines; Type: TABLE DATA; Schema: public; Owner: tanuj
--

COPY public.medicines (id, code, name, "typeId", "genericMedicineId", "drugGroupId", "dosageScheduleId", dosage, information, "isActive", "createdAt", "updatedAt") FROM stdin;
cmid1tt05001xlhe83cbreuln	TIM001	Timolol 0.5% Eye Drops	cmid1tr7q0000lhe80xbp3wmi	cmid1trgi0007lhe85x38budf	cmid1tsaj0011lhe8zidch0oi	cmid1tsoq001ilhe8mrxhgjyq	1 drop	Used for glaucoma treatment. Reduces intraocular pressure.	t	2025-11-24 11:13:42.677	2025-11-26 06:48:45.313
cmid1tt1c001zlhe864a3xtfd	LAT001	Latanoprost 0.005% Eye Drops	cmid1tr7q0000lhe80xbp3wmi	cmid1trhy0008lhe8pdboykex	cmid1tsbp0012lhe8g22769l8	cmid1tsn6001hlhe85r1l5t1p	1 drop	First-line treatment for glaucoma. Apply at bedtime.	t	2025-11-24 11:13:42.719	2025-11-26 06:48:45.366
cmid1tt1l0021lhe8pzl1rv2p	BRIM001	Brimonidine 0.2% Eye Drops	cmid1tr7q0000lhe80xbp3wmi	cmid1trit0009lhe8fdvjcu5n	cmid1tscj0013lhe8z6iot4kf	cmid1tsoq001ilhe8mrxhgjyq	1 drop	Reduces IOP by decreasing aqueous humor production.	t	2025-11-24 11:13:42.729	2025-11-26 06:48:45.374
cmid1tt1u0023lhe8rv9qirwj	DORZ001	Dorzolamide 2% Eye Drops	cmid1tr7q0000lhe80xbp3wmi	cmid1trjs000alhe8v6cpgliz	cmid1tsda0014lhe8kvnstm4l	cmid1tspi001jlhe82wm9bqri	1 drop	Reduces IOP. Can be used as adjunct therapy.	t	2025-11-24 11:13:42.738	2025-11-26 06:48:45.381
cmid1tt240025lhe871yd9vtb	TROP001	Tropicamide 1% Eye Drops	cmid1tr7q0000lhe80xbp3wmi	cmid1trmv000elhe8x5errn6g	cmid1tse30015lhe8l2mavnv3	cmid1tsua001plhe8ac905gml	1 drop	Short-acting mydriatic for fundus examination.	t	2025-11-24 11:13:42.748	2025-11-26 06:48:45.392
cmid1tt2e0027lhe8ljigp9zx	PHEN001	Phenylephrine 2.5% Eye Drops	cmid1tr7q0000lhe80xbp3wmi	cmid1trnn000flhe8zvq211dr	cmid1tse30015lhe8l2mavnv3	cmid1tsua001plhe8ac905gml	1 drop	Mydriatic agent for pupil dilation.	t	2025-11-24 11:13:42.758	2025-11-26 06:48:45.4
cmid1tt2p0029lhe8eqfgwyz2	CYCLO001	Cyclopentolate 1% Eye Drops	cmid1tr7q0000lhe80xbp3wmi	cmid1troe000glhe87b7v3pkc	cmid1tset0016lhe8tdbopyo5	cmid1tsua001plhe8ac905gml	1 drop	Cycloplegic refraction and pupil dilation.	t	2025-11-24 11:13:42.768	2025-11-26 06:48:45.408
cmid1tt2z002blhe8tp51j767	PRED001	Prednisolone 1% Eye Drops	cmid1tr7q0000lhe80xbp3wmi	cmid1trqv000jlhe8pj34lsrh	cmid1tsfj0017lhe8e0zg6dna	cmid1tsq8001klhe8qtd9950b	1 drop	Anti-inflammatory. Monitor IOP during use.	t	2025-11-24 11:13:42.779	2025-11-26 06:48:45.415
cmid1tt39002dlhe8wf0lyxie	DEX001	Dexamethasone 0.1% Eye Drops	cmid1tr7q0000lhe80xbp3wmi	cmid1trrm000klhe8rgkqcofm	cmid1tsfj0017lhe8e0zg6dna	cmid1tsq8001klhe8qtd9950b	1 drop	Potent corticosteroid for inflammation.	t	2025-11-24 11:13:42.789	2025-11-26 06:48:45.422
cmid1tt3g002flhe8ocv31a98	MOXI001	Moxifloxacin 0.5% Eye Drops	cmid1tr7q0000lhe80xbp3wmi	cmid1trtx000nlhe8kq7w498m	cmid1tsga0018lhe8yi9qac34	cmid1tsq8001klhe8qtd9950b	1 drop	Broad-spectrum antibiotic for bacterial infections.	t	2025-11-24 11:13:42.796	2025-11-26 06:48:45.43
cmid1tt3p002hlhe8y5u8fe99	GATI001	Gatifloxacin 0.3% Eye Drops	cmid1tr7q0000lhe80xbp3wmi	cmid1trun000olhe8h9e0j2kq	cmid1tsga0018lhe8yi9qac34	cmid1tsq8001klhe8qtd9950b	1 drop	Fluoroquinolone antibiotic for eye infections.	t	2025-11-24 11:13:42.805	2025-11-26 06:48:45.436
cmid1tt3y002jlhe83dhzmycr	OFLO001	Ofloxacin 0.3% Eye Drops	cmid1tr7q0000lhe80xbp3wmi	cmid1trvg000plhe8zsglelen	cmid1tsga0018lhe8yi9qac34	cmid1tsq8001klhe8qtd9950b	1 drop	Antibiotic for conjunctivitis and corneal ulcers.	t	2025-11-24 11:13:42.814	2025-11-26 06:48:45.444
cmid1tt47002llhe86gsd5m8f	TOBRA001	Tobramycin 0.3% Eye Drops	cmid1tr7q0000lhe80xbp3wmi	cmid1trwu000rlhe8aodpbvhn	cmid1tsga0018lhe8yi9qac34	cmid1tsq8001klhe8qtd9950b	1 drop	Aminoglycoside antibiotic for bacterial infections.	t	2025-11-24 11:13:42.823	2025-11-26 06:48:45.45
cmid1tt4h002nlhe8he7rlxap	KETO001	Ketorolac 0.5% Eye Drops	cmid1tr7q0000lhe80xbp3wmi	cmid1trz5000ulhe8a8gc88k2	cmid1tsh30019lhe8lbtsf7cv	cmid1tsq8001klhe8qtd9950b	1 drop	NSAID for pain and inflammation post-surgery.	t	2025-11-24 11:13:42.833	2025-11-26 06:48:45.458
cmid1tt4p002plhe8qy2v59xy	DICLO001	Diclofenac 0.1% Eye Drops	cmid1tr7q0000lhe80xbp3wmi	cmid1trzv000vlhe8w7svtfhl	cmid1tsh30019lhe8lbtsf7cv	cmid1tsq8001klhe8qtd9950b	1 drop	NSAID for post-operative inflammation.	t	2025-11-24 11:13:42.841	2025-11-26 06:48:45.465
cmid1tt4x002rlhe8rgt46ayw	CMC001	Carboxymethylcellulose 0.5% Eye Drops	cmid1tr7q0000lhe80xbp3wmi	cmid1ts1c000xlhe8lvap1raq	cmid1tshs001alhe8fmlnexqp	cmid1tsua001plhe8ac905gml	1-2 drops	Lubricant for dry eye syndrome.	t	2025-11-24 11:13:42.849	2025-11-26 06:48:45.474
cmid1tt57002tlhe8x5r0wgdu	HYPR001	Hypromellose 0.3% Eye Drops	cmid1tr7q0000lhe80xbp3wmi	cmid1ts4d000ylhe8x9uuwf6h	cmid1tshs001alhe8fmlnexqp	cmid1tsua001plhe8ac905gml	1-2 drops	Artificial tears for dry eyes.	t	2025-11-24 11:13:42.859	2025-11-26 06:48:45.481
cmid1tt5g002vlhe85jsfjk8a	ATRO001	Atropine 1% Eye Drops	cmid1tr7q0000lhe80xbp3wmi	cmid1trpe000hlhe8riorpkuj	cmid1tset0016lhe8tdbopyo5	cmid1tsn6001hlhe85r1l5t1p	1 drop	Long-acting cycloplegic. Used for uveitis and amblyopia.	t	2025-11-24 11:13:42.868	2025-11-26 06:48:45.488
cmid1tt5o002xlhe8bpwziyjq	CHLOR001	Chloramphenicol 0.5% Eye Drops	cmid1tr7q0000lhe80xbp3wmi	cmid1tryb000tlhe8n2oryk4z	cmid1tsga0018lhe8yi9qac34	cmid1tsq8001klhe8qtd9950b	1 drop	Broad-spectrum antibiotic for bacterial conjunctivitis.	t	2025-11-24 11:13:42.876	2025-11-26 06:48:45.495
cmid1tt5w002zlhe80lyj4rpj	CHLOR002	Chloramphenicol 1% Eye Ointment	cmid1tran0001lhe805ohrsqx	cmid1tryb000tlhe8n2oryk4z	cmid1tsga0018lhe8yi9qac34	cmid1tstd001olhe8rhygwb2m	Apply thin layer	Antibiotic ointment for nighttime use.	t	2025-11-24 11:13:42.885	2025-11-26 06:48:45.501
\.


--
-- Data for Name: o2_n2_pressure_check_register; Type: TABLE DATA; Schema: public; Owner: tanuj
--

COPY public.o2_n2_pressure_check_register (id, date, "time", "o2Big", "o2Small", n2, sign, remark, "createdAt", "updatedAt", "createdBy") FROM stdin;
\.


--
-- Data for Name: ophthalmologist_examinations; Type: TABLE DATA; Schema: public; Owner: tanuj
--

COPY public.ophthalmologist_examinations (id, "patientVisitId", "doctorId", "examinationSequence", "slitLampFindings", "fundoscopyFindings", "visualFieldResults", "octFindings", "fundusPhotography", "angiographyFindings", ultrasonography, "clinicalImpressions", assessment, "treatmentPlan", "surgeryRecommended", "urgencyLevel", "followUpRequired", "followUpDate", "followUpInstructions", "createdAt", "updatedAt", "acdOD", "acdOS", "additionalNotes", "additionalOrders", "additionalTests", "additionalTestsLegacy", "additionalTestsOrdered", "anteriorSegment", "anyOtherDetailsOD", "anyOtherDetailsOS", "assignedDoctor", "axlOD", "axlOS", "bcvaOD", "bcvaOS", "clinicalDetails", "clinicalNotes", "colorVision", "completedAt", "conjunctivaOD", "conjunctivaOS", "corneaOD", "corneaOS", "coverTest", "distanceBinocular", "distanceOD", "distanceOS", "examinationNotes", "examinationStatus", "extraocularMovements", "eyeAlignment", "eyelidsOD", "eyelidsOS", "flatAxisOD", "flatAxisOS", "followUpDays", "followUpPeriod", "iolImplantedOD", "iolImplantedOS", "iolPowerPlannedOD", "iolPowerPlannedOS", "iopMethod", "iopOD", "iopOS", "k1OD", "k1OS", "k2OD", "k2OS", "knownAllergies", "lensOD", "lensOS", "nearBinocular", "nearOD", "nearOS", "preliminaryDiagnosis", "proceedToDoctor", "pupilReaction", "receptionist2Notes", "receptionist2Reviewed", "receptionist2ReviewedAt", "receptionist2ReviewedBy", refraction, "refractionAddOD", "refractionAddOS", "refractionAxisOD", "refractionAxisOS", "refractionCylinderOD", "refractionCylinderOS", "refractionPD", "refractionSphereOD", "refractionSphereOS", "requiresDilation", tonometry, "ucvaOD", "ucvaOS", "visualAcuity", "surgeryTypeId") FROM stdin;
cmih22kuc00017kbklsmu1z3n	cmigz9axq001k7kusrjo4f10g	cmicwersg00037k48j2wmqv52	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	f	\N	\N	2025-11-27 06:31:36.707	2025-11-27 06:31:36.707	\N	\N	hhhh	"{\\"oct\\":true,\\"visualField\\":false,\\"fundusPhotography\\":false,\\"angiography\\":false,\\"other\\":\\"\\"}"	"{\\"pupilReaction\\":\\"sluggish\\",\\"colorVision\\":\\"red-green-deficiency\\",\\"eyeAlignment\\":\\"normal\\",\\"extraocularMovements\\":\\"full\\",\\"coverTest\\":\\"orthophoric\\"}"	null	"{\\"oct\\":true,\\"visualField\\":false,\\"fundusPhotography\\":false,\\"angiography\\":false,\\"other\\":\\"\\"}"	"{\\"eyelids\\":{\\"rightEye\\":\\"normal\\",\\"leftEye\\":\\"normal\\"},\\"conjunctiva\\":{\\"rightEye\\":\\"normal\\",\\"leftEye\\":\\"normal\\"},\\"cornea\\":{\\"rightEye\\":\\"clear\\",\\"leftEye\\":\\"clear\\"},\\"lens\\":{\\"rightEye\\":\\"normal\\",\\"leftEye\\":\\"normal\\"}}"	\N	\N	cmicwersg00037k48j2wmqv52	\N	\N	\N	\N	"{\\"notes\\":\\"\\",\\"diagnosis\\":\\"diabetic-retinopathy\\"}"	\N	red-green-deficiency	2025-11-27 06:31:36.703	normal	normal	clear	clear	orthophoric	\N	6/12	6/18	hhhh	completed	full	normal	normal	normal	\N	\N	\N	\N	\N	\N	\N	\N	goldmann	23	56	\N	\N	\N	\N	null	normal	normal	\N	\N	\N	diabetic-retinopathy	t	sluggish	\N	f	\N	\N	"{\\"sphere\\":{\\"rightEye\\":12,\\"leftEye\\":45},\\"cylinder\\":{\\"rightEye\\":45,\\"leftEye\\":78},\\"axis\\":{\\"rightEye\\":67,\\"leftEye\\":54},\\"add\\":{\\"rightEye\\":null,\\"leftEye\\":null},\\"pd\\":null}"	\N	\N	67	54	45	78	\N	12	45	f	"{\\"iop\\":{\\"rightEye\\":23,\\"leftEye\\":56},\\"method\\":\\"goldmann\\"}"	6/12	6/18	"{\\"distance\\":{\\"rightEye\\":\\"6/12\\",\\"leftEye\\":\\"6/18\\",\\"binocular\\":\\"\\"},\\"near\\":{\\"rightEye\\":\\"\\",\\"leftEye\\":\\"\\",\\"binocular\\":\\"\\"}}"	\N
cmih683ik000clhv8t3kl7nqy	cmigz9gvy001q7kus838587bf	cmicwersg00037k48j2wmqv52	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	f	\N	\N	2025-11-27 08:27:52.651	2025-11-27 08:27:52.651	\N	\N	afasf	"{\\"oct\\":false,\\"visualField\\":true,\\"fundusPhotography\\":false,\\"angiography\\":false,\\"other\\":\\"\\"}"	"{\\"pupilReaction\\":\\"sluggish\\",\\"colorVision\\":\\"red-green-deficiency\\",\\"eyeAlignment\\":\\"normal\\",\\"extraocularMovements\\":\\"full\\",\\"coverTest\\":\\"orthophoric\\"}"	null	"{\\"oct\\":false,\\"visualField\\":true,\\"fundusPhotography\\":false,\\"angiography\\":false,\\"other\\":\\"\\"}"	"{\\"eyelids\\":{\\"rightEye\\":\\"normal\\",\\"leftEye\\":\\"normal\\"},\\"conjunctiva\\":{\\"rightEye\\":\\"normal\\",\\"leftEye\\":\\"normal\\"},\\"cornea\\":{\\"rightEye\\":\\"clear\\",\\"leftEye\\":\\"clear\\"},\\"lens\\":{\\"rightEye\\":\\"normal\\",\\"leftEye\\":\\"normal\\"}}"	\N	\N	cmicwersg00037k48j2wmqv52	\N	\N	\N	\N	"{\\"notes\\":\\"\\",\\"diagnosis\\":\\"diabetic-retinopathy\\"}"	\N	red-green-deficiency	2025-11-27 08:27:52.647	normal	normal	clear	clear	orthophoric	\N	6/12	6/18	afasf	completed	full	normal	normal	normal	\N	\N	\N	\N	\N	\N	\N	\N	goldmann	23	56	\N	\N	\N	\N	null	normal	normal	\N	\N	\N	diabetic-retinopathy	t	sluggish	\N	f	\N	\N	"{\\"sphere\\":{\\"rightEye\\":12,\\"leftEye\\":45},\\"cylinder\\":{\\"rightEye\\":45,\\"leftEye\\":78},\\"axis\\":{\\"rightEye\\":67,\\"leftEye\\":54},\\"add\\":{\\"rightEye\\":null,\\"leftEye\\":null},\\"pd\\":null}"	\N	\N	67	54	45	78	\N	12	45	f	"{\\"iop\\":{\\"rightEye\\":23,\\"leftEye\\":56},\\"method\\":\\"goldmann\\"}"	6/12	6/18	"{\\"distance\\":{\\"rightEye\\":\\"6/12\\",\\"leftEye\\":\\"6/18\\",\\"binocular\\":\\"\\"},\\"near\\":{\\"rightEye\\":\\"\\",\\"leftEye\\":\\"\\",\\"binocular\\":\\"\\"}}"	\N
cmih69b4w000klhv8uoh4iil7	cmigz9nca001w7kusxwkoanoz	cmicwersg00037k48j2wmqv52	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	f	\N	\N	2025-11-27 08:28:49.182	2025-11-27 08:29:14.778	\N	\N	dsafsfsafd	"{\\"oct\\":false,\\"visualField\\":true,\\"fundusPhotography\\":true,\\"angiography\\":false,\\"other\\":\\"\\"}"	"{\\"pupilReaction\\":\\"sluggish\\",\\"colorVision\\":\\"red-green-deficiency\\",\\"eyeAlignment\\":\\"normal\\",\\"extraocularMovements\\":\\"full\\",\\"coverTest\\":\\"orthophoric\\"}"	null	"{\\"oct\\":false,\\"visualField\\":true,\\"fundusPhotography\\":true,\\"angiography\\":false,\\"other\\":\\"\\"}"	"{\\"eyelids\\":{\\"rightEye\\":\\"normal\\",\\"leftEye\\":\\"normal\\"},\\"conjunctiva\\":{\\"rightEye\\":\\"normal\\",\\"leftEye\\":\\"normal\\"},\\"cornea\\":{\\"rightEye\\":\\"clear\\",\\"leftEye\\":\\"clear\\"},\\"lens\\":{\\"rightEye\\":\\"normal\\",\\"leftEye\\":\\"normal\\"}}"	\N	\N	cmicwersg00037k48j2wmqv52	\N	\N	\N	\N	"{\\"notes\\":\\"\\",\\"diagnosis\\":\\"diabetic-retinopathy\\"}"	\N	red-green-deficiency	2025-11-27 08:29:14.774	normal	normal	clear	clear	orthophoric	\N	6/12	6/18	dsafsfsafd	completed	full	normal	normal	normal	\N	\N	\N	\N	\N	\N	\N	\N	goldmann	23	56	\N	\N	\N	\N	null	normal	normal	\N	\N	\N	diabetic-retinopathy	t	sluggish	\N	f	\N	\N	"{\\"sphere\\":{\\"rightEye\\":12,\\"leftEye\\":45},\\"cylinder\\":{\\"rightEye\\":45,\\"leftEye\\":78},\\"axis\\":{\\"rightEye\\":67,\\"leftEye\\":54},\\"add\\":{\\"rightEye\\":null,\\"leftEye\\":null},\\"pd\\":null}"	\N	\N	67	54	45	78	\N	12	45	f	"{\\"iop\\":{\\"rightEye\\":23,\\"leftEye\\":56},\\"method\\":\\"goldmann\\"}"	6/12	6/18	"{\\"distance\\":{\\"rightEye\\":\\"6/12\\",\\"leftEye\\":\\"6/18\\",\\"binocular\\":\\"\\"},\\"near\\":{\\"rightEye\\":\\"\\",\\"leftEye\\":\\"\\",\\"binocular\\":\\"\\"}}"	\N
cmih7j008000slhv899za5b7d	cmigz9zac00287kusdvsmah8q	cmicwersg00037k48j2wmqv52	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	f	\N	\N	2025-11-27 09:04:20.934	2025-11-27 09:05:07.48	222	22	asfsdfsdf	"{\\"oct\\":true,\\"visualField\\":false,\\"fundusPhotography\\":false,\\"angiography\\":true,\\"other\\":\\"sdafsdf\\"}"	"{\\"pupilReaction\\":\\"sluggish\\",\\"colorVision\\":\\"red-green-deficiency\\",\\"eyeAlignment\\":\\"normal\\",\\"extraocularMovements\\":\\"full\\",\\"coverTest\\":\\"orthophoric\\"}"	null	"{\\"oct\\":true,\\"visualField\\":false,\\"fundusPhotography\\":false,\\"angiography\\":true,\\"other\\":\\"sdafsdf\\"}"	"{\\"eyelids\\":{\\"rightEye\\":\\"normal\\",\\"leftEye\\":\\"normal\\"},\\"conjunctiva\\":{\\"rightEye\\":\\"normal\\",\\"leftEye\\":\\"normal\\"},\\"cornea\\":{\\"rightEye\\":\\"clear\\",\\"leftEye\\":\\"clear\\"},\\"lens\\":{\\"rightEye\\":\\"normal\\",\\"leftEye\\":\\"normal\\"}}"	222222	2	cmicwersg00037k48j2wmqv52	22	2222	\N	\N	"{\\"notes\\":\\"\\",\\"diagnosis\\":\\"diabetic-retinopathy\\"}"	\N	red-green-deficiency	2025-11-27 09:05:07.477	normal	normal	clear	clear	orthophoric	\N	6/12	6/18	asfsdfsdf	completed	full	normal	normal	normal	22	22	\N	\N	22	222	222222	22	goldmann	23	56	24	22	22	22	null	normal	normal	\N	\N	\N	diabetic-retinopathy	t	sluggish	\N	f	\N	\N	"{\\"sphere\\":{\\"rightEye\\":12,\\"leftEye\\":45},\\"cylinder\\":{\\"rightEye\\":45,\\"leftEye\\":78},\\"axis\\":{\\"rightEye\\":67,\\"leftEye\\":54},\\"add\\":{\\"rightEye\\":null,\\"leftEye\\":null},\\"pd\\":null}"	\N	\N	67	54	45	78	\N	12	45	f	"{\\"iop\\":{\\"rightEye\\":23,\\"leftEye\\":56},\\"method\\":\\"goldmann\\"}"	6/12	6/18	"{\\"distance\\":{\\"rightEye\\":\\"6/12\\",\\"leftEye\\":\\"6/18\\",\\"binocular\\":\\"\\"},\\"near\\":{\\"rightEye\\":\\"\\",\\"leftEye\\":\\"\\",\\"binocular\\":\\"\\"}}"	\N
cmihban3z0010lhv869vo994a	cmigz9t7k00227kusdi09r5gh	cmicwersg00037k48j2wmqv52	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	f	\N	\N	2025-11-27 10:49:49.439	2025-11-27 10:50:35.936	\N	\N	my notes 	"{\\"oct\\":false,\\"visualField\\":true,\\"fundusPhotography\\":false,\\"angiography\\":true,\\"other\\":\\"\\"}"	"{\\"pupilReaction\\":\\"sluggish\\",\\"colorVision\\":\\"red-green-deficiency\\",\\"eyeAlignment\\":\\"normal\\",\\"extraocularMovements\\":\\"full\\",\\"coverTest\\":\\"orthophoric\\"}"	null	"{\\"oct\\":false,\\"visualField\\":true,\\"fundusPhotography\\":false,\\"angiography\\":true,\\"other\\":\\"\\"}"	"{\\"eyelids\\":{\\"rightEye\\":\\"normal\\",\\"leftEye\\":\\"normal\\"},\\"conjunctiva\\":{\\"rightEye\\":\\"normal\\",\\"leftEye\\":\\"normal\\"},\\"cornea\\":{\\"rightEye\\":\\"clear\\",\\"leftEye\\":\\"clear\\"},\\"lens\\":{\\"rightEye\\":\\"normal\\",\\"leftEye\\":\\"normal\\"}}"	\N	\N	cmicwersg00037k48j2wmqv52	\N	\N	\N	\N	"{\\"notes\\":\\"\\",\\"diagnosis\\":\\"diabetic-retinopathy\\"}"	\N	red-green-deficiency	2025-11-27 10:50:35.935	normal	normal	clear	clear	orthophoric	\N	6/12	6/18	my notes 	completed	full	normal	normal	normal	\N	\N	\N	\N	\N	\N	\N	\N	goldmann	23	56	\N	\N	\N	\N	null	normal	normal	\N	\N	\N	diabetic-retinopathy	t	sluggish	\N	f	\N	\N	"{\\"sphere\\":{\\"rightEye\\":12,\\"leftEye\\":45},\\"cylinder\\":{\\"rightEye\\":45,\\"leftEye\\":78},\\"axis\\":{\\"rightEye\\":67,\\"leftEye\\":54},\\"add\\":{\\"rightEye\\":null,\\"leftEye\\":null},\\"pd\\":null}"	\N	\N	67	54	45	78	\N	12	45	f	"{\\"iop\\":{\\"rightEye\\":23,\\"leftEye\\":56},\\"method\\":\\"goldmann\\"}"	6/12	6/18	"{\\"distance\\":{\\"rightEye\\":\\"6/12\\",\\"leftEye\\":\\"6/18\\",\\"binocular\\":\\"\\"},\\"near\\":{\\"rightEye\\":\\"\\",\\"leftEye\\":\\"\\",\\"binocular\\":\\"\\"}}"	\N
cmin38lkv00017kfwbuqisspw	cmiiujue700037kwgs7sxz5ug	cmicwersg00037k48j2wmqv52	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	f	\N	\N	2025-12-01 11:50:54.26	2025-12-01 11:50:54.26	\N	\N	\N	"{\\"oct\\":true,\\"visualField\\":true,\\"fundusPhotography\\":false,\\"angiography\\":false,\\"other\\":\\"\\"}"	"{\\"pupilReaction\\":\\"normal\\",\\"colorVision\\":\\"normal\\",\\"eyeAlignment\\":\\"normal\\",\\"extraocularMovements\\":\\"full\\",\\"coverTest\\":\\"orthophoric\\"}"	null	"{\\"oct\\":true,\\"visualField\\":true,\\"fundusPhotography\\":false,\\"angiography\\":false,\\"other\\":\\"\\"}"	"{\\"eyelids\\":{\\"rightEye\\":\\"normal\\",\\"leftEye\\":\\"normal\\"},\\"conjunctiva\\":{\\"rightEye\\":\\"normal\\",\\"leftEye\\":\\"normal\\"},\\"cornea\\":{\\"rightEye\\":\\"clear\\",\\"leftEye\\":\\"clear\\"},\\"lens\\":{\\"rightEye\\":\\"normal\\",\\"leftEye\\":\\"normal\\"}}"	\N	\N	cmicwersg00037k48j2wmqv52	\N	\N	\N	\N	"{\\"notes\\":\\"\\",\\"diagnosis\\":\\"normal\\"}"	\N	normal	2025-12-01 11:50:54.256	normal	normal	clear	clear	orthophoric	\N	\N	\N	\N	completed	full	normal	normal	normal	\N	\N	\N	\N	\N	\N	\N	\N	goldmann	\N	\N	\N	\N	\N	\N	null	normal	normal	\N	\N	\N	normal	t	normal	\N	f	\N	\N	"{\\"sphere\\":{\\"rightEye\\":null,\\"leftEye\\":null},\\"cylinder\\":{\\"rightEye\\":null,\\"leftEye\\":null},\\"axis\\":{\\"rightEye\\":null,\\"leftEye\\":null},\\"add\\":{\\"rightEye\\":null,\\"leftEye\\":null},\\"pd\\":null}"	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	"{\\"iop\\":{\\"rightEye\\":null,\\"leftEye\\":null},\\"method\\":\\"goldmann\\"}"	\N	\N	"{\\"distance\\":{\\"rightEye\\":\\"\\",\\"leftEye\\":\\"\\",\\"binocular\\":\\"\\"},\\"near\\":{\\"rightEye\\":\\"\\",\\"leftEye\\":\\"\\",\\"binocular\\":\\"\\"}}"	\N
\.


--
-- Data for Name: optometrist_examinations; Type: TABLE DATA; Schema: public; Owner: tanuj
--

COPY public.optometrist_examinations (id, "patientVisitId", "optometristId", "ucvaOD", "ucvaOS", "bcvaOD", "bcvaOS", "refractionSphereOD", "refractionCylinderOD", "refractionAxisOD", "refractionSphereOS", "refractionCylinderOS", "refractionAxisOS", "iopOD", "iopOS", "iopMethod", "colorVision", "pupilReaction", "eyeAlignment", "anteriorSegment", "preliminaryDiagnosis", "urgencyLevel", "additionalNotes", "proceedToDoctor", "requiresDilation", "additionalTests", "createdAt", "updatedAt", "additionalOrders", "additionalTestsLegacy", "assignedDoctor", "clinicalDetails", "clinicalNotes", "completedAt", "examinationStatus", "knownAllergies", refraction, tonometry, "visualAcuity", "receptionist2Notes", "receptionist2Reviewed", "receptionist2ReviewedAt", "receptionist2ReviewedBy") FROM stdin;
cmigzdmw900327kusxi54go8j	cmigz9axq001k7kusrjo4f10g	cmicwerk200007k4801kdnv9f	6/12	6/18			12	45	67	45	78	54	23	56	goldmann	red-green-deficiency	sluggish	normal	{"findings": "corneal-opacity"}	diabetic-retinopathy	\N		t	f	{"coverTest": "exotropia", "colorVision": "red-green-deficiency", "eyeAlignment": "normal", "pupilReaction": "sluggish", "anteriorSegment": "corneal-opacity", "extraocularMovements": "restricted"}	2025-11-27 05:16:13.737	2025-11-27 05:20:32.809	[]	\N	\N	{"preOpParams": {"k1": {"leftEye": "56", "rightEye": "12"}, "k2": {"leftEye": "56", "rightEye": "35"}, "acd": {"leftEye": "34", "rightEye": "65"}, "axl": {"leftEye": "56", "rightEye": "34"}, "flatAxis": {"leftEye": "87", "rightEye": "37"}, "iolImplanted": {"leftEye": "87", "rightEye": "43"}, "anyOtherDetails": {"leftEye": "JKJ", "rightEye": "HJHJH"}, "iolPowerPlanned": {"leftEye": "89", "rightEye": "56"}}, "slitLampFindings": {"lens": {"leftEye": "normal", "rightEye": "abnormal"}, "cornea": {"leftEye": "clear", "rightEye": "hazy"}, "eyelids": {"leftEye": "normal", "rightEye": "normal"}, "conjunctiva": {"leftEye": "normal", "rightEye": "congestion"}}}		2025-11-27 05:16:12.976	completed	[]	{"pd": "65", "add": {"leftEye": "34", "rightEye": "45"}, "axis": {"leftEye": "54", "rightEye": "67"}, "sphere": {"leftEye": "45", "rightEye": "12"}, "cylinder": {"leftEye": "78", "rightEye": "45"}}	{"iop": {"leftEye": "56", "rightEye": "23"}, "time": "", "method": "goldmann"}	{"near": {"leftEye": "N14", "rightEye": "N18", "binocular": "N14"}, "aided": {"leftEye": "", "rightEye": "", "binocular": ""}, "unaided": {"leftEye": "", "rightEye": "", "binocular": ""}, "distance": {"leftEye": "6/18", "rightEye": "6/12", "binocular": "6/18"}}		t	2025-11-27 05:20:32.809	cmicwerqd00027k4837ksgrik
cmigzddw000307kus7dhm5wkj	cmigz93on001e7kus9m18uwt0	cmicwerk200007k4801kdnv9f	6/12	6/18			12	45	67	45	78	54	23	56	goldmann	red-green-deficiency	sluggish	normal	{"findings": "corneal-opacity"}	diabetic-retinopathy	\N		t	f	{"coverTest": "exotropia", "colorVision": "red-green-deficiency", "eyeAlignment": "normal", "pupilReaction": "sluggish", "anteriorSegment": "corneal-opacity", "extraocularMovements": "restricted"}	2025-11-27 05:16:02.064	2025-11-27 05:21:43.114	[]	\N	\N	{"preOpParams": {"k1": {"leftEye": "56", "rightEye": "12"}, "k2": {"leftEye": "56", "rightEye": "35"}, "acd": {"leftEye": "34", "rightEye": "65"}, "axl": {"leftEye": "56", "rightEye": "34"}, "flatAxis": {"leftEye": "87", "rightEye": "37"}, "iolImplanted": {"leftEye": "87", "rightEye": "43"}, "anyOtherDetails": {"leftEye": "JKJ", "rightEye": "HJHJH"}, "iolPowerPlanned": {"leftEye": "89", "rightEye": "56"}}, "slitLampFindings": {"lens": {"leftEye": "normal", "rightEye": "abnormal"}, "cornea": {"leftEye": "clear", "rightEye": "hazy"}, "eyelids": {"leftEye": "normal", "rightEye": "normal"}, "conjunctiva": {"leftEye": "normal", "rightEye": "congestion"}}}		2025-11-27 05:16:01.676	completed	[]	{"pd": "65", "add": {"leftEye": "34", "rightEye": "45"}, "axis": {"leftEye": "54", "rightEye": "67"}, "sphere": {"leftEye": "45", "rightEye": "12"}, "cylinder": {"leftEye": "78", "rightEye": "45"}}	{"iop": {"leftEye": "56", "rightEye": "23"}, "time": "", "method": "goldmann"}	{"near": {"leftEye": "N14", "rightEye": "N18", "binocular": "N14"}, "aided": {"leftEye": "", "rightEye": "", "binocular": ""}, "unaided": {"leftEye": "", "rightEye": "", "binocular": ""}, "distance": {"leftEye": "6/18", "rightEye": "6/12", "binocular": "6/18"}}		t	2025-11-27 05:21:43.114	cmicwerqd00027k4837ksgrik
cmigze1tg00367kuspwxgig2r	cmigz9nca001w7kusxwkoanoz	cmicwerk200007k4801kdnv9f	6/12	6/18			12	45	67	45	78	54	23	56	goldmann	red-green-deficiency	sluggish	normal	{"findings": "corneal-opacity"}	diabetic-retinopathy	\N		t	f	{"coverTest": "exotropia", "colorVision": "red-green-deficiency", "eyeAlignment": "normal", "pupilReaction": "sluggish", "anteriorSegment": "corneal-opacity", "extraocularMovements": "restricted"}	2025-11-27 05:16:33.075	2025-11-27 05:21:47.349	[]	\N	\N	{"preOpParams": {"k1": {"leftEye": "56", "rightEye": "12"}, "k2": {"leftEye": "56", "rightEye": "35"}, "acd": {"leftEye": "34", "rightEye": "65"}, "axl": {"leftEye": "56", "rightEye": "34"}, "flatAxis": {"leftEye": "87", "rightEye": "37"}, "iolImplanted": {"leftEye": "87", "rightEye": "43"}, "anyOtherDetails": {"leftEye": "JKJ", "rightEye": "HJHJH"}, "iolPowerPlanned": {"leftEye": "89", "rightEye": "56"}}, "slitLampFindings": {"lens": {"leftEye": "normal", "rightEye": "abnormal"}, "cornea": {"leftEye": "clear", "rightEye": "hazy"}, "eyelids": {"leftEye": "normal", "rightEye": "normal"}, "conjunctiva": {"leftEye": "normal", "rightEye": "congestion"}}}		2025-11-27 05:16:32.737	completed	[{"id": 1, "name": "Penicillin", "reaction": "Rash, difficulty breathing", "severity": "High"}, {"id": 2, "name": "Sulfa drugs", "reaction": "Skin irritation", "severity": "Medium"}, {"id": 3, "name": "Latex", "reaction": "Contact dermatitis", "severity": "Low"}]	{"pd": "65", "add": {"leftEye": "34", "rightEye": "45"}, "axis": {"leftEye": "54", "rightEye": "67"}, "sphere": {"leftEye": "45", "rightEye": "12"}, "cylinder": {"leftEye": "78", "rightEye": "45"}}	{"iop": {"leftEye": "56", "rightEye": "23"}, "time": "", "method": "goldmann"}	{"near": {"leftEye": "N14", "rightEye": "N18", "binocular": "N14"}, "aided": {"leftEye": "", "rightEye": "", "binocular": ""}, "unaided": {"leftEye": "", "rightEye": "", "binocular": ""}, "distance": {"leftEye": "6/18", "rightEye": "6/12", "binocular": "6/18"}}		t	2025-11-27 05:21:47.349	cmicwerqd00027k4837ksgrik
cmigze8ti00387kus89hvp464	cmigz9t7k00227kusdi09r5gh	cmicwerk200007k4801kdnv9f	6/12	6/18			12	45	67	45	78	54	23	56	goldmann	red-green-deficiency	sluggish	normal	{"findings": "corneal-opacity"}	diabetic-retinopathy	\N		t	f	{"coverTest": "exotropia", "colorVision": "red-green-deficiency", "eyeAlignment": "normal", "pupilReaction": "sluggish", "anteriorSegment": "corneal-opacity", "extraocularMovements": "restricted"}	2025-11-27 05:16:42.15	2025-11-27 05:22:00.938	[]	\N	\N	{"preOpParams": {"k1": {"leftEye": "56", "rightEye": "12"}, "k2": {"leftEye": "56", "rightEye": "35"}, "acd": {"leftEye": "34", "rightEye": "65"}, "axl": {"leftEye": "56", "rightEye": "34"}, "flatAxis": {"leftEye": "87", "rightEye": "37"}, "iolImplanted": {"leftEye": "87", "rightEye": "43"}, "anyOtherDetails": {"leftEye": "JKJ", "rightEye": "HJHJH"}, "iolPowerPlanned": {"leftEye": "89", "rightEye": "56"}}, "slitLampFindings": {"lens": {"leftEye": "normal", "rightEye": "abnormal"}, "cornea": {"leftEye": "clear", "rightEye": "hazy"}, "eyelids": {"leftEye": "normal", "rightEye": "normal"}, "conjunctiva": {"leftEye": "normal", "rightEye": "congestion"}}}		2025-11-27 05:16:41.8	completed	[{"id": 1, "name": "Penicillin", "reaction": "Rash, difficulty breathing", "severity": "High"}, {"id": 2, "name": "Sulfa drugs", "reaction": "Skin irritation", "severity": "Medium"}, {"id": 3, "name": "Latex", "reaction": "Contact dermatitis", "severity": "Low"}]	{"pd": "65", "add": {"leftEye": "34", "rightEye": "45"}, "axis": {"leftEye": "54", "rightEye": "67"}, "sphere": {"leftEye": "45", "rightEye": "12"}, "cylinder": {"leftEye": "78", "rightEye": "45"}}	{"iop": {"leftEye": "56", "rightEye": "23"}, "time": "", "method": "goldmann"}	{"near": {"leftEye": "N14", "rightEye": "N18", "binocular": "N14"}, "aided": {"leftEye": "", "rightEye": "", "binocular": ""}, "unaided": {"leftEye": "", "rightEye": "", "binocular": ""}, "distance": {"leftEye": "6/18", "rightEye": "6/12", "binocular": "6/18"}}	\N	f	\N	\N
cmigzducf00347kusqqifn4fb	cmigz9gvy001q7kus838587bf	cmicwerk200007k4801kdnv9f	6/12	6/18			12	45	67	45	78	54	23	56	goldmann	red-green-deficiency	sluggish	normal	{"findings": "corneal-opacity"}	diabetic-retinopathy	\N		t	f	{"coverTest": "exotropia", "colorVision": "red-green-deficiency", "eyeAlignment": "normal", "pupilReaction": "sluggish", "anteriorSegment": "corneal-opacity", "extraocularMovements": "restricted"}	2025-11-27 05:16:23.391	2025-11-27 07:09:14.685	[]	\N	\N	{"preOpParams": {"k1": {"leftEye": "56", "rightEye": "12"}, "k2": {"leftEye": "56", "rightEye": "35"}, "acd": {"leftEye": "34", "rightEye": "65"}, "axl": {"leftEye": "56", "rightEye": "34"}, "flatAxis": {"leftEye": "87", "rightEye": "37"}, "iolImplanted": {"leftEye": "87", "rightEye": "43"}, "anyOtherDetails": {"leftEye": "JKJ", "rightEye": "HJHJH"}, "iolPowerPlanned": {"leftEye": "89", "rightEye": "56"}}, "slitLampFindings": {"lens": {"leftEye": "normal", "rightEye": "abnormal"}, "cornea": {"leftEye": "clear", "rightEye": "hazy"}, "eyelids": {"leftEye": "normal", "rightEye": "normal"}, "conjunctiva": {"leftEye": "normal", "rightEye": "congestion"}}}		2025-11-27 05:16:23.055	completed	[{"id": 1, "name": "Penicillin", "reaction": "Rash, difficulty breathing", "severity": "High"}, {"id": 2, "name": "Sulfa drugs", "reaction": "Skin irritation", "severity": "Medium"}]	{"pd": "65", "add": {"leftEye": "34", "rightEye": "45"}, "axis": {"leftEye": "54", "rightEye": "67"}, "sphere": {"leftEye": "45", "rightEye": "12"}, "cylinder": {"leftEye": "78", "rightEye": "45"}}	{"iop": {"leftEye": "56", "rightEye": "23"}, "time": "", "method": "goldmann"}	{"near": {"leftEye": "N14", "rightEye": "N18", "binocular": "N14"}, "aided": {"leftEye": "", "rightEye": "", "binocular": ""}, "unaided": {"leftEye": "", "rightEye": "", "binocular": ""}, "distance": {"leftEye": "6/18", "rightEye": "6/12", "binocular": "6/18"}}	\N	f	\N	\N
cmigzef7a003a7kusdu4gxksb	cmigz9zac00287kusdvsmah8q	cmicwerk200007k4801kdnv9f	6/12	6/18			12	45	67	45	78	54	23	56	goldmann	red-green-deficiency	sluggish	normal	{"findings": "corneal-opacity"}	diabetic-retinopathy	\N		t	f	{"coverTest": "exotropia", "colorVision": "red-green-deficiency", "eyeAlignment": "normal", "pupilReaction": "sluggish", "anteriorSegment": "corneal-opacity", "extraocularMovements": "restricted"}	2025-11-27 05:16:50.422	2025-11-27 05:21:53.179	[]	\N	\N	{"preOpParams": {"k1": {"leftEye": "56", "rightEye": "12"}, "k2": {"leftEye": "56", "rightEye": "35"}, "acd": {"leftEye": "34", "rightEye": "65"}, "axl": {"leftEye": "56", "rightEye": "34"}, "flatAxis": {"leftEye": "87", "rightEye": "37"}, "iolImplanted": {"leftEye": "87", "rightEye": "43"}, "anyOtherDetails": {"leftEye": "JKJ", "rightEye": "HJHJH"}, "iolPowerPlanned": {"leftEye": "89", "rightEye": "56"}}, "slitLampFindings": {"lens": {"leftEye": "normal", "rightEye": "abnormal"}, "cornea": {"leftEye": "clear", "rightEye": "hazy"}, "eyelids": {"leftEye": "normal", "rightEye": "normal"}, "conjunctiva": {"leftEye": "normal", "rightEye": "congestion"}}}		2025-11-27 05:16:50.088	completed	[{"id": 1, "name": "Penicillin", "reaction": "Rash, difficulty breathing", "severity": "High"}]	{"pd": "65", "add": {"leftEye": "34", "rightEye": "45"}, "axis": {"leftEye": "54", "rightEye": "67"}, "sphere": {"leftEye": "45", "rightEye": "12"}, "cylinder": {"leftEye": "78", "rightEye": "45"}}	{"iop": {"leftEye": "56", "rightEye": "23"}, "time": "", "method": "goldmann"}	{"near": {"leftEye": "N14", "rightEye": "N18", "binocular": "N14"}, "aided": {"leftEye": "", "rightEye": "", "binocular": ""}, "unaided": {"leftEye": "", "rightEye": "", "binocular": ""}, "distance": {"leftEye": "6/18", "rightEye": "6/12", "binocular": "6/18"}}	\N	f	\N	\N
cmiipisov000j7kvwcgcz4ov3	cmiipgszs00037kvwnfd2kgf1	cmicwerk200007k4801kdnv9f					\N	\N	\N	\N	\N	\N	\N	\N	goldmann	normal	normal	normal	{"findings": "normal"}		\N		t	f	{"coverTest": "orthophoric", "colorVision": "normal", "eyeAlignment": "normal", "pupilReaction": "normal", "anteriorSegment": "normal", "extraocularMovements": "full"}	2025-11-28 10:15:50.72	2025-11-28 10:15:50.72	[]	\N	\N	{"preOpParams": {"k1": {"leftEye": "", "rightEye": ""}, "k2": {"leftEye": "", "rightEye": ""}, "acd": {"leftEye": "", "rightEye": ""}, "axl": {"leftEye": "", "rightEye": ""}, "flatAxis": {"leftEye": "", "rightEye": ""}, "iolImplanted": {"leftEye": "", "rightEye": ""}, "anyOtherDetails": {"leftEye": "", "rightEye": ""}, "iolPowerPlanned": {"leftEye": "", "rightEye": ""}}, "slitLampFindings": {"lens": {"leftEye": "normal", "rightEye": "normal"}, "cornea": {"leftEye": "clear", "rightEye": "clear"}, "eyelids": {"leftEye": "normal", "rightEye": "normal"}, "conjunctiva": {"leftEye": "normal", "rightEye": "normal"}}}		2025-11-28 10:15:50.323	completed	[{"id": 1, "name": "Penicillin", "reaction": "Rash, difficulty breathing", "severity": "High"}, {"id": 2, "name": "Sulfa drugs", "reaction": "Skin irritation", "severity": "Medium"}, {"id": 3, "name": "Latex", "reaction": "Contact dermatitis", "severity": "Low"}]	{"pd": "", "add": {"leftEye": "", "rightEye": ""}, "axis": {"leftEye": "", "rightEye": ""}, "sphere": {"leftEye": "", "rightEye": ""}, "cylinder": {"leftEye": "", "rightEye": ""}}	{"iop": {"leftEye": "", "rightEye": ""}, "time": "", "method": "goldmann"}	{"near": {"leftEye": "", "rightEye": "", "binocular": ""}, "aided": {"leftEye": "", "rightEye": "", "binocular": ""}, "unaided": {"leftEye": "", "rightEye": "", "binocular": ""}, "distance": {"leftEye": "", "rightEye": "", "binocular": ""}}	\N	f	\N	\N
cmiipj0k0000l7kvw4mzouhlj	cmiiph0uu00097kvw79xkw6wv	cmicwerk200007k4801kdnv9f					\N	\N	\N	\N	\N	\N	\N	\N	goldmann	normal	normal	normal	{"findings": "normal"}		\N		t	f	{"coverTest": "orthophoric", "colorVision": "normal", "eyeAlignment": "normal", "pupilReaction": "normal", "anteriorSegment": "normal", "extraocularMovements": "full"}	2025-11-28 10:16:00.912	2025-11-28 10:16:00.912	[]	\N	\N	{"preOpParams": {"k1": {"leftEye": "", "rightEye": ""}, "k2": {"leftEye": "", "rightEye": ""}, "acd": {"leftEye": "", "rightEye": ""}, "axl": {"leftEye": "", "rightEye": ""}, "flatAxis": {"leftEye": "", "rightEye": ""}, "iolImplanted": {"leftEye": "", "rightEye": ""}, "anyOtherDetails": {"leftEye": "", "rightEye": ""}, "iolPowerPlanned": {"leftEye": "", "rightEye": ""}}, "slitLampFindings": {"lens": {"leftEye": "normal", "rightEye": "normal"}, "cornea": {"leftEye": "clear", "rightEye": "clear"}, "eyelids": {"leftEye": "normal", "rightEye": "normal"}, "conjunctiva": {"leftEye": "normal", "rightEye": "normal"}}}		2025-11-28 10:16:00.568	completed	[]	{"pd": "", "add": {"leftEye": "", "rightEye": ""}, "axis": {"leftEye": "", "rightEye": ""}, "sphere": {"leftEye": "", "rightEye": ""}, "cylinder": {"leftEye": "", "rightEye": ""}}	{"iop": {"leftEye": "", "rightEye": ""}, "time": "", "method": "goldmann"}	{"near": {"leftEye": "", "rightEye": "", "binocular": ""}, "aided": {"leftEye": "", "rightEye": "", "binocular": ""}, "unaided": {"leftEye": "", "rightEye": "", "binocular": ""}, "distance": {"leftEye": "", "rightEye": "", "binocular": ""}}	\N	f	\N	\N
cmiipj7yu000n7kvwk5x2ar9h	cmiiph7z1000f7kvw3c6319qg	cmicwerk200007k4801kdnv9f					\N	\N	\N	\N	\N	\N	\N	\N	goldmann	normal	normal	normal	{"findings": "normal"}		\N		t	f	{"coverTest": "orthophoric", "colorVision": "normal", "eyeAlignment": "normal", "pupilReaction": "normal", "anteriorSegment": "normal", "extraocularMovements": "full"}	2025-11-28 10:16:10.518	2025-11-28 10:16:10.518	[]	\N	\N	{"preOpParams": {"k1": {"leftEye": "", "rightEye": ""}, "k2": {"leftEye": "", "rightEye": ""}, "acd": {"leftEye": "", "rightEye": ""}, "axl": {"leftEye": "", "rightEye": ""}, "flatAxis": {"leftEye": "", "rightEye": ""}, "iolImplanted": {"leftEye": "", "rightEye": ""}, "anyOtherDetails": {"leftEye": "", "rightEye": ""}, "iolPowerPlanned": {"leftEye": "", "rightEye": ""}}, "slitLampFindings": {"lens": {"leftEye": "normal", "rightEye": "normal"}, "cornea": {"leftEye": "clear", "rightEye": "clear"}, "eyelids": {"leftEye": "normal", "rightEye": "normal"}, "conjunctiva": {"leftEye": "normal", "rightEye": "normal"}}}		2025-11-28 10:16:10.1	completed	[]	{"pd": "", "add": {"leftEye": "", "rightEye": ""}, "axis": {"leftEye": "", "rightEye": ""}, "sphere": {"leftEye": "", "rightEye": ""}, "cylinder": {"leftEye": "", "rightEye": ""}}	{"iop": {"leftEye": "", "rightEye": ""}, "time": "", "method": "goldmann"}	{"near": {"leftEye": "", "rightEye": "", "binocular": ""}, "aided": {"leftEye": "", "rightEye": "", "binocular": ""}, "unaided": {"leftEye": "", "rightEye": "", "binocular": ""}, "distance": {"leftEye": "", "rightEye": "", "binocular": ""}}	\N	f	\N	\N
cmiiqpx5100017kpc03qrdd4y	cmiipp0rs000r7kvwbi0je6gz	cmicwerk200007k4801kdnv9f					\N	\N	\N	\N	\N	\N	\N	\N	goldmann	normal	normal	normal	{"findings": "normal"}		\N		t	f	{"coverTest": "orthophoric", "colorVision": "normal", "eyeAlignment": "normal", "pupilReaction": "normal", "anteriorSegment": "normal", "extraocularMovements": "full"}	2025-11-28 10:49:22.693	2025-11-28 10:49:22.693	[]	\N	\N	{"preOpParams": {"k1": {"leftEye": "", "rightEye": ""}, "k2": {"leftEye": "", "rightEye": ""}, "acd": {"leftEye": "", "rightEye": ""}, "axl": {"leftEye": "", "rightEye": ""}, "flatAxis": {"leftEye": "", "rightEye": ""}, "iolImplanted": {"leftEye": "", "rightEye": ""}, "anyOtherDetails": {"leftEye": "", "rightEye": ""}, "iolPowerPlanned": {"leftEye": "", "rightEye": ""}}, "slitLampFindings": {"lens": {"leftEye": "normal", "rightEye": "normal"}, "cornea": {"leftEye": "clear", "rightEye": "clear"}, "eyelids": {"leftEye": "normal", "rightEye": "normal"}, "conjunctiva": {"leftEye": "normal", "rightEye": "normal"}}}		2025-11-28 10:49:22.276	completed	[{"id": 1, "name": "Penicillin", "reaction": "Rash, difficulty breathing", "severity": "High"}, {"id": 2, "name": "Sulfa drugs", "reaction": "Skin irritation", "severity": "Medium"}]	{"pd": "", "add": {"leftEye": "", "rightEye": ""}, "axis": {"leftEye": "", "rightEye": ""}, "sphere": {"leftEye": "", "rightEye": ""}, "cylinder": {"leftEye": "", "rightEye": ""}}	{"iop": {"leftEye": "", "rightEye": ""}, "time": "", "method": "goldmann"}	{"near": {"leftEye": "", "rightEye": "", "binocular": ""}, "aided": {"leftEye": "", "rightEye": "", "binocular": ""}, "unaided": {"leftEye": "", "rightEye": "", "binocular": ""}, "distance": {"leftEye": "", "rightEye": "", "binocular": ""}}	\N	f	\N	\N
cmiiwkv3000017kw4wkabrnws	cmiiq0r32000x7kvwvy17orch	cmicwerk200007k4801kdnv9f					\N	\N	\N	\N	\N	\N	\N	\N	goldmann	normal	normal	normal	{"findings": "normal"}		\N		t	f	{"coverTest": "orthophoric", "colorVision": "normal", "eyeAlignment": "normal", "pupilReaction": "normal", "anteriorSegment": "normal", "extraocularMovements": "full"}	2025-11-28 13:33:24.444	2025-11-28 14:51:45.776	[]	\N	\N	{"preOpParams": {"k1": {"leftEye": "", "rightEye": ""}, "k2": {"leftEye": "", "rightEye": ""}, "acd": {"leftEye": "", "rightEye": ""}, "axl": {"leftEye": "", "rightEye": ""}, "flatAxis": {"leftEye": "", "rightEye": ""}, "iolImplanted": {"leftEye": "", "rightEye": ""}, "anyOtherDetails": {"leftEye": "", "rightEye": ""}, "iolPowerPlanned": {"leftEye": "", "rightEye": ""}}, "slitLampFindings": {"lens": {"leftEye": "normal", "rightEye": "normal"}, "cornea": {"leftEye": "clear", "rightEye": "clear"}, "eyelids": {"leftEye": "normal", "rightEye": "normal"}, "conjunctiva": {"leftEye": "normal", "rightEye": "normal"}}}		2025-11-28 13:33:23.601	completed	[]	{"pd": "", "add": {"leftEye": "", "rightEye": ""}, "axis": {"leftEye": "", "rightEye": ""}, "sphere": {"leftEye": "", "rightEye": ""}, "cylinder": {"leftEye": "", "rightEye": ""}}	{"iop": {"leftEye": "", "rightEye": ""}, "time": "", "method": "goldmann"}	{"near": {"leftEye": "", "rightEye": "", "binocular": ""}, "aided": {"leftEye": "", "rightEye": "", "binocular": ""}, "unaided": {"leftEye": "", "rightEye": "", "binocular": ""}, "distance": {"leftEye": "", "rightEye": "", "binocular": ""}}		t	2025-11-28 14:51:45.776	cmicwerqd00027k4837ksgrik
cmiiy670c00017kd48etupacf	cmiiujue700037kwgs7sxz5ug	cmicwerk200007k4801kdnv9f					\N	\N	\N	\N	\N	\N	\N	\N	goldmann	normal	normal	normal	{"findings": "normal"}	normal	\N		t	f	{"coverTest": "orthophoric", "colorVision": "normal", "eyeAlignment": "normal", "pupilReaction": "normal", "anteriorSegment": "normal", "extraocularMovements": "full"}	2025-11-28 14:17:59.292	2025-12-01 08:36:02.941	[]	\N	\N	{"preOpParams": {"k1": {"leftEye": "", "rightEye": ""}, "k2": {"leftEye": "", "rightEye": ""}, "acd": {"leftEye": "", "rightEye": ""}, "axl": {"leftEye": "", "rightEye": ""}, "flatAxis": {"leftEye": "", "rightEye": ""}, "iolImplanted": {"leftEye": "", "rightEye": ""}, "anyOtherDetails": {"leftEye": "", "rightEye": ""}, "iolPowerPlanned": {"leftEye": "", "rightEye": ""}}, "slitLampFindings": {"lens": {"leftEye": "normal", "rightEye": "normal"}, "cornea": {"leftEye": "clear", "rightEye": "clear"}, "eyelids": {"leftEye": "normal", "rightEye": "normal"}, "conjunctiva": {"leftEye": "normal", "rightEye": "normal"}}}		2025-11-28 14:17:58.708	completed	[{"id": 1, "name": "Penicillin", "reaction": "Rash, difficulty breathing", "severity": "High"}, {"id": 2, "name": "Sulfa drugs", "reaction": "Skin irritation", "severity": "Medium"}, {"id": 3, "name": "Latex", "reaction": "Contact dermatitis", "severity": "Low"}]	{"pd": "", "add": {"leftEye": "", "rightEye": ""}, "axis": {"leftEye": "", "rightEye": ""}, "sphere": {"leftEye": "", "rightEye": ""}, "cylinder": {"leftEye": "", "rightEye": ""}}	{"iop": {"leftEye": "", "rightEye": ""}, "time": "", "method": "goldmann"}	{"near": {"leftEye": "", "rightEye": "", "binocular": ""}, "aided": {"leftEye": "", "rightEye": "", "binocular": ""}, "unaided": {"leftEye": "", "rightEye": "", "binocular": ""}, "distance": {"leftEye": "", "rightEye": "", "binocular": ""}}		t	2025-12-01 08:36:02.941	cmicwerqd00027k4837ksgrik
\.


--
-- Data for Name: ot_emergency_stock_register; Type: TABLE DATA; Schema: public; Owner: tanuj
--

COPY public.ot_emergency_stock_register (id, "srNo", "nameOfInjection", "expectedStock", "brandName", "batchNo", "marginDate", "expiryDate", sign, "createdAt", "updatedAt", "createdBy") FROM stdin;
\.


--
-- Data for Name: ot_temperature_register; Type: TABLE DATA; Schema: public; Owner: tanuj
--

COPY public.ot_temperature_register (id, date, "temperature9Am", "temperature12Pm", "temperature3Pm", "temperature6Pm", "humidity9Am", "humidity12Pm", "humidity3Pm", "humidity6Pm", "pressure9Am", "pressure12Pm", "pressure3Pm", "pressure6Pm", sign, "createdAt", "updatedAt", "createdBy") FROM stdin;
\.


--
-- Data for Name: otps; Type: TABLE DATA; Schema: public; Owner: tanuj
--

COPY public.otps (id, identifier, otp, purpose, "expiresAt", attempts, "maxAttempts", "isUsed", "ipAddress", "userAgent", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: patient_queue; Type: TABLE DATA; Schema: public; Owner: tanuj
--

COPY public.patient_queue (id, "patientVisitId", "queueFor", "queueNumber", priority, status, "assignedStaffId", "estimatedWaitTime", "joinedAt", "calledAt", "inProgressAt", "completedAt", notes, "transferReason", "createdAt", "updatedAt", "priorityLabel", "patientId", "doctorQueuePosition", "actualHoldDuration", "estimatedResumeTime", "holdReason", "onHoldAt", "receptionist2Notes", "receptionist2Reviewed", "receptionist2ReviewedAt", "receptionist2ReviewedBy", "resumedAt", "dilationRound", "lastDilationCheckAt", "markedReadyForResume", "customWaitMinutes") FROM stdin;
cmiiy7qv900077kd4plffvvw9	cmiiy7qu800057kd4t3t03uth	OPTOMETRIST	1	0	WAITING	\N	\N	2025-11-28 14:19:11.684	\N	\N	\N	\N	\N	2025-11-28 14:19:11.685	2025-11-28 14:19:11.685	ROUTINE	cmifosp9000077knsrc85belr	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	0	\N	f	\N
cmigz9t8600247kus0m1ure2t	cmigz9t7k00227kusdi09r5gh	OPHTHALMOLOGIST	2	0	COMPLETED	cmicwersg00037k48j2wmqv52	\N	2025-11-27 05:13:15.316	2025-11-27 10:48:19.656	2025-11-27 10:48:26.042	2025-11-27 10:52:55.861	\N	\N	2025-11-27 05:13:15.318	2025-11-27 10:52:55.863	ROUTINE	cmiforhuz00007knsf1bj4bff	6	\N	\N	\N	\N	\N	f	\N	\N	\N	0	\N	f	\N
cmigzaazw002m7kusieiai79s	cmigzaaz9002k7kusoa42jguh	OPTOMETRIST	1	0	CALLED	cmicwerk200007k4801kdnv9f	\N	2025-11-27 05:13:38.347	2025-11-28 10:16:03.591	\N	\N	\N	\N	2025-11-27 05:13:38.349	2025-11-28 10:16:03.591	ROUTINE	cmid4i0bj00087kuoin675c9t	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	0	\N	f	\N
cmiiujufa00057kwglcvflqom	cmiiujue700037kwgs7sxz5ug	OPHTHALMOLOGIST	4	0	ON_HOLD	cmicwersg00037k48j2wmqv52	\N	2025-11-28 12:36:37.7	2025-12-01 09:19:31.705	2025-12-01 09:19:33.833	2025-11-28 14:17:59.454	Queue reordered - Shifted from 3 to 4	\N	2025-11-28 12:36:37.702	2025-12-01 12:53:42.724	ROUTINE	cmid1gref0007lh2o4lyiui4h	\N	28	\N	Photography of Eye	2025-12-01 12:53:42.724		t	2025-12-01 08:36:03.025	cmicwerqd00027k4837ksgrik	2025-12-01 11:37:46.74	0	\N	f	1
cmigzah5g002s7kusfb74tjy5	cmigzah4u002q7kusaokhtoyl	OPTOMETRIST	1	0	CALLED	cmicwerk200007k4801kdnv9f	\N	2025-11-27 05:13:46.323	2025-11-28 10:45:40.385	\N	\N	\N	\N	2025-11-27 05:13:46.324	2025-11-28 10:45:40.385	ROUTINE	cmid1gref0007lh2o4lyiui4h	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	0	\N	f	\N
cmigzaokj002y7kusjncnrlzx	cmigzaoju002w7kuseexkf3bz	OPTOMETRIST	1	0	CALLED	cmicwerk200007k4801kdnv9f	\N	2025-11-27 05:13:55.935	2025-11-28 10:45:45.808	\N	\N	\N	\N	2025-11-27 05:13:55.939	2025-11-28 10:45:45.808	ROUTINE	cmid1g2fc0000lh2oexmdgcjs	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	0	\N	f	\N
cmigz9aya001m7kusmisx5ty7	cmigz9axq001k7kusrjo4f10g	OPHTHALMOLOGIST	2	0	COMPLETED	cmicwersg00037k48j2wmqv52	\N	2025-11-27 05:12:51.633	2025-11-27 06:30:49.765	2025-11-27 06:30:56.515	2025-11-27 06:32:45.198	\N	\N	2025-11-27 05:12:51.634	2025-11-27 06:32:45.201	ROUTINE	cmifovdsp000l7kns1ayir9mv	2	\N	\N	\N	\N		t	2025-11-27 05:20:32.883	cmicwerqd00027k4837ksgrik	\N	0	\N	f	\N
cmigz9zaw002a7kusw0snyhp1	cmigz9zac00287kusdvsmah8q	OPHTHALMOLOGIST	5	0	ON_HOLD	cmicwersg00037k48j2wmqv52	1	2025-11-27 05:13:23.191	2025-11-27 09:03:48.559	2025-11-27 09:03:52.178	2025-11-27 05:16:50.546	Queue reordered - Active patient repositioned from 3 to 5	\N	2025-11-27 05:13:23.193	2025-12-01 11:14:53.962	ROUTINE	cmid4ke80000t7kuo25jo31bt	5	19	2025-12-01 11:15:53.961	Visual Field Test	2025-12-01 11:09:11.853	\N	f	\N	\N	2025-12-01 11:08:50.728	3	2025-12-01 11:14:53.961	f	1
cmigz9gwj001s7kusdnnbzuz5	cmigz9gvy001q7kus838587bf	OPHTHALMOLOGIST	2	0	COMPLETED	cmicwersg00037k48j2wmqv52	\N	2025-11-27 05:12:59.346	2025-11-27 08:27:33.972	2025-11-27 08:27:38.941	2025-11-27 08:28:22.068	\N	\N	2025-11-27 05:12:59.347	2025-11-27 08:28:22.07	ROUTINE	cmifoudy5000e7knsp79gvllm	3	\N	\N	\N	\N	\N	f	\N	\N	\N	0	\N	f	\N
cmiipgt1100057kvw5hg6vt8f	cmiipgszs00037kvwnfd2kgf1	OPHTHALMOLOGIST	1	0	ON_HOLD	cmicwersg00037k48j2wmqv52	\N	2025-11-28 10:14:17.844	2025-11-28 10:50:11.957	2025-11-28 10:50:13.801	2025-11-28 10:15:50.833	\N	\N	2025-11-28 10:14:17.846	2025-11-28 10:50:19.799	ROUTINE	cmifoudy5000e7knsp79gvllm	\N	\N	\N	Blood Pressure Check	2025-11-28 10:50:19.799	\N	f	\N	\N	\N	0	\N	f	\N
cmigz93ps001g7kusw31u57ml	cmigz93on001e7kus9m18uwt0	OPHTHALMOLOGIST	3	0	ON_HOLD	cmicwersg00037k48j2wmqv52	1	2025-11-27 05:12:42.254	2025-11-27 06:30:30.314	2025-11-27 06:30:39.219	2025-11-27 05:16:02.191	Queue reordered - Active patient repositioned from 1 to 4	\N	2025-11-27 05:12:42.256	2025-12-01 11:38:04.278	ROUTINE	cmigyrzyp00067kusikwq7ypy	1	48	2025-12-01 11:39:04.278	Diabetic Retinopathy Screening	2025-12-01 11:37:34.848		t	2025-11-27 05:21:43.178	cmicwerqd00027k4837ksgrik	2025-12-01 11:37:27.81	1	2025-12-01 11:38:04.278	f	1
cmiiph0vg000b7kvwefo4atwd	cmiiph0uu00097kvw79xkw6wv	OPHTHALMOLOGIST	2	0	COMPLETED	cmicwersg00037k48j2wmqv52	\N	2025-11-28 10:14:28.011	2025-11-28 10:50:23.819	2025-11-28 10:50:25.428	2025-11-28 10:50:27.459	\N	\N	2025-11-28 10:14:28.012	2025-11-28 10:50:27.461	ROUTINE	cmiforhuz00007knsf1bj4bff	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	0	\N	f	\N
cmiiq0r4q000z7kvw98bwr9lb	cmiiq0r32000x7kvwvy17orch	OPHTHALMOLOGIST	2	0	COMPLETED	cmicwersg00037k48j2wmqv52	1	2025-11-28 10:29:48.504	2025-12-01 08:32:22.346	2025-12-01 08:32:24.809	2025-12-01 11:50:08.083	\N	\N	2025-11-28 10:29:48.506	2025-12-01 11:50:08.085	ROUTINE	cmid4jpr6000m7kuonfbhpf5p	\N	28	2025-12-01 11:15:55.594	Diabetic Retinopathy Screening	2025-12-01 11:09:18.741		t	2025-11-28 14:51:45.831	cmicwerqd00027k4837ksgrik	2025-12-01 11:37:48.026	2	2025-12-01 11:14:55.594	f	1
cmigz9ncv001y7kusw0t7zqw2	cmigz9nca001w7kusxwkoanoz	OPHTHALMOLOGIST	2	0	COMPLETED	cmicwersg00037k48j2wmqv52	\N	2025-11-27 05:13:07.71	2025-11-27 08:28:25.1	2025-11-27 08:28:31.331	2025-11-27 08:29:17.914	\N	\N	2025-11-27 05:13:07.711	2025-11-27 08:29:17.916	ROUTINE	cmifosp9000077knsrc85belr	4	\N	\N	\N	\N		t	2025-11-27 05:21:47.401	cmicwerqd00027k4837ksgrik	\N	0	\N	f	\N
cmigza5fg002g7kust27lku2y	cmigza5es002e7kusi1iip1m3	OPTOMETRIST	1	0	WAITING	\N	\N	2025-11-27 05:13:31.131	\N	\N	\N	\N	\N	2025-11-27 05:13:31.132	2025-11-27 05:16:50.567	ROUTINE	cmid4j13f000f7kuojk83el5r	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	0	\N	f	\N
cmiiph80i000h7kvwsq7gbt1r	cmiiph7z1000f7kvw3c6319qg	OPHTHALMOLOGIST	2	0	COMPLETED	cmicwersg00037k48j2wmqv52	\N	2025-11-28 10:14:37.265	2025-11-28 14:18:28.187	2025-11-28 14:18:29.856	2025-11-28 14:18:32.208	\N	\N	2025-11-28 10:14:37.267	2025-11-28 14:18:32.21	ROUTINE	cmid1g2fc0000lh2oexmdgcjs	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	0	\N	f	\N
cmiipp0t5000t7kvwfeg7hlu5	cmiipp0rs000r7kvwbi0je6gz	OPHTHALMOLOGIST	2	0	COMPLETED	cmicwersg00037k48j2wmqv52	\N	2025-11-28 10:20:41.176	2025-11-28 14:18:34.377	2025-11-28 14:18:36.166	2025-11-28 14:18:38.478	\N	\N	2025-11-28 10:20:41.177	2025-11-28 14:18:38.48	ROUTINE	cmid4ke80000t7kuo25jo31bt	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	0	\N	f	\N
\.


--
-- Data for Name: patient_visits; Type: TABLE DATA; Schema: public; Owner: tanuj
--

COPY public.patient_visits (id, "patientId", "doctorId", "visitDate", "chiefComplaint", "presentingSymptoms", "visionComplaints", "eyeSymptoms", "onsetDuration", "priorityLevel", "admissionDate", "dischargeDate", "estimatedCost", "insuranceCoverage", "visitOutcome", "followUpInstructions", "nextAppointmentDate", "createdAt", "updatedAt", "appointmentId", "billingInitiatedAt", "checkedInAt", "completedAt", "doctorCalledAt", "doctorSeenAt", "followUpDate", "followUpRequired", "optometristCalledAt", "optometristSeenAt", "totalActualCost", "totalEstimatedCost", status, "visitNumber", "receptionist2Notes", "visitType") FROM stdin;
cmigza5es002e7kusi1iip1m3	cmid4j13f000f7kuojk83el5r	\N	2025-11-27 05:13:31.107	\N	\N	\N	\N	\N	routine	\N	\N	\N	\N	\N	\N	\N	2025-11-27 05:13:31.108	2025-11-27 05:13:31.108	cmigza4dx002c7kus4nmvs4s0	\N	2025-11-27 05:13:31.107	\N	\N	\N	\N	f	\N	\N	0	0	CHECKED_IN	1	\N	OPD
cmigzaaz9002k7kusoa42jguh	cmid4i0bj00087kuoin675c9t	\N	2025-11-27 05:13:38.324	\N	\N	\N	\N	\N	routine	\N	\N	\N	\N	\N	\N	\N	2025-11-27 05:13:38.325	2025-11-27 05:13:38.325	cmigza9w5002i7kusog859le7	\N	2025-11-27 05:13:38.324	\N	\N	\N	\N	f	\N	\N	0	0	CHECKED_IN	1	\N	OPD
cmigzah4u002q7kusaokhtoyl	cmid1gref0007lh2o4lyiui4h	\N	2025-11-27 05:13:46.301	\N	\N	\N	\N	\N	routine	\N	\N	\N	\N	\N	\N	\N	2025-11-27 05:13:46.302	2025-11-27 05:13:46.302	cmigzag2m002o7kusbtodz1f3	\N	2025-11-27 05:13:46.301	\N	\N	\N	\N	f	\N	\N	0	0	CHECKED_IN	1	\N	OPD
cmigzaoju002w7kuseexkf3bz	cmid1g2fc0000lh2oexmdgcjs	\N	2025-11-27 05:13:55.913	\N	\N	\N	\N	\N	routine	\N	\N	\N	\N	\N	\N	\N	2025-11-27 05:13:55.914	2025-11-27 05:13:55.914	cmigzanko002u7kusg6rl8jn9	\N	2025-11-27 05:13:55.913	\N	\N	\N	\N	f	\N	\N	0	0	CHECKED_IN	1	\N	OPD
cmiiph7z1000f7kvw3c6319qg	cmid1g2fc0000lh2oexmdgcjs	\N	2025-11-28 10:14:37.212	\N	\N	\N	\N	\N	routine	\N	\N	\N	\N	\N	\N	\N	2025-11-28 10:14:37.213	2025-11-28 14:18:32.256	cmiiph6mg000d7kvw1105mqlh	\N	2025-11-28 10:14:37.212	2025-11-28 14:18:32.254	\N	2025-11-28 14:18:32.254	\N	f	\N	2025-11-28 10:16:10.681	0	0	COMPLETED	2	\N	OPD
cmiipp0rs000r7kvwbi0je6gz	cmid4ke80000t7kuo25jo31bt	\N	2025-11-28 10:20:41.127	\N	\N	\N	\N	\N	routine	\N	\N	\N	\N	\N	\N	\N	2025-11-28 10:20:41.128	2025-11-28 14:18:38.513	cmiipozad000p7kvwbxcnui1z	\N	2025-11-28 10:20:41.127	2025-11-28 14:18:38.512	\N	2025-11-28 14:18:38.512	\N	f	\N	2025-11-28 10:49:22.833	0	0	COMPLETED	2	\N	OPD
cmigz93on001e7kus9m18uwt0	cmigyrzyp00067kusikwq7ypy	\N	2025-11-27 05:12:42.214	\N	\N	\N	\N	\N	routine	\N	\N	\N	\N	\N	\N	\N	2025-11-27 05:12:42.215	2025-11-27 05:16:02.319	cmigz92i9001c7kusn64wno3b	\N	2025-11-27 05:12:42.214	\N	\N	\N	\N	f	\N	2025-11-27 05:16:02.317	0	0	AWAITING_DOCTOR	1	\N	OPD
cmiipgszs00037kvwnfd2kgf1	cmifoudy5000e7knsp79gvllm	\N	2025-11-28 10:14:17.799	\N	\N	\N	\N	\N	routine	\N	\N	\N	\N	\N	\N	\N	2025-11-28 10:14:17.8	2025-11-28 10:15:50.933	cmiipgron00017kvwb3z5ul9n	\N	2025-11-28 10:14:17.799	\N	\N	\N	\N	f	\N	2025-11-28 10:15:50.931	0	0	AWAITING_DOCTOR	2	\N	OPD
cmiiy7qu800057kd4t3t03uth	cmifosp9000077knsrc85belr	\N	2025-11-28 14:19:11.647	\N	\N	\N	\N	\N	routine	\N	\N	\N	\N	\N	\N	\N	2025-11-28 14:19:11.648	2025-11-28 14:19:11.648	cmiiy7plp00037kd4999wpn1n	\N	2025-11-28 14:19:11.647	\N	\N	\N	\N	f	\N	\N	0	0	CHECKED_IN	2	\N	OPD
cmiiq0r32000x7kvwvy17orch	cmid4jpr6000m7kuonfbhpf5p	\N	2025-11-28 10:29:48.444	\N	\N	\N	\N	\N	routine	\N	\N	\N	\N	\N	\N	\N	2025-11-28 10:29:48.446	2025-12-01 11:50:08.129	cmiiq0pq8000v7kvws3xult5d	\N	2025-11-28 10:29:48.444	2025-12-01 11:50:08.126	\N	2025-12-01 11:50:08.126	\N	f	\N	2025-11-28 13:33:24.733	0	0	COMPLETED	1	\N	OPD
cmiiph0uu00097kvw79xkw6wv	cmiforhuz00007knsf1bj4bff	\N	2025-11-28 10:14:27.989	\N	\N	\N	\N	\N	routine	\N	\N	\N	\N	\N	\N	\N	2025-11-28 10:14:27.991	2025-11-28 10:50:27.505	cmiipgzpr00077kvw5srvzvf6	\N	2025-11-28 10:14:27.989	2025-11-28 10:50:27.503	\N	2025-11-28 10:50:27.503	\N	f	\N	2025-11-28 10:16:01.031	0	0	COMPLETED	2	\N	OPD
cmigz9zac00287kusdvsmah8q	cmid4ke80000t7kuo25jo31bt	\N	2025-11-27 05:13:23.17	\N	\N	\N	\N	\N	routine	\N	\N	\N	\N	\N	\N	\N	2025-11-27 05:13:23.172	2025-11-27 05:16:50.606	cmigz9y5o00267kusc2mbyfmd	\N	2025-11-27 05:13:23.17	\N	\N	\N	\N	f	\N	2025-11-27 05:16:50.604	0	0	AWAITING_DOCTOR	1	\N	OPD
cmigz9axq001k7kusrjo4f10g	cmifovdsp000l7kns1ayir9mv	\N	2025-11-27 05:12:51.613	\N	\N	\N	\N	\N	routine	\N	\N	\N	\N	\N	\N	\N	2025-11-27 05:12:51.614	2025-11-27 06:32:45.284	cmigz98m0001i7kusyp8ko495	\N	2025-11-27 05:12:51.613	2025-11-27 06:32:45.281	\N	2025-11-27 06:32:45.281	\N	f	\N	2025-11-27 05:16:14.153	0	0	COMPLETED	1	\N	OPD
cmigz9gvy001q7kus838587bf	cmifoudy5000e7knsp79gvllm	\N	2025-11-27 05:12:59.325	\N	\N	\N	\N	\N	routine	\N	\N	\N	\N	\N	\N	\N	2025-11-27 05:12:59.326	2025-11-27 08:28:22.111	cmigz9fiu001o7kusmucnh6cg	\N	2025-11-27 05:12:59.325	2025-11-27 08:28:22.109	\N	2025-11-27 08:28:22.109	\N	f	\N	2025-11-27 05:16:23.555	0	0	COMPLETED	1	\N	OPD
cmigz9nca001w7kusxwkoanoz	cmifosp9000077knsrc85belr	\N	2025-11-27 05:13:07.688	\N	\N	\N	\N	\N	routine	\N	\N	\N	\N	\N	\N	\N	2025-11-27 05:13:07.69	2025-11-27 08:29:17.956	cmigz9m8z001u7kus9vkgnbkx	\N	2025-11-27 05:13:07.688	2025-11-27 08:29:17.953	\N	2025-11-27 08:29:17.953	\N	f	\N	2025-11-27 05:16:33.261	0	0	COMPLETED	1	\N	OPD
cmigz9t7k00227kusdi09r5gh	cmiforhuz00007knsf1bj4bff	\N	2025-11-27 05:13:15.294	\N	\N	\N	\N	\N	routine	\N	\N	\N	\N	\N	\N	\N	2025-11-27 05:13:15.296	2025-11-27 10:52:55.897	cmigz9s1h00207kus5eee2p37	\N	2025-11-27 05:13:15.294	2025-11-27 10:52:55.896	\N	2025-11-27 10:52:55.896	\N	f	\N	2025-11-27 05:16:42.294	0	0	COMPLETED	1	\N	OPD
cmiiujue700037kwgs7sxz5ug	cmid1gref0007lh2o4lyiui4h	\N	2025-11-28 12:36:37.661	\N	\N	\N	\N	\N	routine	\N	\N	\N	\N	\N	\N	\N	2025-11-28 12:36:37.663	2025-11-28 14:17:59.529	cmiiujt7800017kwgrhg9vtyh	\N	2025-11-28 12:36:37.661	\N	\N	\N	\N	f	\N	2025-11-28 14:17:59.528	0	0	AWAITING_DOCTOR	2	\N	OPD
\.


--
-- Data for Name: patients; Type: TABLE DATA; Schema: public; Owner: tanuj
--

COPY public.patients (id, mrn, "firstName", "lastName", "dateOfBirth", gender, phone, email, address, "emergencyContacts", "bloodGroup", allergies, "chronicConditions", "familyHistory", "eyeHistory", "visionHistory", "currentMedications", "riskFactors", "insuranceDetails", "patientStatus", "createdAt", "updatedAt", "lastLogin", "passwordHash", "defaultInsuranceId", "patientNumber", "isReferred", "referredBy", "previousSurgeries", "profilePhoto", lifestyle) FROM stdin;
cmid1g2fc0000lh2oexmdgcjs	MRN63654280	Arun	Gaikward	2000-12-12 00:00:00	male	8989893457	ankushdiwakar8080@gmail.com	"Vasant Vihar"	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	active	2025-11-24 11:03:01.682	2025-11-24 11:03:01.682	\N	$2b$12$Z9rYJWuHHL8R8LN2OyuMbejXTTS8Govf.4DvjFNHFG/mDG9CiAt6a	\N	667129	f	\N	\N	\N	\N
cmid1gref0007lh2o4lyiui4h	MRN35259565	Shubham	Dige	2000-12-12 00:00:00	male	9998887654	shubham@gmail.com	"asfasfasfdsdf"	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	active	2025-11-24 11:03:34.071	2025-11-24 11:03:34.071	\N	$2b$12$N4WX/qsnTb/u60FqZmXVtOS3y9i5aQawYwlisI7uVqFIX2JyNiRp6	\N	996370	f	\N	\N	\N	\N
cmid4i0bj00087kuoin675c9t	MRN82010777	Rama	Rane	2025-11-13 00:00:00	female	9090908765	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	active	2025-11-24 12:28:31.136	2025-11-24 12:28:31.136	\N	$2b$12$ioW8wdZrVr.HGE/D8Ouac.cgtcQfMQqZejDlVd38ys4znyHrD7fHu	\N	516682	f	\N	\N	\N	\N
cmid4j13f000f7kuojk83el5r	MRN18924321	Tejas	pawar	2025-11-13 00:00:00	male	1234567898	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	active	2025-11-24 12:29:18.795	2025-11-24 12:29:18.795	\N	$2b$12$gAbRCHeVOq4yn1drSb/.he6SG7Qk.GFQz9WE9osn9ENazP/KOrpl6	\N	853115	f	\N	\N	\N	\N
cmid4jpr6000m7kuonfbhpf5p	MRN17429733	Riya	Ramane	2025-11-03 00:00:00	female	1112432345	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	active	2025-11-24 12:29:50.754	2025-11-24 12:29:50.754	\N	$2b$12$4PS1RaIaH53WPZWCyjQ8BOpxnqK0M8WbGogZY2Io16Lg5AIZ06Y0e	\N	799608	f	\N	\N	\N	\N
cmid4ke80000t7kuo25jo31bt	MRN65198712	Soham	Shinde	2025-11-01 00:00:00	male	8765434567	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	active	2025-11-24 12:30:22.465	2025-11-24 12:30:22.465	\N	$2b$12$PnAnR72kUFEPqUFgLMCAo.2uO1g9CK1e27vPF61tBPbHn2SRm.9li	\N	498193	f	\N	\N	\N	\N
cmiforhuz00007knsf1bj4bff	MRN71172099	ditya	ms	2025-11-14 00:00:00	female	6543212345	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	active	2025-11-26 07:31:18.443	2025-11-26 07:31:18.443	\N	$2b$12$LdjqgJh0O8/CFrpBrmooA.QhDHBqkLVGS4GoXjXRkajMVdU4gi4Wy	\N	671340	f	\N	\N	\N	\N
cmifosp9000077knsrc85belr	MRN86231279	nilesh	Ln	1995-01-11 00:00:00	male	9876543456	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	active	2025-11-26 07:32:14.676	2025-11-26 07:32:14.676	\N	$2b$12$TRwHTaKJGgHryPGx7rXim.r6LBLV7v78avjqogU7ykbgbvkZ48XsK	\N	860783	f	\N	\N	\N	\N
cmifoudy5000e7knsp79gvllm	MRN52169546	Pooja	cc	1988-02-24 00:00:00	female	6789098765	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	active	2025-11-26 07:33:33.341	2025-11-26 07:33:33.341	\N	$2b$12$1eCgklCPrys7JsDiC/NxcOOJZfyNzdGwmgl0RpZOl86wMvuHv9ymS	\N	367962	f	\N	\N	\N	\N
cmifovdsp000l7kns1ayir9mv	MRN54214257	balu	Mn	2013-05-23 00:00:00	male	4565432345	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	active	2025-11-26 07:34:19.801	2025-11-26 07:34:19.801	\N	$2b$12$kmNFkTIS4qaCCJol7.PjE.VFcYH7rQ3e4BFn/oFMmLtPzVIJstH/q	\N	830313	f	\N	\N	\N	\N
cmigyrzyp00067kusikwq7ypy	MRN28836086	testing	register&book	2025-11-05 00:00:00	male	9876548456	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	active	2025-11-27 04:59:24.241	2025-11-27 04:59:24.241	\N	$2b$12$R.wqQvkC0qOF/IUkA5m3CeCK9hIChlcFddbPA7uKy9CLsUzL0DYRS	\N	235843	f	\N	\N	\N	\N
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: tanuj
--

COPY public.payments (id, "billId", "patientId", "paymentDate", "paymentMethod", amount, "transactionId", "referenceNumber", "bankName", "cardLast4", status, notes, "processedBy", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: pre_op_assessments; Type: TABLE DATA; Schema: public; Owner: tanuj
--

COPY public.pre_op_assessments (id, "ipdAdmissionId", "assessedBy", "assessmentDate", "visualAcuity", refraction, iop, "slitLampFindings", "fundusFindings", "surgicalPlan", "iolPower", "anesthesiaType", "specialConsiderations", "riskAssessment", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: prescription_items; Type: TABLE DATA; Schema: public; Owner: tanuj
--

COPY public.prescription_items (id, "prescriptionId", "medicineName", dosage, frequency, duration, instructions, quantity, "createdAt", "updatedAt", "medicineId") FROM stdin;
cmih23goo00077kbk7ystyy3v	cmih23gon00057kbkfg8johj8	Chloramphenicol 1% Eye Ointment	10	At Bedtime (HS)	12 days	no inst	10	2025-11-27 06:32:17.976	2025-11-27 06:32:17.976	cmid1tt5w002zlhe80lyj4rpj
cmih68lea000ilhv8irlppnx3	cmih68le9000glhv8jq25qpxr	Carboxymethylcellulose 0.5% Eye Drops	11	Four Times Daily (QID)	31	212	1	2025-11-27 08:28:15.825	2025-11-27 08:28:15.825	cmid1tt4x002rlhe8rgt46ayw
cmih69oqi000qlhv84m9xnst1	cmih69oqi000olhv88wngdgro	Brimonidine 0.2% Eye Drops	1	Every 4 Hours	1	11	11	2025-11-27 08:29:06.81	2025-11-27 08:29:06.81	cmid1tt1l0021lhe8pzl1rv2p
cmih7jv96000ylhv8afyo4av8	cmih7jv95000wlhv810hymp49	Brimonidine 0.2% Eye Drops	1	Every 4 Hours	11	11	11	2025-11-27 09:05:01.433	2025-11-27 09:05:01.433	cmid1tt1l0021lhe8pzl1rv2p
cmihbcv800016lhv8apwe47d6	cmihbcv800014lhv8a02z22ke	Gatifloxacin 0.3% Eye Drops	1	Every 6 Hours	2	fdsdfsfsdf	32	2025-11-27 10:51:33.264	2025-11-27 10:51:33.264	cmid1tt3p002hlhe8y5u8fe99
cmihbcv800017lhv8vf17m9de	cmihbcv800014lhv8a02z22ke	Dexamethasone 0.1% Eye Drops	1	Four Times Daily (QID)	11	11	11	2025-11-27 10:51:33.264	2025-11-27 10:51:33.264	cmid1tt39002dlhe8wf0lyxie
cmin3ecz000097kfww7brcxi6	cmin39f8400057kfw2do9vz7t	Prednisolone 1% Eye Drops	10	Four Times Daily (QID)	4 daYS	NO INST.U R SMART	11	2025-12-01 11:55:23.053	2025-12-01 11:55:23.053	cmid1tt2z002blhe8tp51j767
cmin3ecz0000a7kfwubebjrz1	cmin39f8400057kfw2do9vz7t	Dexamethasone 0.1% Eye Drops	13	Four Times Daily (QID)	78	\N	22	2025-12-01 11:55:23.053	2025-12-01 11:55:23.053	cmid1tt39002dlhe8wf0lyxie
\.


--
-- Data for Name: prescriptions; Type: TABLE DATA; Schema: public; Owner: tanuj
--

COPY public.prescriptions (id, "prescriptionNumber", "patientVisitId", "examinationId", "doctorId", "prescriptionDate", "validTill", "generalInstructions", "followUpInstructions", status, "createdAt", "updatedAt") FROM stdin;
cmih23gon00057kbkfg8johj8	RX-20251127-0001	cmigz9axq001k7kusrjo4f10g	\N	cmicwersg00037k48j2wmqv52	2025-11-27 06:32:17.976	\N	\N	\N	active	2025-11-27 06:32:17.976	2025-11-27 06:32:17.976
cmih68le9000glhv8jq25qpxr	RX-20251127-0002	cmigz9gvy001q7kus838587bf	\N	cmicwersg00037k48j2wmqv52	2025-11-27 08:28:15.825	\N	eafsd	fasdfsaf	active	2025-11-27 08:28:15.825	2025-11-27 08:28:15.825
cmih69oqi000olhv88wngdgro	RX-20251127-0003	cmigz9nca001w7kusxwkoanoz	\N	cmicwersg00037k48j2wmqv52	2025-11-27 08:29:06.81	\N	\N	\N	active	2025-11-27 08:29:06.81	2025-11-27 08:29:06.81
cmih7jv95000wlhv810hymp49	RX-20251127-0004	cmigz9zac00287kusdvsmah8q	\N	cmicwersg00037k48j2wmqv52	2025-11-27 09:05:01.433	\N	agsdffd	fagasfgsdg	active	2025-11-27 09:05:01.433	2025-11-27 09:05:01.433
cmihbcv800014lhv8a02z22ke	RX-20251127-0005	cmigz9t7k00227kusdi09r5gh	\N	cmicwersg00037k48j2wmqv52	2025-11-27 10:51:33.264	\N	fasdfasdfasdfwegffvbxcbxcv	afjhajfijkjklm,afd	active	2025-11-27 10:51:33.264	2025-11-27 10:51:33.264
cmin39f8400057kfw2do9vz7t	RX-20251201-0001	cmiiujue700037kwgs7sxz5ug	\N	cmicwersg00037k48j2wmqv52	2025-12-01 11:51:32.693	\N	\N	\N	active	2025-12-01 11:51:32.693	2025-12-01 11:55:23.053
\.


--
-- Data for Name: refrigerator_temperature_register; Type: TABLE DATA; Schema: public; Owner: tanuj
--

COPY public.refrigerator_temperature_register (id, date, "temperature12Pm", "temperature3Pm", "temperature6Pm", sign, "createdAt", "updatedAt", "createdBy") FROM stdin;
\.


--
-- Data for Name: room_types; Type: TABLE DATA; Schema: public; Owner: tanuj
--

COPY public.room_types (id, "typeName", "typeCode", category, "defaultCapacity", "equipmentRequirements", "costPerHour") FROM stdin;
\.


--
-- Data for Name: rooms; Type: TABLE DATA; Schema: public; Owner: tanuj
--

COPY public.rooms (id, "floorId", "roomTypeId", "roomNumber", "roomName", capacity, "equipmentInstalled", status, "dailyRate", "hourlyRate", "lastCleaned", "createdAt", "updatedAt", "assignedStaffId") FROM stdin;
\.


--
-- Data for Name: staff; Type: TABLE DATA; Schema: public; Owner: tanuj
--

COPY public.staff (id, "employeeId", "firstName", "lastName", email, phone, "dateOfBirth", gender, address, department, "staffType", "employmentStatus", "joiningDate", qualifications, certifications, "languagesSpoken", "passwordHash", "isActive", "lastLogin", "createdAt", "updatedAt", "adminProfile", "doctorProfile", "emergencyContact", "nurseProfile", "optometristProfile", "receptionistProfile", "technicianProfile", "accountantProfile", documents, "patientSafetyOfficerProfile", "profilePhoto", "qualityCoordinatorProfile", "tpaProfile", "receptionist2Profile", "anesthesiologistProfile", "otAdminProfile", "sisterProfile", "surgeonProfile") FROM stdin;
cmicwes2800077k4890xub85z	SIS001	Sister	User	metacodehorizons@gmail.com	+91-9876543217	\N	\N	\N	OT Nursing	sister	active	2024-01-01 00:00:00	\N	\N	\N	$2b$10$Ql4sgmQKJ.vznE./1ibkauaI0aJ9RPAo4T6cOn29fqS96k6iF7xAu	t	\N	2025-11-24 08:42:03.536	2025-11-24 08:42:03.536	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"teamSize": 8, "totalAssists": 5000, "certifications": ["BSc Nursing", "OT Specialist Certificate"], "specialization": "OT Management", "yearsExperience": 18}	\N
cmicwersg00037k48j2wmqv52	DOC001	Mithilesh	Chaudhary	chavantanuj50@gmail.com	+91-9876543213	\N	\N	\N	Ophthalmology	doctor	active	2024-01-01 00:00:00	\N	\N	\N	$2b$10$SYE.bHonAN2JDbJN4swneuy5YVRXYsAWmhzmNV2jl6nSE5McffYuG	t	2025-12-01 12:53:36.013	2025-11-24 08:42:03.185	2025-12-01 12:53:36.013	\N	{"availableSlots": ["09:00-12:00", "14:00-17:00"], "certifications": ["MS Ophthalmology"], "specialization": "General Ophthalmology", "consultationFee": 1500, "yearsExperience": 12}	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
cmid297j8000rlh2ogvzts7jc	TPA0001	Ankush	Diwakar	Jon32@gmail.com	+918938382943	2973-02-11 00:00:00	male	"Thane"	accounts	tpa	active	2000-12-12 00:00:00	["B.Sc Nursing"]	["Board Certified Ophthalmologist"]	{English}	$2b$04$CRF9g98/v93qJQ5IvNh8duElSbnWN3G6tgqiaVCcH4C6jx1Qadfxi	t	2025-12-02 07:45:16.689	2025-11-24 11:25:41.348	2025-12-02 07:45:16.689	null	null	{"name": "Shubham Dige", "phone": "+9165655443254", "relationship": "Brother"}	null	null	null	null	null	{uploads/TPA0001/documents/documents_1763983541214-224732998_OHMS_Appointment_8819_2025-10-30_125431.pdf}	null	\N	null	{"licenseExpiry": "3000-02-23", "certifications": ["jghghhgjjh"], "claimSpecialty": "customer-service", "additionalNotes": "hjg", "shiftPreference": "night", "tpaLicenseNumber": "76t767565", "companyAffiliation": "Yogineers Technologies pvt ltd", "insuranceCompanies": ["khj"], "insuranceExperience": "5-10 years"}	null	null	null	null	null
cmicwerqd00027k4837ksgrik	REC002	Receptionist	Two	tcchavan999@gmail.com	+91-9876543212	\N	\N	\N	Reception	receptionist2	active	2024-01-01 00:00:00	\N	\N	\N	$2b$10$TunazwYHy.g3rrDmv7WN1.jKncy9C4XXflaxQjJtLDnrfhbFXjj2S	t	2025-12-01 12:53:47.222	2025-11-24 08:42:03.109	2025-12-01 12:53:47.222	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
cmicwerzv00067k48ttdux05d	SUR001	Surgeon	User	work.ankush07@gmail.com	+91-9876543216	\N	\N	\N	Ophthalmology	surgeon	active	2024-01-01 00:00:00	\N	\N	\N	$2b$10$DMJfnXEkRrlY.vDdfKoCYe6PMNzaxbadutM1/iTlupN8CcvjcXw96	t	2025-11-26 16:42:51.263	2025-11-24 08:42:03.451	2025-11-26 16:42:51.264	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"successRate": 99.2, "certifications": ["MS Ophthalmology", "Fellowship in Cataract Surgery"], "specialization": "Cataract & Anterior Segment", "totalSurgeries": 2500, "yearsExperience": 15}
cmicwerk200007k4801kdnv9f	OPT001	Optometrist	User	adwapking83@gmail.com	+91-9876543210	\N	\N	\N	Optometry	optometrist	active	2024-01-01 00:00:00	\N	\N	\N	$2b$10$nasRuV20pwMB56Gmak1T4.uqLxEg2I1h2xQ62hcDq4F2ahNuJ3odC	t	2025-12-01 12:55:26.114	2025-11-24 08:42:02.882	2025-12-01 12:55:26.114	\N	\N	\N	\N	{"certifications": ["BSc Optometry", "Contact Lens Specialist"], "specialization": "Refraction & Contact Lenses", "yearsExperience": 8, "equipmentCertified": ["Auto Refractometer", "Tonometer", "Slit Lamp"]}	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
cmicwerxj00057k488pq5hg0m	ANE001	Anesthesiologist	User	ankushmu8080@gmail.com	+91-9876543215	\N	\N	\N	Anesthesiology	anesthesiologist	active	2024-01-01 00:00:00	\N	\N	\N	$2b$10$BahlgOqO8JrJ610yOcKhH.8g7ZdtRa.ITk4u0luNW7WWY/qqMaPlK	t	2025-11-26 06:38:05.839	2025-11-24 08:42:03.367	2025-11-26 06:38:05.839	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"totalCases": 3200, "complications": 0.1, "certifications": ["MD Anesthesiology", "Fellowship in Regional Anesthesia"], "specialization": "Ophthalmic Anesthesia", "yearsExperience": 12}	\N	\N	\N
cmicweruv00047k484nat6i75	OTA001	OT Admin	User	ankushdiwakar8080@gmail.com	+91-9876543214	\N	\N	\N	Operation Theatre	ot_admin	active	2024-01-01 00:00:00	\N	\N	\N	$2b$10$9TtOIbStr1z0ouHHp1d/l.uaOrzOUKleW8y7zApnCkk0qMcLF4g3.	t	2025-12-02 08:11:29.642	2025-11-24 08:42:03.271	2025-12-02 08:11:29.642	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"certifications": ["OT Management Certificate", "Hospital Administration"], "specialization": "OT Management", "yearsExperience": 10, "responsibilities": ["OT Scheduling", "Equipment Management", "Staff Coordination"]}	\N	\N
cmicwerny00017k484x0x4b3h	REC001	Receptionist	One	admin@yogineerstech.in	+91-9876543211	\N	\N	\N	Reception	receptionist	active	2024-01-01 00:00:00	\N	\N	\N	$2b$10$bH5Uz8k7Ks6jkPZNERf6Z.7IfTIJ67nuSS4knXXVRLyg7Jt.ZKOX2	t	2025-12-01 12:20:27.619	2025-11-24 08:42:03.023	2025-12-01 12:20:27.619	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: staff_attendance; Type: TABLE DATA; Schema: public; Owner: tanuj
--

COPY public.staff_attendance (id, "staffId", date, "checkInTime", "checkOutTime", "workingHours", "isPresent", "createdAt", "updatedAt", status) FROM stdin;
cmid13zvn00027kp47p56asd9	cmicwerk200007k4801kdnv9f	2025-11-03 18:30:00	2025-11-24 10:53:38.457	\N	\N	t	2025-11-24 10:53:38.493	2025-11-24 10:53:38.493	ABSENT
cmid13zwj00047kp46v9ucu1t	cmicwerqd00027k4837ksgrik	2025-11-03 18:30:00	2025-11-24 10:53:38.457	\N	\N	t	2025-11-24 10:53:38.493	2025-11-24 10:53:38.493	ABSENT
cmid13zwr00067kp47cwwojio	cmicweruv00047k484nat6i75	2025-11-03 18:30:00	2025-11-24 10:53:38.457	\N	\N	t	2025-11-24 10:53:38.493	2025-11-24 10:53:38.493	ABSENT
cmid13zww00087kp4xs3ikwhk	cmicwes2800077k4890xub85z	2025-11-03 18:30:00	2025-11-24 10:53:38.457	\N	\N	t	2025-11-24 10:53:38.493	2025-11-24 10:53:38.493	ABSENT
cmid13zwx000e7kp4wr5l14tc	cmicwerxj00057k488pq5hg0m	2025-11-03 18:30:00	2025-11-24 10:53:38.457	\N	\N	t	2025-11-24 10:53:38.493	2025-11-24 10:53:38.493	ABSENT
cmid13zwx000f7kp4ftrtzwj7	cmicwerny00017k484x0x4b3h	2025-11-03 18:30:00	2025-11-24 10:53:38.457	\N	\N	t	2025-11-24 10:53:38.493	2025-11-24 10:53:38.493	ABSENT
cmid13zwx000d7kp4wv3dqnjv	cmicwerzv00067k48ttdux05d	2025-11-03 18:30:00	2025-11-24 10:53:38.457	\N	\N	t	2025-11-24 10:53:38.493	2025-11-24 10:53:38.493	ABSENT
cmid13zwx000g7kp4kouv54gh	cmicwersg00037k48j2wmqv52	2025-11-03 18:30:00	2025-11-24 10:53:38.457	\N	\N	t	2025-11-24 10:53:38.493	2025-11-24 10:53:38.493	ABSENT
cmid1457n000o7kp4rgmbd77j	cmicwerqd00027k4837ksgrik	2025-11-05 18:30:00	2025-11-24 10:53:45.412	\N	\N	t	2025-11-24 10:53:45.444	2025-11-24 10:53:45.444	ABSENT
cmid1457n000m7kp46757ttvx	cmicwerny00017k484x0x4b3h	2025-11-05 18:30:00	2025-11-24 10:53:45.412	\N	\N	t	2025-11-24 10:53:45.444	2025-11-24 10:53:45.444	ABSENT
cmid1457o000s7kp47k143l2v	cmicwerzv00067k48ttdux05d	2025-11-05 18:30:00	2025-11-24 10:53:45.412	\N	\N	t	2025-11-24 10:53:45.444	2025-11-24 10:53:45.444	ABSENT
cmid1457n000n7kp42kfa23b7	cmicweruv00047k484nat6i75	2025-11-05 18:30:00	2025-11-24 10:53:45.412	\N	\N	t	2025-11-24 10:53:45.444	2025-11-24 10:53:45.444	ABSENT
cmid1457o000u7kp49kfa4e44	cmicwersg00037k48j2wmqv52	2025-11-05 18:30:00	2025-11-24 10:53:45.412	\N	\N	t	2025-11-24 10:53:45.444	2025-11-24 10:53:45.444	ABSENT
cmid1457n000l7kp45c9d4rgc	cmicwerk200007k4801kdnv9f	2025-11-05 18:30:00	2025-11-24 10:53:45.412	\N	\N	t	2025-11-24 10:53:45.444	2025-11-24 10:53:45.444	ABSENT
cmid1457o000q7kp4eqq1tnf7	cmicwerxj00057k488pq5hg0m	2025-11-05 18:30:00	2025-11-24 10:53:45.412	\N	\N	t	2025-11-24 10:53:45.444	2025-11-24 10:53:45.444	ABSENT
cmid1457w000w7kp4hf3iq659	cmicwes2800077k4890xub85z	2025-11-05 18:30:00	2025-11-24 10:53:45.412	\N	\N	t	2025-11-24 10:53:45.444	2025-11-24 10:53:45.444	ABSENT
cmid14b9m000y7kp4bsn2x1ox	cmicwerk200007k4801kdnv9f	2025-11-16 18:30:00	2025-11-24 10:53:53.255	\N	\N	t	2025-11-24 10:53:53.29	2025-11-24 10:53:53.29	ABSENT
cmid14b9t00147kp4j0ol4v75	cmicwerxj00057k488pq5hg0m	2025-11-16 18:30:00	2025-11-24 10:53:53.255	\N	\N	t	2025-11-24 10:53:53.298	2025-11-24 10:53:53.298	ABSENT
cmid14b9t00137kp482oh2e7e	cmicwerqd00027k4837ksgrik	2025-11-16 18:30:00	2025-11-24 10:53:53.255	\N	\N	t	2025-11-24 10:53:53.298	2025-11-24 10:53:53.298	ABSENT
cmid14b9t00127kp4scspkshh	cmicweruv00047k484nat6i75	2025-11-16 18:30:00	2025-11-24 10:53:53.255	\N	\N	t	2025-11-24 10:53:53.298	2025-11-24 10:53:53.298	ABSENT
cmid14b9v001a7kp4e4qrg1z8	cmicwerny00017k484x0x4b3h	2025-11-16 18:30:00	2025-11-24 10:53:53.255	\N	\N	t	2025-11-24 10:53:53.299	2025-11-24 10:53:53.299	ABSENT
cmid14b9u00187kp4mha1koz7	cmicwersg00037k48j2wmqv52	2025-11-16 18:30:00	2025-11-24 10:53:53.255	\N	\N	t	2025-11-24 10:53:53.299	2025-11-24 10:53:53.299	ABSENT
cmid14b9u00177kp4z1pr64od	cmicwes2800077k4890xub85z	2025-11-16 18:30:00	2025-11-24 10:53:53.255	\N	\N	t	2025-11-24 10:53:53.299	2025-11-24 10:53:53.299	ABSENT
cmid14b9y001c7kp4n2uqq1zf	cmicwerzv00067k48ttdux05d	2025-11-16 18:30:00	2025-11-24 10:53:53.255	\N	\N	t	2025-11-24 10:53:53.303	2025-11-24 10:53:53.303	ABSENT
cmid14iq0001e7kp4ryme15f7	cmicwerny00017k484x0x4b3h	2025-11-18 18:30:00	2025-11-24 10:54:02.917	\N	\N	t	2025-11-24 10:54:02.953	2025-11-24 10:54:02.953	ABSENT
cmid14iq8001g7kp4wpbkzist	cmicwes2800077k4890xub85z	2025-11-18 18:30:00	2025-11-24 10:54:02.917	\N	\N	t	2025-11-24 10:54:02.953	2025-11-24 10:54:02.953	ABSENT
cmid14iq9001k7kp4qf4jqgd1	cmicwerxj00057k488pq5hg0m	2025-11-18 18:30:00	2025-11-24 10:54:02.917	\N	\N	t	2025-11-24 10:54:02.953	2025-11-24 10:54:02.953	ABSENT
cmid14iq9001l7kp49tzem0cr	cmicwersg00037k48j2wmqv52	2025-11-18 18:30:00	2025-11-24 10:54:02.917	\N	\N	t	2025-11-24 10:54:02.953	2025-11-24 10:54:02.953	ABSENT
cmid14iq9001r7kp4mimrn8vs	cmicweruv00047k484nat6i75	2025-11-18 18:30:00	2025-11-24 10:54:02.917	\N	\N	t	2025-11-24 10:54:02.953	2025-11-24 10:54:02.953	ABSENT
cmid14iq9001s7kp438bjizub	cmicwerqd00027k4837ksgrik	2025-11-18 18:30:00	2025-11-24 10:54:02.917	\N	\N	t	2025-11-24 10:54:02.953	2025-11-24 10:54:02.953	ABSENT
cmid14iq9001o7kp4qyov2nuf	cmicwerzv00067k48ttdux05d	2025-11-18 18:30:00	2025-11-24 10:54:02.917	\N	\N	t	2025-11-24 10:54:02.953	2025-11-24 10:54:02.953	ABSENT
cmid14iq9001m7kp4mri9hump	cmicwerk200007k4801kdnv9f	2025-11-18 18:30:00	2025-11-24 10:54:02.917	\N	\N	t	2025-11-24 10:54:02.953	2025-11-24 10:54:02.953	ABSENT
cmid14tvy002k7kp4w1kczspl	cmicwes2800077k4890xub85z	2025-11-20 18:30:00	2025-11-24 10:54:17.391	\N	\N	t	2025-11-24 10:54:17.422	2025-11-24 10:54:17.422	ABSENT
cmid14tvx002d7kp4hj21s3fh	cmicwerny00017k484x0x4b3h	2025-11-20 18:30:00	2025-11-24 10:54:17.391	\N	\N	t	2025-11-24 10:54:17.421	2025-11-24 10:54:17.421	ABSENT
cmid14tvx002g7kp4dxvmq6qj	cmicweruv00047k484nat6i75	2025-11-20 18:30:00	2025-11-24 10:54:17.391	\N	\N	t	2025-11-24 10:54:17.421	2025-11-24 10:54:17.421	ABSENT
cmid14tvx002e7kp4zohn49mv	cmicwerqd00027k4837ksgrik	2025-11-20 18:30:00	2025-11-24 10:54:17.391	\N	\N	t	2025-11-24 10:54:17.421	2025-11-24 10:54:17.421	ABSENT
cmid14tvy002m7kp4bckc5aqh	cmicwersg00037k48j2wmqv52	2025-11-20 18:30:00	2025-11-24 10:54:17.391	\N	\N	t	2025-11-24 10:54:17.422	2025-11-24 10:54:17.422	ABSENT
cmid14tvy002j7kp4fc78xsq7	cmicwerzv00067k48ttdux05d	2025-11-20 18:30:00	2025-11-24 10:54:17.391	\N	\N	t	2025-11-24 10:54:17.422	2025-11-24 10:54:17.422	ABSENT
cmid14tvx002a7kp49kfy3d7x	cmicwerk200007k4801kdnv9f	2025-11-20 18:30:00	2025-11-24 10:54:17.391	\N	\N	t	2025-11-24 10:54:17.421	2025-11-24 10:54:17.421	ABSENT
cmid14twe002o7kp4os4s8yno	cmicwerxj00057k488pq5hg0m	2025-11-20 18:30:00	2025-11-24 10:54:17.391	\N	\N	t	2025-11-24 10:54:17.422	2025-11-24 10:54:17.422	ABSENT
cmid1504n002q7kp4h69mew36	cmicwerny00017k484x0x4b3h	2025-11-21 18:30:00	2025-11-24 10:54:25.492	\N	\N	t	2025-11-24 10:54:25.511	2025-11-24 10:54:25.511	ABSENT
cmid1504o002s7kp4b9rcmo21	cmicwes2800077k4890xub85z	2025-11-21 18:30:00	2025-11-24 10:54:25.492	\N	\N	t	2025-11-24 10:54:25.512	2025-11-24 10:54:25.512	ABSENT
cmid1504t002u7kp4kom913jf	cmicwerk200007k4801kdnv9f	2025-11-21 18:30:00	2025-11-24 10:54:25.492	\N	\N	t	2025-11-24 10:54:25.511	2025-11-24 10:54:25.511	ABSENT
cmid1504u002y7kp4mnl7e6rb	cmicwerqd00027k4837ksgrik	2025-11-21 18:30:00	2025-11-24 10:54:25.492	\N	\N	t	2025-11-24 10:54:25.512	2025-11-24 10:54:25.512	ABSENT
cmid1504u002w7kp4uect4iw3	cmicwerzv00067k48ttdux05d	2025-11-21 18:30:00	2025-11-24 10:54:25.492	\N	\N	t	2025-11-24 10:54:25.512	2025-11-24 10:54:25.512	ABSENT
cmid1504v00307kp4mzcknyzk	cmicweruv00047k484nat6i75	2025-11-21 18:30:00	2025-11-24 10:54:25.492	\N	\N	t	2025-11-24 10:54:25.512	2025-11-24 10:54:25.512	ABSENT
cmid1504v00327kp4q952eva3	cmicwersg00037k48j2wmqv52	2025-11-21 18:30:00	2025-11-24 10:54:25.492	\N	\N	t	2025-11-24 10:54:25.512	2025-11-24 10:54:25.512	ABSENT
cmid1504x00347kp4u3my9ay9	cmicwerxj00057k488pq5hg0m	2025-11-21 18:30:00	2025-11-24 10:54:25.492	\N	\N	t	2025-11-24 10:54:25.512	2025-11-24 10:54:25.512	ABSENT
cmid1558m00387kp4era6dqx6	cmicwerk200007k4801kdnv9f	2025-11-22 18:30:00	2025-11-24 10:54:32.113	\N	\N	t	2025-11-24 10:54:32.134	2025-11-24 10:54:32.134	ABSENT
cmid1558m00397kp4wcyceb8n	cmicwerny00017k484x0x4b3h	2025-11-22 18:30:00	2025-11-24 10:54:32.113	\N	\N	t	2025-11-24 10:54:32.134	2025-11-24 10:54:32.134	ABSENT
cmid1558m003a7kp4l09zzx1p	cmicweruv00047k484nat6i75	2025-11-22 18:30:00	2025-11-24 10:54:32.113	\N	\N	t	2025-11-24 10:54:32.134	2025-11-24 10:54:32.134	ABSENT
cmid1558m003c7kp4wmxp9neo	cmicwerzv00067k48ttdux05d	2025-11-22 18:30:00	2025-11-24 10:54:32.113	\N	\N	t	2025-11-24 10:54:32.135	2025-11-24 10:54:32.135	ABSENT
cmid1558n003j7kp4su4e9apa	cmicwes2800077k4890xub85z	2025-11-22 18:30:00	2025-11-24 10:54:32.113	\N	\N	t	2025-11-24 10:54:32.135	2025-11-24 10:54:32.135	ABSENT
cmid1558m003e7kp4h1ke7th4	cmicwerqd00027k4837ksgrik	2025-11-22 18:30:00	2025-11-24 10:54:32.113	\N	\N	t	2025-11-24 10:54:32.134	2025-11-24 10:54:32.134	ABSENT
cmid15bhb003t7kp49pjzp5zo	cmicwerxj00057k488pq5hg0m	2025-11-23 18:30:00	2025-11-24 10:54:40.202	\N	\N	t	2025-11-24 10:54:40.223	2025-11-24 10:54:40.223	ABSENT
cmid15bhb003m7kp4v6o0fy7a	cmicwerk200007k4801kdnv9f	2025-11-23 18:30:00	2025-11-24 10:54:40.202	\N	\N	t	2025-11-24 10:54:40.223	2025-11-24 10:54:40.223	ABSENT
cmid15bhb003v7kp43lscpkma	cmicwerzv00067k48ttdux05d	2025-11-23 18:30:00	2025-11-24 10:54:40.202	\N	\N	t	2025-11-24 10:54:40.223	2025-11-24 10:54:40.223	ABSENT
cmid1558m003g7kp4z4r10hoa	cmicwerxj00057k488pq5hg0m	2025-11-22 18:30:00	2025-11-24 10:54:32.113	\N	\N	t	2025-11-24 10:54:32.135	2025-11-24 10:54:32.135	ABSENT
cmid15bhb003q7kp4k9ybc6ea	cmicwerny00017k484x0x4b3h	2025-11-23 18:30:00	2025-11-24 10:54:40.202	\N	\N	t	2025-11-24 10:54:40.223	2025-11-24 10:54:40.223	ABSENT
cmid15bhb003r7kp45rzrbdjw	cmicweruv00047k484nat6i75	2025-11-23 18:30:00	2025-11-24 10:54:40.202	\N	\N	t	2025-11-24 10:54:40.223	2025-11-24 10:54:40.223	ABSENT
cmid15bhi00407kp4kvpwveft	cmicwerqd00027k4837ksgrik	2025-11-23 18:30:00	2025-11-24 10:54:40.202	2025-11-24 12:41:36.214	1.78	t	2025-11-24 10:54:40.223	2025-11-24 12:41:36.326	ABSENT
cmid1558n003k7kp4mf4gvqcb	cmicwersg00037k48j2wmqv52	2025-11-22 18:30:00	2025-11-24 10:54:32.113	\N	\N	t	2025-11-24 10:54:32.135	2025-11-24 10:54:32.135	ABSENT
cmid15bhb003w7kp42oka6f3v	cmicwersg00037k48j2wmqv52	2025-11-23 18:30:00	2025-11-24 10:54:40.202	2025-11-24 11:11:37.49	0.28	t	2025-11-24 10:54:40.223	2025-11-24 11:11:37.511	ABSENT
cmid15bhi003z7kp4c3rvkwmw	cmicwes2800077k4890xub85z	2025-11-23 18:30:00	2025-11-24 10:54:40.202	\N	\N	t	2025-11-24 10:54:40.223	2025-11-24 10:54:40.223	ABSENT
cmiiid77500037kpstal20dob	cmicwes2800077k4890xub85z	2025-11-27 18:30:00	2025-11-28 06:55:32.246	\N	\N	t	2025-11-28 06:55:32.273	2025-11-28 06:55:32.273	PRESENT
cmiiifin4001n7kpsldomr2xj	cmicwes2800077k4890xub85z	2025-11-26 18:30:00	2025-11-28 06:59:16.804	\N	\N	t	2025-11-28 06:57:20.407	2025-11-28 06:59:16.804	PRESENT
cmiiifin3001d7kpsx89mhzyx	cmicwersg00037k48j2wmqv52	2025-11-26 18:30:00	2025-11-28 06:59:16.804	\N	\N	t	2025-11-28 06:57:20.407	2025-11-28 06:59:16.804	PRESENT
cmiiifimv001b7kpsyycjo4dk	cmid297j8000rlh2ogvzts7jc	2025-11-26 18:30:00	2025-11-28 06:59:16.804	\N	\N	t	2025-11-28 06:57:20.407	2025-11-28 06:59:16.804	PRESENT
cmiiifin4001i7kpsdndfa43p	cmicweruv00047k484nat6i75	2025-11-26 18:30:00	2025-11-28 06:59:16.804	\N	\N	t	2025-11-28 06:57:20.407	2025-11-28 06:59:16.804	PRESENT
cmiiifin4001j7kpsjpxzjogh	cmicwerzv00067k48ttdux05d	2025-11-26 18:30:00	2025-11-28 06:59:16.804	\N	\N	t	2025-11-28 06:57:20.407	2025-11-28 06:59:16.804	PRESENT
cmiiifin4001l7kpsz7bowpvx	cmicwerxj00057k488pq5hg0m	2025-11-26 18:30:00	2025-11-28 06:59:16.804	\N	\N	t	2025-11-28 06:57:20.407	2025-11-28 06:59:16.804	PRESENT
cmiiifip7001r7kps1k5d5c9y	cmicwerny00017k484x0x4b3h	2025-11-26 18:30:00	2025-11-28 06:59:16.804	\N	\N	t	2025-11-28 06:57:20.408	2025-11-28 06:59:16.804	PRESENT
cmiiid3n500017kpsnwmcezmt	cmicwerqd00027k4837ksgrik	2025-11-27 18:30:00	2025-11-28 06:55:27.583	2025-11-28 14:20:45.433	7.42	t	2025-11-28 06:55:27.653	2025-11-28 14:20:45.451	PRESENT
cmiiidn4s000b7kpsztx8c8hy	cmicwerny00017k484x0x4b3h	2025-11-27 18:30:00	2025-11-28 06:56:12.546	\N	\N	t	2025-11-28 06:55:52.831	2025-11-28 06:56:12.546	PRESENT
cmiiidn4t000d7kpsteokjfgr	cmicwerk200007k4801kdnv9f	2025-11-27 18:30:00	2025-11-28 06:56:12.546	\N	\N	t	2025-11-28 06:55:52.831	2025-11-28 06:56:12.546	PRESENT
cmiiidn4t000g7kps1p8edw2d	cmicwerxj00057k488pq5hg0m	2025-11-27 18:30:00	2025-11-28 06:56:12.546	\N	\N	t	2025-11-28 06:55:52.831	2025-11-28 06:56:12.546	PRESENT
cmiiidn4s000a7kpstzl7trzq	cmicwerzv00067k48ttdux05d	2025-11-27 18:30:00	2025-11-28 06:56:12.546	\N	\N	t	2025-11-28 06:55:52.831	2025-11-28 06:56:12.546	PRESENT
cmiiidn4t000h7kpsr6wvp48i	cmicweruv00047k484nat6i75	2025-11-27 18:30:00	2025-11-28 06:56:12.546	\N	\N	t	2025-11-28 06:55:52.831	2025-11-28 06:56:12.546	PRESENT
cmiilcadb003v7kpshef5v5na	cmicwerqd00027k4837ksgrik	2025-11-12 18:30:00	2025-11-28 08:19:00.361	\N	\N	t	2025-11-28 08:18:48.476	2025-11-28 08:19:00.361	PRESENT
cmiiifin4001h7kpsex20eswx	cmicwerqd00027k4837ksgrik	2025-11-26 18:30:00	2025-11-28 06:59:16.804	\N	\N	t	2025-11-28 06:57:20.407	2025-11-28 06:59:16.804	PRESENT
cmiiifip6001p7kpsfhln74n5	cmicwerk200007k4801kdnv9f	2025-11-26 18:30:00	2025-11-28 06:59:16.804	\N	\N	t	2025-11-28 06:57:20.408	2025-11-28 06:59:16.804	PRESENT
cmiiip8p4002t7kpsv3oliepv	cmicwes2800077k4890xub85z	2025-11-25 18:30:00	\N	\N	\N	f	2025-11-28 07:04:54.089	2025-11-28 07:04:54.089	LEAVE
cmiiipd3s002v7kps1v1whoo4	cmicwerqd00027k4837ksgrik	2025-11-25 18:30:00	\N	\N	\N	f	2025-11-28 07:04:59.801	2025-11-28 07:04:59.801	HOLIDAY
cmiiisn0g002x7kps7ftib6un	cmid297j8000rlh2ogvzts7jc	2025-11-25 18:30:00	2025-11-28 07:07:32.388	\N	\N	t	2025-11-28 07:07:32.608	2025-11-28 07:07:32.608	PRESENT
cmiiispe8002z7kpseughjlen	cmicweruv00047k484nat6i75	2025-11-25 18:30:00	\N	\N	\N	f	2025-11-28 07:07:35.696	2025-11-28 07:07:35.696	LATE
cmiiistg600317kpsr6hbyzin	cmicwersg00037k48j2wmqv52	2025-11-25 18:30:00	\N	\N	\N	f	2025-11-28 07:07:40.95	2025-11-28 07:07:40.95	HOLIDAY
cmiijfyp700337kpsj29kkamo	cmicwes2800077k4890xub85z	2025-11-09 18:30:00	\N	\N	\N	f	2025-11-28 07:25:40.843	2025-11-28 07:25:40.843	HOLIDAY
cmiijfyrc00357kpsnu2fwwoq	cmicwersg00037k48j2wmqv52	2025-11-09 18:30:00	\N	\N	\N	f	2025-11-28 07:25:40.844	2025-11-28 07:25:40.844	HOLIDAY
cmiijfyrc00377kpsl9ffd45w	cmicweruv00047k484nat6i75	2025-11-09 18:30:00	\N	\N	\N	f	2025-11-28 07:25:40.843	2025-11-28 07:25:40.843	HOLIDAY
cmiijfyrh00397kpsy7i7y8eo	cmicwerzv00067k48ttdux05d	2025-11-09 18:30:00	\N	\N	\N	f	2025-11-28 07:25:40.844	2025-11-28 07:25:40.844	HOLIDAY
cmiijfyri003c7kpse6tahub1	cmicwerk200007k4801kdnv9f	2025-11-09 18:30:00	\N	\N	\N	f	2025-11-28 07:25:40.844	2025-11-28 07:25:40.844	HOLIDAY
cmiijfyrl003f7kps5y91sj0m	cmicwerny00017k484x0x4b3h	2025-11-09 18:30:00	\N	\N	\N	f	2025-11-28 07:25:40.844	2025-11-28 07:25:40.844	HOLIDAY
cmiijfyri003d7kps3jz8zkz3	cmicwerxj00057k488pq5hg0m	2025-11-09 18:30:00	\N	\N	\N	f	2025-11-28 07:25:40.844	2025-11-28 07:25:40.844	HOLIDAY
cmiijfyrn003h7kpsgwxpzgdq	cmicwerqd00027k4837ksgrik	2025-11-09 18:30:00	\N	\N	\N	f	2025-11-28 07:25:40.843	2025-11-28 07:25:40.843	HOLIDAY
cmiijfyrp003j7kpskqip73y5	cmid297j8000rlh2ogvzts7jc	2025-11-09 18:30:00	\N	\N	\N	f	2025-11-28 07:25:40.843	2025-11-28 07:25:40.843	HOLIDAY
cmiilerwr005c7kps86ota6ro	cmicwerny00017k484x0x4b3h	2025-11-02 18:30:00	\N	\N	\N	f	2025-11-28 08:20:44.611	2025-11-28 08:20:44.611	HOLIDAY
cmiilcadb003t7kps4pi7qu3l	cmicwerxj00057k488pq5hg0m	2025-11-12 18:30:00	2025-11-28 08:19:00.361	\N	\N	t	2025-11-28 08:18:48.476	2025-11-28 08:19:00.361	PRESENT
cmiilerwr005i7kpscviwto32	cmicwes2800077k4890xub85z	2025-11-02 18:30:00	\N	\N	\N	f	2025-11-28 08:20:44.61	2025-11-28 08:20:44.61	HOLIDAY
cmiilerwr005j7kpse13mhlzl	cmicweruv00047k484nat6i75	2025-11-02 18:30:00	\N	\N	\N	f	2025-11-28 08:20:44.61	2025-11-28 08:20:44.61	HOLIDAY
cmiilcad3003r7kpsvvtllcrz	cmicwerny00017k484x0x4b3h	2025-11-12 18:30:00	2025-11-28 08:19:00.361	\N	\N	t	2025-11-28 08:18:48.476	2025-11-28 08:19:00.361	PRESENT
cmiilbv37003l7kpsrg9dok67	cmicwes2800077k4890xub85z	2025-11-12 18:30:00	2025-11-28 08:19:00.361	\N	\N	t	2025-11-28 08:18:28.772	2025-11-28 08:19:00.361	PRESENT
cmiilerwr00597kps3fwwm14t	cmicwerzv00067k48ttdux05d	2025-11-02 18:30:00	\N	\N	\N	f	2025-11-28 08:20:44.61	2025-11-28 08:20:44.61	HOLIDAY
cmiiidn4s00077kps2y3ddbvc	cmid297j8000rlh2ogvzts7jc	2025-11-27 18:30:00	2025-11-28 06:56:12.546	2025-11-28 10:11:18.879	3.25	t	2025-11-28 06:55:52.831	2025-11-28 10:11:19.112	PRESENT
cmiiidn2600057kps94ghqfrh	cmicwersg00037k48j2wmqv52	2025-11-27 18:30:00	2025-11-28 06:56:12.546	2025-11-28 08:56:42.685	2.01	t	2025-11-28 06:55:52.83	2025-11-28 08:56:43.135	PRESENT
cmiilcadc00437kpswtk409ys	cmicwersg00037k48j2wmqv52	2025-11-12 18:30:00	2025-11-28 08:19:00.361	\N	\N	t	2025-11-28 08:18:48.476	2025-11-28 08:19:00.361	PRESENT
cmiilerwr005f7kps3gaupj7w	cmicwerxj00057k488pq5hg0m	2025-11-02 18:30:00	\N	\N	\N	f	2025-11-28 08:20:44.61	2025-11-28 08:20:44.61	HOLIDAY
cmiilcadc00427kps49hx0jbc	cmicwerzv00067k48ttdux05d	2025-11-12 18:30:00	2025-11-28 08:19:00.361	\N	\N	t	2025-11-28 08:18:48.476	2025-11-28 08:19:00.361	PRESENT
cmiilerwi00557kpsgoxt7aa0	cmicwersg00037k48j2wmqv52	2025-11-02 18:30:00	\N	\N	\N	f	2025-11-28 08:20:44.61	2025-11-28 08:20:44.61	HOLIDAY
cmiisdtvv00017k5oahn1lqpc	cmicwes2800077k4890xub85z	2025-10-31 18:30:00	\N	\N	\N	f	2025-11-28 11:35:57.83	2025-11-28 11:35:57.83	LEAVE
cmiisdty4000c7k5ogjo1uc0f	cmicwerny00017k484x0x4b3h	2025-10-31 18:30:00	\N	\N	\N	f	2025-11-28 11:35:57.831	2025-11-28 11:35:57.831	LEAVE
cmiise23r000n7k5o23kql1p4	cmicwerk200007k4801kdnv9f	2025-11-14 18:30:00	\N	\N	\N	f	2025-11-28 11:36:08.487	2025-11-28 11:36:08.487	HOLIDAY
cmiise23y000z7k5o8b98nwuc	cmid297j8000rlh2ogvzts7jc	2025-11-14 18:30:00	\N	\N	\N	f	2025-11-28 11:36:08.487	2025-11-28 11:36:08.487	HOLIDAY
cmiiuqn0w00097kwg71wqxf4b	cmicwerny00017k484x0x4b3h	2025-11-04 18:30:00	2025-11-28 12:42:03.311	\N	\N	t	2025-11-28 12:41:54.602	2025-11-28 12:42:03.311	PRESENT
cmiiuqn18000k7kwgqvaxftej	cmid297j8000rlh2ogvzts7jc	2025-11-04 18:30:00	2025-11-28 12:42:03.311	\N	\N	t	2025-11-28 12:41:54.602	2025-11-28 12:42:03.311	PRESENT
cmimoovj7000z7kxcpw0x2cok	cmicweruv00047k484nat6i75	2025-11-28 18:30:00	\N	\N	\N	f	2025-12-01 05:03:39.42	2025-12-01 05:03:39.42	HOLIDAY
cmimoovj7000r7kxcvsa9vxm9	cmicwerqd00027k4837ksgrik	2025-11-28 18:30:00	\N	\N	\N	f	2025-12-01 05:03:39.42	2025-12-01 05:03:39.42	HOLIDAY
cmimoo10200017kxcf70d7b3r	cmicwerzv00067k48ttdux05d	2025-11-29 18:30:00	\N	\N	\N	f	2025-12-01 05:02:59.857	2025-12-01 05:04:06.679	HOLIDAY
cmimoo12k000b7kxc84kkq99h	cmicwerny00017k484x0x4b3h	2025-11-29 18:30:00	\N	\N	\N	f	2025-12-01 05:02:59.857	2025-12-01 05:04:06.679	HOLIDAY
cmid14ntc00247kp45vjdsvrn	cmicwerzv00067k48ttdux05d	2025-11-19 18:30:00	\N	\N	\N	f	2025-11-24 10:54:09.552	2025-12-01 05:04:24.795	LEAVE
cmid14ntc00237kp4ikun0hvk	cmicwerxj00057k488pq5hg0m	2025-11-19 18:30:00	\N	\N	\N	f	2025-11-24 10:54:09.552	2025-12-01 05:04:24.795	LEAVE
cmiilcadc00417kpskuuzx38n	cmicwerk200007k4801kdnv9f	2025-11-12 18:30:00	2025-11-28 08:19:00.361	\N	\N	t	2025-11-28 08:18:48.476	2025-11-28 08:19:00.361	PRESENT
cmiilerwr005l7kpss6ndiyzv	cmid297j8000rlh2ogvzts7jc	2025-11-02 18:30:00	\N	\N	\N	f	2025-11-28 08:20:44.61	2025-11-28 08:20:44.61	HOLIDAY
cmiisdtxu00037k5oazq6uefy	cmicwerk200007k4801kdnv9f	2025-10-31 18:30:00	\N	\N	\N	f	2025-11-28 11:35:57.831	2025-11-28 11:35:57.831	LEAVE
cmiisdty4000f7k5obglti2m2	cmicwersg00037k48j2wmqv52	2025-10-31 18:30:00	\N	\N	\N	f	2025-11-28 11:35:57.831	2025-11-28 11:35:57.831	LEAVE
cmiise23q000l7k5o19ptyysq	cmicwerzv00067k48ttdux05d	2025-11-14 18:30:00	\N	\N	\N	f	2025-11-28 11:36:08.487	2025-11-28 11:36:08.487	HOLIDAY
cmiise23r000v7k5o8f5ostfk	cmicwerny00017k484x0x4b3h	2025-11-14 18:30:00	\N	\N	\N	f	2025-11-28 11:36:08.487	2025-11-28 11:36:08.487	HOLIDAY
cmiiuqn10000b7kwgq7l5u7o4	cmicwes2800077k4890xub85z	2025-11-04 18:30:00	2025-11-28 12:42:03.311	\N	\N	t	2025-11-28 12:41:54.602	2025-11-28 12:42:03.311	PRESENT
cmiiuqn18000n7kwg1ijcnq3h	cmicwerxj00057k488pq5hg0m	2025-11-04 18:30:00	2025-11-28 12:42:03.311	\N	\N	t	2025-11-28 12:41:54.602	2025-11-28 12:42:03.311	PRESENT
cmimoovj7000p7kxckeyhszxd	cmicwerny00017k484x0x4b3h	2025-11-28 18:30:00	\N	\N	\N	f	2025-12-01 05:03:39.42	2025-12-01 05:03:39.42	HOLIDAY
cmimoovj7000w7kxcu0hh9j4a	cmicwerzv00067k48ttdux05d	2025-11-28 18:30:00	\N	\N	\N	f	2025-12-01 05:03:39.42	2025-12-01 05:03:39.42	HOLIDAY
cmimoo12k00077kxc015dopj9	cmicwersg00037k48j2wmqv52	2025-11-29 18:30:00	\N	\N	\N	f	2025-12-01 05:02:59.857	2025-12-01 05:04:06.679	HOLIDAY
cmimoo12g00037kxcz3e4okot	cmid297j8000rlh2ogvzts7jc	2025-11-29 18:30:00	\N	\N	\N	f	2025-12-01 05:02:59.857	2025-12-01 05:04:06.679	HOLIDAY
cmimopuky002d7kxcny3mcml4	cmid297j8000rlh2ogvzts7jc	2025-11-19 18:30:00	\N	\N	\N	f	2025-12-01 05:04:24.841	2025-12-01 05:04:24.841	LEAVE
cmid14ntc00207kp4ztv7aqaz	cmicweruv00047k484nat6i75	2025-11-19 18:30:00	\N	\N	\N	f	2025-11-24 10:54:09.552	2025-12-01 05:04:24.795	LEAVE
cmimoqa50002j7kxcvolwt9ov	cmid297j8000rlh2ogvzts7jc	2025-11-20 18:30:00	\N	\N	\N	f	2025-12-01 05:04:45.012	2025-12-01 05:04:45.012	LATE
cmiilcacz003p7kps6vaizc7y	cmid297j8000rlh2ogvzts7jc	2025-11-12 18:30:00	2025-11-28 08:19:00.361	\N	\N	t	2025-11-28 08:18:48.476	2025-11-28 08:19:00.361	PRESENT
cmiilerwr00587kpsjc2qe7ye	cmicwerqd00027k4837ksgrik	2025-11-02 18:30:00	\N	\N	\N	f	2025-11-28 08:20:44.61	2025-11-28 08:20:44.61	HOLIDAY
cmiisdtxx00057k5odgmu7ap8	cmicweruv00047k484nat6i75	2025-10-31 18:30:00	\N	\N	\N	f	2025-11-28 11:35:57.831	2025-11-28 11:35:57.831	LEAVE
cmiisdty4000e7k5ohfcr6uxj	cmicwerxj00057k488pq5hg0m	2025-10-31 18:30:00	\N	\N	\N	f	2025-11-28 11:35:57.831	2025-11-28 11:35:57.831	LEAVE
cmiise23r000w7k5osgsgtgur	cmicwerxj00057k488pq5hg0m	2025-11-14 18:30:00	\N	\N	\N	f	2025-11-28 11:36:08.487	2025-11-28 11:36:08.487	HOLIDAY
cmiise23r000t7k5ok64z36ei	cmicwerqd00027k4837ksgrik	2025-11-14 18:30:00	\N	\N	\N	f	2025-11-28 11:36:08.487	2025-11-28 11:36:08.487	HOLIDAY
cmiiuqn14000d7kwg50mk6egv	cmicwerzv00067k48ttdux05d	2025-11-04 18:30:00	2025-11-28 12:42:03.311	\N	\N	t	2025-11-28 12:41:54.602	2025-11-28 12:42:03.311	PRESENT
cmiiuqn18000l7kwgw73r0xlj	cmicwerk200007k4801kdnv9f	2025-11-04 18:30:00	2025-11-28 12:42:03.311	\N	\N	t	2025-11-28 12:41:54.602	2025-11-28 12:42:03.311	PRESENT
cmimoovj6000l7kxcbgaft0zj	cmicwersg00037k48j2wmqv52	2025-11-28 18:30:00	\N	\N	\N	f	2025-12-01 05:03:39.42	2025-12-01 05:03:39.42	HOLIDAY
cmimoovj7000n7kxcngfzjrkg	cmid297j8000rlh2ogvzts7jc	2025-11-28 18:30:00	\N	\N	\N	f	2025-12-01 05:03:39.42	2025-12-01 05:03:39.42	HOLIDAY
cmimoo12m000f7kxczqa0d6d9	cmicwerk200007k4801kdnv9f	2025-11-29 18:30:00	\N	\N	\N	f	2025-12-01 05:02:59.857	2025-12-01 05:04:06.679	HOLIDAY
cmimoo12k00067kxc7acjntys	cmicweruv00047k484nat6i75	2025-11-29 18:30:00	\N	\N	\N	f	2025-12-01 05:02:59.857	2025-12-01 05:04:06.679	HOLIDAY
cmid14ntc001x7kp40xkjk8wl	cmicwerk200007k4801kdnv9f	2025-11-19 18:30:00	\N	\N	\N	f	2025-11-24 10:54:09.552	2025-12-01 05:04:24.795	LEAVE
cmid14ntc00277kp4l9cfaq34	cmicwersg00037k48j2wmqv52	2025-11-19 18:30:00	\N	\N	\N	f	2025-11-24 10:54:09.553	2025-12-01 05:04:24.795	LEAVE
cmiisdtxy00077k5o48z70bc0	cmid297j8000rlh2ogvzts7jc	2025-10-31 18:30:00	\N	\N	\N	f	2025-11-28 11:35:57.831	2025-11-28 11:35:57.831	LEAVE
cmiisdty5000h7k5oltce2i1g	cmicwerqd00027k4837ksgrik	2025-10-31 18:30:00	\N	\N	\N	f	2025-11-28 11:35:57.83	2025-11-28 11:35:57.83	LEAVE
cmiise23q000j7k5ophhrf53g	cmicwes2800077k4890xub85z	2025-11-14 18:30:00	\N	\N	\N	f	2025-11-28 11:36:08.487	2025-11-28 11:36:08.487	HOLIDAY
cmiise23r000x7k5os5ba7d54	cmicweruv00047k484nat6i75	2025-11-14 18:30:00	\N	\N	\N	f	2025-11-28 11:36:08.487	2025-11-28 11:36:08.487	HOLIDAY
cmiiuqn15000f7kwgih87fj8d	cmicweruv00047k484nat6i75	2025-11-04 18:30:00	2025-11-28 12:42:03.311	\N	\N	t	2025-11-28 12:41:54.602	2025-11-28 12:42:03.311	PRESENT
cmimoovj0000j7kxcx1ac8ypv	cmicwes2800077k4890xub85z	2025-11-28 18:30:00	\N	\N	\N	f	2025-12-01 05:03:39.42	2025-12-01 05:03:39.42	HOLIDAY
cmimoovj7000y7kxciv00q79s	cmicwerxj00057k488pq5hg0m	2025-11-28 18:30:00	\N	\N	\N	f	2025-12-01 05:03:39.42	2025-12-01 05:03:39.42	HOLIDAY
cmimoo12l000d7kxc02yf5fua	cmicwerqd00027k4837ksgrik	2025-11-29 18:30:00	\N	\N	\N	f	2025-12-01 05:02:59.857	2025-12-01 05:04:06.679	HOLIDAY
cmimoo132000h7kxc0c0dml38	cmicwerxj00057k488pq5hg0m	2025-11-29 18:30:00	\N	\N	\N	f	2025-12-01 05:02:59.857	2025-12-01 05:04:06.679	HOLIDAY
cmid14ntc001z7kp4xkwggijr	cmicwerqd00027k4837ksgrik	2025-11-19 18:30:00	\N	\N	\N	f	2025-11-24 10:54:09.552	2025-12-01 05:04:24.795	LEAVE
cmid14ntc00217kp4pwpcezj1	cmicwerny00017k484x0x4b3h	2025-11-19 18:30:00	\N	\N	\N	f	2025-11-24 10:54:09.552	2025-12-01 05:04:24.795	LEAVE
cmiilcadc003z7kpsl11karga	cmicweruv00047k484nat6i75	2025-11-12 18:30:00	2025-11-28 08:19:00.361	\N	\N	t	2025-11-28 08:18:48.476	2025-11-28 08:19:00.361	PRESENT
cmiilerwr005k7kpst97cf1pe	cmicwerk200007k4801kdnv9f	2025-11-02 18:30:00	\N	\N	\N	f	2025-11-28 08:20:44.61	2025-11-28 08:20:44.61	HOLIDAY
cmiisdtxy00097k5oxz3bljgx	cmicwerzv00067k48ttdux05d	2025-10-31 18:30:00	\N	\N	\N	f	2025-11-28 11:35:57.831	2025-11-28 11:35:57.831	LEAVE
cmiise23r000u7k5oio4pgjfr	cmicwersg00037k48j2wmqv52	2025-11-14 18:30:00	\N	\N	\N	f	2025-11-28 11:36:08.487	2025-11-28 11:36:08.487	HOLIDAY
cmiiuqn18000i7kwgy87xejey	cmicwersg00037k48j2wmqv52	2025-11-04 18:30:00	2025-11-28 12:42:03.311	\N	\N	t	2025-11-28 12:41:54.602	2025-11-28 12:42:03.311	PRESENT
cmiiuqmy100077kwg5dps6vmv	cmicwerqd00027k4837ksgrik	2025-11-04 18:30:00	2025-11-28 12:42:03.311	\N	\N	t	2025-11-28 12:41:54.602	2025-11-28 12:42:03.311	PRESENT
cmimoovj7000t7kxcmj5s72xc	cmicwerk200007k4801kdnv9f	2025-11-28 18:30:00	\N	\N	\N	f	2025-12-01 05:03:39.42	2025-12-01 05:03:39.42	HOLIDAY
cmimoo12l000c7kxctzopiniw	cmicwes2800077k4890xub85z	2025-11-29 18:30:00	\N	\N	\N	f	2025-12-01 05:02:59.857	2025-12-01 05:04:06.679	HOLIDAY
cmid14ntc00287kp4juoc1ha0	cmicwes2800077k4890xub85z	2025-11-19 18:30:00	\N	\N	\N	f	2025-11-24 10:54:09.553	2025-12-01 05:04:24.795	LEAVE
\.


--
-- Data for Name: staff_types; Type: TABLE DATA; Schema: public; Owner: tanuj
--

COPY public.staff_types (id, type) FROM stdin;
cmid48bko00007k2onsx7cvy4	doctor
cmid48bmp00017k2ofhaozz1k	receptionist
cmid48bpu00027k2oo22g9nmm	receptionist2
cmid48brs00037k2o0for59gp	optometrist
cmid48btp00047k2ohyd05uhy	ot_admin
cmid48bvl00057k2o4enzhxib	anesthesiologist
cmid48bwa00067k2ot467jj4p	surgeon
cmid48bxp00077k2ox984frnc	sister
cmid48bxx00087k2o11c73ez4	tpa
cmid48by700097k2oxra8lvtf	ophthalmologist
cmid48bzp000a7k2owqtdp15g	nurse
cmid48bzx000b7k2ou8pn9zfe	technician
\.


--
-- Data for Name: super_admins; Type: TABLE DATA; Schema: public; Owner: tanuj
--

COPY public.super_admins (id, "firstName", "lastName", email, "passwordHash", phone, "isActive", "createdAt", "updatedAt") FROM stdin;
cmicwemnf00007kmwiu8va9id	Super	Admin	admin@yogineerstech.in	$2b$10$qpctwrJ4ttwwfPDwWclW2eHPeojZTpDirCTW18ZEiQozqBEZY.Pl2	+91-9876543210	t	2025-11-24 08:41:56.511	2025-12-02 05:12:17.61
\.


--
-- Data for Name: surgery_fitness_requirements; Type: TABLE DATA; Schema: public; Owner: tanuj
--

COPY public.surgery_fitness_requirements (id, "surgeryTypeId", "requirementName", "requirementType", description, "testParameters", "normalRanges", "criticalValues", "validityPeriod", "minimumGap", "minAge", "maxAge", "specificConditions", "isActive", "createdBy", "createdAt", "updatedAt") FROM stdin;
cmifm85y40010lh7knj6brvbr	cmifm85nd0000lh7kr0y660d4	Complete Blood Count (CBC)	MANDATORY	Basic blood test to check overall health	\N	\N	\N	30	7	\N	\N	\N	t	\N	2025-11-26 06:20:17.308	2025-11-26 06:20:17.308
cmifm85yl0012lh7kpzb2ngqq	cmifm85nd0000lh7kr0y660d4	Blood Sugar (Random/Fasting)	MANDATORY	Blood glucose level assessment	\N	\N	\N	15	3	\N	\N	\N	t	\N	2025-11-26 06:20:17.325	2025-11-26 06:20:17.325
cmifm85yu0014lh7k42osxaqf	cmifm85nd0000lh7kr0y660d4	Blood Pressure Check	MANDATORY	Blood pressure measurement	\N	\N	\N	7	1	\N	\N	\N	t	\N	2025-11-26 06:20:17.334	2025-11-26 06:20:17.334
cmifm85z70016lh7kef1bmn6y	cmifm85nd0000lh7kr0y660d4	ECG (Electrocardiogram)	AGE_SPECIFIC	Heart rhythm assessment for patients above 50 years	\N	\N	\N	30	7	50	\N	\N	t	\N	2025-11-26 06:20:17.347	2025-11-26 06:20:17.347
cmifm85zq0018lh7kk6wvmt17	cmifm85nd0000lh7kr0y660d4	Chest X-ray	CONDITIONAL	Required for patients with respiratory conditions or above 60 years	\N	\N	\N	60	14	60	\N	["Respiratory conditions", "Smoking history", "Chronic cough"]	t	\N	2025-11-26 06:20:17.366	2025-11-26 06:20:17.366
cmifm8607001alh7kdknqlm94	cmifm85pj0001lh7k9a4kufiy	Complete Blood Count (CBC)	MANDATORY	Basic blood test to check overall health	\N	\N	\N	30	7	\N	\N	\N	t	\N	2025-11-26 06:20:17.383	2025-11-26 06:20:17.383
cmifm860g001clh7k57euvjnf	cmifm85pj0001lh7k9a4kufiy	Blood Sugar (Random/Fasting)	MANDATORY	Blood glucose level assessment	\N	\N	\N	15	3	\N	\N	\N	t	\N	2025-11-26 06:20:17.392	2025-11-26 06:20:17.392
cmifm860n001elh7kch3z3c4e	cmifm85pj0001lh7k9a4kufiy	Blood Pressure Check	MANDATORY	Blood pressure measurement	\N	\N	\N	7	1	\N	\N	\N	t	\N	2025-11-26 06:20:17.399	2025-11-26 06:20:17.399
cmifm860v001glh7kq8qqk0oo	cmifm85pj0001lh7k9a4kufiy	ECG (Electrocardiogram)	AGE_SPECIFIC	Heart rhythm assessment for patients above 50 years	\N	\N	\N	30	7	50	\N	\N	t	\N	2025-11-26 06:20:17.407	2025-11-26 06:20:17.407
cmifm8612001ilh7kkh3liurk	cmifm85pj0001lh7k9a4kufiy	Chest X-ray	CONDITIONAL	Required for patients with respiratory conditions or above 60 years	\N	\N	\N	60	14	60	\N	["Respiratory conditions", "Smoking history", "Chronic cough"]	t	\N	2025-11-26 06:20:17.414	2025-11-26 06:20:17.414
cmifm861b001klh7kk5s7osm9	cmifm85py0002lh7kxn3lgt4c	Complete Blood Count (CBC)	MANDATORY	Basic blood test to check overall health	\N	\N	\N	30	7	\N	\N	\N	t	\N	2025-11-26 06:20:17.423	2025-11-26 06:20:17.423
cmifm861i001mlh7k7k2muhj3	cmifm85py0002lh7kxn3lgt4c	Blood Sugar (Random/Fasting)	MANDATORY	Blood glucose level assessment	\N	\N	\N	15	3	\N	\N	\N	t	\N	2025-11-26 06:20:17.43	2025-11-26 06:20:17.43
cmifm861q001olh7kcpc7dzmf	cmifm85py0002lh7kxn3lgt4c	Blood Pressure Check	MANDATORY	Blood pressure measurement	\N	\N	\N	7	1	\N	\N	\N	t	\N	2025-11-26 06:20:17.438	2025-11-26 06:20:17.438
cmifm861x001qlh7kigc0h5x4	cmifm85py0002lh7kxn3lgt4c	ECG (Electrocardiogram)	AGE_SPECIFIC	Heart rhythm assessment for patients above 50 years	\N	\N	\N	30	7	50	\N	\N	t	\N	2025-11-26 06:20:17.445	2025-11-26 06:20:17.445
cmifm8624001slh7ksd5b75mi	cmifm85py0002lh7kxn3lgt4c	Chest X-ray	CONDITIONAL	Required for patients with respiratory conditions or above 60 years	\N	\N	\N	60	14	60	\N	["Respiratory conditions", "Smoking history", "Chronic cough"]	t	\N	2025-11-26 06:20:17.452	2025-11-26 06:20:17.452
cmifm862d001ulh7k3uijbetg	cmifm85qa0003lh7koo1rbkpu	Complete Blood Count (CBC)	MANDATORY	Basic blood test to check overall health	\N	\N	\N	30	7	\N	\N	\N	t	\N	2025-11-26 06:20:17.461	2025-11-26 06:20:17.461
cmifm862l001wlh7ke35fl2hc	cmifm85qa0003lh7koo1rbkpu	Blood Sugar (Random/Fasting)	MANDATORY	Blood glucose level assessment	\N	\N	\N	15	3	\N	\N	\N	t	\N	2025-11-26 06:20:17.469	2025-11-26 06:20:17.469
cmifm862t001ylh7kzco8o0di	cmifm85qa0003lh7koo1rbkpu	Blood Pressure Check	MANDATORY	Blood pressure measurement	\N	\N	\N	7	1	\N	\N	\N	t	\N	2025-11-26 06:20:17.477	2025-11-26 06:20:17.477
cmifm86310020lh7kqtf7u7sd	cmifm85qa0003lh7koo1rbkpu	ECG (Electrocardiogram)	AGE_SPECIFIC	Heart rhythm assessment for patients above 50 years	\N	\N	\N	30	7	50	\N	\N	t	\N	2025-11-26 06:20:17.485	2025-11-26 06:20:17.485
cmifm86380022lh7k4k8vv11f	cmifm85qa0003lh7koo1rbkpu	Chest X-ray	CONDITIONAL	Required for patients with respiratory conditions or above 60 years	\N	\N	\N	60	14	60	\N	["Respiratory conditions", "Smoking history", "Chronic cough"]	t	\N	2025-11-26 06:20:17.492	2025-11-26 06:20:17.492
cmifm863h0024lh7kmkjob9yg	cmifm85qw0004lh7kwlyhkyjs	Complete Blood Count (CBC)	MANDATORY	Basic blood test to check overall health	\N	\N	\N	30	7	\N	\N	\N	t	\N	2025-11-26 06:20:17.501	2025-11-26 06:20:17.501
cmifm863o0026lh7khepk1vc2	cmifm85qw0004lh7kwlyhkyjs	Blood Sugar (Random/Fasting)	MANDATORY	Blood glucose level assessment	\N	\N	\N	15	3	\N	\N	\N	t	\N	2025-11-26 06:20:17.508	2025-11-26 06:20:17.508
cmifm863v0028lh7kb1zgcuh8	cmifm85qw0004lh7kwlyhkyjs	Blood Pressure Check	MANDATORY	Blood pressure measurement	\N	\N	\N	7	1	\N	\N	\N	t	\N	2025-11-26 06:20:17.515	2025-11-26 06:20:17.515
cmifm8643002alh7kimdmc9mg	cmifm85qw0004lh7kwlyhkyjs	ECG (Electrocardiogram)	AGE_SPECIFIC	Heart rhythm assessment for patients above 50 years	\N	\N	\N	30	7	50	\N	\N	t	\N	2025-11-26 06:20:17.523	2025-11-26 06:20:17.523
cmifm864b002clh7kbn7frphh	cmifm85qw0004lh7kwlyhkyjs	Chest X-ray	CONDITIONAL	Required for patients with respiratory conditions or above 60 years	\N	\N	\N	60	14	60	\N	["Respiratory conditions", "Smoking history", "Chronic cough"]	t	\N	2025-11-26 06:20:17.531	2025-11-26 06:20:17.531
\.


--
-- Data for Name: surgery_metrics; Type: TABLE DATA; Schema: public; Owner: tanuj
--

COPY public.surgery_metrics (id, "ipdAdmissionId", "surgeryStartTime", "surgeryEndTime", "surgeonId", "anesthesiaType", complications, "iolImplanted", "surgicalNotes", "intraOperativeFindings", "immediateComplications", "postOpInstructions", "followUpSchedule", "visualOutcome", "surgeryDuration", "bloodLoss", "patientTolerance", "surgicalComplexity", "equipmentUsed", "createdAt", "updatedAt", "implantedLensId") FROM stdin;
\.


--
-- Data for Name: surgery_packages; Type: TABLE DATA; Schema: public; Owner: tanuj
--

COPY public.surgery_packages (id, "surgeryTypeId", "packageName", "packageCode", description, "includedServices", "excludedServices", "defaultLensId", "packageCost", "lensUpgradeCost", "additionalCharges", "discountEligible", "warrantyPeriod", "followUpVisits", "emergencySupport", "isActive", "isRecommended", priority, "createdBy", "createdAt", "updatedAt", "relatedSurgeryNames", "surgeryCategory") FROM stdin;
cmid1sjtf0001lhy8bq1km2gg	\N	Acid and Alkali Burns OPD Management	PKG002	Acid and Alkali Burns OPD Management - Professional surgical package with comprehensive care	["Pre-operative consultation", "Surgical procedure", "Post-operative care", "Follow-up visits as specified", "Standard surgical technique"]	["Additional medications beyond standard protocol", "Extended hospitalization beyond normal recovery", "Treatment of unrelated complications"]	\N	2500	0	\N	t	\N	1	f	t	f	4	\N	2025-11-24 11:12:44.116	2025-11-24 11:12:44.116	\N	EMERGENCY
cmid1sju80003lhy85tql3c4e	\N	Automated Perimetry	PKG004	Automated Perimetry - Professional surgical package with comprehensive care	["Pre-operative consultation", "Surgical procedure", "Post-operative care", "Follow-up visits as specified", "Standard surgical technique"]	["Additional medications beyond standard protocol", "Extended hospitalization beyond normal recovery", "Treatment of unrelated complications"]	\N	5000	0	\N	t	\N	1	f	t	f	4	\N	2025-11-24 11:12:44.144	2025-11-24 11:12:44.144	\N	GLAUCOMA
cmid1sjuk0004lhy8vz7wo0id	\N	Barrage Laser Unilateral one sitting	PKG005	Barrage Laser Unilateral one sitting - Professional surgical package with comprehensive care	["Pre-operative consultation", "Surgical procedure", "Post-operative care", "Follow-up visits as specified", "Laser treatment"]	["Additional medications beyond standard protocol", "Extended hospitalization beyond normal recovery", "Treatment of unrelated complications"]	\N	7500	0	\N	t	\N	1	f	t	f	4	\N	2025-11-24 11:12:44.156	2025-11-24 11:12:44.156	\N	RETINAL
cmid1sjv10005lhy8pbjo6tbb	\N	Blepharoplasty	PKG006	Blepharoplasty - Professional surgical package with comprehensive care	["Pre-operative consultation", "Surgical procedure", "Post-operative care", "Follow-up visits as specified", "Standard surgical technique"]	["Additional medications beyond standard protocol", "Extended hospitalization beyond normal recovery", "Treatment of unrelated complications"]	\N	7500	0	\N	t	\N	1	f	t	f	4	\N	2025-11-24 11:12:44.173	2025-11-24 11:12:44.173	\N	OCULOPLASTIC
cmid1sjve0006lhy8joo4hrpv	\N	Buckle Removal	PKG007	Buckle Removal - Professional surgical package with comprehensive care	["Pre-operative consultation", "Surgical procedure", "Post-operative care", "Follow-up visits as specified", "Standard surgical technique"]	["Additional medications beyond standard protocol", "Extended hospitalization beyond normal recovery", "Treatment of unrelated complications"]	\N	45000	0	\N	t	3	2	f	t	f	3	\N	2025-11-24 11:12:44.187	2025-11-24 11:12:44.187	\N	RETINAL
cmid1sjwp0008lhy8bxubbahy	\N	Clinical Fundus Photograph	PKG009	Clinical Fundus Photograph - Professional surgical package with comprehensive care	["Pre-operative consultation", "Surgical procedure", "Post-operative care", "Follow-up visits as specified", "Standard surgical technique"]	["Additional medications beyond standard protocol", "Extended hospitalization beyond normal recovery", "Treatment of unrelated complications"]	\N	2500	0	\N	t	\N	1	f	t	f	4	\N	2025-11-24 11:12:44.234	2025-11-24 11:12:44.234	\N	RETINAL
cmid1sjxr000blhy8pg7x9wmh	cmid1pk2f000olhzwe39757ic	Corneal Pachymetry	PKG012	Corneal Pachymetry - Professional surgical package with comprehensive care	["Pre-operative consultation", "Surgical procedure", "Post-operative care", "Follow-up visits as specified", "Standard surgical technique"]	["Additional medications beyond standard protocol", "Extended hospitalization beyond normal recovery", "Treatment of unrelated complications"]	\N	1700	0	\N	t	\N	1	f	t	f	4	\N	2025-11-24 11:12:44.271	2025-11-26 08:08:24.779	\N	CORNEAL
cmid1sjy6000clhy8z2ahynxj	cmid1pk2f000olhzwe39757ic	Corneal Suture Removal under LA	PKG013	Corneal Suture Removal under LA - Professional surgical package with comprehensive care	["Pre-operative consultation", "Surgical procedure", "Post-operative care", "Follow-up visits as specified", "Standard surgical technique"]	["Additional medications beyond standard protocol", "Extended hospitalization beyond normal recovery", "Treatment of unrelated complications"]	\N	18500	0	\N	t	\N	1	f	t	f	4	\N	2025-11-24 11:12:44.286	2025-11-26 08:08:27.333	\N	CORNEAL
cmid1sjyj000dlhy827ij4va6	cmid1pk2f000olhzwe39757ic	Corneal Suturing with Anterior Chamber Reconstruction With Iris Prolapse Repair	PKG014	Corneal Suturing with Anterior Chamber Reconstruction With Iris Prolapse Repair - Professional surgical package with comprehensive care	["Pre-operative consultation", "Surgical procedure", "Post-operative care", "Follow-up visits as specified", "Standard surgical technique"]	["Additional medications beyond standard protocol", "Extended hospitalization beyond normal recovery", "Treatment of unrelated complications"]	\N	20000	0	\N	t	3	1	f	t	f	3	\N	2025-11-24 11:12:44.299	2025-11-26 08:08:32.199	\N	EMERGENCY
cmid1sjqo0000lhy8887cdopo	cmid1pk1a000klhzwf7mmnkf7	AC Paracentesis	PKG001	AC Paracentesis - Professional surgical package with comprehensive care	["Pre-operative consultation", "Surgical procedure", "Post-operative care", "Follow-up visits as specified", "Standard surgical technique"]	["Additional medications beyond standard protocol", "Extended hospitalization beyond normal recovery", "Treatment of unrelated complications"]	\N	5500	0	\N	t	\N	1	f	t	f	4	\N	2025-11-24 11:12:44.016	2025-11-26 10:39:28.274	\N	CATARACT
cmid1sjtr0002lhy8vi1iz4wu	cmid1pk1a000klhzwf7mmnkf7	Anterior Chamber Wash	PKG003	Anterior Chamber Wash - Professional surgical package with comprehensive care	["Pre-operative consultation", "Surgical procedure", "Post-operative care", "Follow-up visits as specified", "Standard surgical technique"]	["Additional medications beyond standard protocol", "Extended hospitalization beyond normal recovery", "Treatment of unrelated complications"]	\N	26000	0	\N	t	3	1	f	t	f	3	\N	2025-11-24 11:12:44.127	2025-11-26 10:39:32.001	\N	CATARACT
cmid1sjvw0007lhy8ca9z9cu7	cmifm85py0002lh7kxn3lgt4c	Chalazion	PKG008	Chalazion - Professional surgical package with comprehensive care	["Pre-operative consultation", "Surgical procedure", "Post-operative care", "Follow-up visits as specified", "Standard surgical technique"]	["Additional medications beyond standard protocol", "Extended hospitalization beyond normal recovery", "Treatment of unrelated complications"]	\N	7400	0	\N	t	\N	1	f	t	f	4	\N	2025-11-24 11:12:44.204	2025-11-27 10:56:16.569	\N	OCULOPLASTIC
cmid1sjx30009lhy8yw8ehd9r	cmifm85py0002lh7kxn3lgt4c	Corneal Collagen Cross Linking	PKG010	Corneal Collagen Cross Linking - Professional surgical package with comprehensive care	["Pre-operative consultation", "Surgical procedure", "Post-operative care", "Follow-up visits as specified", "Standard surgical technique"]	["Additional medications beyond standard protocol", "Extended hospitalization beyond normal recovery", "Treatment of unrelated complications"]	\N	42000	0	\N	t	3	2	f	t	f	3	\N	2025-11-24 11:12:44.247	2025-11-27 10:56:19.334	\N	CORNEAL
cmid1sjyw000elhy8o11bk1ma	\N	Corneal Topography	PKG015	Corneal Topography - Professional surgical package with comprehensive care	["Pre-operative consultation", "Surgical procedure", "Post-operative care", "Follow-up visits as specified", "Standard surgical technique"]	["Additional medications beyond standard protocol", "Extended hospitalization beyond normal recovery", "Treatment of unrelated complications"]	\N	6500	0	\N	t	\N	1	f	t	f	4	\N	2025-11-24 11:12:44.312	2025-11-24 11:12:44.312	\N	CORNEAL
cmid1sjz8000flhy8gi1xw3mq	\N	Cryoretinopexy	PKG016	Cryoretinopexy - Professional surgical package with comprehensive care	["Pre-operative consultation", "Surgical procedure", "Post-operative care", "Follow-up visits as specified", "Standard surgical technique"]	["Additional medications beyond standard protocol", "Extended hospitalization beyond normal recovery", "Treatment of unrelated complications"]	\N	55000	0	\N	t	6	2	t	t	t	2	\N	2025-11-24 11:12:44.325	2025-11-24 11:12:44.325	\N	RETINAL
cmid1sjzk000glhy8ddbym8zu	\N	Cyclocryotherapy	PKG017	Cyclocryotherapy - Professional surgical package with comprehensive care	["Pre-operative consultation", "Surgical procedure", "Post-operative care", "Follow-up visits as specified", "Standard surgical technique"]	["Additional medications beyond standard protocol", "Extended hospitalization beyond normal recovery", "Treatment of unrelated complications"]	\N	38000	0	\N	t	3	2	f	t	f	3	\N	2025-11-24 11:12:44.336	2025-11-24 11:12:44.336	\N	GLAUCOMA
cmid1sk08000ilhy870gk332s	\N	Dacryocystectomy (DCT)	PKG019	Dacryocystectomy (DCT) - Professional surgical package with comprehensive care	["Pre-operative consultation", "Surgical procedure", "Post-operative care", "Follow-up visits as specified", "Standard surgical technique"]	["Additional medications beyond standard protocol", "Extended hospitalization beyond normal recovery", "Treatment of unrelated complications"]	\N	25000	0	\N	t	3	1	f	t	f	3	\N	2025-11-24 11:12:44.36	2025-11-24 11:12:44.36	\N	OCULOPLASTIC
cmid1sk0k000jlhy8rl5btex0	\N	DALK	PKG020	DALK - Professional surgical package with comprehensive care	["Pre-operative consultation", "Surgical procedure", "Post-operative care", "Follow-up visits as specified", "Standard surgical technique"]	["Additional medications beyond standard protocol", "Extended hospitalization beyond normal recovery", "Treatment of unrelated complications"]	\N	75000	0	\N	t	6	2	t	t	t	2	\N	2025-11-24 11:12:44.373	2025-11-24 11:12:44.373	\N	CORNEAL
cmid1sk0w000klhy8v284mzmw	\N	DSAEK	PKG021	DSAEK - Professional surgical package with comprehensive care	["Pre-operative consultation", "Surgical procedure", "Post-operative care", "Follow-up visits as specified", "Standard surgical technique"]	["Additional medications beyond standard protocol", "Extended hospitalization beyond normal recovery", "Treatment of unrelated complications"]	\N	95000	0	\N	t	6	2	t	t	t	2	\N	2025-11-24 11:12:44.384	2025-11-24 11:12:44.384	\N	CORNEAL
cmid1sk19000llhy8fv5ed439	\N	Ectropion / Entropion Correction (Unilateral)	PKG022	Ectropion / Entropion Correction (Unilateral) - Professional surgical package with comprehensive care	["Pre-operative consultation", "Surgical procedure", "Post-operative care", "Follow-up visits as specified", "Standard surgical technique"]	["Additional medications beyond standard protocol", "Extended hospitalization beyond normal recovery", "Treatment of unrelated complications"]	\N	38000	0	\N	t	3	2	f	t	f	3	\N	2025-11-24 11:12:44.397	2025-11-24 11:12:44.397	\N	OCULOPLASTIC
cmid1sk1m000mlhy8s7bhexqa	\N	Endonasal Dacryocysto Rhinostomy (Endonasal DCR)	PKG023	Endonasal Dacryocysto Rhinostomy (Endonasal DCR) - Professional surgical package with comprehensive care	["Pre-operative consultation", "Surgical procedure", "Post-operative care", "Follow-up visits as specified", "Standard surgical technique"]	["Additional medications beyond standard protocol", "Extended hospitalization beyond normal recovery", "Treatment of unrelated complications"]	\N	38000	0	\N	t	3	2	f	t	f	3	\N	2025-11-24 11:12:44.41	2025-11-24 11:12:44.41	\N	OCULOPLASTIC
cmid1sk1z000nlhy8ggyf746l	\N	Enucleation / Evisceration	PKG024	Enucleation / Evisceration - Professional surgical package with comprehensive care	["Pre-operative consultation", "Surgical procedure", "Post-operative care", "Follow-up visits as specified", "Standard surgical technique"]	["Additional medications beyond standard protocol", "Extended hospitalization beyond normal recovery", "Treatment of unrelated complications"]	\N	38000	0	\N	t	3	2	f	t	f	3	\N	2025-11-24 11:12:44.423	2025-11-24 11:12:44.423	\N	OCULOPLASTIC
cmid1sk2b000olhy83bzrut7f	\N	Enucleation With Prosthesis Implant	PKG025	Enucleation With Prosthesis Implant - Professional surgical package with comprehensive care	["Pre-operative consultation", "Surgical procedure", "Post-operative care", "Follow-up visits as specified", "Standard surgical technique"]	["Additional medications beyond standard protocol", "Extended hospitalization beyond normal recovery", "Treatment of unrelated complications"]	\N	65000	0	\N	t	6	2	t	t	t	2	\N	2025-11-24 11:12:44.435	2025-11-24 11:12:44.435	\N	OCULOPLASTIC
cmid1sk2l000plhy8oiotjfyx	\N	Evisceration with implant	PKG026	Evisceration with implant - Professional surgical package with comprehensive care	["Pre-operative consultation", "Surgical procedure", "Post-operative care", "Follow-up visits as specified", "Standard surgical technique"]	["Additional medications beyond standard protocol", "Extended hospitalization beyond normal recovery", "Treatment of unrelated complications"]	\N	65000	0	\N	t	6	2	t	t	t	2	\N	2025-11-24 11:12:44.445	2025-11-24 11:12:44.445	\N	OCULOPLASTIC
cmid1sk32000qlhy8373ijp7r	\N	Excimer laser (LASIK) Refractive Surgery Bilateral	PKG027	Excimer laser (LASIK) Refractive Surgery Bilateral - Professional surgical package with comprehensive care	["Pre-operative consultation", "Surgical procedure", "Post-operative care", "Follow-up visits as specified", "Standard surgical technique"]	["Additional medications beyond standard protocol", "Extended hospitalization beyond normal recovery", "Treatment of unrelated complications"]	\N	95000	0	\N	t	12	3	t	t	t	2	\N	2025-11-24 11:12:44.463	2025-11-24 11:12:44.463	\N	CORNEAL
cmid1sk3f000rlhy8id6idfbu	\N	Excimer laser (LASIK) Refractive Surgery Unilateral	PKG028	Excimer laser (LASIK) Refractive Surgery Unilateral - Professional surgical package with comprehensive care	["Pre-operative consultation", "Surgical procedure", "Post-operative care", "Follow-up visits as specified", "Standard surgical technique"]	["Additional medications beyond standard protocol", "Extended hospitalization beyond normal recovery", "Treatment of unrelated complications"]	\N	53000	0	\N	t	12	3	t	t	t	2	\N	2025-11-24 11:12:44.476	2025-11-24 11:12:44.476	\N	CORNEAL
cmid1sk3r000slhy8qngoyq3w	\N	Exenteration	PKG029	Exenteration - Professional surgical package with comprehensive care	["Pre-operative consultation", "Surgical procedure", "Post-operative care", "Follow-up visits as specified", "Standard surgical technique"]	["Additional medications beyond standard protocol", "Extended hospitalization beyond normal recovery", "Treatment of unrelated complications"]	\N	78000	0	\N	t	6	2	t	t	t	2	\N	2025-11-24 11:12:44.487	2025-11-24 11:12:44.487	\N	OCULOPLASTIC
cmid1sk48000tlhy8no221xsy	\N	Eyelid tumour excision	PKG030	Eyelid tumour excision - Professional surgical package with comprehensive care	["Pre-operative consultation", "Surgical procedure", "Post-operative care", "Follow-up visits as specified", "Standard surgical technique"]	["Additional medications beyond standard protocol", "Extended hospitalization beyond normal recovery", "Treatment of unrelated complications"]	\N	25000	0	\N	t	3	1	f	t	f	3	\N	2025-11-24 11:12:44.504	2025-11-24 11:12:44.504	\N	OCULOPLASTIC
cmid1sk4i000ulhy8qw843ok0	\N	Eyelid reconstruction	PKG031	Eyelid reconstruction - Professional surgical package with comprehensive care	["Pre-operative consultation", "Surgical procedure", "Post-operative care", "Follow-up visits as specified", "Standard surgical technique"]	["Additional medications beyond standard protocol", "Extended hospitalization beyond normal recovery", "Treatment of unrelated complications"]	\N	48000	0	\N	t	3	2	f	t	f	3	\N	2025-11-24 11:12:44.514	2025-11-24 11:12:44.514	\N	OCULOPLASTIC
cmid1sk4v000vlhy8j7vwn8d5	\N	Focal Laser (Unilateral) Single Sitting	PKG032	Focal Laser (Unilateral) Single Sitting - Professional surgical package with comprehensive care	["Pre-operative consultation", "Surgical procedure", "Post-operative care", "Follow-up visits as specified", "Laser treatment"]	["Additional medications beyond standard protocol", "Extended hospitalization beyond normal recovery", "Treatment of unrelated complications"]	\N	9500	0	\N	t	\N	1	f	t	f	4	\N	2025-11-24 11:12:44.527	2025-11-24 11:12:44.527	\N	RETINAL
cmid1sk5l000wlhy82c1ctie7	\N	Fundus Fluorescein Angiography	PKG033	Fundus Fluorescein Angiography - Professional surgical package with comprehensive care	["Pre-operative consultation", "Surgical procedure", "Post-operative care", "Follow-up visits as specified", "Standard surgical technique"]	["Additional medications beyond standard protocol", "Extended hospitalization beyond normal recovery", "Treatment of unrelated complications"]	\N	8000	0	\N	t	\N	1	f	t	f	4	\N	2025-11-24 11:12:44.553	2025-11-24 11:12:44.553	\N	RETINAL
cmid1sk5z000xlhy8ubdn085b	\N	Goniotomy	PKG034	Goniotomy - Professional surgical package with comprehensive care	["Pre-operative consultation", "Surgical procedure", "Post-operative care", "Follow-up visits as specified", "Standard surgical technique"]	["Additional medications beyond standard protocol", "Extended hospitalization beyond normal recovery", "Treatment of unrelated complications"]	\N	48000	0	\N	t	3	2	f	t	f	3	\N	2025-11-24 11:12:44.568	2025-11-24 11:12:44.568	\N	GLAUCOMA
cmid1sk6c000ylhy8u58u8yed	\N	I & D Lid Abscess Drainage	PKG035	I & D Lid Abscess Drainage - Professional surgical package with comprehensive care	["Pre-operative consultation", "Surgical procedure", "Post-operative care", "Follow-up visits as specified", "Standard surgical technique"]	["Additional medications beyond standard protocol", "Extended hospitalization beyond normal recovery", "Treatment of unrelated complications"]	\N	24000	0	\N	t	3	1	f	t	f	3	\N	2025-11-24 11:12:44.581	2025-11-24 11:12:44.581	\N	OCULOPLASTIC
cmid1sk6o000zlhy8i7b5rjt2	\N	Intraocular Foreign Body Removal With Vitrectomy	PKG036	Intraocular Foreign Body Removal With Vitrectomy - Professional surgical package with comprehensive care	["Pre-operative consultation", "Surgical procedure", "Post-operative care", "Follow-up visits as specified", "Standard surgical technique"]	["Additional medications beyond standard protocol", "Extended hospitalization beyond normal recovery", "Treatment of unrelated complications"]	\N	86500	0	\N	t	6	4	t	t	t	2	\N	2025-11-24 11:12:44.592	2025-11-24 11:12:44.592	\N	EMERGENCY
cmid1sk710010lhy8ji98gp3w	\N	IOL Dialing	PKG037	IOL Dialing - Professional surgical package with comprehensive care	["Pre-operative consultation", "Surgical procedure", "Post-operative care", "Follow-up visits as specified", "Standard surgical technique"]	["Additional medications beyond standard protocol", "Extended hospitalization beyond normal recovery", "Treatment of unrelated complications"]	\N	32500	6500	\N	t	3	2	f	t	f	3	\N	2025-11-24 11:12:44.606	2025-11-24 11:12:44.606	\N	CATARACT
cmid1sk7h0011lhy85ekatyqr	\N	IRIS Prolapse Repair	PKG038	IRIS Prolapse Repair - Professional surgical package with comprehensive care	["Pre-operative consultation", "Surgical procedure", "Post-operative care", "Follow-up visits as specified", "Standard surgical technique"]	["Additional medications beyond standard protocol", "Extended hospitalization beyond normal recovery", "Treatment of unrelated complications"]	\N	42000	0	\N	t	3	2	f	t	f	3	\N	2025-11-24 11:12:44.621	2025-11-24 11:12:44.621	\N	EMERGENCY
cmid1sk7w0012lhy8p2zp7fpm	\N	Kerato Prosthesis	PKG039	Kerato Prosthesis - Professional surgical package with comprehensive care	["Pre-operative consultation", "Surgical procedure", "Post-operative care", "Follow-up visits as specified", "Standard surgical technique"]	["Additional medications beyond standard protocol", "Extended hospitalization beyond normal recovery", "Treatment of unrelated complications"]	\N	10500	0	\N	t	\N	1	f	t	f	4	\N	2025-11-24 11:12:44.637	2025-11-24 11:12:44.637	\N	CORNEAL
cmid1sk860013lhy80cdwviyi	\N	Laser Iridectomy	PKG040	Laser Iridectomy - Professional surgical package with comprehensive care	["Pre-operative consultation", "Surgical procedure", "Post-operative care", "Follow-up visits as specified", "Laser treatment"]	["Additional medications beyond standard protocol", "Extended hospitalization beyond normal recovery", "Treatment of unrelated complications"]	\N	7500	0	\N	t	\N	1	f	t	f	4	\N	2025-11-24 11:12:44.646	2025-11-24 11:12:44.646	\N	GLAUCOMA
cmid1sk8h0014lhy8wazukxvp	\N	Lensectomy + anterior vitrectomy + secondary IOL (excluding IOL charges)	PKG041	Lensectomy + anterior vitrectomy + secondary IOL (excluding IOL charges) - Professional surgical package with comprehensive care	["Pre-operative consultation", "Surgical procedure", "Post-operative care", "Follow-up visits as specified", "Standard surgical technique"]	["Additional medications beyond standard protocol", "Extended hospitalization beyond normal recovery", "Treatment of unrelated complications"]	\N	55000	11000	\N	t	6	2	t	t	t	2	\N	2025-11-24 11:12:44.657	2025-11-24 11:12:44.657	\N	CATARACT
cmid1sk8v0015lhy8zu1m6rnc	\N	Lid Tear Suturing	PKG042	Lid Tear Suturing - Professional surgical package with comprehensive care	["Pre-operative consultation", "Surgical procedure", "Post-operative care", "Follow-up visits as specified", "Standard surgical technique"]	["Additional medications beyond standard protocol", "Extended hospitalization beyond normal recovery", "Treatment of unrelated complications"]	\N	45500	0	\N	t	3	2	f	t	f	3	\N	2025-11-24 11:12:44.672	2025-11-24 11:12:44.672	\N	EMERGENCY
cmid1sk990016lhy8fzc2h1d2	\N	Limbal Dermoid Removal	PKG043	Limbal Dermoid Removal - Professional surgical package with comprehensive care	["Pre-operative consultation", "Surgical procedure", "Post-operative care", "Follow-up visits as specified", "Standard surgical technique"]	["Additional medications beyond standard protocol", "Extended hospitalization beyond normal recovery", "Treatment of unrelated complications"]	\N	39000	0	\N	t	3	2	f	t	f	3	\N	2025-11-24 11:12:44.685	2025-11-24 11:12:44.685	\N	CORNEAL
cmid1sk9j0017lhy8u7r3foqe	\N	Limbal Stem Cell Grafting	PKG044	Limbal Stem Cell Grafting - Professional surgical package with comprehensive care	["Pre-operative consultation", "Surgical procedure", "Post-operative care", "Follow-up visits as specified", "Standard surgical technique"]	["Additional medications beyond standard protocol", "Extended hospitalization beyond normal recovery", "Treatment of unrelated complications"]	\N	65500	0	\N	t	6	2	t	t	t	2	\N	2025-11-24 11:12:44.695	2025-11-24 11:12:44.695	\N	CORNEAL
cmid1sk9s0018lhy8ho3wfss0	\N	Macular Hole Surgery	PKG045	Macular Hole Surgery - Professional surgical package with comprehensive care	["Pre-operative consultation", "Surgical procedure", "Post-operative care", "Follow-up visits as specified", "Standard surgical technique"]	["Additional medications beyond standard protocol", "Extended hospitalization beyond normal recovery", "Treatment of unrelated complications"]	\N	92000	0	\N	t	6	2	t	t	t	2	\N	2025-11-24 11:12:44.704	2025-11-24 11:12:44.704	\N	RETINAL
cmid1ska20019lhy8cig9ro57	\N	ND Yag Laser Posterior Capsulectomy (Unilateral)	PKG046	ND Yag Laser Posterior Capsulectomy (Unilateral) - Professional surgical package with comprehensive care	["Pre-operative consultation", "Surgical procedure", "Post-operative care", "Follow-up visits as specified", "Laser treatment"]	["Additional medications beyond standard protocol", "Extended hospitalization beyond normal recovery", "Treatment of unrelated complications"]	\N	5400	0	\N	t	\N	1	f	t	f	4	\N	2025-11-24 11:12:44.714	2025-11-24 11:12:44.714	\N	CATARACT
cmid1skac001alhy8823baxd0	\N	OCT (Optical Coherence Tomography)	PKG047	OCT (Optical Coherence Tomography) - Professional surgical package with comprehensive care	["Pre-operative consultation", "Surgical procedure", "Post-operative care", "Follow-up visits as specified", "Standard surgical technique"]	["Additional medications beyond standard protocol", "Extended hospitalization beyond normal recovery", "Treatment of unrelated complications"]	\N	7800	0	\N	t	\N	1	f	t	f	4	\N	2025-11-24 11:12:44.725	2025-11-24 11:12:44.725	\N	RETINAL
cmid1skas001blhy8szvvls1c	\N	Ocular Examination under GA	PKG048	Ocular Examination under GA - Professional surgical package with comprehensive care	["Pre-operative consultation", "Surgical procedure", "Post-operative care", "Follow-up visits as specified", "Standard surgical technique"]	["Additional medications beyond standard protocol", "Extended hospitalization beyond normal recovery", "Treatment of unrelated complications"]	\N	17000	0	\N	t	\N	1	f	t	f	4	\N	2025-11-24 11:12:44.741	2025-11-24 11:12:44.741	\N	EMERGENCY
cmid1skb8001clhy8wdd55o2j	\N	Optical Biometry / A Scan	PKG049	Optical Biometry / A Scan - Professional surgical package with comprehensive care	["Pre-operative consultation", "Surgical procedure", "Post-operative care", "Follow-up visits as specified", "Standard surgical technique"]	["Additional medications beyond standard protocol", "Extended hospitalization beyond normal recovery", "Treatment of unrelated complications"]	\N	2550	0	\N	t	\N	1	f	t	f	4	\N	2025-11-24 11:12:44.756	2025-11-24 11:12:44.756	\N	CATARACT
cmid1skbl001dlhy8li4jrqik	\N	Orbitotomy	PKG050	Orbitotomy - Professional surgical package with comprehensive care	["Pre-operative consultation", "Surgical procedure", "Post-operative care", "Follow-up visits as specified", "Standard surgical technique"]	["Additional medications beyond standard protocol", "Extended hospitalization beyond normal recovery", "Treatment of unrelated complications"]	\N	78000	0	\N	t	6	2	t	t	t	2	\N	2025-11-24 11:12:44.769	2025-11-24 11:12:44.769	\N	OCULOPLASTIC
cmid1skck001elhy8d7ck9mca	\N	Ortho–Optic Exercises per session	PKG051	Ortho–Optic Exercises per session - Professional surgical package with comprehensive care	["Pre-operative consultation", "Surgical procedure", "Post-operative care", "Follow-up visits as specified", "Standard surgical technique"]	["Additional medications beyond standard protocol", "Extended hospitalization beyond normal recovery", "Treatment of unrelated complications"]	\N	700	0	\N	t	\N	1	f	t	f	4	\N	2025-11-24 11:12:44.805	2025-11-24 11:12:44.805	\N	OCULOPLASTIC
cmid1skcw001flhy8sr6kquzv	\N	Orthoptic Checkup	PKG052	Orthoptic Checkup - Professional surgical package with comprehensive care	["Pre-operative consultation", "Surgical procedure", "Post-operative care", "Follow-up visits as specified", "Standard surgical technique"]	["Additional medications beyond standard protocol", "Extended hospitalization beyond normal recovery", "Treatment of unrelated complications"]	\N	1500	0	\N	t	\N	1	f	t	f	4	\N	2025-11-24 11:12:44.817	2025-11-24 11:12:44.817	\N	OCULOPLASTIC
cmid1skd8001glhy85jl49ifr	\N	Penetrating keratoplasty	PKG053	Penetrating keratoplasty - Professional surgical package with comprehensive care	["Pre-operative consultation", "Surgical procedure", "Post-operative care", "Follow-up visits as specified", "Standard surgical technique"]	["Additional medications beyond standard protocol", "Extended hospitalization beyond normal recovery", "Treatment of unrelated complications"]	\N	85000	0	\N	t	6	2	t	t	t	2	\N	2025-11-24 11:12:44.828	2025-11-24 11:12:44.828	\N	CORNEAL
cmid1skdh001hlhy8kyfz1zqh	\N	Perforating Cornea – Scleral Injury Reconstruction with Vitrectomy	PKG054	Perforating Cornea – Scleral Injury Reconstruction with Vitrectomy - Professional surgical package with comprehensive care	["Pre-operative consultation", "Surgical procedure", "Post-operative care", "Follow-up visits as specified", "Standard surgical technique"]	["Additional medications beyond standard protocol", "Extended hospitalization beyond normal recovery", "Treatment of unrelated complications"]	\N	110000	0	\N	t	6	4	t	t	t	1	\N	2025-11-24 11:12:44.837	2025-11-24 11:12:44.837	\N	EMERGENCY
cmid1skdx001ilhy8s1ohdmhb	\N	Preoperative LASIK Assessment	PKG055	Preoperative LASIK Assessment - Professional surgical package with comprehensive care	["Pre-operative consultation", "Surgical procedure", "Post-operative care", "Follow-up visits as specified", "Standard surgical technique"]	["Additional medications beyond standard protocol", "Extended hospitalization beyond normal recovery", "Treatment of unrelated complications"]	\N	9200	0	\N	t	12	3	f	t	t	4	\N	2025-11-24 11:12:44.853	2025-11-24 11:12:44.853	\N	CORNEAL
cmid1skec001jlhy8sppvux58	\N	Primary Corneal Tear Repair	PKG056	Primary Corneal Tear Repair - Professional surgical package with comprehensive care	["Pre-operative consultation", "Surgical procedure", "Post-operative care", "Follow-up visits as specified", "Standard surgical technique"]	["Additional medications beyond standard protocol", "Extended hospitalization beyond normal recovery", "Treatment of unrelated complications"]	\N	65000	0	\N	t	6	2	t	t	t	2	\N	2025-11-24 11:12:44.868	2025-11-24 11:12:44.868	\N	EMERGENCY
cmid1sken001klhy8m0b6g2wf	\N	Primary Globe Rupture Repair	PKG057	Primary Globe Rupture Repair - Professional surgical package with comprehensive care	["Pre-operative consultation", "Surgical procedure", "Post-operative care", "Follow-up visits as specified", "Standard surgical technique"]	["Additional medications beyond standard protocol", "Extended hospitalization beyond normal recovery", "Treatment of unrelated complications"]	\N	45000	0	\N	t	3	2	f	t	f	3	\N	2025-11-24 11:12:44.879	2025-11-24 11:12:44.879	\N	EMERGENCY
cmid1skez001llhy8aphddcgx	\N	Primary Lid Tear Repair	PKG058	Primary Lid Tear Repair - Professional surgical package with comprehensive care	["Pre-operative consultation", "Surgical procedure", "Post-operative care", "Follow-up visits as specified", "Standard surgical technique"]	["Additional medications beyond standard protocol", "Extended hospitalization beyond normal recovery", "Treatment of unrelated complications"]	\N	16000	0	\N	t	\N	1	f	t	f	4	\N	2025-11-24 11:12:44.891	2025-11-24 11:12:44.891	\N	EMERGENCY
cmid1skfb001mlhy8x6r39067	\N	Probing under GA	PKG059	Probing under GA - Professional surgical package with comprehensive care	["Pre-operative consultation", "Surgical procedure", "Post-operative care", "Follow-up visits as specified", "Standard surgical technique"]	["Additional medications beyond standard protocol", "Extended hospitalization beyond normal recovery", "Treatment of unrelated complications"]	\N	15000	0	\N	t	\N	1	f	t	f	4	\N	2025-11-24 11:12:44.903	2025-11-24 11:12:44.903	\N	OCULOPLASTIC
cmid1skfq001nlhy8u9x9dttz	\N	PRP Laser For Retinopathy Unilateral Single Sitting	PKG060	PRP Laser For Retinopathy Unilateral Single Sitting - Professional surgical package with comprehensive care	["Pre-operative consultation", "Surgical procedure", "Post-operative care", "Follow-up visits as specified", "Laser treatment"]	["Additional medications beyond standard protocol", "Extended hospitalization beyond normal recovery", "Treatment of unrelated complications"]	\N	5500	0	\N	t	\N	1	f	t	f	4	\N	2025-11-24 11:12:44.918	2025-11-24 11:12:44.918	\N	RETINAL
cmid1skg5001olhy88gktpbzf	\N	Pterygium Excision With Sutured Conjunctival Grafting Unilateral	PKG061	Pterygium Excision With Sutured Conjunctival Grafting Unilateral - Professional surgical package with comprehensive care	["Pre-operative consultation", "Surgical procedure", "Post-operative care", "Follow-up visits as specified", "Standard surgical technique"]	["Additional medications beyond standard protocol", "Extended hospitalization beyond normal recovery", "Treatment of unrelated complications"]	\N	26000	0	\N	t	3	1	f	t	f	3	\N	2025-11-24 11:12:44.933	2025-11-24 11:12:44.933	\N	CORNEAL
cmid1skgg001plhy8svfgh6mt	\N	Pterygium Excision With Sutureless Conjunctival Grafting With Fibrin Sealant Unilateral	PKG062	Pterygium Excision With Sutureless Conjunctival Grafting With Fibrin Sealant Unilateral - Professional surgical package with comprehensive care	["Pre-operative consultation", "Surgical procedure", "Post-operative care", "Follow-up visits as specified", "Standard surgical technique"]	["Additional medications beyond standard protocol", "Extended hospitalization beyond normal recovery", "Treatment of unrelated complications"]	\N	44500	0	\N	t	3	2	f	t	f	3	\N	2025-11-24 11:12:44.944	2025-11-24 11:12:44.944	\N	CORNEAL
cmid1skgr001qlhy8hy4z7t7c	\N	Ptosis correction Unilateral	PKG063	Ptosis correction Unilateral - Professional surgical package with comprehensive care	["Pre-operative consultation", "Surgical procedure", "Post-operative care", "Follow-up visits as specified", "Standard surgical technique"]	["Additional medications beyond standard protocol", "Extended hospitalization beyond normal recovery", "Treatment of unrelated complications"]	\N	96500	0	\N	t	6	2	t	t	t	2	\N	2025-11-24 11:12:44.955	2025-11-24 11:12:44.955	\N	OCULOPLASTIC
cmid1skh2001rlhy8q0zyq5wb	\N	Retinal Detachment Surgery With Vitrectomy With Silicon Oil	PKG064	Retinal Detachment Surgery With Vitrectomy With Silicon Oil - Professional surgical package with comprehensive care	["Pre-operative consultation", "Surgical procedure", "Post-operative care", "Follow-up visits as specified", "Standard surgical technique"]	["Additional medications beyond standard protocol", "Extended hospitalization beyond normal recovery", "Treatment of unrelated complications"]	\N	120000	0	\N	t	6	4	t	t	t	1	\N	2025-11-24 11:12:44.966	2025-11-24 11:12:44.966	\N	RETINAL
cmid1skhb001slhy84u3jtcr0	\N	Scleral Buckle with 3 Port Pars Plana Vitrectomy With Silicon Oil	PKG065	Scleral Buckle with 3 Port Pars Plana Vitrectomy With Silicon Oil - Professional surgical package with comprehensive care	["Pre-operative consultation", "Surgical procedure", "Post-operative care", "Follow-up visits as specified", "Standard surgical technique"]	["Additional medications beyond standard protocol", "Extended hospitalization beyond normal recovery", "Treatment of unrelated complications"]	\N	120000	0	\N	t	6	4	t	t	t	1	\N	2025-11-24 11:12:44.975	2025-11-24 11:12:44.975	\N	RETINAL
cmid1skhn001tlhy8v6rbxp2d	\N	Scleral buckle WITH Cryotherapy	PKG066	Scleral buckle WITH Cryotherapy - Professional surgical package with comprehensive care	["Pre-operative consultation", "Surgical procedure", "Post-operative care", "Follow-up visits as specified", "Standard surgical technique"]	["Additional medications beyond standard protocol", "Extended hospitalization beyond normal recovery", "Treatment of unrelated complications"]	\N	48000	0	\N	t	3	2	f	t	f	3	\N	2025-11-24 11:12:44.987	2025-11-24 11:12:44.987	\N	RETINAL
cmid1skhz001ulhy8jw64oeqa	\N	Secondary IOL Implant (Excluding IOL Charges)	PKG067	Secondary IOL Implant (Excluding IOL Charges) - Professional surgical package with comprehensive care	["Pre-operative consultation", "Surgical procedure", "Post-operative care", "Follow-up visits as specified", "Standard surgical technique"]	["Additional medications beyond standard protocol", "Extended hospitalization beyond normal recovery", "Treatment of unrelated complications"]	\N	46500	9300	\N	t	3	2	f	t	f	3	\N	2025-11-24 11:12:45	2025-11-24 11:12:45	\N	CATARACT
cmid1skie001vlhy8huq9wjs9	\N	Silicone Oil Removal With Endolaser	PKG068	Silicone Oil Removal With Endolaser - Professional surgical package with comprehensive care	["Pre-operative consultation", "Surgical procedure", "Post-operative care", "Follow-up visits as specified", "Standard surgical technique"]	["Additional medications beyond standard protocol", "Extended hospitalization beyond normal recovery", "Treatment of unrelated complications"]	\N	84000	0	\N	t	6	2	t	t	t	2	\N	2025-11-24 11:12:45.014	2025-11-24 11:12:45.014	\N	RETINAL
cmid1skis001wlhy860l0yaf6	\N	SIRION Cataract Surgery With PMMA IOL Implant	PKG069	SIRION Cataract Surgery With PMMA IOL Implant - Professional surgical package with comprehensive care	["Pre-operative consultation", "Surgical procedure", "Post-operative care", "Follow-up visits as specified", "Standard surgical technique"]	["Additional medications beyond standard protocol", "Extended hospitalization beyond normal recovery", "Treatment of unrelated complications"]	\N	27200	5440	\N	t	12	3	f	t	t	3	\N	2025-11-24 11:12:45.028	2025-11-24 11:12:45.028	\N	CATARACT
cmid1skj5001xlhy8mth3p7c4	\N	Small Tumor of Lid / Cyst Excision	PKG070	Small Tumor of Lid / Cyst Excision - Professional surgical package with comprehensive care	["Pre-operative consultation", "Surgical procedure", "Post-operative care", "Follow-up visits as specified", "Standard surgical technique"]	["Additional medications beyond standard protocol", "Extended hospitalization beyond normal recovery", "Treatment of unrelated complications"]	\N	20000	0	\N	t	3	1	f	t	f	3	\N	2025-11-24 11:12:45.041	2025-11-24 11:12:45.041	\N	OCULOPLASTIC
cmid1skjg001ylhy8e9tz0yfc	\N	Squint Correction	PKG071	Squint Correction - Professional surgical package with comprehensive care	["Pre-operative consultation", "Surgical procedure", "Post-operative care", "Follow-up visits as specified", "Standard surgical technique"]	["Additional medications beyond standard protocol", "Extended hospitalization beyond normal recovery", "Treatment of unrelated complications"]	\N	58500	0	\N	t	6	2	t	t	t	2	\N	2025-11-24 11:12:45.053	2025-11-24 11:12:45.053	\N	OCULOPLASTIC
cmid1skjq001zlhy850198af9	\N	Surgical Iridectomy	PKG072	Surgical Iridectomy - Professional surgical package with comprehensive care	["Pre-operative consultation", "Surgical procedure", "Post-operative care", "Follow-up visits as specified", "Standard surgical technique"]	["Additional medications beyond standard protocol", "Extended hospitalization beyond normal recovery", "Treatment of unrelated complications"]	\N	34000	0	\N	t	3	2	f	t	f	3	\N	2025-11-24 11:12:45.062	2025-11-24 11:12:45.062	\N	GLAUCOMA
cmid1skk30020lhy8ypvnftzo	\N	Surgical Posterior Capsulectomy	PKG073	Surgical Posterior Capsulectomy - Professional surgical package with comprehensive care	["Pre-operative consultation", "Surgical procedure", "Post-operative care", "Follow-up visits as specified", "Standard surgical technique"]	["Additional medications beyond standard protocol", "Extended hospitalization beyond normal recovery", "Treatment of unrelated complications"]	\N	40000	0	\N	t	3	2	f	t	f	3	\N	2025-11-24 11:12:45.075	2025-11-24 11:12:45.075	\N	CATARACT
cmid1skkf0021lhy8y4hi50ju	\N	Trabeculectomy	PKG074	Trabeculectomy - Professional surgical package with comprehensive care	["Pre-operative consultation", "Surgical procedure", "Post-operative care", "Follow-up visits as specified", "Standard surgical technique"]	["Additional medications beyond standard protocol", "Extended hospitalization beyond normal recovery", "Treatment of unrelated complications"]	\N	53500	0	\N	t	6	2	t	t	t	2	\N	2025-11-24 11:12:45.088	2025-11-24 11:12:45.088	\N	GLAUCOMA
cmid1skks0022lhy8yzn1z88c	\N	Tractional Retinal Detachment Surgery With Silicon Oil WITH Endolaser	PKG075	Tractional Retinal Detachment Surgery With Silicon Oil WITH Endolaser - Professional surgical package with comprehensive care	["Pre-operative consultation", "Surgical procedure", "Post-operative care", "Follow-up visits as specified", "Standard surgical technique"]	["Additional medications beyond standard protocol", "Extended hospitalization beyond normal recovery", "Treatment of unrelated complications"]	\N	92000	0	\N	t	6	4	t	t	t	2	\N	2025-11-24 11:12:45.101	2025-11-24 11:12:45.101	\N	RETINAL
cmid1skl30023lhy8ggnxf314	\N	Traumatic Conjunctival Tear Repair	PKG076	Traumatic Conjunctival Tear Repair - Professional surgical package with comprehensive care	["Pre-operative consultation", "Surgical procedure", "Post-operative care", "Follow-up visits as specified", "Standard surgical technique"]	["Additional medications beyond standard protocol", "Extended hospitalization beyond normal recovery", "Treatment of unrelated complications"]	\N	15000	0	\N	t	\N	1	f	t	f	4	\N	2025-11-24 11:12:45.111	2025-11-24 11:12:45.111	\N	EMERGENCY
cmid1sklf0024lhy8ozk4wsx0	\N	Vitrectomy	PKG077	Vitrectomy - Professional surgical package with comprehensive care	["Pre-operative consultation", "Surgical procedure", "Post-operative care", "Follow-up visits as specified", "Standard surgical technique"]	["Additional medications beyond standard protocol", "Extended hospitalization beyond normal recovery", "Treatment of unrelated complications"]	\N	58000	0	\N	t	6	4	t	t	t	2	\N	2025-11-24 11:12:45.123	2025-11-24 11:12:45.123	\N	RETINAL
cmid1sklq0025lhy86fk48lbu	\N	Vitrectomy With Epiretinal Membrane Peeling	PKG078	Vitrectomy With Epiretinal Membrane Peeling - Professional surgical package with comprehensive care	["Pre-operative consultation", "Surgical procedure", "Post-operative care", "Follow-up visits as specified", "Standard surgical technique"]	["Additional medications beyond standard protocol", "Extended hospitalization beyond normal recovery", "Treatment of unrelated complications"]	\N	84000	0	\N	t	6	4	t	t	t	2	\N	2025-11-24 11:12:45.134	2025-11-24 11:12:45.134	\N	RETINAL
cmid1skm40026lhy8gz60qlaj	\N	Vitrectomy With Silicon Oil	PKG079	Vitrectomy With Silicon Oil - Professional surgical package with comprehensive care	["Pre-operative consultation", "Surgical procedure", "Post-operative care", "Follow-up visits as specified", "Standard surgical technique"]	["Additional medications beyond standard protocol", "Extended hospitalization beyond normal recovery", "Treatment of unrelated complications"]	\N	84000	0	\N	t	6	4	t	t	t	2	\N	2025-11-24 11:12:45.148	2025-11-24 11:12:45.148	\N	RETINAL
cmifm85xl000ylh7kw17ouqje	cmifm85pj0001lh7k9a4kufiy	Standard LASIK Package	LAS-STD	Standard LASIK surgery for vision correction	["Pre-op evaluation", "LASIK surgery", "Post-op medications", "4 follow-up visits"]	["Wavefront-guided treatment", "Enhancement procedures"]	\N	45000	0	\N	t	12	4	f	t	t	1	\N	2025-11-26 06:20:17.288	2025-11-26 06:20:17.288	\N	\N
cmifm85v0000ilh7k94dbgkh3	cmifm85nd0000lh7kr0y660d4	Premium Cataract Package	CAT-PREMIUM	Premium cataract surgery with advanced IOL options	["Surgery", "Premium IOL", "Advanced biometry", "Post-op medications", "5 follow-up visits"]	["Multifocal lens upgrade"]	\N	35000	5000	\N	t	24	5	f	t	f	2	\N	2025-11-26 06:20:17.196	2025-11-26 06:20:17.196	\N	\N
cmifm85w4000qlh7kzjick0xd	cmifm85nd0000lh7kr0y660d4	Luxury Multifocal Package	CAT-LUXURY	Premium cataract surgery with multifocal lens for spectacle independence	["Surgery", "Multifocal IOL", "Advanced biometry", "Wavefront analysis", "Post-op medications", "6 follow-up visits", "Emergency support"]	[]	\N	55000	0	\N	t	36	6	t	t	f	3	\N	2025-11-26 06:20:17.236	2025-11-26 06:20:17.236	\N	\N
cmid1sjxg000alhy87hb3cuht	cmid1pk2f000olhzwe39757ic	Corneal Foreign Body Removal (Unilateral) OPD Management	PKG011	Corneal Foreign Body Removal (Unilateral) OPD Management - Professional surgical package with comprehensive care	["Pre-operative consultation", "Surgical procedure", "Post-operative care", "Follow-up visits as specified", "Standard surgical technique"]	["Additional medications beyond standard protocol", "Extended hospitalization beyond normal recovery", "Treatment of unrelated complications"]	\N	1200	0	\N	t	\N	1	f	t	f	4	\N	2025-11-24 11:12:44.26	2025-11-26 08:08:20.994	\N	EMERGENCY
cmid1sjzw000hlhy8yvmzs09i	cmifm85py0002lh7kxn3lgt4c	Dacryocysto Rhinostomy (Conventional DCR)	PKG018	Dacryocysto Rhinostomy (Conventional DCR) - Professional surgical package with comprehensive care	["Pre-operative consultation", "Surgical procedure", "Post-operative care", "Follow-up visits as specified", "Standard surgical technique"]	["Additional medications beyond standard protocol", "Extended hospitalization beyond normal recovery", "Treatment of unrelated complications"]	\N	32000	0	\N	t	3	2	f	t	f	3	\N	2025-11-24 11:12:44.348	2025-11-27 10:56:27.609	\N	OCULOPLASTIC
\.


--
-- Data for Name: surgery_types; Type: TABLE DATA; Schema: public; Owner: tanuj
--

COPY public.surgery_types (id, name, code, category, description, "averageDuration", "complexityLevel", "requiresAnesthesia", "isOutpatient", "requiresAdmission", "requiredEquipment", "preOpRequirements", "postOpInstructions", "followUpSchedule", "baseCost", "additionalCharges", "isActive", "createdBy", "createdAt", "updatedAt", "investigationIds") FROM stdin;
cmid1pjwx0007lhzw8v4phg4s	Cataract surgery	CATARACTSU	CATARACT	Cataract surgery - Requires 7 pre-operative investigations	90	High	General	t	f	\N	\N	\N	\N	\N	\N	t	\N	2025-11-24 11:10:24.274	2025-11-24 11:10:24.274	{cmid1pju20000lhzwn3xpqnq8,cmid1pjup0001lhzwefs5cya7,cmid1pjv10002lhzwhfsc5b2r,cmid1pjvd0003lhzwv4zh3dov,cmid1pjvr0004lhzwsc14n2kv,cmid1pjw10005lhzwau23av4h,cmid1pjwl0006lhzwfbbzo6u8}
cmid1pjxl0008lhzwmyoo7mgl	Vitrectomy surgery	VITRECTOMY	RETINAL	Vitrectomy surgery - Requires 7 pre-operative investigations	90	High	General	f	t	\N	\N	\N	\N	\N	\N	t	\N	2025-11-24 11:10:24.297	2025-11-24 11:10:24.297	{cmid1pju20000lhzwn3xpqnq8,cmid1pjup0001lhzwefs5cya7,cmid1pjv10002lhzwhfsc5b2r,cmid1pjvd0003lhzwv4zh3dov,cmid1pjvr0004lhzwsc14n2kv,cmid1pjw10005lhzwau23av4h,cmid1pjwl0006lhzwfbbzo6u8}
cmid1pjxy0009lhzw8hd800xx	Pterygium surgery	PTERYGIUMS	CORNEAL	Pterygium surgery - Requires 7 pre-operative investigations	90	High	General	t	f	\N	\N	\N	\N	\N	\N	t	\N	2025-11-24 11:10:24.31	2025-11-24 11:10:24.31	{cmid1pju20000lhzwn3xpqnq8,cmid1pjup0001lhzwefs5cya7,cmid1pjv10002lhzwhfsc5b2r,cmid1pjvd0003lhzwv4zh3dov,cmid1pjvr0004lhzwsc14n2kv,cmid1pjw10005lhzwau23av4h,cmid1pjwl0006lhzwfbbzo6u8}
cmid1pjya000alhzwpr0yaqj1	RD (Retinal Detachment)	RD(RETINAL	RETINAL	RD (Retinal Detachment) - Requires 7 pre-operative investigations	90	High	General	f	t	\N	\N	\N	\N	\N	\N	t	\N	2025-11-24 11:10:24.322	2025-11-24 11:10:24.322	{cmid1pju20000lhzwn3xpqnq8,cmid1pjup0001lhzwefs5cya7,cmid1pjv10002lhzwhfsc5b2r,cmid1pjvd0003lhzwv4zh3dov,cmid1pjvr0004lhzwsc14n2kv,cmid1pjw10005lhzwau23av4h,cmid1pjwl0006lhzwfbbzo6u8}
cmid1pjyk000blhzwfwcf8sfs	Ptosis surgery	PTOSISSURG	OCULOPLASTIC	Ptosis surgery - Requires 7 pre-operative investigations	90	High	General	t	f	\N	\N	\N	\N	\N	\N	t	\N	2025-11-24 11:10:24.332	2025-11-24 11:10:24.332	{cmid1pju20000lhzwn3xpqnq8,cmid1pjup0001lhzwefs5cya7,cmid1pjv10002lhzwhfsc5b2r,cmid1pjvd0003lhzwv4zh3dov,cmid1pjvr0004lhzwsc14n2kv,cmid1pjw10005lhzwau23av4h,cmid1pjwl0006lhzwfbbzo6u8}
cmid1pjyu000clhzwwohur2im	Squint surgery	SQUINTSURG	OCULOPLASTIC	Squint surgery - Requires 7 pre-operative investigations	90	High	General	t	f	\N	\N	\N	\N	\N	\N	t	\N	2025-11-24 11:10:24.342	2025-11-24 11:10:24.342	{cmid1pju20000lhzwn3xpqnq8,cmid1pjup0001lhzwefs5cya7,cmid1pjv10002lhzwhfsc5b2r,cmid1pjvd0003lhzwv4zh3dov,cmid1pjvr0004lhzwsc14n2kv,cmid1pjw10005lhzwau23av4h,cmid1pjwl0006lhzwfbbzo6u8}
cmid1pjz7000dlhzws8g89gvo	DCR (Dacryocystorhinostomy) surgery	DCR(DACRYO	OCULOPLASTIC	DCR (Dacryocystorhinostomy) surgery - Requires 7 pre-operative investigations	90	High	General	t	f	\N	\N	\N	\N	\N	\N	t	\N	2025-11-24 11:10:24.355	2025-11-24 11:10:24.355	{cmid1pju20000lhzwn3xpqnq8,cmid1pjup0001lhzwefs5cya7,cmid1pjv10002lhzwhfsc5b2r,cmid1pjvd0003lhzwv4zh3dov,cmid1pjvr0004lhzwsc14n2kv,cmid1pjw10005lhzwau23av4h,cmid1pjwl0006lhzwfbbzo6u8}
cmid1pjzi000elhzwab8ll6fl	DCT (Dacryocystectomy) surgery	DCT(DACRYO	OCULOPLASTIC	DCT (Dacryocystectomy) surgery - Requires 7 pre-operative investigations	90	High	General	t	f	\N	\N	\N	\N	\N	\N	t	\N	2025-11-24 11:10:24.366	2025-11-24 11:10:24.366	{cmid1pju20000lhzwn3xpqnq8,cmid1pjup0001lhzwefs5cya7,cmid1pjv10002lhzwhfsc5b2r,cmid1pjvd0003lhzwv4zh3dov,cmid1pjvr0004lhzwsc14n2kv,cmid1pjw10005lhzwau23av4h,cmid1pjwl0006lhzwfbbzo6u8}
cmid1pjzs000flhzwrj9gv5ac	SFIOL (Scleral Fixation of Intraocular Lens) surgery	SFIOL(SCLE	CATARACT	SFIOL (Scleral Fixation of Intraocular Lens) surgery - Requires 7 pre-operative investigations	90	High	General	t	f	\N	\N	\N	\N	\N	\N	t	\N	2025-11-24 11:10:24.376	2025-11-24 11:10:24.376	{cmid1pju20000lhzwn3xpqnq8,cmid1pjup0001lhzwefs5cya7,cmid1pjv10002lhzwhfsc5b2r,cmid1pjvd0003lhzwv4zh3dov,cmid1pjvr0004lhzwsc14n2kv,cmid1pjw10005lhzwau23av4h,cmid1pjwl0006lhzwfbbzo6u8}
cmid1pk03000glhzwhugzvoqs	Evisceration surgery	EVISCERATI	OCULOPLASTIC	Evisceration surgery - Requires 7 pre-operative investigations	90	High	General	t	f	\N	\N	\N	\N	\N	\N	t	\N	2025-11-24 11:10:24.388	2025-11-24 11:10:24.388	{cmid1pju20000lhzwn3xpqnq8,cmid1pjup0001lhzwefs5cya7,cmid1pjv10002lhzwhfsc5b2r,cmid1pjvd0003lhzwv4zh3dov,cmid1pjvr0004lhzwsc14n2kv,cmid1pjw10005lhzwau23av4h,cmid1pjwl0006lhzwfbbzo6u8}
cmid1pk0g000hlhzwotpr08fd	SOR (Silicone Oil Removal) surgery	SOR(SILICO	RETINAL	SOR (Silicone Oil Removal) surgery - Requires 7 pre-operative investigations	90	High	General	t	f	\N	\N	\N	\N	\N	\N	t	\N	2025-11-24 11:10:24.401	2025-11-24 11:10:24.401	{cmid1pju20000lhzwn3xpqnq8,cmid1pjup0001lhzwefs5cya7,cmid1pjv10002lhzwhfsc5b2r,cmid1pjvd0003lhzwv4zh3dov,cmid1pjvr0004lhzwsc14n2kv,cmid1pjw10005lhzwau23av4h,cmid1pjwl0006lhzwfbbzo6u8}
cmid1pk0p000ilhzwm30f7bow	Lasik surgery	LASIKSURGE	CORNEAL	Lasik surgery - Requires 4 pre-operative investigations	90	Medium	General	t	f	\N	\N	\N	\N	\N	\N	t	\N	2025-11-24 11:10:24.409	2025-11-24 11:10:24.409	{cmid1pju20000lhzwn3xpqnq8,cmid1pjvd0003lhzwv4zh3dov,cmid1pjup0001lhzwefs5cya7,cmid1pjv10002lhzwhfsc5b2r}
cmid1pk10000jlhzwkeo4k2qr	C3R (Corneal Collagen Cross-Linking with Riboflavin) surgery	C3R(CORNEA	CORNEAL	C3R (Corneal Collagen Cross-Linking with Riboflavin) surgery - Requires 4 pre-operative investigations	90	Medium	General	t	f	\N	\N	\N	\N	\N	\N	t	\N	2025-11-24 11:10:24.42	2025-11-24 11:10:24.42	{cmid1pju20000lhzwn3xpqnq8,cmid1pjvd0003lhzwv4zh3dov,cmid1pjup0001lhzwefs5cya7,cmid1pjv10002lhzwhfsc5b2r}
cmid1pk1a000klhzwf7mmnkf7	Chalazion surgery	CHALAZIONS	OCULOPLASTIC	Chalazion surgery - Requires 4 pre-operative investigations	90	Medium	General	t	f	\N	\N	\N	\N	\N	\N	t	\N	2025-11-24 11:10:24.43	2025-11-24 11:10:24.43	{cmid1pju20000lhzwn3xpqnq8,cmid1pjvd0003lhzwv4zh3dov,cmid1pjup0001lhzwefs5cya7,cmid1pjv10002lhzwhfsc5b2r}
cmid1pk1k000llhzwmflpve6o	Cyst removing surgery	CYSTREMOVI	OCULOPLASTIC	Cyst removing surgery - Requires 4 pre-operative investigations	90	Medium	General	t	f	\N	\N	\N	\N	\N	\N	t	\N	2025-11-24 11:10:24.441	2025-11-24 11:10:24.441	{cmid1pju20000lhzwn3xpqnq8,cmid1pjvd0003lhzwv4zh3dov,cmid1pjup0001lhzwefs5cya7,cmid1pjv10002lhzwhfsc5b2r}
cmid1pk1v000mlhzwp64bgxq6	Trauma surgery	TRAUMASURG	EMERGENCY	Trauma surgery - Requires 4 pre-operative investigations	90	Medium	General	t	f	\N	\N	\N	\N	\N	\N	t	\N	2025-11-24 11:10:24.451	2025-11-24 11:10:24.451	{cmid1pju20000lhzwn3xpqnq8,cmid1pjvd0003lhzwv4zh3dov,cmid1pjup0001lhzwefs5cya7,cmid1pjv10002lhzwhfsc5b2r}
cmid1pk25000nlhzwetc2mb4q	Intravitreal Injection	INTRAVITRE	RETINAL	Intravitreal Injection - Requires 4 pre-operative investigations	30	Medium	Local	t	f	\N	\N	\N	\N	\N	\N	t	\N	2025-11-24 11:10:24.461	2025-11-24 11:10:24.461	{cmid1pju20000lhzwn3xpqnq8,cmid1pjvd0003lhzwv4zh3dov,cmid1pjup0001lhzwefs5cya7,cmid1pjv10002lhzwhfsc5b2r}
cmid1pk2f000olhzwe39757ic	FFA	FFA	RETINAL	FFA - Requires 1 pre-operative investigations	90	Low	Local	t	f	\N	\N	\N	\N	\N	\N	t	\N	2025-11-24 11:10:24.472	2025-11-24 11:10:24.472	{cmid1pjvd0003lhzwv4zh3dov}
cmifm85nd0000lh7kr0y660d4	Cataract Surgery (Phacoemulsification)	CAT001	CATARACT	Removal of clouded lens using ultrasonic energy	30	Medium	Local	t	f	["Phaco machine", "Microscope", "IOL injector"]	["Biometry", "IOL calculation", "Dilated fundus examination"]	["Use prescribed eye drops", "Avoid water contact for 1 week", "No heavy lifting"]	["1 day", "1 week", "1 month", "3 months"]	25000	\N	t	\N	2025-11-26 06:20:16.921	2025-11-26 06:20:16.921	\N
cmifm85pj0001lh7k9a4kufiy	LASIK Surgery	LAS001	CORNEAL	Laser-assisted in situ keratomileusis for vision correction	20	High	Topical	t	f	["Excimer laser", "Femtosecond laser", "Wavefront analyzer"]	["Corneal topography", "Wavefront analysis", "Pachymetry"]	["Protective eye shields", "Avoid rubbing eyes", "Regular follow-ups"]	["1 day", "1 week", "1 month", "6 months"]	45000	\N	t	\N	2025-11-26 06:20:16.999	2025-11-26 06:20:16.999	\N
cmifm85py0002lh7kxn3lgt4c	Glaucoma Trabeculectomy	GLA001	GLAUCOMA	Surgical creation of drainage opening to reduce intraocular pressure	45	High	Local	f	t	["Microscope", "Antimetabolites", "Specialized instruments"]	["Visual field test", "OCT", "IOP measurement"]	["Strict medication compliance", "Avoid strenuous activity", "Regular IOP monitoring"]	["1 day", "1 week", "2 weeks", "1 month", "3 months"]	35000	\N	t	\N	2025-11-26 06:20:17.014	2025-11-26 06:20:17.014	\N
cmifm85qa0003lh7koo1rbkpu	Retinal Detachment Surgery	RET001	RETINAL	Surgical repair of detached retina using various techniques	90	High	Local/General	f	t	["Vitrectomy machine", "Endolaser", "Gas tamponade", "Silicone oil"]	["Detailed fundus examination", "B-scan ultrasound", "OCT"]	["Positioning restrictions", "No air travel if gas bubble", "Regular monitoring"]	["1 day", "3 days", "1 week", "2 weeks", "1 month", "3 months"]	55000	\N	t	\N	2025-11-26 06:20:17.026	2025-11-26 06:20:17.026	\N
cmifm85qw0004lh7kwlyhkyjs	Ptosis Correction	OCU001	OCULOPLASTIC	Surgical correction of drooping upper eyelid	60	Medium	Local	t	f	["Microsurgical instruments", "Sutures"]	["Levator function assessment", "Visual field test"]	["Cold compress", "Antibiotic ointment", "Avoid strain"]	["1 week", "2 weeks", "1 month", "3 months"]	20000	\N	t	\N	2025-11-26 06:20:17.048	2025-11-26 06:20:17.048	\N
\.


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: appointments appointments_pkey; Type: CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_pkey PRIMARY KEY (id);


--
-- Name: bed_types bed_types_pkey; Type: CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.bed_types
    ADD CONSTRAINT bed_types_pkey PRIMARY KEY (id);


--
-- Name: beds beds_pkey; Type: CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.beds
    ADD CONSTRAINT beds_pkey PRIMARY KEY (id);


--
-- Name: bill_items bill_items_pkey; Type: CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.bill_items
    ADD CONSTRAINT bill_items_pkey PRIMARY KEY (id);


--
-- Name: bills bills_pkey; Type: CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.bills
    ADD CONSTRAINT bills_pkey PRIMARY KEY (id);


--
-- Name: diagnoses diagnoses_pkey; Type: CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.diagnoses
    ADD CONSTRAINT diagnoses_pkey PRIMARY KEY (id);


--
-- Name: digital_register_columns digital_register_columns_pkey; Type: CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.digital_register_columns
    ADD CONSTRAINT digital_register_columns_pkey PRIMARY KEY (id);


--
-- Name: digital_register_definitions digital_register_definitions_pkey; Type: CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.digital_register_definitions
    ADD CONSTRAINT digital_register_definitions_pkey PRIMARY KEY (id);


--
-- Name: digital_register_records digital_register_records_pkey; Type: CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.digital_register_records
    ADD CONSTRAINT digital_register_records_pkey PRIMARY KEY (id);


--
-- Name: digital_register_values digital_register_values_pkey; Type: CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.digital_register_values
    ADD CONSTRAINT digital_register_values_pkey PRIMARY KEY (id);


--
-- Name: diseases diseases_pkey; Type: CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.diseases
    ADD CONSTRAINT diseases_pkey PRIMARY KEY (id);


--
-- Name: dosage_schedules dosage_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.dosage_schedules
    ADD CONSTRAINT dosage_schedules_pkey PRIMARY KEY (id);


--
-- Name: drug_groups drug_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.drug_groups
    ADD CONSTRAINT drug_groups_pkey PRIMARY KEY (id);


--
-- Name: emergency_register emergency_register_pkey; Type: CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.emergency_register
    ADD CONSTRAINT emergency_register_pkey PRIMARY KEY (id);


--
-- Name: equipment_stock_register equipment_stock_register_pkey; Type: CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.equipment_stock_register
    ADD CONSTRAINT equipment_stock_register_pkey PRIMARY KEY (id);


--
-- Name: eto_register eto_register_pkey; Type: CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.eto_register
    ADD CONSTRAINT eto_register_pkey PRIMARY KEY (id);


--
-- Name: examination_templates examination_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.examination_templates
    ADD CONSTRAINT examination_templates_pkey PRIMARY KEY (id);


--
-- Name: examinations examinations_pkey; Type: CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.examinations
    ADD CONSTRAINT examinations_pkey PRIMARY KEY (id);


--
-- Name: eye_drop_reasons eye_drop_reasons_pkey; Type: CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.eye_drop_reasons
    ADD CONSTRAINT eye_drop_reasons_pkey PRIMARY KEY (id);


--
-- Name: fitness_investigation_results fitness_investigation_results_pkey; Type: CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.fitness_investigation_results
    ADD CONSTRAINT fitness_investigation_results_pkey PRIMARY KEY (id);


--
-- Name: fitness_investigations fitness_investigations_pkey; Type: CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.fitness_investigations
    ADD CONSTRAINT fitness_investigations_pkey PRIMARY KEY (id);


--
-- Name: fitness_reports fitness_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.fitness_reports
    ADD CONSTRAINT fitness_reports_pkey PRIMARY KEY (id);


--
-- Name: floors floors_pkey; Type: CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.floors
    ADD CONSTRAINT floors_pkey PRIMARY KEY (id);


--
-- Name: fridge_stock_medicines_register fridge_stock_medicines_register_pkey; Type: CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.fridge_stock_medicines_register
    ADD CONSTRAINT fridge_stock_medicines_register_pkey PRIMARY KEY (id);


--
-- Name: generic_medicines generic_medicines_pkey; Type: CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.generic_medicines
    ADD CONSTRAINT generic_medicines_pkey PRIMARY KEY (id);


--
-- Name: hospital hospital_pkey; Type: CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.hospital
    ADD CONSTRAINT hospital_pkey PRIMARY KEY (id);


--
-- Name: icd11_codes icd11_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.icd11_codes
    ADD CONSTRAINT icd11_codes_pkey PRIMARY KEY (id);


--
-- Name: insurance_claims insurance_claims_pkey; Type: CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.insurance_claims
    ADD CONSTRAINT insurance_claims_pkey PRIMARY KEY (id);


--
-- Name: insurance insurance_pkey; Type: CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.insurance
    ADD CONSTRAINT insurance_pkey PRIMARY KEY (id);


--
-- Name: ipd_admissions ipd_admissions_pkey; Type: CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.ipd_admissions
    ADD CONSTRAINT ipd_admissions_pkey PRIMARY KEY (id);


--
-- Name: lens_packages lens_packages_pkey; Type: CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.lens_packages
    ADD CONSTRAINT lens_packages_pkey PRIMARY KEY (id);


--
-- Name: lenses lenses_pkey; Type: CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.lenses
    ADD CONSTRAINT lenses_pkey PRIMARY KEY (id);


--
-- Name: letterhead_templates letterhead_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.letterhead_templates
    ADD CONSTRAINT letterhead_templates_pkey PRIMARY KEY (id);


--
-- Name: medicine_types medicine_types_pkey; Type: CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.medicine_types
    ADD CONSTRAINT medicine_types_pkey PRIMARY KEY (id);


--
-- Name: medicines medicines_pkey; Type: CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.medicines
    ADD CONSTRAINT medicines_pkey PRIMARY KEY (id);


--
-- Name: o2_n2_pressure_check_register o2_n2_pressure_check_register_pkey; Type: CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.o2_n2_pressure_check_register
    ADD CONSTRAINT o2_n2_pressure_check_register_pkey PRIMARY KEY (id);


--
-- Name: ophthalmologist_examinations ophthalmologist_examinations_pkey; Type: CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.ophthalmologist_examinations
    ADD CONSTRAINT ophthalmologist_examinations_pkey PRIMARY KEY (id);


--
-- Name: optometrist_examinations optometrist_examinations_pkey; Type: CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.optometrist_examinations
    ADD CONSTRAINT optometrist_examinations_pkey PRIMARY KEY (id);


--
-- Name: ot_emergency_stock_register ot_emergency_stock_register_pkey; Type: CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.ot_emergency_stock_register
    ADD CONSTRAINT ot_emergency_stock_register_pkey PRIMARY KEY (id);


--
-- Name: ot_temperature_register ot_temperature_register_pkey; Type: CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.ot_temperature_register
    ADD CONSTRAINT ot_temperature_register_pkey PRIMARY KEY (id);


--
-- Name: otps otps_pkey; Type: CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.otps
    ADD CONSTRAINT otps_pkey PRIMARY KEY (id);


--
-- Name: patient_queue patient_queue_pkey; Type: CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.patient_queue
    ADD CONSTRAINT patient_queue_pkey PRIMARY KEY (id);


--
-- Name: patient_visits patient_visits_pkey; Type: CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.patient_visits
    ADD CONSTRAINT patient_visits_pkey PRIMARY KEY (id);


--
-- Name: patients patients_pkey; Type: CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: pre_op_assessments pre_op_assessments_pkey; Type: CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.pre_op_assessments
    ADD CONSTRAINT pre_op_assessments_pkey PRIMARY KEY (id);


--
-- Name: prescription_items prescription_items_pkey; Type: CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.prescription_items
    ADD CONSTRAINT prescription_items_pkey PRIMARY KEY (id);


--
-- Name: prescriptions prescriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.prescriptions
    ADD CONSTRAINT prescriptions_pkey PRIMARY KEY (id);


--
-- Name: refrigerator_temperature_register refrigerator_temperature_register_pkey; Type: CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.refrigerator_temperature_register
    ADD CONSTRAINT refrigerator_temperature_register_pkey PRIMARY KEY (id);


--
-- Name: room_types room_types_pkey; Type: CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.room_types
    ADD CONSTRAINT room_types_pkey PRIMARY KEY (id);


--
-- Name: rooms rooms_pkey; Type: CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.rooms
    ADD CONSTRAINT rooms_pkey PRIMARY KEY (id);


--
-- Name: staff_attendance staff_attendance_pkey; Type: CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.staff_attendance
    ADD CONSTRAINT staff_attendance_pkey PRIMARY KEY (id);


--
-- Name: staff staff_pkey; Type: CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.staff
    ADD CONSTRAINT staff_pkey PRIMARY KEY (id);


--
-- Name: staff_types staff_types_pkey; Type: CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.staff_types
    ADD CONSTRAINT staff_types_pkey PRIMARY KEY (id);


--
-- Name: super_admins super_admins_pkey; Type: CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.super_admins
    ADD CONSTRAINT super_admins_pkey PRIMARY KEY (id);


--
-- Name: surgery_fitness_requirements surgery_fitness_requirements_pkey; Type: CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.surgery_fitness_requirements
    ADD CONSTRAINT surgery_fitness_requirements_pkey PRIMARY KEY (id);


--
-- Name: surgery_metrics surgery_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.surgery_metrics
    ADD CONSTRAINT surgery_metrics_pkey PRIMARY KEY (id);


--
-- Name: surgery_packages surgery_packages_pkey; Type: CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.surgery_packages
    ADD CONSTRAINT surgery_packages_pkey PRIMARY KEY (id);


--
-- Name: surgery_types surgery_types_pkey; Type: CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.surgery_types
    ADD CONSTRAINT surgery_types_pkey PRIMARY KEY (id);


--
-- Name: appointments_appointmentDate_status_idx; Type: INDEX; Schema: public; Owner: tanuj
--

CREATE INDEX "appointments_appointmentDate_status_idx" ON public.appointments USING btree ("appointmentDate", status);


--
-- Name: appointments_tokenNumber_key; Type: INDEX; Schema: public; Owner: tanuj
--

CREATE UNIQUE INDEX "appointments_tokenNumber_key" ON public.appointments USING btree ("tokenNumber");


--
-- Name: bed_types_typeCode_key; Type: INDEX; Schema: public; Owner: tanuj
--

CREATE UNIQUE INDEX "bed_types_typeCode_key" ON public.bed_types USING btree ("typeCode");


--
-- Name: bills_billDate_status_idx; Type: INDEX; Schema: public; Owner: tanuj
--

CREATE INDEX "bills_billDate_status_idx" ON public.bills USING btree ("billDate", status);


--
-- Name: bills_billNumber_key; Type: INDEX; Schema: public; Owner: tanuj
--

CREATE UNIQUE INDEX "bills_billNumber_key" ON public.bills USING btree ("billNumber");


--
-- Name: digital_register_columns_registerId_columnName_key; Type: INDEX; Schema: public; Owner: tanuj
--

CREATE UNIQUE INDEX "digital_register_columns_registerId_columnName_key" ON public.digital_register_columns USING btree ("registerId", "columnName");


--
-- Name: digital_register_definitions_name_key; Type: INDEX; Schema: public; Owner: tanuj
--

CREATE UNIQUE INDEX digital_register_definitions_name_key ON public.digital_register_definitions USING btree (name);


--
-- Name: digital_register_values_recordId_columnId_key; Type: INDEX; Schema: public; Owner: tanuj
--

CREATE UNIQUE INDEX "digital_register_values_recordId_columnId_key" ON public.digital_register_values USING btree ("recordId", "columnId");


--
-- Name: dosage_schedules_name_key; Type: INDEX; Schema: public; Owner: tanuj
--

CREATE UNIQUE INDEX dosage_schedules_name_key ON public.dosage_schedules USING btree (name);


--
-- Name: drug_groups_name_key; Type: INDEX; Schema: public; Owner: tanuj
--

CREATE UNIQUE INDEX drug_groups_name_key ON public.drug_groups USING btree (name);


--
-- Name: equipment_stock_register_medicineName_month_year_key; Type: INDEX; Schema: public; Owner: tanuj
--

CREATE UNIQUE INDEX "equipment_stock_register_medicineName_month_year_key" ON public.equipment_stock_register USING btree ("medicineName", month, year);


--
-- Name: eye_drop_reasons_reason_key; Type: INDEX; Schema: public; Owner: tanuj
--

CREATE UNIQUE INDEX eye_drop_reasons_reason_key ON public.eye_drop_reasons USING btree (reason);


--
-- Name: fitness_investigation_results_ipdAdmissionId_investigationI_key; Type: INDEX; Schema: public; Owner: tanuj
--

CREATE UNIQUE INDEX "fitness_investigation_results_ipdAdmissionId_investigationI_key" ON public.fitness_investigation_results USING btree ("ipdAdmissionId", "investigationId");


--
-- Name: fitness_investigations_investigationCode_key; Type: INDEX; Schema: public; Owner: tanuj
--

CREATE UNIQUE INDEX "fitness_investigations_investigationCode_key" ON public.fitness_investigations USING btree ("investigationCode");


--
-- Name: fitness_investigations_investigationName_key; Type: INDEX; Schema: public; Owner: tanuj
--

CREATE UNIQUE INDEX "fitness_investigations_investigationName_key" ON public.fitness_investigations USING btree ("investigationName");


--
-- Name: generic_medicines_name_key; Type: INDEX; Schema: public; Owner: tanuj
--

CREATE UNIQUE INDEX generic_medicines_name_key ON public.generic_medicines USING btree (name);


--
-- Name: hospital_hospitalCode_key; Type: INDEX; Schema: public; Owner: tanuj
--

CREATE UNIQUE INDEX "hospital_hospitalCode_key" ON public.hospital USING btree ("hospitalCode");


--
-- Name: icd11_codes_foundationId_key; Type: INDEX; Schema: public; Owner: tanuj
--

CREATE UNIQUE INDEX "icd11_codes_foundationId_key" ON public.icd11_codes USING btree ("foundationId");


--
-- Name: insurance_claims_claimNumber_key; Type: INDEX; Schema: public; Owner: tanuj
--

CREATE UNIQUE INDEX "insurance_claims_claimNumber_key" ON public.insurance_claims USING btree ("claimNumber");


--
-- Name: ipd_admissions_admissionNumber_key; Type: INDEX; Schema: public; Owner: tanuj
--

CREATE UNIQUE INDEX "ipd_admissions_admissionNumber_key" ON public.ipd_admissions USING btree ("admissionNumber");


--
-- Name: ipd_admissions_patientVisitId_key; Type: INDEX; Schema: public; Owner: tanuj
--

CREATE UNIQUE INDEX "ipd_admissions_patientVisitId_key" ON public.ipd_admissions USING btree ("patientVisitId");


--
-- Name: ipd_admissions_surgeryDayVisitId_key; Type: INDEX; Schema: public; Owner: tanuj
--

CREATE UNIQUE INDEX "ipd_admissions_surgeryDayVisitId_key" ON public.ipd_admissions USING btree ("surgeryDayVisitId");


--
-- Name: lens_packages_packageId_lensId_key; Type: INDEX; Schema: public; Owner: tanuj
--

CREATE UNIQUE INDEX "lens_packages_packageId_lensId_key" ON public.lens_packages USING btree ("packageId", "lensId");


--
-- Name: lenses_lensCode_key; Type: INDEX; Schema: public; Owner: tanuj
--

CREATE UNIQUE INDEX "lenses_lensCode_key" ON public.lenses USING btree ("lensCode");


--
-- Name: medicine_types_name_key; Type: INDEX; Schema: public; Owner: tanuj
--

CREATE UNIQUE INDEX medicine_types_name_key ON public.medicine_types USING btree (name);


--
-- Name: medicines_code_key; Type: INDEX; Schema: public; Owner: tanuj
--

CREATE UNIQUE INDEX medicines_code_key ON public.medicines USING btree (code);


--
-- Name: ophthalmologist_examinations_patientVisitId_examinationSequ_key; Type: INDEX; Schema: public; Owner: tanuj
--

CREATE UNIQUE INDEX "ophthalmologist_examinations_patientVisitId_examinationSequ_key" ON public.ophthalmologist_examinations USING btree ("patientVisitId", "examinationSequence");


--
-- Name: optometrist_examinations_patientVisitId_key; Type: INDEX; Schema: public; Owner: tanuj
--

CREATE UNIQUE INDEX "optometrist_examinations_patientVisitId_key" ON public.optometrist_examinations USING btree ("patientVisitId");


--
-- Name: otps_expiresAt_idx; Type: INDEX; Schema: public; Owner: tanuj
--

CREATE INDEX "otps_expiresAt_idx" ON public.otps USING btree ("expiresAt");


--
-- Name: otps_identifier_purpose_isUsed_idx; Type: INDEX; Schema: public; Owner: tanuj
--

CREATE INDEX "otps_identifier_purpose_isUsed_idx" ON public.otps USING btree (identifier, purpose, "isUsed");


--
-- Name: patient_queue_assignedStaffId_doctorQueuePosition_idx; Type: INDEX; Schema: public; Owner: tanuj
--

CREATE INDEX "patient_queue_assignedStaffId_doctorQueuePosition_idx" ON public.patient_queue USING btree ("assignedStaffId", "doctorQueuePosition");


--
-- Name: patient_queue_assignedStaffId_status_doctorQueuePosition_idx; Type: INDEX; Schema: public; Owner: tanuj
--

CREATE INDEX "patient_queue_assignedStaffId_status_doctorQueuePosition_idx" ON public.patient_queue USING btree ("assignedStaffId", status, "doctorQueuePosition");


--
-- Name: patient_queue_patientId_idx; Type: INDEX; Schema: public; Owner: tanuj
--

CREATE INDEX "patient_queue_patientId_idx" ON public.patient_queue USING btree ("patientId");


--
-- Name: patient_queue_queueFor_queueNumber_joinedAt_key; Type: INDEX; Schema: public; Owner: tanuj
--

CREATE UNIQUE INDEX "patient_queue_queueFor_queueNumber_joinedAt_key" ON public.patient_queue USING btree ("queueFor", "queueNumber", "joinedAt");


--
-- Name: patient_queue_queueFor_status_priority_joinedAt_idx; Type: INDEX; Schema: public; Owner: tanuj
--

CREATE INDEX "patient_queue_queueFor_status_priority_joinedAt_idx" ON public.patient_queue USING btree ("queueFor", status, priority, "joinedAt");


--
-- Name: patient_visits_appointmentId_key; Type: INDEX; Schema: public; Owner: tanuj
--

CREATE UNIQUE INDEX "patient_visits_appointmentId_key" ON public.patient_visits USING btree ("appointmentId");


--
-- Name: patient_visits_patientId_visitNumber_key; Type: INDEX; Schema: public; Owner: tanuj
--

CREATE UNIQUE INDEX "patient_visits_patientId_visitNumber_key" ON public.patient_visits USING btree ("patientId", "visitNumber");


--
-- Name: patients_mrn_key; Type: INDEX; Schema: public; Owner: tanuj
--

CREATE UNIQUE INDEX patients_mrn_key ON public.patients USING btree (mrn);


--
-- Name: patients_patientNumber_key; Type: INDEX; Schema: public; Owner: tanuj
--

CREATE UNIQUE INDEX "patients_patientNumber_key" ON public.patients USING btree ("patientNumber");


--
-- Name: prescriptions_prescriptionNumber_key; Type: INDEX; Schema: public; Owner: tanuj
--

CREATE UNIQUE INDEX "prescriptions_prescriptionNumber_key" ON public.prescriptions USING btree ("prescriptionNumber");


--
-- Name: room_types_typeCode_key; Type: INDEX; Schema: public; Owner: tanuj
--

CREATE UNIQUE INDEX "room_types_typeCode_key" ON public.room_types USING btree ("typeCode");


--
-- Name: staff_attendance_date_idx; Type: INDEX; Schema: public; Owner: tanuj
--

CREATE INDEX staff_attendance_date_idx ON public.staff_attendance USING btree (date);


--
-- Name: staff_attendance_staffId_date_key; Type: INDEX; Schema: public; Owner: tanuj
--

CREATE UNIQUE INDEX "staff_attendance_staffId_date_key" ON public.staff_attendance USING btree ("staffId", date);


--
-- Name: staff_attendance_staffId_idx; Type: INDEX; Schema: public; Owner: tanuj
--

CREATE INDEX "staff_attendance_staffId_idx" ON public.staff_attendance USING btree ("staffId");


--
-- Name: staff_email_key; Type: INDEX; Schema: public; Owner: tanuj
--

CREATE UNIQUE INDEX staff_email_key ON public.staff USING btree (email);


--
-- Name: staff_employeeId_key; Type: INDEX; Schema: public; Owner: tanuj
--

CREATE UNIQUE INDEX "staff_employeeId_key" ON public.staff USING btree ("employeeId");


--
-- Name: staff_types_type_key; Type: INDEX; Schema: public; Owner: tanuj
--

CREATE UNIQUE INDEX staff_types_type_key ON public.staff_types USING btree (type);


--
-- Name: super_admins_email_key; Type: INDEX; Schema: public; Owner: tanuj
--

CREATE UNIQUE INDEX super_admins_email_key ON public.super_admins USING btree (email);


--
-- Name: surgery_fitness_requirements_surgeryTypeId_requirementName_key; Type: INDEX; Schema: public; Owner: tanuj
--

CREATE UNIQUE INDEX "surgery_fitness_requirements_surgeryTypeId_requirementName_key" ON public.surgery_fitness_requirements USING btree ("surgeryTypeId", "requirementName");


--
-- Name: surgery_packages_packageCode_key; Type: INDEX; Schema: public; Owner: tanuj
--

CREATE UNIQUE INDEX "surgery_packages_packageCode_key" ON public.surgery_packages USING btree ("packageCode");


--
-- Name: surgery_packages_packageName_key; Type: INDEX; Schema: public; Owner: tanuj
--

CREATE UNIQUE INDEX "surgery_packages_packageName_key" ON public.surgery_packages USING btree ("packageName");


--
-- Name: surgery_types_code_key; Type: INDEX; Schema: public; Owner: tanuj
--

CREATE UNIQUE INDEX surgery_types_code_key ON public.surgery_types USING btree (code);


--
-- Name: surgery_types_name_key; Type: INDEX; Schema: public; Owner: tanuj
--

CREATE UNIQUE INDEX surgery_types_name_key ON public.surgery_types USING btree (name);


--
-- Name: appointments appointments_doctorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT "appointments_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES public.staff(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: appointments appointments_patientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT "appointments_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES public.patients(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: appointments appointments_roomId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT "appointments_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES public.rooms(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: beds beds_bedTypeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.beds
    ADD CONSTRAINT "beds_bedTypeId_fkey" FOREIGN KEY ("bedTypeId") REFERENCES public.bed_types(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: beds beds_patientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.beds
    ADD CONSTRAINT "beds_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES public.patients(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: beds beds_roomId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.beds
    ADD CONSTRAINT "beds_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES public.rooms(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: bill_items bill_items_billId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.bill_items
    ADD CONSTRAINT "bill_items_billId_fkey" FOREIGN KEY ("billId") REFERENCES public.bills(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: bills bills_hospitalId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.bills
    ADD CONSTRAINT "bills_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES public.hospital(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: bills bills_insuranceClaimId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.bills
    ADD CONSTRAINT "bills_insuranceClaimId_fkey" FOREIGN KEY ("insuranceClaimId") REFERENCES public.insurance_claims(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: bills bills_patientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.bills
    ADD CONSTRAINT "bills_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES public.patients(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: bills bills_patientVisitId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.bills
    ADD CONSTRAINT "bills_patientVisitId_fkey" FOREIGN KEY ("patientVisitId") REFERENCES public.patient_visits(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: diagnoses diagnoses_diseaseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.diagnoses
    ADD CONSTRAINT "diagnoses_diseaseId_fkey" FOREIGN KEY ("diseaseId") REFERENCES public.diseases(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: diagnoses diagnoses_doctorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.diagnoses
    ADD CONSTRAINT "diagnoses_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES public.staff(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: diagnoses diagnoses_examinationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.diagnoses
    ADD CONSTRAINT "diagnoses_examinationId_fkey" FOREIGN KEY ("examinationId") REFERENCES public.examinations(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: diagnoses diagnoses_ophthalmologistExaminationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.diagnoses
    ADD CONSTRAINT "diagnoses_ophthalmologistExaminationId_fkey" FOREIGN KEY ("ophthalmologistExaminationId") REFERENCES public.ophthalmologist_examinations(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: diagnoses diagnoses_visitId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.diagnoses
    ADD CONSTRAINT "diagnoses_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES public.patient_visits(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: digital_register_columns digital_register_columns_registerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.digital_register_columns
    ADD CONSTRAINT "digital_register_columns_registerId_fkey" FOREIGN KEY ("registerId") REFERENCES public.digital_register_definitions(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: digital_register_records digital_register_records_registerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.digital_register_records
    ADD CONSTRAINT "digital_register_records_registerId_fkey" FOREIGN KEY ("registerId") REFERENCES public.digital_register_definitions(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: digital_register_values digital_register_values_columnId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.digital_register_values
    ADD CONSTRAINT "digital_register_values_columnId_fkey" FOREIGN KEY ("columnId") REFERENCES public.digital_register_columns(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: digital_register_values digital_register_values_recordId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.digital_register_values
    ADD CONSTRAINT "digital_register_values_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES public.digital_register_records(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: diseases diseases_icd11CodeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.diseases
    ADD CONSTRAINT "diseases_icd11CodeId_fkey" FOREIGN KEY ("icd11CodeId") REFERENCES public.icd11_codes(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: examination_templates examination_templates_createdBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.examination_templates
    ADD CONSTRAINT "examination_templates_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES public.staff(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: examinations examinations_doctorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.examinations
    ADD CONSTRAINT "examinations_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES public.staff(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: examinations examinations_templateId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.examinations
    ADD CONSTRAINT "examinations_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES public.examination_templates(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: examinations examinations_visitId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.examinations
    ADD CONSTRAINT "examinations_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES public.patient_visits(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: fitness_investigation_results fitness_investigation_results_investigationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.fitness_investigation_results
    ADD CONSTRAINT "fitness_investigation_results_investigationId_fkey" FOREIGN KEY ("investigationId") REFERENCES public.fitness_investigations(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: fitness_investigation_results fitness_investigation_results_ipdAdmissionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.fitness_investigation_results
    ADD CONSTRAINT "fitness_investigation_results_ipdAdmissionId_fkey" FOREIGN KEY ("ipdAdmissionId") REFERENCES public.ipd_admissions(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: fitness_reports fitness_reports_assessedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.fitness_reports
    ADD CONSTRAINT "fitness_reports_assessedBy_fkey" FOREIGN KEY ("assessedBy") REFERENCES public.staff(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: fitness_reports fitness_reports_ipdAdmissionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.fitness_reports
    ADD CONSTRAINT "fitness_reports_ipdAdmissionId_fkey" FOREIGN KEY ("ipdAdmissionId") REFERENCES public.ipd_admissions(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: insurance_claims insurance_claims_insuranceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.insurance_claims
    ADD CONSTRAINT "insurance_claims_insuranceId_fkey" FOREIGN KEY ("insuranceId") REFERENCES public.insurance(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: insurance_claims insurance_claims_patientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.insurance_claims
    ADD CONSTRAINT "insurance_claims_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES public.patients(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ipd_admissions ipd_admissions_admittedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.ipd_admissions
    ADD CONSTRAINT "ipd_admissions_admittedBy_fkey" FOREIGN KEY ("admittedBy") REFERENCES public.staff(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ipd_admissions ipd_admissions_anesthesiologistId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.ipd_admissions
    ADD CONSTRAINT "ipd_admissions_anesthesiologistId_fkey" FOREIGN KEY ("anesthesiologistId") REFERENCES public.staff(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ipd_admissions ipd_admissions_lensId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.ipd_admissions
    ADD CONSTRAINT "ipd_admissions_lensId_fkey" FOREIGN KEY ("lensId") REFERENCES public.lenses(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ipd_admissions ipd_admissions_patientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.ipd_admissions
    ADD CONSTRAINT "ipd_admissions_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES public.patients(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ipd_admissions ipd_admissions_patientVisitId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.ipd_admissions
    ADD CONSTRAINT "ipd_admissions_patientVisitId_fkey" FOREIGN KEY ("patientVisitId") REFERENCES public.patient_visits(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ipd_admissions ipd_admissions_sisterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.ipd_admissions
    ADD CONSTRAINT "ipd_admissions_sisterId_fkey" FOREIGN KEY ("sisterId") REFERENCES public.staff(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ipd_admissions ipd_admissions_surgeonId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.ipd_admissions
    ADD CONSTRAINT "ipd_admissions_surgeonId_fkey" FOREIGN KEY ("surgeonId") REFERENCES public.staff(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ipd_admissions ipd_admissions_surgeryDayVisitId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.ipd_admissions
    ADD CONSTRAINT "ipd_admissions_surgeryDayVisitId_fkey" FOREIGN KEY ("surgeryDayVisitId") REFERENCES public.patient_visits(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ipd_admissions ipd_admissions_surgeryTypeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.ipd_admissions
    ADD CONSTRAINT "ipd_admissions_surgeryTypeId_fkey" FOREIGN KEY ("surgeryTypeId") REFERENCES public.surgery_types(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: lens_packages lens_packages_lensId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.lens_packages
    ADD CONSTRAINT "lens_packages_lensId_fkey" FOREIGN KEY ("lensId") REFERENCES public.lenses(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: lens_packages lens_packages_packageId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.lens_packages
    ADD CONSTRAINT "lens_packages_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES public.surgery_packages(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: medicines medicines_dosageScheduleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.medicines
    ADD CONSTRAINT "medicines_dosageScheduleId_fkey" FOREIGN KEY ("dosageScheduleId") REFERENCES public.dosage_schedules(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: medicines medicines_drugGroupId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.medicines
    ADD CONSTRAINT "medicines_drugGroupId_fkey" FOREIGN KEY ("drugGroupId") REFERENCES public.drug_groups(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: medicines medicines_genericMedicineId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.medicines
    ADD CONSTRAINT "medicines_genericMedicineId_fkey" FOREIGN KEY ("genericMedicineId") REFERENCES public.generic_medicines(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: medicines medicines_typeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.medicines
    ADD CONSTRAINT "medicines_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES public.medicine_types(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ophthalmologist_examinations ophthalmologist_examinations_doctorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.ophthalmologist_examinations
    ADD CONSTRAINT "ophthalmologist_examinations_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES public.staff(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ophthalmologist_examinations ophthalmologist_examinations_patientVisitId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.ophthalmologist_examinations
    ADD CONSTRAINT "ophthalmologist_examinations_patientVisitId_fkey" FOREIGN KEY ("patientVisitId") REFERENCES public.patient_visits(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ophthalmologist_examinations ophthalmologist_examinations_surgeryTypeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.ophthalmologist_examinations
    ADD CONSTRAINT "ophthalmologist_examinations_surgeryTypeId_fkey" FOREIGN KEY ("surgeryTypeId") REFERENCES public.surgery_types(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: optometrist_examinations optometrist_examinations_optometristId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.optometrist_examinations
    ADD CONSTRAINT "optometrist_examinations_optometristId_fkey" FOREIGN KEY ("optometristId") REFERENCES public.staff(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: optometrist_examinations optometrist_examinations_patientVisitId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.optometrist_examinations
    ADD CONSTRAINT "optometrist_examinations_patientVisitId_fkey" FOREIGN KEY ("patientVisitId") REFERENCES public.patient_visits(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: patient_queue patient_queue_assignedStaffId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.patient_queue
    ADD CONSTRAINT "patient_queue_assignedStaffId_fkey" FOREIGN KEY ("assignedStaffId") REFERENCES public.staff(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: patient_queue patient_queue_patientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.patient_queue
    ADD CONSTRAINT "patient_queue_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES public.patients(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: patient_queue patient_queue_patientVisitId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.patient_queue
    ADD CONSTRAINT "patient_queue_patientVisitId_fkey" FOREIGN KEY ("patientVisitId") REFERENCES public.patient_visits(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: patient_visits patient_visits_appointmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.patient_visits
    ADD CONSTRAINT "patient_visits_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES public.appointments(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: patient_visits patient_visits_doctorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.patient_visits
    ADD CONSTRAINT "patient_visits_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES public.staff(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: patient_visits patient_visits_patientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.patient_visits
    ADD CONSTRAINT "patient_visits_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES public.patients(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: patients patients_defaultInsuranceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT "patients_defaultInsuranceId_fkey" FOREIGN KEY ("defaultInsuranceId") REFERENCES public.insurance(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: patients patients_referredBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT "patients_referredBy_fkey" FOREIGN KEY ("referredBy") REFERENCES public.patients(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: payments payments_billId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT "payments_billId_fkey" FOREIGN KEY ("billId") REFERENCES public.bills(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: payments payments_patientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT "payments_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES public.patients(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: pre_op_assessments pre_op_assessments_assessedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.pre_op_assessments
    ADD CONSTRAINT "pre_op_assessments_assessedBy_fkey" FOREIGN KEY ("assessedBy") REFERENCES public.staff(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: pre_op_assessments pre_op_assessments_ipdAdmissionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.pre_op_assessments
    ADD CONSTRAINT "pre_op_assessments_ipdAdmissionId_fkey" FOREIGN KEY ("ipdAdmissionId") REFERENCES public.ipd_admissions(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: prescription_items prescription_items_medicineId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.prescription_items
    ADD CONSTRAINT "prescription_items_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES public.medicines(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: prescription_items prescription_items_prescriptionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.prescription_items
    ADD CONSTRAINT "prescription_items_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES public.prescriptions(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: prescriptions prescriptions_doctorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.prescriptions
    ADD CONSTRAINT "prescriptions_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES public.staff(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: prescriptions prescriptions_examinationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.prescriptions
    ADD CONSTRAINT "prescriptions_examinationId_fkey" FOREIGN KEY ("examinationId") REFERENCES public.ophthalmologist_examinations(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: prescriptions prescriptions_patientVisitId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.prescriptions
    ADD CONSTRAINT "prescriptions_patientVisitId_fkey" FOREIGN KEY ("patientVisitId") REFERENCES public.patient_visits(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: rooms rooms_assignedStaffId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.rooms
    ADD CONSTRAINT "rooms_assignedStaffId_fkey" FOREIGN KEY ("assignedStaffId") REFERENCES public.staff(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: rooms rooms_floorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.rooms
    ADD CONSTRAINT "rooms_floorId_fkey" FOREIGN KEY ("floorId") REFERENCES public.floors(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: rooms rooms_roomTypeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.rooms
    ADD CONSTRAINT "rooms_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES public.room_types(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: staff_attendance staff_attendance_staffId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.staff_attendance
    ADD CONSTRAINT "staff_attendance_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES public.staff(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: surgery_fitness_requirements surgery_fitness_requirements_surgeryTypeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.surgery_fitness_requirements
    ADD CONSTRAINT "surgery_fitness_requirements_surgeryTypeId_fkey" FOREIGN KEY ("surgeryTypeId") REFERENCES public.surgery_types(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: surgery_metrics surgery_metrics_implantedLensId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.surgery_metrics
    ADD CONSTRAINT "surgery_metrics_implantedLensId_fkey" FOREIGN KEY ("implantedLensId") REFERENCES public.lenses(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: surgery_metrics surgery_metrics_ipdAdmissionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.surgery_metrics
    ADD CONSTRAINT "surgery_metrics_ipdAdmissionId_fkey" FOREIGN KEY ("ipdAdmissionId") REFERENCES public.ipd_admissions(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: surgery_metrics surgery_metrics_surgeonId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.surgery_metrics
    ADD CONSTRAINT "surgery_metrics_surgeonId_fkey" FOREIGN KEY ("surgeonId") REFERENCES public.staff(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: surgery_packages surgery_packages_defaultLensId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.surgery_packages
    ADD CONSTRAINT "surgery_packages_defaultLensId_fkey" FOREIGN KEY ("defaultLensId") REFERENCES public.lenses(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: surgery_packages surgery_packages_surgeryTypeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanuj
--

ALTER TABLE ONLY public.surgery_packages
    ADD CONSTRAINT "surgery_packages_surgeryTypeId_fkey" FOREIGN KEY ("surgeryTypeId") REFERENCES public.surgery_types(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: tanuj
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

