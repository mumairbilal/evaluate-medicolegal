# Evaluate Medicolegal — PRD → Codebase Mapping

This document maps every major requirement in `Evaluate_Medicolegal_PRD_2.pdf`
(131 pages — Main PRD + UI/UX Spec + Screen Specification, combined into one
file) to where it is implemented in this codebase, so you can justify each
screen/decision against the PRD.

The PRD itself defines three delivery priorities (Screen Priority
Classification, PRD p.62):

- **Priority 1 — MVP**
- **Priority 2 — Workflow Automation**
- **Priority 3 — Advanced Features**

This build implements **Priority 1 (MVP)** end-to-end and now prototypes selected Priority 2/3 UI workflows where they are explicitly required by the UI/UX PRD, including the human-in-the-loop AI review experience in §16. Real AI inference, deep analytics backends, portals and external integrations remain outside this front-end prototype and are called out below where relevant.

---

## 1. Roles (PRD §6 "Primary Users and Roles")

| PRD Role | App Role (`src/context/RoleContext.tsx`) | Sample User | Dashboard File |
|---|---|---|---|
| 6.1 Administrators | Booking Administrator | Priya Nandra | `pages/dashboards/BookingAdministratorDashboard.tsx` |
| 6.2 Operations Team | Operations Manager | Marcus Bell | `pages/dashboards/OperationsDashboard.tsx` |
| 6.3 Doctors and Medical Experts | Medical Expert | Dr Amara Osei | `pages/dashboards/MedicalExpertDashboard.tsx` |
| 6.4 File Preparation Team | File Preparation | Fiona Chen | `pages/dashboards/FilePreparationDashboard.tsx` |
| 6.5 Quality Assurance Team | Quality Assurance | Elaine Fitzgerald | `pages/dashboards/QaDashboard.tsx` |
| 6.6 System Administrators | System Administrator | Tom Ackerley | reuses Operations dashboard + `pages/Administration.tsx` |
| 6.7 Management | Management | Helena Vasquez | `pages/dashboards/ManagementDashboard.tsx` |

Each role has its own **sidebar navigation set** (`RoleContext.tsx → nav`),
matching PRD §6 (Information Architecture) — a Doctor doesn't see
"Bookings" or "Clients", QA doesn't see "Calendar", etc., because the PRD
defines different responsibilities per role.

The **"VIEW AS ROLE" switcher** in the header (`components/Header.tsx`) lets
you preview any role without logging in as a different user — this exists
purely to make the prototype demo-able; the PRD does not require it as a
production feature (real role-switching would be admin-managed, see §18
Administration).

---

## 2. Authentication (PRD §4, UI/UX Spec)

| Screen | PRD Ref | File |
|---|---|---|
| Login Screen | §4.1 | `pages/Login.tsx` |
| Multi-Factor Authentication | §4.2 | `pages/Mfa.tsx` |
| Forgot Password | §4.3 | `pages/ForgotPassword.tsx` — validated recovery request and confirmation state |
| Reset Password | §4.4 | `pages/ResetPassword.tsx` — password rules, confirmation and success flow |
| Session Expired modal | §4.5 | `components/SessionExpiredModal.tsx` — re-authenticate or return to login |

---

## 3. Dashboards (PRD §8 "Dashboard Requirements")

The PRD explicitly lists what each role's dashboard should contain. Every
card/section below is named directly from PRD §8.2–§8.7 so you can point at
the PDF and the screen side by side.

### 8.2 Administrator Dashboard → `BookingAdministratorDashboard.tsx`
PRD asks for: New bookings · Bookings requiring information · Appointments
to schedule · Appointments today · Missing documents · Outstanding
communication · Overdue administrative tasks · Recently updated cases.

Implemented as: 6 summary cards (New bookings, Awaiting information, To be
scheduled, Appointments today, Missing documents, Overdue tasks) +
Appointments today list + Quick actions + Bookings requiring action +
Overdue administrative tasks + Recently updated cases + Recent
communication (covers "outstanding communication").

