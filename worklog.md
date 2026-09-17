# Samic — Worklog (Educational Management System)

> Persian RTL Educational Management System. Next.js 16 App Router + TypeScript + Tailwind 4 + shadcn/ui + Prisma(SQLite).
> Single visible route: `/` (SPA with client-side view switching). All features via `/api/*` routes.

---
Task ID: 1
Agent: main (Z.ai Code)
Task: Install ui-ux-pro-max skill, design system, core foundation (DB schema, auth, APIs, app shell, landing, OTP auth)

Work Log:
- Cloned https://github.com/nextlevelbuilder/ui-ux-pro-max-skill.git to /home/z/ui-ux-pro-max-skill
- Generated + persisted design system via skill search.py → /home/z/my-project/design-system/samic/MASTER.md
  (adapted: teal primary instead of recommended blue — environment rule + user allowed Teal)
- Installed packages: qrcode, html5-qrcode, react-multi-date-picker, date-fns-jalali, @types/qrcode
- Prisma schema (SQLite — env constraint, spec asked PostgreSQL but env mandates SQLite):
  User(mobile unique, role, studentCode/teacherCode, teacher fields: teachingSubject/bankCardNo/shebaNo,
  student fields: educationLevel/parentPhone1/2, profileCompleted), Otp(mobile, code, expiresAt),
  Institute(managerId), Class(id=CLS-XXXXXX, qrToken, teacherId, instituteId, schedule),
  Enrollment(studentId, classId, joinedAtSessionNum ← enrollment history rule),
  JoinRequest(direction STUDENT_REQUEST|TEACHER_INVITE, status PENDING/APPROVED/REJECTED),
  Session(classId, name, sessionNum, date), Attendance(sessionId, studentId, status PRESENT/ABSENT/LATE/null, assignmentDone default true)
- Seed (prisma/seed.ts): SuperAdmin 09120000001, Manager 09120000002 (آموزشگاه البرز),
  Teacher 09120000003, Student 09120000004, Ghost 09120000005 (profileCompleted=false + pending TEACHER_INVITE),
  2 classes, 3 sessions (incl. custom-named "جلسه فوق‌العاده"), attendance records, 1 pending STUDENT_REQUEST
- Libs: src/lib/{auth.ts (HMAC JWT cookie session, requireRole), ids.ts (TCH-/STU-/CLS- codes),
  iran.ts (31 provinces + cities), mobile.ts (normalize Iranian mobile, Luhn bank card, Sheba check),
  jalali.ts (format via date-fns-jalali; parse via newDate(y, m-1, d, 12) — month is 0-based!),
  api-helpers.ts (ok/fail/route wrappers), enrollment.ts (maxSessionNum/nextJoinSessionNum)}
- API routes (all under /api): auth/(send-otp[returns devCode for demo], verify-otp, me, logout, select-role),
  profile/complete, qr (PNG generator), teacher/classes (GET list+POST create),
  teacher/classes/[id] (GET detail), teacher/classes/[id]/add-student (POST MOBILE→invite/ghost, STU_ID→direct enroll),
  teacher/classes/[id]/requests (POST approve/reject), teacher/classes/[id]/sessions (POST — name default جلسه N editable, date default today),
  teacher/sessions/[id] (GET — only students with joinedAtSessionNum<=sessionNum), teacher/sessions/[id]/attendance (POST upsert),
  student/overview (GET), student/requests (POST accept/reject), student/join (POST CLS code or QR payload → STUDENT_REQUEST),
  student/classes/[id] (GET my attendance history), institute/overview, institute/classes (POST + assign teacher),
  institute/add-teacher, institute/add-student (existing→invite, unknown→ghost+direct add per spec),
  admin/overview, admin/institutes (POST), admin/institutes/[id] (DELETE), admin/users (POST), admin/users/[id] (PATCH/DELETE),
  admin/classes/[id] (DELETE)
