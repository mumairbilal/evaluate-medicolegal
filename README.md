# Evaluate Medicolegal — DOCX PRD Workflow Prototype

React + TypeScript desktop-web prototype aligned in the final pass to **`Evaluate Medicolegal PRD.docx` (Product Requirements Document v1.0)**.

## Core workflow

Booking → central case → appointment → documents → file preparation → File Ready → report draft → QA request/review → amendments or QA approval → final medical approval → secure delivery record → case completion → optional archive.

The Case Overview intentionally uses one exact case status in the header and a compact “What happens now” / workflow-checkpoint layout rather than a long duplicated progress strip.

## Exact case statuses

`New Booking`, `Information Required`, `Booking Confirmed`, `Appointment Pending`, `Appointment Scheduled`, `Appointment Completed`, `Documents Pending`, `File Preparation in Progress`, `File Ready`, `Report in Progress`, `Draft Report Submitted`, `QA Review`, `Amendments Required`, `Awaiting Final Approval`, `Final Report Approved`, `Report Delivered`, `On Hold`, `Cancelled`, `Completed`, `Archived`.

## QA hand-off demo

Switch **View as role** to **Quality Assurance — Elaine Fitzgerald**. The Dashboard has a **New QA requests** section. Seed case `EM-2026-1210` contains a submitted report awaiting QA and demonstrates the hand-off. Starting the request moves the case to `QA Review`; approving or returning it records the decision and updates downstream notifications/status.

## Notifications

The Notification Centre supports All / Unread / Read, mark read/unread, mark all read, delete one, delete read, delete all, filters and preferences. Workflow notifications use same-case/audience superseding so a new hand-off replaces the stale workflow alert instead of creating an endless sequence. The header shows only the four newest unread items.

## Persistence

This is a frontend prototype using shared React context + browser localStorage. The final pass uses new versioned storage keys so older local prototype data does not override the corrected DOCX workflow seeds.

## Run

```bash
npm install
npm run dev
```

Production backend services, server-side encryption/storage, integrations and infrastructure are outside this frontend prototype and are not implied by the UI.

See `DOC_PRD_FINAL_AUDIT.md` and `DOC_PRD_REQUIREMENTS_CHECKLIST.md` for the final source-to-implementation review.