### 8.3 Operations Dashboard → `OperationsDashboard.tsx`
PRD asks for: Active cases by status · Overdue cases · Cases without an
owner · Workload by team member · Delayed reports · QA backlog · Upcoming
deadlines · Operational alerts.

Implemented as: 6 summary cards + "Cases by status" bar chart + "Workload
by team member" + "Operational alerts" + "Upcoming deadlines" +
"Unassigned cases" table.

### 8.4 Doctor Dashboard → `MedicalExpertDashboard.tsx`
PRD asks for: Assigned cases · Appointments today · Upcoming appointments ·
Files ready for review · Reports requiring completion · QA amendments ·
Reports awaiting approval.

Implemented 1:1 as summary cards with matching labels.

### 8.5 File Preparation Dashboard → `FilePreparationDashboard.tsx`
PRD asks for: Cases awaiting file preparation · Recently uploaded documents
· Missing document issues · AI processing status · Files requiring review ·
Prepared bundles awaiting confirmation · Overdue preparation tasks.

Implemented as matching summary cards. The dashboard AI-processing card is backed by the prototype status model used in the Documents/File Preparation workflow; the UI is interactive, while real model inference remains outside this front-end prototype.

### 8.6 QA Dashboard → `QaDashboard.tsx`
PRD asks for: Reports awaiting review · High-priority reviews · Reports
near deadline · Reports returned for amendment · Resubmitted reports ·
Recently approved reports.

Implemented 1:1.

### 8.7 Management Dashboard → `ManagementDashboard.tsx`
PRD asks for: Total bookings · Active cases · Completed cases · Average
turnaround · Overdue cases · Appointments completed · Reports awaiting QA ·
Workload distribution · Case volume trends · Client/doctor performance.

Implemented: summary cards for the first six, plus a case-volume trend
chart. Client and doctor performance are also available in the full Analytics workspace, together with workload, turnaround, appointment and QA statistics.

---

## 4. Workflow Automation (PRD Priority 2)

The interactive front-end workflow is implemented across File Preparation, AI review, Reports, Quality Assurance, final approval/delivery, notifications and analytics. Real AI inference, mail delivery, binary PDF generation and external system integrations remain backend concerns; the prototype provides complete user-facing states and controls for those workflows.

---

## 5. Case Management (PRD §7/§10, Screen Spec §7)

`pages/CaseDetail.tsx` implements the **Case Management UI** from UI/UX PRD §10:

- §10.1 Case header — case/client reference, patient, status, priority, assigned doctor, case owner and target completion date.
- §10.2 Status timeline — completed/current/upcoming stages, visible stage dates and an explicit blocked state when a case is placed on hold.
- §10.3 Case tabs — Overview · Patient · Booking · Appointment · Documents · File Preparation · Reports · Quality Assurance · Tasks · Communication · Activity History, with useful counts for documents, reports, QA comments, tasks and communication.
- §10.4 Case overview — next required action, important deadline, assigned users, appointment, missing information, recent activity, outstanding tasks, latest report status, document readiness and QA status.
- §10.5 Case actions — Edit Case, Change Status, Assign User, Add Task, Add Note, Upload Document, Schedule Appointment, Create Report, Place on Hold and Mark Complete. Sensitive hold/complete actions use explicit confirmation modals.

`pages/CaseList.tsx` implements the Case List Screen (§7.1) — table with
search/filter, matching the PRD's suggested columns (reference, patient,
client, doctor, status, priority, owner, target date).

---

## 6. Booking Management (PRD §9 UI/UX Spec, §6 Screen Spec)