- Frontend foundation: layout.tsx (RTL fa + Vazirmatn next/font), globals.css (teal theme, glass-header, scroll-samic
  custom scrollbar, RTL fixes for react-multi-date-picker), page.tsx (SPA router: loading→landing→complete-profile→role panels)
- Components built: samic/api.ts (typed fetch client + ALL shared types), shared/panel-shell.tsx (header+sticky footer),
  shared/province-city-select.tsx (cascading), shared/jalali-date-picker.tsx (+todayJalali), shared/stat-card.tsx (+AttendanceBadge),
  landing/landing-view.tsx (hero/features/audience/how/CTA/footer per Phase 7), landing/auth-dialog.tsx (mobile→OTP(InputOTP)→role select),
  auth/profile-completion.tsx (teacher/student forms with validation)
- Placeholder panels created: teacher/teacher-panel.tsx, student/student-panel.tsx, institute/institute-panel.tsx, admin/super-admin-panel.tsx
- Verified: GET / 200, /api/auth/me OK, send-otp returns devCode

Stage Summary:
- Foundation COMPLETE. Landing page + OTP auth + profile completion fully functional.
- Remaining: the 4 role panels (delegated to subagents 12-a/b/c), integration QA, cron setup.
- Demo accounts: 09120000001..05 (OTP code shown in UI as "کد نمایشی" — no real SMS in sandbox).
- CRITICAL KNOWLEDGE: date-fns-jalali v4 has NO toGregorian export — use newDate(year, month0, day, hour).
  Turbopack strict about unknown exports (500 error). react-multi-date-picker value: DateObject persian/persian_en "YYYY/MM/DD".

---
Task ID: 12-b
Agent: full-stack-developer
Task: Student Panel + QR Scanner (Phase 3 — Persian RTL UI, all 4 join methods)

Work Log:
- Read contracts (docs/panel-contracts.md), api.ts types, shared components, jalali helpers, landing design language.
- REPLACED src/components/samic/student/student-panel.tsx (was placeholder):
  * Method 4 — STU code card at top (border-primary/30, gradient accent): "شناسه دانش‌آموز شما" + big code
    (dir=ltr, font-mono, text-2xl, select-all) + copy button (clipboard API + execCommand fallback, "کپی شد"
    state 2s) + hint "این شناسه را به معلم خود بدهید تا شما را به کلاس اضافه کند".
  * Stats row (grid-cols-2 → lg:grid-cols-4, StatCard): تعداد کلاس‌ها / جلسات شرکت‌کرده (sum totalSessions) /
    حضور (sum present) / تکالیف انجام‌نشده (danger tone when > 0).
  * Method 1 — invites section (only when pending TEACHER_INVITE exist): cards with class name, مدرس, institute,
    Jalali invite date + پذیرش (primary) / رد (destructive outline) → POST /api/student/requests → toast
    (server message "به کلاس پیوستید"/"دعوت رد شد") + silent refresh. Hidden when empty.
  * "اتصال به کلاس" prominent primary button (classes section header, h-12) + again in empty state.
  * My classes grid (sm:2 / lg:3): name, teacher, institute, schedule, chips (حضور/غایب/تأخیر colored + "از جلسه N"
    muted), whole card clickable (role=button, keyboard Enter/Space, focus ring) → class detail.
  * Empty state (dashed card + icon + CTA), loading skeletons, initial-load error card with retry,
    header refresh button (RefreshCw spinner; remounts detail via key nonce), greeting.
- NEW src/components/samic/student/join-class-dialog.tsx (Methods 2+3):
  * Segmented toggle (کد کلاس / اسکن QR کد) + manual Input (dir=ltr, placeholder CLS-XXXXXX, auto-uppercase,
    font-mono tracking, h-12) → POST /api/student/join → toast "درخواست عضویت برای معلم ارسال شد" (+ class name
    description) + close + refresh. Scan mode: QrScanner embedded + "یا" separator + manual input STAYS visible
    below (camera fallback). On scan-failure server error → auto-switch back to manual. Reset on every close path.
