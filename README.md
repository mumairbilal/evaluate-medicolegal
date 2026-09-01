# Evaluate Medicolegal — Case Management Platform

Reconstructed from your Magic Patterns screenshots + PRD. Your **Dashboard** page was already fully designed — I kept that layout and logic (summary cards, clinic today, upcoming appointments, your cases, action required, role switcher, create menu, notifications) and rebuilt it as a real component. Every other sidebar item was a "not yet designed" placeholder in your screenshots — those are now built out.

## What's included (previously missing, now built)

| Page | Route | Notes |
|---|---|---|
| Cases (list) | `/cases` | Table w/ status, priority, owner, doc/task/QA counts |
| Case detail | `/cases/:ref` | Header, status timeline and linked operational tabs (Overview, Patient, Booking, Appointment, Documents, File Preparation, Reports, QA, Tasks, Communication, Activity History) |
| Calendar | `/calendar` | Month grid + appointment list, view switcher (Day/Week/Month/Doctor/Location) |
| Patients (list + profile) | `/patients`, `/patients/:id` | Contact details, related cases, activity |
| Documents | `/documents` | Document workspace, preview/versioning, AI review and three-column file preparation/bundle workflow |
| Tasks | `/tasks` | Persisted My/Team/Overdue/Completed/By Case views, creation and editable task details |
| Communication | `/communication` | Persisted case-linked timeline, attachments, visibility, details and follow-up task creation |
| Reports | `/reports` | Template-based report creation/workspace, QA submission, comments and version history |
| Help & Support | `/help` | Help centre search, guide cards, contact support form |

Dashboard, Sidebar, and Header were rebuilt to match your screenshots pixel-for-pixel in structure (dark navy sidebar, sections DAILY WORK / RECORDS / REPORTS & OVERSIGHT / SYSTEM, top header with search/create/notifications/role-switcher).

## Prototype data layer

This is still a frontend prototype with no production backend, but the operational modules now use a shared `PrototypeDataContext` with localStorage persistence. Seed records originate from `src/data/mockData.ts`; bookings, clients, doctors, appointments, documents, reports, QA reviews, tasks and communications can then be changed through the UI and remain consistent across linked screens. Replace the context actions with API calls when the backend is introduced.

## Run it

```bash
npm install
npm run dev       # http://localhost:5173
npm run build      # production build to dist/
```

## Stack

React 18 + TypeScript + React Router 6 + Tailwind CSS + lucide-react icons. Same stack Magic Patterns typically outputs, so it should drop into your existing repo — just diff/merge `src/pages` and `src/components` against what you already have and keep whichever version of each is newer.

## Current PRD progress

The prototype now covers the complete red-marked UI/UX implementation path through Dashboard, Bookings, Cases, Patients, Clients, Doctors, Calendar, Documents, AI-assisted review, Reports, Quality Assurance, Tasks, Communication, list filtering/saved views, Notification Centre, Analytics/Reporting, Administration, status communication and system feedback states.


### AI-assisted document review prototype
The Documents workspace includes the PRD §16 human-in-the-loop AI review UI: six processing statuses, generated summary/source references, edit/approve/regenerate/report-issue actions, mandatory human-review labelling, and non-blocking Failed → Retry/Continue manually recovery. This is UI/prototype state only; it does not call an external AI service.


## Final PRD completion pass

The remaining red-marked requirements have been implemented. Highlights include persisted custom saved views and date-range list controls, a working Notification Centre, filtered/exportable management analytics, full User/Role/Configuration/Audit administration, icon+text status communication, long-form auto-save/unsaved-change behaviour, access-restricted feedback, and reusable loading/empty/success/error/component-state patterns. Existing Inter typography and brand colour tokens were intentionally left unchanged.

## Final verification / UI polish — 1 Sep 2026

The final pass was checked against all three documents inside the combined 131-page PRD (Main PRD, UI/UX PRD and Tab 3 Screen Breakdown PRD).

Additional completion in this pass:

- Working permission-aware Global Search with grouped results and recent searches.
- Reports toolbar CTA alignment corrected.
- Documents workspace restructured to prevent dense table/preview content from visually colliding; secondary metadata moved into a compact hierarchy and the dedicated preview.
- Help Centre article search and expandable results are functional, with Contact Support form.
- Shared hover/focus/active interaction polish and themed dropdown surfaces.
- My Tasks seeded with realistic current work; Team Workload includes reassignment.
- Forgot/Reset Password, Notification Preferences, Profile/Password/Preferences/Activity screens.
- Administration Security Settings and detailed configuration reference for statuses, appointment types, document rules, report templates and QA checklists.
- File Preparation Queue and explicit PDF Bundle Preview/confirmation flow.
- Final Report Approval and Report Delivery recording.
- Operational Reports with applied-filter details, export and related-record navigation.

The PRD's explicitly **Advanced Features / later phase** (external portals, Email Integration Inbox, billing/invoicing, integration/API management, electronic signatures, etc.) are not represented as completed product functionality in this internal-workflow prototype.