| Screen | File |
|---|---|
| Booking List Screen (§6.1) | `pages/Bookings.tsx` — search, complete PRD filter set (including booking/appointment date, doctor, client, case type and missing information), sort, saved views, export, suggested table columns and row Actions |
| Create Booking (§6.2) | `components/NewBookingModal.tsx` — guided booking flow including appointment requirements, document upload, fees/deadlines, review, Save as Draft, Save and Continue, validation, duplicate-patient warning and duplicate-booking warning |
| Booking Details / booking actions (§6.4–§6.6) | `pages/BookingDetail.tsx` — consolidated booking overview with genuinely working edit, appointment scheduling/rescheduling (time/conflict validation), traceable information requests (recipient email validation + requested-item checklist), real multi-file metadata upload, notes/activity, linked client/case actions, cancellation and conversion. Booking state is shared/persisted across list/detail navigation via `PrototypeDataContext`. |

---

## 7. Other core record screens

| PRD Screen | File |
|---|---|
| Patient List / Profile (§11 UI/UX) | `pages/PatientList.tsx`, `pages/PatientProfile.tsx` — PRD-aligned linked-case count and last activity, personal/contact/address/accessibility/interpreter/communication details, related cases, appointment history, permitted documents, activity history, working edit flow, and duplicate-patient handling with match review/use-existing/confirmed-create actions |
| Client List / Profile (§12 UI/UX) | `pages/Clients.tsx`, `pages/ClientDetail.tsx` — client list plus organisation information, contact people, communication details, service requirements, standard instructions, report delivery preference, permitted agreed-fee information, active/completed cases and performance summary. `EditClientModal.tsx` provides a working edit flow. |
| Doctor List / Profile (§13 UI/UX) | `pages/Doctors.tsx`, `pages/DoctorDetail.tsx` |
| Document Workspace (§12, UI/UX §15) | `pages/Documents.tsx` |
| Reports List / Workspace (§13, UI/UX §17) | `pages/Reports.tsx` |
| QA Queue / Review (§14, UI/UX §18) | `pages/QualityAssurance.tsx` |
| Task List (§15, UI/UX §19) | `pages/Tasks.tsx` |
| Communication Timeline (§16, UI/UX §20) | `pages/Communication.tsx` |
| Calendar (§8, UI/UX §14) | `pages/Calendar.tsx` |
| Analytics Overview / Operational Reports (§17, UI/UX §23) | `pages/Analytics.tsx` — summary/trend/status/workload/turnaround/client/doctor/appointment/QA analytics, full PRD filters, operational report details and confirmed CSV/JSON export |
| Administration (§18) | `pages/Administration.tsx` — users, roles/permissions, configuration detail, report-template and QA-checklist configuration, audit logs and Security Settings |
| My Profile (§21.1) | `pages/Profile.tsx` |
| Help Centre (§22.1) | `pages/Help.tsx` |

---

## 8. Case statuses (PRD §9)

The PRD lists 20 suggested statuses and explicitly says *"the final status
list should be confirmed with stakeholders during the research phase"*
(PRD p.20). This build implements a working subset of ~11 statuses that
covers the full case lifecycle end-to-end (see `components/StatusBadge.tsx`):
New Booking, Information Required, Appointment Scheduled, File Preparation,
Report in Progress, Quality Assurance, Amendments Required, Report
Delivered, On Hold, Completed, Cancelled — deliberately simplified rather
than modelling all 20 PRD-suggested states, since the PRD itself flags that
list as provisional.

---

## 9. Design system (PRD §31–§32, UI/UX Spec)

| PRD Requirement | Implementation |
|---|---|
| §31.2 Typography — clean, professional sans-serif | Inter (`tailwind.config.js → fontFamily.sans`) |
| §32 Design System — consistent color tokens, status colors | `tailwind.config.js → theme.extend.colors` (`brand`, `ink`, `teal`) + `StatusBadge.tsx` / `PriorityBadge.tsx` for consistent status/priority colour coding across every screen |
| §7.1 Left Sidebar (persistent nav, collapsible) | `components/Sidebar.tsx` — collapsible, role-based sections |
| §7.2 Top Header (search, notifications, create action, user menu) | `components/Header.tsx` |
| §7.4 Global Quick Actions | "+ Create" dropdown in header + dashboard "Quick actions" cards |
| §5.4 Role Relevance (UI/UX principle) | Every dashboard, nav set, and screen list above is role-specific per PRD §6 |