- NEW src/components/samic/student/qr-scanner.tsx (Method 3):
  * html5-qrcode dynamically imported in useEffect (type-only static import for types), instance on
    #qr-scanner-region, facingMode environment, {fps:10, qrbox:240}; on success → stop() then onScan(text)
    exactly once (handledRef guard); loading overlay while camera starts; camera failure (sandbox iframe) →
    friendly role=alert box "دسترسی به دوربین ممکن نیست" + "کد کلاس را دستی وارد کنید"; full cleanup on unmount.
- NEW src/components/samic/student/student-class-detail.tsx:
  * Back button (ArrowRight RTL) + header card (name, teacher + subject, institute, schedule, "عضو از جلسه N"
    badge) + 3 StatCards (حضور کل success / غیب danger / تأخیر warning) computed from sessions +
    sessions list (server already sessionNum desc): "جلسه N" chip, name, toJalaliLong date, AttendanceBadge,
    assignment chip "تکلیف انجام شد" (emerald + Check icon) / "تکلیف انجام نشد" (red + X icon) / nothing when null.
  * Empty sessions state + skeleton + error card. Remounts on refresh via key={classId-nonce}.
- ESLint fixes for new react-hooks/set-state-in-effect rule: replaced dialog reset-effect with reset-on-close
  handler (all close paths); panel initial load inlined as async IIFE in effect, event-handler wrappers
  (refreshOverview/retryLoad) do the sync setState; fetchOverview keeps setState after await only.
- E2E verified via agent-browser (isolated sessions) + curl with OTP login as demo student 04 & ghost 05:
  overview render (Persian digits stats), class detail rows, join manual (invalid → server error toast; valid
  CLS-2EJS45 → dialog closed + toast + STUDENT_REQUEST row in DB), camera fallback shown in scan mode,
  copy button toast, ghost invite ACCEPT → class appears + section hides. DB demo state RESTORED afterwards
  (ghost profileCompleted=false, enrollment deleted, invite back to PENDING; kept the new pending
  STUDENT_REQUEST as seed-equivalent demo data). VLM screenshot QA (desktop + 390px mobile): RTL correct,
  no overflow, ID card prominent, chips/badges readable.
- NOTE: shared default agent-browser session collided with another agent's testing (session hijack mid-test) —
  used --session isolation afterwards. Dev server crash-looped briefly (environment/OOM, unrelated to my files);
  recovered and re-verified.

Stage Summary:
- Student panel COMPLETE: all 4 connection methods (invite accept/reject, CLS code, QR scan with camera
  fallback, STU code display/copy), dashboard stats, class cards, full class-detail history view.
- Files: student/student-panel.tsx (replaced), student/join-class-dialog.tsx, student/qr-scanner.tsx,
  student/student-class-detail.tsx (all inside samic/student/, nothing else touched).
