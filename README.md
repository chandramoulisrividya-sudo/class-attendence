# SmartAttend – Dynamic QR Attendance Management System

**SmartAttend** is a modern, responsive, and secure full-stack web application designed for colleges and universities to digitize attendance management using dynamically generated, cryptographically signed QR codes.

---

## Key Features

### 1. Dynamic QR Code Engine & Anti-Proxy Security
- **Short-Lived Rotating Tokens**: The server issues HMAC-SHA256 digitally signed tokens that rotate every 20 seconds.
- **Anti-Screenshot Protection**: Dynamic watermarks with rotating timestamps prevent students from forwarding screenshots via messaging apps.
- **Single-Attendance Guarantee**: The server strictly enforces one attendance record per student per session.
- **Classroom Geofencing**: Optional geographic coordinate proximity check against classroom beacons and geofences.
- **Real-Time Live Feed**: Faculty screens display student attendee avatars and metrics popping in dynamically as they scan.
- **Immutable Audit Trail**: Every session creation, scan validation, and faculty manual override is logged with actor details and timestamps.

### 2. Three Specialized Dashboards

#### A. Student Dashboard
- Circular SVG attendance percentage gauge with color thresholds:
  - Green (`≥ 85%`): Good Standing
  - Amber (`75% - 84.9%`): Borderline Warning
  - Red (`< 75%`): Critical Shortage Alert
- Subject-wise attendance breakdown and classes needed consecutively to meet the mandatory 75% university eligibility requirement.
- Full daily attendance history log with subject, date, and status filters.
- HTML5 Mobile Camera QR Scanner with `jsqr` targeting reticle, file upload, and 1-click test simulation.
- Export personal attendance reports in CSV format.

#### B. Faculty Dashboard
- Assigned courses and curriculum schedules.
- "Start Attendance Session" modal with Subject, Classroom, Duration, and Syllabus Module inputs.
- Projector mode Dynamic QR broadcast with full-screen toggle, rotating countdown ring, audio scan chimes, and pause/resume controls.
- Manual attendance review & override with required audit justification notes.
- Course register reports with CSV and PDF printable registers.

#### C. Administrator Dashboard
- University-wide executive KPIs: Enrolled Students, Faculty, Departments, Active QR Sessions, and College Attendance Average.
- Department-wise attendance performance comparison.
- Student Management: Search, add new student, and remove student accounts.
- Faculty Management: Roster and course assignments.
- Subjects & Classrooms: Curriculum credits and lecture hall geofence radius settings.
- Shortage Control Center: Instant identification of at-risk students below 75% and 65% with official advisory notice generator.
- Complete system-wide security audit log.

---

## Demo Accounts (Instant 1-Click Access)

| Role | Name | Email / ID | Context |
|---|---|---|---|
| **Student (Exemplary)** | Alex Vance | `alex.vance@smartattend.edu` (Roll: `CS2023048`) | 90% attendance, exam eligible |
| **Student (Shortage)** | David Kim | `david.kim@smartattend.edu` (Roll: `CS2023029`) | 58% attendance, critical shortage warning |
| **Faculty** | Dr. Sarah Jenkins | `sarah.jenkins@smartattend.edu` (ID: `FAC-CSE-01`) | Professor & Head of CSE, hosts CS301 |
| **Admin** | Dr. Marcus Vance | `admin@smartattend.edu` | Dean of Academic Affairs |

---

## Technical Stack & Architecture

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, `qrcode`, `jsqr`, `canvas-confetti`.
- **Backend**: Node.js, Express.js REST APIs with Vite middlewares (`server.ts`).
- **Security**: Cryptographic token generation via HMAC-SHA256, Haversine geofencing distance formulas.
- **Persistence**: Fast JSON-backed database (`data/database.json`) with auto-persistence and demo reset support.

---

## Local Development & Run Instructions

```bash
# Install dependencies
npm install

# Run unit tests (security and calculation rules)
npx tsx --test src/utils/security.test.ts src/utils/attendanceCalculations.test.ts

# Start dev server on port 3000
npm run dev

# Build for production
npm run build
```