---

## 10. What's explicitly out of scope for this build

Per the PRD's own priority tiers, the following are **not** implemented and
should be justified as Priority 2/3, not gaps in Priority 1:

- Real AI inference/backend integration is not wired up. UI/UX §16 is implemented as a stateful human-in-the-loop prototype (status, generated draft, sources, review/approval, retry/manual recovery and issue reporting), but it intentionally does not call an external model service.
- Deep analytics — trend breakdowns, client/doctor performance, data export
  (§23 UI/UX, §17 Screen Spec) — Priority 3.
- Client/interpreter portals, external integrations — mentioned in §2
  Product Overview as future phases, not modelled at all in this build.
- Full audit logging / security settings screens (§18.13–§18.14,
  PRD §10 Data Security) — the *requirement* (role-based access, individual
  accounts) is respected structurally (per-role nav/permissions), but the
  admin-facing audit log UI itself isn't built.

---

*This mapping was generated by reading `Evaluate_Medicolegal_PRD_2.pdf`
against the current `src/` tree. If a PRD section isn't listed above, it
wasn't found to have a matching screen — call it out and we'll either build
it or document why it's deferred.*

## UX refinement pass — case workflow quality
- Replaced generic Case action placeholders for Assign user, Add task, Add note, Upload document, and Schedule appointment with structured, case-linked workflows.
- Case task creation now persists in the open Case Tasks tab; case document uploads persist in Documents; case appointments persist in Appointment; internal notes persist in Communication and Activity History; assignment updates the displayed case owner.
- Appointment creation validates required fields, invalid time ranges, and doctor time conflicts. Rescheduling marks the prior appointment as rescheduled.
- New case creation now detects possible duplicate active cases by patient identity and requires an explicit separate-matter confirmation before another case can be created.
- Patient/client phone-entry controls now separate country code from local number. Patient create/edit and client creation enforce email/phone validation.
- UI density was reduced without changing the existing brand palette or Inter font family; Case Overview was regrouped into Workflow, Ownership & Work, and Readiness sections.

## Booking + Client refinement pass
- Booking list/detail now use a shared localStorage-backed prototype data context so edits and workflow actions persist across navigation/reload.
- Edit Booking is a structured form and blocks duplicate active bookings for the same patient, client and case type.
- Schedule/Reschedule Appointment captures expert, appointment type, method, date/time, location, interpreter and notes, including invalid-time and doctor-conflict validation.
- Request Information captures recipient, validated email, requested-item checklist, due date, subject and message; the request is visible on the booking and updates missing-information status/activity.
- Upload Documents uses real file selection/drag-drop with file type/size checks and adds uploaded document metadata to the booking.
- Booking layout was consolidated into one main operational surface plus a compact workflow sidebar to reduce visual clutter.
- `PhoneInput.tsx` now exposes broad international/territory calling-code coverage instead of a six-country subset; all patient/client forms that use the shared control receive the expanded list.
- Client Management PRD §12 is now continued with working client profiles and edit flow.

## Dropdown / export reliability pass
- Added a reusable dismissable-menu hook. Custom menus now close on outside click and Escape instead of remaining layered over the page.
- Applied it to the shared PageToolbar (Filters, Saved Views, Sort), global Header (Create, Notifications, Profile) and Case "More actions" menu.
- Booking Export now generates and downloads a real UTF-8 CSV containing the currently searched/filtered/saved-view/sorted booking rows instead of displaying a placeholder toast.

## Doctor Management continuation — UI/UX PRD §13
- `pages/Doctors.tsx` retains the PRD doctor list fields and now links every medical expert to a real profile.
- `pages/DoctorDetail.tsx` implements Doctor Profile with professional/contact details, specialities, appointment types, locations, availability, assigned cases, appointment calendar, report workload and performance information.
- Doctor Availability is an interactive tab: availability status and capacity notes can be updated and persist through `PrototypeDataContext`.
- Doctor Workload is a dedicated tab showing case, appointment and report workload with case navigation.
- Newly created doctors are also persisted in the shared prototype data layer and retain their selected appointment types/location metadata.