- Verification: eslint clean on all 4 student files; dev.log clean (all student routes 200, no compile errors);
  full E2E flow passes. Remaining lint errors in repo belong to page.tsx / teacher/* / institute/* / admin/*
  (other agents' files — not touched per contract).
- KNOWLEDGE for 12-a/12-c: react-hooks/set-state-in-effect (eslint-config-next latest) flags sync setState in
  effect bodies including via useCallback indirection — use async-IIFE-in-effect for initial fetches and do
  spinner setState in event-handler wrappers only.

---
Task ID: 2 (integration & QA)
Agent: main (Z.ai Code)
Task: Integrate all panels, end-to-end QA with agent-browser, fix cross-cutting bugs, setup cron

Work Log:
- Fixed page.tsx react-hooks/set-state-in-effect lint error (async IIFE pattern)
- Fixed date-fns-jalali v4 bug: NO toGregorian export → replaced with newDate(year, month0, day, hour) in parseJalaliString
- CRITICAL FIX in shared/jalali-date-picker.tsx: react-date-object DateObject requires IMPORTED calendar OBJECT
  (import persian from 'react-date-object/calendars/persian') — passing string "persian" silently stays Gregorian!
  This caused add-session dialog to default to ۲۰۲۶/۰۹/۱۷ instead of ۱۴۰۵/۰۶/۲۶. Fixed + verified in browser.
- Fixed footer year: Jalali year (dynamic via toJalaliString(new Date(),'yyyy')) instead of Gregorian in panel-shell + landing
- Fixed EDUCATION_LEVELS labels → Persian digits (پایه ۸ not پایه 8)
- E2E verified with agent-browser (all flows):
  * Landing renders (hero/features/audience/how/CTA/footer) + VLM desktop 8.5/10, mobile 9/10, RTL correct, no overflow
  * OTP login teacher 03 → dashboard (TCH code, 2 classes) → class detail (3 tabs) → students table
  * Sessions tab → add session dialog (Jalali today ۱۴۰۵/۰۶/۲۶ default, name "جلسه ۴" editable) → created "جلسه آزمایشی" ✓
  * Session attendance: 3-state toggle (حاضر/غایب/تأخیر, deselectable), iOS-style assignment switch default ON,
    "همه حاضر" bulk, save → persisted in DB (verified via Prisma query)
  * QR dialog: /api/qr?data=CLS-xxx returns 320px PNG, img renders in dialog
  * Add student Method A (new mobile 09121110000) → ghost STU-E8B5PF + TEACHER_INVITE PENDING in DB ✓
  * Add student Method B (STU-ID via API) → direct enrollment + auto-resolved pending request ✓
  * Student 04 login → dashboard (STU code copy, 2 classes) → class detail (4 sessions newest first, badges)
  * Ghost 05 login → FORCED profile completion (full student form incl. province/city cascade, level, parent phones)
    → saved → student dashboard → accepted pending invite → joined class → "عضو از جلسه ۵" and sessions 1-4 HIDDEN
    (enrollment history rule VERIFIED exactly per spec)
  * Institute manager 02 → overview (آموزشگاه البرز, tabs کلاس‌ها ۳/معلمان ۱/دانش‌آموزان ۲), students table with search
  * Institute add-student via API: existing mobile → invite ✓, unknown mobile → ghost+direct add ✓ (per spec)
  * Super admin 01 → stats (۴/۱/۱/۳/۴), users table with search+role filter, institutes tab, delete actions present
  * Mobile 390px + desktop 1440px: no horizontal overflow, footer sticky (mt-auto) + pushed naturally on long pages
- Final lint: PASSES (0 errors). Homepage 200. No runtime errors in dev.log.

Stage Summary:
- ALL PHASES (1,2,3,4,5,7) COMPLETE AND BROWSER-VERIFIED. Task complete.
- Cron job created: "Samic Web Dev Review (15min)" job_id 392988 (webDevReview kind, every 15 min, Asia/Tehran).
- Demo data now richer: جلسه آزمایشی (custom-named session), ghost 09121110000, زهرا کریمی completed profile + enrolled.
- Demo logins: 09120000001 admin, 02 manager, 03 teacher, 04 student, 05 student(زهرا), 09121110000 ghost-pending.
- Known limitations (documented, not bugs): OTP shown in UI (no real SMS in sandbox); QR scanner camera may fail in
  preview iframe → manual CLS code fallback provided; SQLite instead of PostgreSQL (environment constraint).

Unresolved issues / next-phase recommendations (for the 15-min review cron):
- Persian date INPUT in JalaliDatePicker shows English digits in the input field while calendar UI is Persian digits — cosmetic polish possible.
- Consider: teacher class edit/delete, student "leave class", attendance summary charts (recharts installed), institute class→session drilldown, admin pagination for large tables.
- The design-system/samic/MASTER.md recommends glassmorphism accents — more subtle glass touches could be added to headers/cards.
