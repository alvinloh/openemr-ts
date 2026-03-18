# OpenEMR-TS

A modern Electronic Health Records (EHR) system built with NestJS and TypeScript, translated from the [OpenEMR](https://www.open-emr.org/) open-source project.

## About

OpenEMR-TS is a clean reimplementation of core OpenEMR clinical workflows in TypeScript. The original OpenEMR project — with over 4,300 PHP files and 281 database tables — was analyzed, and its key clinical features were translated into a modern NestJS application with a redesigned 26-table schema across ~10,000 lines of code.

This project is not a fork — it's a ground-up rewrite that preserves OpenEMR's clinical patterns, FHIR R4 compliance, and HL7v2 interoperability while modernizing the architecture.

## Features

### Clinical
- **Patient Management** — full CRUD with search, MRN generation, encrypted PHI (SSN via AES-256-GCM)
- **Encounters** — ambulatory/emergency/inpatient encounters with diagnoses (ICD-10/SNOMED)
- **Vitals** — temperature, BP, pulse, respirations, O2 sat, height, weight, BMI
- **Medications** — prescriptions with RxNorm codes, dosage, route, frequency, refills
- **Lab Orders & Results** — create orders, receive results, view reports with abnormal flags
- **Conditions & Allergies** — problem list and allergy tracking with severity/reaction
- **Scheduling** — calendar UI with day/week/month views, appointment booking, status workflow (scheduled → arrived → completed)
- **Billing** — billing entries, claims, insurance management
- **Documents** — file upload/download with SHA-256 hashing, category organization

### Interoperability
- **FHIR R4 API** — 8 resource types: Patient, Encounter, Observation, MedicationRequest, Condition, AllergyIntolerance, Appointment, DocumentReference
- **HL7v2** — parse and generate ORM (lab orders) and ORU (lab results) messages
- **HL7 MDM** — receive clinical documents (discharge summaries, consultation notes, operative reports) via MDM^T02/T04/T08
- **HL7 Transport** — MLLP (TCP) and HTTP senders for transmitting orders to lab systems
- **OAuth2 Client Credentials** — external EHRs register for scoped FHIR access with client_id/client_secret
- **Webhooks** — subscribe to events (lab.order.sent, lab.results.received, document.received, etc.) with HMAC-SHA256 signed payloads
- **DICOM Viewer** — in-browser medical image viewer supporting JPEG-compressed multi-frame images with window/level controls

### Infrastructure
- **HIPAA Audit Logging** — every API call logged with user, patient, resource, action, IP
- **JWT + Session Auth** — stateless API tokens and cookie-based UI sessions
- **RBAC** — role-based access control (admin, physician, nurse, staff, billing)
- **PDF Generation** — Puppeteer + Handlebars templates for encounter summaries and lab reports
- **BullMQ Jobs** — Redis-backed queues for async HL7 processing and report generation
- **Swagger/OpenAPI** — interactive API documentation at `/api-docs`

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 22 |
| Framework | NestJS 11 |
| Language | TypeScript |
| Database | MariaDB / MySQL |
| ORM | TypeORM |
| Queue | BullMQ + Redis |
| Auth | Passport.js (JWT + Local) |
| PDF | Puppeteer + Handlebars |
| Frontend | jQuery + Bootstrap 4 |
| Testing | Jest + Playwright |

## Quick Start

### Prerequisites
- Node.js 22+
- MariaDB or MySQL
- Redis

### Setup

```bash
# Clone
git clone https://github.com/alvinloh/openemr-ts.git
cd openemr-ts

# Install dependencies
npm install

# Create database
mysql -u root -e "CREATE DATABASE openemr_ts CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Configure environment
cp .env.example .env
# Edit .env with your database credentials

# Start (tables auto-created on first run)
npm run start:dev
```

### Seed Data

On first run, create the admin user:

```bash
# Login to MariaDB and insert admin user
# Or use the seed script in seeds/initial-data.seed.ts
```

### Access

- **UI**: http://localhost:3000 (login: `admin` / `admin`)
- **Swagger**: http://localhost:3000/api-docs
- **FHIR**: http://localhost:3000/fhir/metadata

## API Overview

### REST API
```
POST   /api/auth/login                        # Login
GET    /api/patient                            # Search patients
POST   /api/patient                            # Create patient
GET    /api/patient/:pid/encounter             # List encounters
POST   /api/patient/:pid/encounter             # Create encounter
POST   /api/patient/:pid/medication            # Add medication
GET    /api/procedure                          # List lab orders
POST   /api/procedure                          # Create lab order
POST   /api/hl7/receive                        # Receive HL7 (ORU + MDM)
POST   /api/hl7/send/:orderUuid               # Send HL7 order to lab
```

### FHIR R4 API
```
GET    /fhir/metadata                          # CapabilityStatement
GET    /fhir/Patient[?name=Doe]                # Search patients
GET    /fhir/Encounter?patient=1               # Patient encounters
GET    /fhir/Observation?patient=1&category=vital-signs
GET    /fhir/MedicationRequest?patient=1       # Patient medications
GET    /fhir/Condition?patient=1               # Problem list
GET    /fhir/AllergyIntolerance?patient=1      # Allergies
GET    /fhir/Appointment?patient=1             # Appointments
GET    /fhir/DocumentReference?patient=1       # Documents
```

### OAuth2 (External System Access)
```bash
# 1. Register a client (admin)
POST /api/oauth2/register

# 2. Get token (external system)
POST /oauth2/token
  grant_type=client_credentials
  client_id=...
  client_secret=...

# 3. Query FHIR with token
GET /fhir/Patient -H "Authorization: Bearer <token>"
```

## Testing

```bash
# Unit tests (32 tests)
npx jest --testPathPatterns="test/unit"

# E2E API tests (25 tests) — requires running server
npx jest --testPathPatterns="test/e2e"

# Playwright browser tests (10 tests)
npm run test:playwright
```

## Project Structure

```
src/
├── auth/           # JWT + session auth, RBAC
├── patient/        # Patient CRUD
├── encounter/      # Encounters, vitals, conditions, allergies
├── medication/     # Medications/prescriptions
├── lab/            # Lab orders, reports, results
├── scheduling/     # Appointments, calendar
├── billing/        # Billing entries, claims, insurance
├── document/       # File upload/download
├── fhir/           # FHIR R4 mappers + controller
├── hl7/            # HL7v2 parser, generator, MLLP/HTTP sender
├── dicom/          # DICOM viewer integration
├── oauth2/         # OAuth2 client registration + token server
├── webhook/        # Event webhooks with HMAC signing
├── audit/          # HIPAA audit logging
├── pdf/            # PDF generation (Puppeteer + Handlebars)
├── jobs/           # BullMQ async processors
└── common/         # Shared entities, guards, decorators, utils
```

## Acknowledgments

This project stands on the shoulders of [**OpenEMR**](https://www.open-emr.org/) — the most popular open-source electronic health records and medical practice management solution in the world.

OpenEMR has been serving the healthcare community since 2002, and its dedication to open-source, standards-compliant EHR software has made quality healthcare IT accessible to providers of all sizes, from small clinics to large hospital networks, across more than 100 countries.

We are deeply grateful to the OpenEMR community — the developers, contributors, and maintainers who have built and sustained this project over two decades. Their work on FHIR R4 compliance, HL7 interoperability, HIPAA-compliant audit logging, and clinical workflows directly informed the architecture and design of OpenEMR-TS.

- **OpenEMR Website**: https://www.open-emr.org/
- **OpenEMR GitHub**: https://github.com/openemr/openemr
- **OpenEMR Community**: https://community.open-emr.org/

OpenEMR is licensed under the GNU General Public License v3.

## License

This project is independently developed and is not affiliated with or endorsed by the OpenEMR project. It is provided as-is for educational and development purposes.