## Doctor safety + copy refinement
- Doctor creation copy is now consistently **Add doctor** (toolbar, modal title, and submit action); the UI no longer says “Create doctor”.
- Doctor profiles now expose explicit account actions: deactivate/reactivate and remove. Removal is confirmation-gated and blocked while active cases or scheduled appointments still reference the doctor; the UI directs users to reassign active work first.
- A small UI copy pass corrected inconsistent/awkward labels while preserving the existing brand typography and visual tokens.

## Calendar & Appointment continuation — UI/UX PRD §14
- §14.1 Calendar views: Day, Week, Month, Doctor and Location views remain available.
- §14.2 Calendar filters is implemented completely: Doctor, Location, Appointment type, Appointment status, Client and Date range, with clear-filter behaviour and visible result count.
- §14.3 Calendar event design now surfaces time, patient, doctor, appointment type, text status and location/remote context directly in appointment blocks; appointments open into the details workflow.
- §14.4 New Appointment Form includes case, patient, doctor, appointment type, date, start/end time, location, consultation method, interpreter requirement and notes. It warns on missing mandatory information, invalid time ranges, doctor conflicts and duplicate/overlapping patient bookings.
- §14.5 Appointment Details is implemented as a working modal containing patient, case, doctor, date/time, location, appointment type, status, interpreter, notes, outcome and history. Actions include Edit, Reschedule, Cancel, Mark attended, Mark did not attend, Add outcome and Open case.
- Calendar appointments now use the shared persisted prototype data context, so appointments created/edited from Calendar persist across navigation/reload and update Doctor appointment workload.

## Document Management continuation — UI/UX PRD §15
- §15.1 Document Workspace is now a three-area operational workspace with folder/category navigation, searchable/filterable/sortable document list, persistent document preview and upload entry points.
- §15.2 Document List now surfaces file name, category, uploader, upload date, version, size, review status, AI status and actions. Sticky headers, row selection and a working bulk "Mark approved" action are included.
- §15.3 Upload Experience supports drag-and-drop, multiple files, visible upload progress, type/size validation, category and confidentiality selection, duplicate-name warnings/new-version handling, replacement of invalid files and a retry path that preserves the upload queue after failure.
- §15.4 Document Preview provides page navigation, zoom, rotation, document information, category changes, notes, version history and permitted prototype download behaviour. Review/category/note changes persist through `PrototypeDataContext`.
- §15.5 File Preparation Workspace uses the requested three-column pattern: ordered/selectable source list, preparation preview, and preparation controls. It supports drag reordering, preparation-copy page removal/restoration, duplicate review, missing-document checklist, human-reviewed AI summary, PDF bundle generation, final bundle preview, save-as-version and mark-file-ready actions.
- Global/Case document uploads now use the same persisted document library, so documents added from a Case appear in Documents and prepared bundles remain available across navigation/reload.


## AI-Assisted UI continuation — UI/UX PRD §16
- §16.1 AI Status Indicators: Documents use the complete status set — Not Started, Processing, Completed, Review Required, Failed and Approved — through the shared `StatusBadge` treatment. Failed is explicitly styled as critical.
- §16.2 AI Summary Interface: `components/DocumentAiSummaryPanel.tsx` is integrated into Document Preview and shows the generated summary, source-document/page references, generation date, current AI status, editable content, Approve, Regenerate and Report issue actions.
- §16.3 AI Content Labelling: every generated draft visibly carries **“AI-generated draft — human review required.”** Editing an approved/completed draft returns it to Review Required; AI content is never presented as verified before explicit human approval.
- §16.4 AI Error Handling: Failed processing displays a plain-language error while leaving the source document accessible. Users can Retry AI or Continue manually, and processing itself also exposes manual continuation so AI cannot block the case workflow.
- Prototype AI state is persisted with the document record in `PrototypeDataContext` (`aiSummary`, generation time, source refs, error and reported issue). Real model inference is intentionally not called by this UI prototype.

