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
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS '';


--
-- Name: testbackup; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA testbackup;


--
-- Name: AppointmentStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."AppointmentStatus" AS ENUM (
    'SCHEDULED',
    'CHECKED_IN',
    'RESCHEDULED',
    'CANCELLED',
    'NO_SHOW',
    'COMPLETED'
);


--
-- Name: BillStatus; Type: TYPE; Schema: public; Owner: -
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


--
-- Name: ColumnType; Type: TYPE; Schema: public; Owner: -
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
    'URL'
);


--
-- Name: ItemType; Type: TYPE; Schema: public; Owner: -
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


--
-- Name: PaymentMethod; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."PaymentMethod" AS ENUM (
    'CASH',
    'CARD',
    'UPI',
    'NET_BANKING',
    'INSURANCE',
    'CHEQUE'
);


--
-- Name: PriorityLabel; Type: TYPE; Schema: public; Owner: -
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


--
-- Name: QueueFor; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."QueueFor" AS ENUM (
    'OPTOMETRIST',
    'OPHTHALMOLOGIST',
    'DIAGNOSTICS',
    'SURGERY',
    'BILLING',
    'PHARMACY'
);


--
-- Name: QueueStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."QueueStatus" AS ENUM (
    'WAITING',
    'CALLED',
    'IN_PROGRESS',
    'ON_HOLD',
    'COMPLETED'
);


--
-- Name: VisitStatus; Type: TYPE; Schema: public; Owner: -
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


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: appointments; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: bed_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bed_types (
    id text NOT NULL,
    "typeName" text NOT NULL,
    "typeCode" text,
    category text,
    "dailyCharge" double precision
);


