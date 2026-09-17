# Task 12-b — Student Panel + QR Scanner (Agent: full-stack-developer)

> Work record for other agents. Read the shared `worklog.md` for the global picture.
> My scope: `src/components/samic/student/**` ONLY (4 files). Everything else untouched.

## What was built

| File | Purpose |
|---|---|
| `src/components/samic/student/student-panel.tsx` | Dashboard (REPLACED placeholder) — STU code card (Method 4), stats, invites (Method 1), classes grid, empty/error/loading states |
| `src/components/samic/student/join-class-dialog.tsx` | اتصال به کلاس dialog — manual CLS input (Method 2) + QR scan toggle (Method 3), manual input always visible as fallback |
| `src/components/samic/student/qr-scanner.tsx` | html5-qrcode wrapper (id `qr-scanner-region`, facingMode environment, fps 10, qrbox 240) with camera-unavailable fallback |
| `src/components/samic/student/student-class-detail.tsx` | Class detail — header, summary stats, sessions list (newest first) with AttendanceBadge + assignment chips |

All reuse: `api()` + types from `../api`, `PanelShell` (`activeTitle="پنل دانش‌آموز"`), `StatCard`/`AttendanceBadge`,
`toPersianDigitsSafe`/`toJalaliLong`/`toJalaliPersian`, shadcn/ui (button, card, dialog, input, label, badge,
separator, skeleton). No blue/indigo, no raw hex, lucide icons only, RTL-aware (codes `dir="ltr"`).

## API endpoints consumed (all verified 200)
- `GET /api/student/overview` → `{ studentCode, classes: StudentClassSummary[], invites: StudentInvite[] }`
- `POST /api/student/join` `{ code }` → toast "درخواست عضویت برای معلم ارسال شد" (server regex `CLS-[A-Z2-9]{6}`,
  digits allowed are 2–9 only — "1/0" invalid, handled with Persian server error toast)
- `POST /api/student/requests` `{ requestId, action: "ACCEPT"|"REJECT" }` → "به کلاس پیوستید" / "دعوت رد شد"
- `GET /api/student/classes/[id]` → sessions with `attendanceStatus` + `assignmentDone` (null = no chip)

## Verification results
- `bunx eslint src/components/samic/student/` → CLEAN.
- dev.log: all student routes 200, no compile errors for my files.
- E2E (agent-browser, isolated `--session`): dashboard, class detail rows, join invalid/valid, dialog auto-close
  + toast + refresh, camera fallback in scan mode, copy button, ghost invite ACCEPT flow. Demo DB state restored
  after testing (ghost back to `profileCompleted=false`, invite PENDING; a pending STUDENT_REQUEST
  student-04→CLS-2EJS45 exists as useful demo data for the teacher panel).
- VLM screenshot QA on desktop + 390px mobile: RTL correct, no overflow/clipping, ID card prominent.

## Gotchas discovered (useful for the other panel agents)
1. **`react-hooks/set-state-in-effect`** (enabled by eslint-config-next latest) flags setState called
   synchronously in effect bodies — INCLUDING transitively through a `useCallback` (e.g. `void load()` in an
   effect where `load` starts with `setLoading(true)`). Fix pattern: inline initial fetch as an async IIFE
   inside the effect; do spinner setState only inside event-handler wrapper functions.
2. The default agent-browser session is SHARED between agents — use `agent-browser --session <name>` to avoid
   mid-test session hijacking (another agent logged in as manager while I was testing as student).
3. Dev server occasionally crash-loops under memory pressure (next-server ~1.1GB RSS + multiple headless
   Chromes); it auto-recovers — poll with curl before concluding your code broke anything.
4. Clipboard: `navigator.clipboard.writeText` + hidden-textarea `execCommand` fallback (non-secure contexts).

## Demo accounts for the student panel
- Student: `09120000004` (علی احمدی) — 1 class with attendance history (PRESENT/LATE/ABSENT mix + custom-named session).
- Ghost student: `09120000005` — pending TEACHER_INVITE card visible after profile completion (Method 1 demo).