## Report Management continuation — UI/UX PRD §17
- §17.1 Reports List is implemented with case reference, patient, doctor, report type, current version, report status, QA status, due date, last updated and assigned user. Search/filter/saved-view/sort controls and CSV export support the operational list.
- §17.2 Create Report Flow is a structured case-linked flow: select case, select report template/type, review auto-populated case information, edit report content, review, then Save draft or Submit for QA. Submission creates a linked QA queue item rather than a disconnected placeholder.
- §17.3 Report Workspace provides editable report content, case summary, source documents, version/save information, comments and workflow actions. Working actions include Save draft, Upload new version, Submit/Resubmit for QA, Request information, Approve final report after QA approval, Download and View version history.
- §17.4 Version History records version number, date, author, status, change summary and QA outcome with preview/download behaviour. The final-approved version is visually identified.
- Reports are now persisted in `PrototypeDataContext`, and Case/Doctor/QA surfaces read the same report records so workflow changes remain consistent across navigation.

## Quality Assurance continuation — UI/UX PRD §18
- §18.1 QA Queue includes case reference, patient, doctor, report type, submission date, due date, priority, assigned reviewer and review status, with filtering/sorting and review entry points.
- §18.2 QA Review Workspace contains report preview, case information, QA checklist, comment panel, previous report versions, supporting documents and persistent review history.
- §18.3 QA Checklist supports Pass, Issue Found and Not Applicable. Every Issue Found item captures comment, severity, required action and report-section reference; issue resolution is explicitly tracked.
- §18.4 QA actions are working: Save Review, Return for Amendments, Approve Report, Reassign Review and Add General Comment. Return/approve use explicit confirmation and validation rules.
- §18.5 Amendment Experience is linked end-to-end: returned QA comments appear in the Report Workspace, can be resolved/reopened, Resubmit for QA creates a new report version, and previous QA history remains available.
- QA approval updates the shared report QA state; final report approval remains a separate report-owner action after QA, preserving the intended workflow separation.

## Task Management continuation — UI/UX PRD §19
- §19.1 Task List provides My Tasks, Team Tasks, Overdue Tasks, Completed Tasks and Tasks by Case. Columns include task, related case, owner, due date, priority, status and created by; overdue rows are explicitly highlighted.
- §19.2 Task Creation captures title, description, related case, owner, due date, priority, task type, supporting document and notification preference. Case-created and Communication follow-up tasks use the same persisted task store.
- §19.3 Task Statuses include Not Started, In Progress, Blocked, Completed and Cancelled. Task details are editable in a dedicated modal rather than a toast-only action.

## Communication continuation — UI/UX PRD §20
- §20.1 Communication Timeline supports emails, telephone calls, internal notes, patient/client/doctor communication and automated System Notifications in the same case-linked timeline.
- §20.2 Add Communication captures communication type, sender, recipient, date/time, subject, notes/summary, attachment and optional follow-up task. Follow-up creation writes a real shared Task record.
- §20.3 Visibility is explicit: internal records carry the required **Internal Only** label, external communication is separately labelled, and System Notifications are visually identifiable as automated activity.
- Communication details expose attachment and linked follow-up-task context, and Case Communication reads from the same persisted communication dataset.

## Cross-module workflow integration for §§17–20
- Case → Create report opens the actual structured Create Report flow with the current case preselected.
- Report → Submit for QA creates/updates the real QA queue; QA decisions update the same report; amendments and resubmissions retain version/review history.
- Case → Add task and Communication → Create follow-up task both populate the global Tasks module.
- Report → Request information records a case-linked Communication item rather than only showing a success message.
- Case report/QA/task/communication tabs now derive their content from the same shared persisted prototype state as the global modules.

## Final red-marked PRD completion pass — §§21–32

The remaining **red-marked** UI/UX requirements in the supplied PRD are now implemented as follows.