--
-- Name: beds; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: bill_items; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: bills; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: diagnoses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.diagnoses (
    id text NOT NULL,
    "visitId" text NOT NULL,
    "examinationId" text,
    "ophthalmologistExaminationId" text,
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
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: digital_register_columns; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.digital_register_columns (
    id text NOT NULL,
    "registerId" text NOT NULL,
    "columnName" text NOT NULL,
    "columnType" public."ColumnType" NOT NULL,
    "isRequired" boolean DEFAULT false NOT NULL,
    "displayOrder" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "maxLength" integer,
    "maxValue" double precision,
    "minLength" integer,
    "minValue" double precision,
    pattern text
);


--
-- Name: digital_register_definitions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.digital_register_definitions (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: digital_register_records; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.digital_register_records (
    id text NOT NULL,
    "registerId" text NOT NULL,
    "createdBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: digital_register_values; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: diseases; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: dosage_schedules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dosage_schedules (
    id text NOT NULL,
    name text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: drug_groups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.drug_groups (
    id text NOT NULL,
    name text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: emergency_register; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: equipment_stock_register; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: eto_register; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: examination_templates; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: examinations; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: floors; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: fridge_stock_medicines_register; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: generic_medicines; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.generic_medicines (
    id text NOT NULL,
    name text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: hospital; Type: TABLE; Schema: public; Owner: -
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
    "taxSettings" jsonb,
    configuration jsonb,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: icd11_codes; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: insurance; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: insurance_claims; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: letterhead_templates; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: medicine_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.medicine_types (
    id text NOT NULL,
    name text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: medicines; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: o2_n2_pressure_check_register; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: ophthalmologist_examinations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ophthalmologist_examinations (
    id text NOT NULL,
    "patientVisitId" text NOT NULL,
    "doctorId" text NOT NULL,
    "examinationSequence" integer DEFAULT 1 NOT NULL,
    "visualAcuity" jsonb,
    refraction jsonb,
    tonometry jsonb,
    "additionalTests" jsonb,
    "clinicalDetails" jsonb,
    "clinicalNotes" text,
    "preliminaryDiagnosis" text,
    "assignedDoctor" text,
    "urgencyLevel" text,
    "additionalOrders" jsonb,
    "knownAllergies" jsonb,
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
    "additionalNotes" text,
    "proceedToDoctor" boolean DEFAULT true NOT NULL,
    "requiresDilation" boolean DEFAULT false NOT NULL,
    "additionalTestsLegacy" jsonb,
    "examinationStatus" text DEFAULT 'completed'::text NOT NULL,
    "completedAt" timestamp(3) without time zone,
    "receptionist2Reviewed" boolean DEFAULT false NOT NULL,
    "receptionist2ReviewedAt" timestamp(3) without time zone,
    "receptionist2ReviewedBy" text,
    "receptionist2Notes" text,
    "distanceOD" text,
    "distanceOS" text,
    "distanceBinocular" text,
    "nearOD" text,
    "nearOS" text,
    "nearBinocular" text,
    "refractionAddOD" double precision,
    "refractionAddOS" double precision,
    "refractionPD" double precision,
    "extraocularMovements" text,
    "coverTest" text,
    "k1OD" text,
    "k1OS" text,
    "k2OD" text,
    "k2OS" text,
    "flatAxisOD" text,
    "flatAxisOS" text,
    "acdOD" text,
    "acdOS" text,
    "axlOD" text,
    "axlOS" text,
    "iolPowerPlannedOD" text,
    "iolPowerPlannedOS" text,
    "iolImplantedOD" text,
    "iolImplantedOS" text,
    "anyOtherDetailsOD" text,
    "anyOtherDetailsOS" text,
    "eyelidsOD" text,
    "eyelidsOS" text,
    "conjunctivaOD" text,
    "conjunctivaOS" text,
    "corneaOD" text,
    "corneaOS" text,
    "lensOD" text,
    "lensOS" text,
    "examinationNotes" text,
    "additionalTestsOrdered" jsonb,
    "followUpPeriod" text,
    "followUpDays" integer,
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
    "surgeryType" text,
    "followUpRequired" boolean DEFAULT false NOT NULL,
    "followUpDate" timestamp(3) without time zone,
    "followUpInstructions" jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: optometrist_examinations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.optometrist_examinations (
    id text NOT NULL,
    "patientVisitId" text NOT NULL,
    "optometristId" text NOT NULL,
    "visualAcuity" jsonb,
    refraction jsonb,
    tonometry jsonb,
    "additionalTests" jsonb,
    "clinicalDetails" jsonb,
    "clinicalNotes" text,
    "preliminaryDiagnosis" text,
    "assignedDoctor" text,
    "urgencyLevel" text,
    "additionalOrders" jsonb,
    "knownAllergies" jsonb,
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
    "additionalNotes" text,
    "proceedToDoctor" boolean DEFAULT true NOT NULL,
    "requiresDilation" boolean DEFAULT false NOT NULL,
    "additionalTestsLegacy" jsonb,
    "examinationStatus" text DEFAULT 'completed'::text NOT NULL,
    "completedAt" timestamp(3) without time zone,
    "receptionist2Reviewed" boolean DEFAULT false NOT NULL,
    "receptionist2ReviewedAt" timestamp(3) without time zone,
    "receptionist2ReviewedBy" text,
    "receptionist2Notes" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: ot_emergency_stock_register; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: ot_temperature_register; Type: TABLE; Schema: public; Owner: -
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
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdBy" text,
    sign text
);


--
-- Name: otps; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: patient_queue; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.patient_queue (
    id text NOT NULL,
    "patientId" text NOT NULL,
    "patientVisitId" text NOT NULL,
    "queueFor" public."QueueFor" NOT NULL,
    "queueNumber" integer NOT NULL,
    priority integer DEFAULT 0 NOT NULL,
    "priorityLabel" public."PriorityLabel" DEFAULT 'ROUTINE'::public."PriorityLabel" NOT NULL,
    status public."QueueStatus" DEFAULT 'WAITING'::public."QueueStatus" NOT NULL,
    "assignedStaffId" text,
    "doctorQueuePosition" integer,
    "estimatedWaitTime" integer,
    "joinedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "calledAt" timestamp(3) without time zone,
    "inProgressAt" timestamp(3) without time zone,
    "completedAt" timestamp(3) without time zone,
    "onHoldAt" timestamp(3) without time zone,
    "resumedAt" timestamp(3) without time zone,
    "holdReason" text,
    "estimatedResumeTime" timestamp(3) without time zone,
    "actualHoldDuration" integer,
    notes text,
    "transferReason" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "receptionist2Reviewed" boolean DEFAULT false NOT NULL,
    "receptionist2ReviewedAt" timestamp(3) without time zone,
    "receptionist2ReviewedBy" text,
    "receptionist2Notes" text
);


--
-- Name: patient_visits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.patient_visits (
    id text NOT NULL,
    "patientId" text NOT NULL,
    "appointmentId" text NOT NULL,
    "doctorId" text,
    "visitNumber" integer,
    "visitType" text,
    "visitDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "chiefComplaint" text,
    "presentingSymptoms" jsonb,
    "visionComplaints" jsonb,
    "eyeSymptoms" jsonb,
    "onsetDuration" text,
    status public."VisitStatus" DEFAULT 'CHECKED_IN'::public."VisitStatus" NOT NULL,
    "priorityLevel" text,
    "checkedInAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "optometristCalledAt" timestamp(3) without time zone,
    "optometristSeenAt" timestamp(3) without time zone,
    "doctorCalledAt" timestamp(3) without time zone,
    "doctorSeenAt" timestamp(3) without time zone,
    "billingInitiatedAt" timestamp(3) without time zone,
    "completedAt" timestamp(3) without time zone,
    "admissionDate" timestamp(3) without time zone,
    "dischargeDate" timestamp(3) without time zone,
    "estimatedCost" double precision,
    "insuranceCoverage" double precision,
    "totalEstimatedCost" double precision DEFAULT 0,
    "totalActualCost" double precision DEFAULT 0,
    "visitOutcome" text,
    "followUpInstructions" jsonb,
    "followUpRequired" boolean DEFAULT false NOT NULL,
    "followUpDate" timestamp(3) without time zone,
    "nextAppointmentDate" timestamp(3) without time zone,
    "receptionist2Notes" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: patients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.patients (
    id text NOT NULL,
    "patientNumber" integer,
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
    "previousSurgeries" jsonb,
    "familyHistory" jsonb,
    lifestyle jsonb,
    "eyeHistory" jsonb,
    "visionHistory" jsonb,
    "currentMedications" jsonb,
    "riskFactors" jsonb,
    "insuranceDetails" jsonb,
    "defaultInsuranceId" text,
    "profilePhoto" text,
    "passwordHash" text,
    "lastLogin" timestamp(3) without time zone,
    "isReferred" boolean DEFAULT false NOT NULL,
    "referredBy" text,
    "patientStatus" text DEFAULT 'active'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: payments; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: prescription_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.prescription_items (
    id text NOT NULL,
    "prescriptionId" text NOT NULL,
    "medicineId" text,
    "medicineName" text NOT NULL,
    dosage text NOT NULL,
    frequency text NOT NULL,
    duration text NOT NULL,
    instructions text,
    quantity integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: prescriptions; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: refrigerator_temperature_register; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: room_types; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: rooms; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: staff; Type: TABLE; Schema: public; Owner: -
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
    "emergencyContact" jsonb,
    department text,
    "staffType" text NOT NULL,
    "employmentStatus" text DEFAULT 'active'::text NOT NULL,
    "joiningDate" timestamp(3) without time zone,
    qualifications jsonb,
    certifications jsonb,
    "languagesSpoken" text[],
    "doctorProfile" jsonb,
    "nurseProfile" jsonb,
    "technicianProfile" jsonb,
    "adminProfile" jsonb,
    "receptionistProfile" jsonb,
    "receptionist2Profile" jsonb,
    "optometristProfile" jsonb,
    "accountantProfile" jsonb,
    "qualityCoordinatorProfile" jsonb,
    "patientSafetyOfficerProfile" jsonb,
    "tpaProfile" jsonb,
    "otAdminProfile" jsonb,
    "anesthesiologistProfile" jsonb,
    "surgeonProfile" jsonb,
    "sisterProfile" jsonb,
    "profilePhoto" text,
    documents text[],
    "passwordHash" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "lastLogin" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: super_admins; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: appointments appointments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_pkey PRIMARY KEY (id);


--
-- Name: bed_types bed_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bed_types
    ADD CONSTRAINT bed_types_pkey PRIMARY KEY (id);


--
-- Name: beds beds_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.beds
    ADD CONSTRAINT beds_pkey PRIMARY KEY (id);


--
-- Name: bill_items bill_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bill_items
    ADD CONSTRAINT bill_items_pkey PRIMARY KEY (id);


--
-- Name: bills bills_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bills
    ADD CONSTRAINT bills_pkey PRIMARY KEY (id);


--
-- Name: diagnoses diagnoses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.diagnoses
    ADD CONSTRAINT diagnoses_pkey PRIMARY KEY (id);


--
-- Name: digital_register_columns digital_register_columns_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.digital_register_columns
    ADD CONSTRAINT digital_register_columns_pkey PRIMARY KEY (id);


--
-- Name: digital_register_definitions digital_register_definitions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.digital_register_definitions
    ADD CONSTRAINT digital_register_definitions_pkey PRIMARY KEY (id);


--
-- Name: digital_register_records digital_register_records_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.digital_register_records
    ADD CONSTRAINT digital_register_records_pkey PRIMARY KEY (id);


--
-- Name: digital_register_values digital_register_values_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.digital_register_values
    ADD CONSTRAINT digital_register_values_pkey PRIMARY KEY (id);


--
-- Name: diseases diseases_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.diseases
    ADD CONSTRAINT diseases_pkey PRIMARY KEY (id);


--
-- Name: dosage_schedules dosage_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dosage_schedules
    ADD CONSTRAINT dosage_schedules_pkey PRIMARY KEY (id);


--
-- Name: drug_groups drug_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.drug_groups
    ADD CONSTRAINT drug_groups_pkey PRIMARY KEY (id);


--
-- Name: emergency_register emergency_register_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.emergency_register
    ADD CONSTRAINT emergency_register_pkey PRIMARY KEY (id);


--
-- Name: equipment_stock_register equipment_stock_register_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipment_stock_register
    ADD CONSTRAINT equipment_stock_register_pkey PRIMARY KEY (id);


--
-- Name: eto_register eto_register_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.eto_register
    ADD CONSTRAINT eto_register_pkey PRIMARY KEY (id);


--
-- Name: examination_templates examination_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.examination_templates
    ADD CONSTRAINT examination_templates_pkey PRIMARY KEY (id);


--
-- Name: examinations examinations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.examinations
    ADD CONSTRAINT examinations_pkey PRIMARY KEY (id);


--
-- Name: floors floors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.floors
    ADD CONSTRAINT floors_pkey PRIMARY KEY (id);


--
-- Name: fridge_stock_medicines_register fridge_stock_medicines_register_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fridge_stock_medicines_register
    ADD CONSTRAINT fridge_stock_medicines_register_pkey PRIMARY KEY (id);


--
-- Name: generic_medicines generic_medicines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.generic_medicines
    ADD CONSTRAINT generic_medicines_pkey PRIMARY KEY (id);


--
-- Name: hospital hospital_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hospital
    ADD CONSTRAINT hospital_pkey PRIMARY KEY (id);


--
-- Name: icd11_codes icd11_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.icd11_codes
    ADD CONSTRAINT icd11_codes_pkey PRIMARY KEY (id);


--
-- Name: insurance_claims insurance_claims_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.insurance_claims
    ADD CONSTRAINT insurance_claims_pkey PRIMARY KEY (id);


--
-- Name: insurance insurance_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.insurance
    ADD CONSTRAINT insurance_pkey PRIMARY KEY (id);


--
-- Name: letterhead_templates letterhead_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.letterhead_templates
    ADD CONSTRAINT letterhead_templates_pkey PRIMARY KEY (id);


--
-- Name: medicine_types medicine_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medicine_types
    ADD CONSTRAINT medicine_types_pkey PRIMARY KEY (id);


--
-- Name: medicines medicines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medicines
    ADD CONSTRAINT medicines_pkey PRIMARY KEY (id);


--
-- Name: o2_n2_pressure_check_register o2_n2_pressure_check_register_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.o2_n2_pressure_check_register
    ADD CONSTRAINT o2_n2_pressure_check_register_pkey PRIMARY KEY (id);


--
-- Name: ophthalmologist_examinations ophthalmologist_examinations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ophthalmologist_examinations
    ADD CONSTRAINT ophthalmologist_examinations_pkey PRIMARY KEY (id);


--
-- Name: optometrist_examinations optometrist_examinations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.optometrist_examinations
    ADD CONSTRAINT optometrist_examinations_pkey PRIMARY KEY (id);


--
-- Name: ot_emergency_stock_register ot_emergency_stock_register_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ot_emergency_stock_register
    ADD CONSTRAINT ot_emergency_stock_register_pkey PRIMARY KEY (id);


--
-- Name: ot_temperature_register ot_temperature_register_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ot_temperature_register
    ADD CONSTRAINT ot_temperature_register_pkey PRIMARY KEY (id);


--
-- Name: otps otps_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.otps
    ADD CONSTRAINT otps_pkey PRIMARY KEY (id);


--
-- Name: patient_queue patient_queue_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_queue
    ADD CONSTRAINT patient_queue_pkey PRIMARY KEY (id);


--
-- Name: patient_visits patient_visits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_visits
    ADD CONSTRAINT patient_visits_pkey PRIMARY KEY (id);


--
-- Name: patients patients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: prescription_items prescription_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prescription_items
    ADD CONSTRAINT prescription_items_pkey PRIMARY KEY (id);


--
-- Name: prescriptions prescriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prescriptions
    ADD CONSTRAINT prescriptions_pkey PRIMARY KEY (id);


--
-- Name: refrigerator_temperature_register refrigerator_temperature_register_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refrigerator_temperature_register
    ADD CONSTRAINT refrigerator_temperature_register_pkey PRIMARY KEY (id);


--
-- Name: room_types room_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.room_types
    ADD CONSTRAINT room_types_pkey PRIMARY KEY (id);


--
-- Name: rooms rooms_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rooms
    ADD CONSTRAINT rooms_pkey PRIMARY KEY (id);


--
-- Name: staff staff_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staff
    ADD CONSTRAINT staff_pkey PRIMARY KEY (id);


--
-- Name: super_admins super_admins_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.super_admins
    ADD CONSTRAINT super_admins_pkey PRIMARY KEY (id);


--
-- Name: appointments_appointmentDate_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "appointments_appointmentDate_status_idx" ON public.appointments USING btree ("appointmentDate", status);


--
-- Name: appointments_tokenNumber_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "appointments_tokenNumber_key" ON public.appointments USING btree ("tokenNumber");


--
-- Name: bed_types_typeCode_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "bed_types_typeCode_key" ON public.bed_types USING btree ("typeCode");


--
-- Name: bills_billDate_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "bills_billDate_status_idx" ON public.bills USING btree ("billDate", status);


--
-- Name: bills_billNumber_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "bills_billNumber_key" ON public.bills USING btree ("billNumber");


--
-- Name: digital_register_columns_registerId_columnName_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "digital_register_columns_registerId_columnName_key" ON public.digital_register_columns USING btree ("registerId", "columnName");


--
-- Name: digital_register_definitions_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX digital_register_definitions_name_key ON public.digital_register_definitions USING btree (name);


--
-- Name: digital_register_values_recordId_columnId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "digital_register_values_recordId_columnId_key" ON public.digital_register_values USING btree ("recordId", "columnId");


--
-- Name: dosage_schedules_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX dosage_schedules_name_key ON public.dosage_schedules USING btree (name);


--
-- Name: drug_groups_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX drug_groups_name_key ON public.drug_groups USING btree (name);


--
-- Name: equipment_stock_register_medicineName_month_year_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "equipment_stock_register_medicineName_month_year_key" ON public.equipment_stock_register USING btree ("medicineName", month, year);


--
-- Name: generic_medicines_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX generic_medicines_name_key ON public.generic_medicines USING btree (name);


--
-- Name: hospital_hospitalCode_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "hospital_hospitalCode_key" ON public.hospital USING btree ("hospitalCode");


--
-- Name: icd11_codes_foundationId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "icd11_codes_foundationId_key" ON public.icd11_codes USING btree ("foundationId");


--
-- Name: insurance_claims_claimNumber_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "insurance_claims_claimNumber_key" ON public.insurance_claims USING btree ("claimNumber");


--
-- Name: medicine_types_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX medicine_types_name_key ON public.medicine_types USING btree (name);


--
-- Name: medicines_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX medicines_code_key ON public.medicines USING btree (code);


--
-- Name: ophthalmologist_examinations_patientVisitId_examinationSequ_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "ophthalmologist_examinations_patientVisitId_examinationSequ_key" ON public.ophthalmologist_examinations USING btree ("patientVisitId", "examinationSequence");


--
-- Name: optometrist_examinations_patientVisitId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "optometrist_examinations_patientVisitId_key" ON public.optometrist_examinations USING btree ("patientVisitId");


--
-- Name: otps_expiresAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "otps_expiresAt_idx" ON public.otps USING btree ("expiresAt");


--
-- Name: otps_identifier_purpose_isUsed_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "otps_identifier_purpose_isUsed_idx" ON public.otps USING btree (identifier, purpose, "isUsed");


--
-- Name: patient_queue_assignedStaffId_doctorQueuePosition_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "patient_queue_assignedStaffId_doctorQueuePosition_idx" ON public.patient_queue USING btree ("assignedStaffId", "doctorQueuePosition");


--
-- Name: patient_queue_assignedStaffId_status_doctorQueuePosition_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "patient_queue_assignedStaffId_status_doctorQueuePosition_idx" ON public.patient_queue USING btree ("assignedStaffId", status, "doctorQueuePosition");


--
-- Name: patient_queue_patientId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "patient_queue_patientId_idx" ON public.patient_queue USING btree ("patientId");


--
-- Name: patient_queue_queueFor_queueNumber_joinedAt_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "patient_queue_queueFor_queueNumber_joinedAt_key" ON public.patient_queue USING btree ("queueFor", "queueNumber", "joinedAt");


--
-- Name: patient_queue_queueFor_status_priority_joinedAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "patient_queue_queueFor_status_priority_joinedAt_idx" ON public.patient_queue USING btree ("queueFor", status, priority, "joinedAt");


--
-- Name: patient_visits_appointmentId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "patient_visits_appointmentId_key" ON public.patient_visits USING btree ("appointmentId");


--
-- Name: patient_visits_patientId_visitNumber_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "patient_visits_patientId_visitNumber_key" ON public.patient_visits USING btree ("patientId", "visitNumber");


--
-- Name: patients_mrn_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX patients_mrn_key ON public.patients USING btree (mrn);


--
-- Name: patients_patientNumber_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "patients_patientNumber_key" ON public.patients USING btree ("patientNumber");


--
-- Name: prescriptions_prescriptionNumber_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "prescriptions_prescriptionNumber_key" ON public.prescriptions USING btree ("prescriptionNumber");


--
-- Name: room_types_typeCode_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "room_types_typeCode_key" ON public.room_types USING btree ("typeCode");


--
-- Name: staff_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX staff_email_key ON public.staff USING btree (email);


--
-- Name: staff_employeeId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "staff_employeeId_key" ON public.staff USING btree ("employeeId");


--
-- Name: super_admins_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX super_admins_email_key ON public.super_admins USING btree (email);


--
-- Name: appointments appointments_doctorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT "appointments_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES public.staff(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: appointments appointments_patientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT "appointments_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES public.patients(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: appointments appointments_roomId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT "appointments_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES public.rooms(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: beds beds_bedTypeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.beds
    ADD CONSTRAINT "beds_bedTypeId_fkey" FOREIGN KEY ("bedTypeId") REFERENCES public.bed_types(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: beds beds_patientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.beds
    ADD CONSTRAINT "beds_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES public.patients(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: beds beds_roomId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.beds
    ADD CONSTRAINT "beds_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES public.rooms(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: bill_items bill_items_billId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bill_items
    ADD CONSTRAINT "bill_items_billId_fkey" FOREIGN KEY ("billId") REFERENCES public.bills(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: bills bills_hospitalId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bills
    ADD CONSTRAINT "bills_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES public.hospital(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: bills bills_insuranceClaimId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bills
    ADD CONSTRAINT "bills_insuranceClaimId_fkey" FOREIGN KEY ("insuranceClaimId") REFERENCES public.insurance_claims(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: bills bills_patientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bills
    ADD CONSTRAINT "bills_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES public.patients(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: bills bills_patientVisitId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bills
    ADD CONSTRAINT "bills_patientVisitId_fkey" FOREIGN KEY ("patientVisitId") REFERENCES public.patient_visits(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: diagnoses diagnoses_diseaseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.diagnoses
    ADD CONSTRAINT "diagnoses_diseaseId_fkey" FOREIGN KEY ("diseaseId") REFERENCES public.diseases(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: diagnoses diagnoses_doctorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.diagnoses
    ADD CONSTRAINT "diagnoses_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES public.staff(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: diagnoses diagnoses_examinationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.diagnoses
    ADD CONSTRAINT "diagnoses_examinationId_fkey" FOREIGN KEY ("examinationId") REFERENCES public.examinations(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: diagnoses diagnoses_ophthalmologistExaminationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.diagnoses
    ADD CONSTRAINT "diagnoses_ophthalmologistExaminationId_fkey" FOREIGN KEY ("ophthalmologistExaminationId") REFERENCES public.ophthalmologist_examinations(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: diagnoses diagnoses_visitId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.diagnoses
    ADD CONSTRAINT "diagnoses_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES public.patient_visits(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: digital_register_columns digital_register_columns_registerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.digital_register_columns
    ADD CONSTRAINT "digital_register_columns_registerId_fkey" FOREIGN KEY ("registerId") REFERENCES public.digital_register_definitions(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: digital_register_records digital_register_records_registerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.digital_register_records
    ADD CONSTRAINT "digital_register_records_registerId_fkey" FOREIGN KEY ("registerId") REFERENCES public.digital_register_definitions(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: digital_register_values digital_register_values_columnId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.digital_register_values
    ADD CONSTRAINT "digital_register_values_columnId_fkey" FOREIGN KEY ("columnId") REFERENCES public.digital_register_columns(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: digital_register_values digital_register_values_recordId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.digital_register_values
    ADD CONSTRAINT "digital_register_values_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES public.digital_register_records(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: diseases diseases_icd11CodeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.diseases
    ADD CONSTRAINT "diseases_icd11CodeId_fkey" FOREIGN KEY ("icd11CodeId") REFERENCES public.icd11_codes(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: examination_templates examination_templates_createdBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.examination_templates
    ADD CONSTRAINT "examination_templates_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES public.staff(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: examinations examinations_doctorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.examinations
    ADD CONSTRAINT "examinations_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES public.staff(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: examinations examinations_templateId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.examinations
    ADD CONSTRAINT "examinations_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES public.examination_templates(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: examinations examinations_visitId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.examinations
    ADD CONSTRAINT "examinations_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES public.patient_visits(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: insurance_claims insurance_claims_insuranceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.insurance_claims
    ADD CONSTRAINT "insurance_claims_insuranceId_fkey" FOREIGN KEY ("insuranceId") REFERENCES public.insurance(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: insurance_claims insurance_claims_patientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.insurance_claims
    ADD CONSTRAINT "insurance_claims_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES public.patients(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: medicines medicines_dosageScheduleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medicines
    ADD CONSTRAINT "medicines_dosageScheduleId_fkey" FOREIGN KEY ("dosageScheduleId") REFERENCES public.dosage_schedules(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: medicines medicines_drugGroupId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medicines
    ADD CONSTRAINT "medicines_drugGroupId_fkey" FOREIGN KEY ("drugGroupId") REFERENCES public.drug_groups(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: medicines medicines_genericMedicineId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medicines
    ADD CONSTRAINT "medicines_genericMedicineId_fkey" FOREIGN KEY ("genericMedicineId") REFERENCES public.generic_medicines(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: medicines medicines_typeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medicines
    ADD CONSTRAINT "medicines_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES public.medicine_types(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ophthalmologist_examinations ophthalmologist_examinations_doctorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ophthalmologist_examinations
    ADD CONSTRAINT "ophthalmologist_examinations_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES public.staff(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ophthalmologist_examinations ophthalmologist_examinations_patientVisitId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ophthalmologist_examinations
    ADD CONSTRAINT "ophthalmologist_examinations_patientVisitId_fkey" FOREIGN KEY ("patientVisitId") REFERENCES public.patient_visits(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: optometrist_examinations optometrist_examinations_optometristId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.optometrist_examinations
    ADD CONSTRAINT "optometrist_examinations_optometristId_fkey" FOREIGN KEY ("optometristId") REFERENCES public.staff(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: optometrist_examinations optometrist_examinations_patientVisitId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.optometrist_examinations
    ADD CONSTRAINT "optometrist_examinations_patientVisitId_fkey" FOREIGN KEY ("patientVisitId") REFERENCES public.patient_visits(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: patient_queue patient_queue_assignedStaffId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_queue
    ADD CONSTRAINT "patient_queue_assignedStaffId_fkey" FOREIGN KEY ("assignedStaffId") REFERENCES public.staff(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: patient_queue patient_queue_patientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_queue
    ADD CONSTRAINT "patient_queue_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES public.patients(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: patient_queue patient_queue_patientVisitId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_queue
    ADD CONSTRAINT "patient_queue_patientVisitId_fkey" FOREIGN KEY ("patientVisitId") REFERENCES public.patient_visits(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: patient_visits patient_visits_appointmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_visits
    ADD CONSTRAINT "patient_visits_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES public.appointments(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: patient_visits patient_visits_doctorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_visits
    ADD CONSTRAINT "patient_visits_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES public.staff(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: patient_visits patient_visits_patientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_visits
    ADD CONSTRAINT "patient_visits_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES public.patients(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: patients patients_defaultInsuranceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT "patients_defaultInsuranceId_fkey" FOREIGN KEY ("defaultInsuranceId") REFERENCES public.insurance(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: patients patients_referredBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT "patients_referredBy_fkey" FOREIGN KEY ("referredBy") REFERENCES public.patients(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: payments payments_billId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT "payments_billId_fkey" FOREIGN KEY ("billId") REFERENCES public.bills(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: payments payments_patientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT "payments_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES public.patients(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: prescription_items prescription_items_medicineId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prescription_items
    ADD CONSTRAINT "prescription_items_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES public.medicines(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: prescription_items prescription_items_prescriptionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prescription_items
    ADD CONSTRAINT "prescription_items_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES public.prescriptions(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: prescriptions prescriptions_doctorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prescriptions
    ADD CONSTRAINT "prescriptions_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES public.staff(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: prescriptions prescriptions_examinationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prescriptions
    ADD CONSTRAINT "prescriptions_examinationId_fkey" FOREIGN KEY ("examinationId") REFERENCES public.ophthalmologist_examinations(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: prescriptions prescriptions_patientVisitId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prescriptions
    ADD CONSTRAINT "prescriptions_patientVisitId_fkey" FOREIGN KEY ("patientVisitId") REFERENCES public.patient_visits(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: rooms rooms_assignedStaffId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rooms
    ADD CONSTRAINT "rooms_assignedStaffId_fkey" FOREIGN KEY ("assignedStaffId") REFERENCES public.staff(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: rooms rooms_floorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rooms
    ADD CONSTRAINT "rooms_floorId_fkey" FOREIGN KEY ("floorId") REFERENCES public.floors(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: rooms rooms_roomTypeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rooms
    ADD CONSTRAINT "rooms_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES public.room_types(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