### §21 Search and Filtering — red §21.2 List Filters + §21.3 Saved Views
- `PageToolbar.tsx` now provides the shared list-control standard used by operational list screens: search, filter menus, sorting, result count, clear filters, persisted custom saved views, and date-range controls wherever the underlying records expose a parseable date field.
- Custom saved views persist the current search, selected filters, sort order and applicable date range in localStorage and can be reapplied or removed.
- Existing purpose-built views such as booking/report/QA/communication saved views remain available alongside user-created views.

### §22 Notifications — remaining red fields/types/behaviour
- `context/NotificationContext.tsx` + `pages/Notifications.tsx` implement a persistent Notification Centre with title, related case, time, read/unread state, priority and direct action route.
- All PRD notification types are represented: new assignment, appointment created/changed, missing document, task approaching deadline/overdue, report submitted, QA amendment requested, report approved and case completed.
- Users can mark individual items as read, mark all as read, open the related action/case, filter by type, search notifications and reveal earlier notifications.
- `Header.tsx` uses the same notification state and links to the full centre.

### §23 Analytics and Reporting — all red analytics bullets, filters and export
- `pages/Analytics.tsx` now contains summary cards, case-volume trend chart, status breakdown, workload table, turnaround metrics, client performance, doctor performance, appointment statistics and QA statistics.
- Analytics filters include date range, client, doctor, case type, team, user, status and location, and affect the operational analytics view.
- Export supports CSV/JSON and explicitly displays export format, included filters, date range and a medicolegal confidentiality warning before download.

### §24 Administration — all red administration headings
- **§24.1 User Management:** user list, Add User, role/team assignment, activation/suspension, access reset, last login and permission review.
- **§24.2 Role Management:** view roles, add role, copy role, assign/review permissions, review assigned users, and explicit confirmation/warning before permission changes.
- **§24.3 Configuration:** case statuses, appointment types, case types, document categories, task types, locations, notification rules, report templates, QA checklists and client requirements are editable reference sets.
- **§24.4 Audit Logs:** search, date filters, user/action/record filters, case reference filter and a detailed activity view are included. Sensitive admin access is role-gated and does not partially expose restricted data.

### §25 Status and Visual Communication
- `StatusBadge.tsx` centralises neutral/informational/positive/warning/critical/inactive treatments.
- Every rendered badge includes a text label plus a semantic icon in addition to colour, so status is never communicated by colour alone.

### §26.3 Saving Behaviour
- The long New Booking flow retains Save as Draft and Save and Continue, shows explicit save confirmation through the existing toast workflow, automatically stores an in-progress local draft, and warns before closing with unsaved form work.
- Report/document workspaces already expose saved/saving workflow state where technically appropriate.

### §28 System Feedback and States
- Administration → Configuration includes the reusable system-state patterns for Loading, Empty, Success, Error/Retry and Access Restricted states.
- Restricted Administration access explicitly states that permission is missing and does not partially expose sensitive user/configuration/audit information.

### §31.2 Typography red requirement
- The project continues to use the existing modern sans-serif **Inter** configuration. No brand font or palette changes were made in this pass.

### §32 component-state red bullets
- Administration → Configuration includes reference interaction states for Default, Hover, Focus, Active, Selected, Disabled, Error and Loading, aligned with the existing design tokens.

### Final scope note
- The implementation is still a frontend prototype with localStorage-backed state rather than a production backend, but all red-marked UI/UX items in the supplied PRD are now represented in the prototype without changing the established brand colour tokens or typography.


## Final three-document PRD verification — 1 September 2026

The combined 131-page PRD contains **Main PRD**, **UI/UX PRD** and **Tab 3 — Screen Breakdown PRD**. A final screen-by-screen verification was completed against all three sections. In addition to the module work mapped above, the following Screen Breakdown requirements are now explicitly represented:

- **Global Search Results / No Results** — `pages/GlobalSearch.tsx`: case/client references, patients, clients, doctors, appointments, reports and documents; grouped result types, category filters, recent searches, result count and permission-aware visibility. `Header.tsx` routes the global search field to this screen.
- **Notification Preferences** — `pages/Notifications.tsx`: in-platform/email notifications, task reminders, appointment/report/QA updates and digest preference.
- **User Profile screens** — `pages/Profile.tsx`: My Profile, Change Password, My Preferences and My Activity including completed tasks, report actions, login activity, downloads/exports and saved preferences.
- **Help and Support** — `pages/Help.tsx`: searchable help articles for Getting Started, Bookings, Case Workflow, Document Preparation, Report/QA and account help, plus a working Contact Support form with category, subject, description, related case and attachment.
- **Security Settings** — `pages/Administration.tsx`: password policy, MFA policy, session duration, failed-login policy, export/download restrictions and retention controls with audit logging.
- **Detailed Configuration** — Administration now shows the Screen Breakdown fields for case-status progression/completion rules, appointment-type duration/location/eligibility/interpreter support, document-category requirements/AI rules, report-template versions/status and QA-checklist item/severity configuration.
- **Team Workload** — `pages/Tasks.tsx`: active/overdue workload, case count, workload indicator and working reassignment.
- **File Preparation Queue + PDF Bundle Preview** — `pages/Documents.tsx`: queue operational fields, document index/page numbering, version information, preview/download, save version and Confirm Bundle / Mark Ready workflow.
- **Final Report Approval + Report Delivery** — `components/ReportWorkspaceModal.tsx`: QA-approved final preview context, outstanding-comment warning, doctor approval/declaration, final approval confirmation, then recipient/method/date/notes/attachment delivery recording.
- **Operational Reports** — `pages/Analytics.tsx`: Bookings by period, cases by status/client/doctor, appointment/cancellation activity, pending reports, QA turnaround, overdue tasks, completed cases and team workload; each exposes applied filters, breakdown details, export and related-record navigation.
- **Authentication completion** — Login, MFA, Forgot Password, Reset Password and Session Expired states are all represented.
- **Interaction polish** — shared dropdowns close on outside click/Escape, menus use the existing branded surface treatment, native selects have a consistent chevron/presentation, and interactive rows/buttons expose hover/focus/active states.

### Scope boundary

Items explicitly classified as **Advanced Features / later phase** in Tab 3 — for example Email Integration Inbox, Client/Doctor/Patient portals, interpreter management, billing/invoicing, integration/API management and electronic signatures — are intentionally not added to this internal-workflow prototype. This preserves the PRD's own phase boundary rather than presenting future integrations as implemented functionality.

## Destructive-action audit — record lifecycle and delete confirmations

- The final audit added a shared `DeleteRecordModal.tsx` pattern matching the Screen Breakdown PRD's global Delete Confirmation requirements: record name, impact warning, reason field, Confirm and Cancel actions.
- **Documents:** Document Preview now exposes **Delete document** where permitted. Deletion is blocked when the user's role is not permitted, when the document is referenced by a report, or when an approved Prepared Bundle must be retained as workflow evidence.
- **Reports:** Report Workspace now exposes **Delete report**. Only unsubmitted Draft reports without QA history can be permanently removed; submitted, amended, approved or delivered reports are retained for version/audit history.
- **Patients:** Patient Profile now exposes **Deactivate/Reactivate** and **Remove patient** for permitted operational/admin roles. Hard removal is blocked while cases, bookings, appointments, documents or reports are linked; unlinked erroneous records can be removed with a reason.
- **Clients:** Client Profile now exposes **Deactivate/Reactivate** and **Remove client**. Hard removal is blocked while bookings or historical/active cases are linked.
- **Doctors:** Existing Deactivate/Reactivate/Remove workflow remains, with removal blocked while active cases or scheduled appointments exist; removal now also requires a reason.
- Bookings/appointments use Cancel rather than hard delete, cases use Hold/Complete lifecycle actions, tasks use Cancelled status, and communication/audit history is retained rather than deleted. This follows the PRD principle that delete actions are limited and audit history is not editable.
