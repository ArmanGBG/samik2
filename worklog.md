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

---
Task ID: 4-b
Agent: full-stack-developer
Task: Student leave-class (خروج از کلاس), institute class drilldown (sessions+students read-only view), admin users pagination (server-side q/role/page + UI controls)

Work Log:
- Read worklog + all contract files. Confirmed critical knowledge: date-fns-jalali has NO toGregorian; react-hooks/set-state-in-effect requires async-IIFE-in-effect (setState after await / inside setTimeout callbacks is fine).
- NEW src/app/api/student/classes/[id]/leave/route.ts (POST): requireRole STUDENT → find ACTIVE enrollment →
  transaction { enrollment.status="LEFT" (history preserved, row NOT deleted), PENDING JoinRequests for student+class →
  REJECTED+respondedAt } → ok "از کلاس خارج شدید". No ACTIVE enrollment → 404 "شما عضو این کلاس نیستید".
- student/student-class-detail.tsx: added onLeft prop + bottom "خروج از کلاس" card (destructive-outline Button, LogOut icon,
  short hint) → destructive AlertDialog (exact warning text per spec, Loader2 while leaving, dialog stays open on error) →
  toast server message → onLeft(). student-panel.tsx wires onLeft={backToDashboard} (navigate back + silent overview refresh).
- NEW src/app/api/institute/classes/[id]/route.ts (GET): requireRole INSTITUTE_MANAGER → manager's institute via managedInstitute →
  class must have instituteId===it (else 404 "کلاس یافت نشد"). Returns InstituteClassDetail shape exactly: class info +
  teacher{id,name,teacherCode} + students[] (ACTIVE enrollments, per-student PRESENT/ABSENT/LATE counts over sessions with
  sessionNum >= joinedAtSessionNum — enrollment history rule) + sessions[] (sessionNum desc, attendance{PRESENT,ABSENT,LATE,UNMARKED};
  counts scoped to ACTIVE students, UNMARKED = eligible(joinedAtSessionNum<=sessionNum) − marked, clamped ≥0).
- NEW institute/class-detail.tsx: back button "بازگشت به کلاس‌ها" (ArrowRight), header Card (name, teacher + mono teacherCode chip,
  schedule, "ایجاد: toJalaliLong(createdAt)", student/session count badges), جلسات list (جلسه N badge + name + Jalali date +
  AttChip×4 imported from teacher/bits.tsx — حاضر emerald/غایب red/تأخیر amber/بدون ثبت muted), دانش‌آموزان table (max-h-96
  overflow-auto scroll-samic; name/STU code/mobile Persian digits/educationLevelLabel/از جلسه N/3 mini AttChips; شناسه hidden
  sm:, موبایل hidden md:, پایه hidden lg:), EmptyStates, skeleton, error card, read-only Eye hint footer.
- institute/classes-tab.tsx: class Cards now clickable (role=button, tabIndex, Enter/Space, hover+focus ring, ChevronLeft hint,
  "جزئیات" Eye button) → onOpenClass(classId) prop; copy-code + add-student buttons stopPropagation. institute-panel.tsx:
  activeClassId/detailNonce state → full-view switch to InstituteClassDetail (key remount), back → load() refresh + scroll top.
- admin/users/route.ts: added GET — requireRole SUPER_ADMIN; params page (def 1), pageSize (def 10, clamp 1..50), q (mobile/name/
  lastName/studentCode/teacherCode contains — SQLite LIKE is ASCII case-insensitive; Persian/Arabic digits normalized to English
  server-side), role (optional SUPER_ADMIN|INSTITUTE_MANAGER|TEACHER|STUDENT, invalid → 400; absent → non-admin roles like overview).
  Returns AdminUsersPage exactly: users (createdAt desc, skip/take, instituteName via institute ?? managedInstitute) + total +
  page + pageSize + pageCount (ceil).
- admin/users-tab.tsx: refactored from overview-users prop to self-fetching paginated list (kept register/edit/delete dialogs —
  they now bump reloadNonce + onRefresh). Debounced search (400ms, resets page 1), role Select resets page 1, async-IIFE fetch
  effect, clamp when page > pageCount after deleting last row of last page, skeleton on first load, opacity-50 overlay on
  refetch, error card + retry, "نتیجه‌ای یافت نشد" vs "هنوز کاربری ثبت نشده است" empty states, pagination footer
  "صفحه X از Y — Z کاربر" (Persian digits) + prev(ChevronRight)/next(ChevronLeft) + first/last(ChevronsRight/Left, only when
  pageCount>5) icon buttons with disabled states. super-admin-panel.tsx: usersTotal state via stable useCallback onTotalChange,
  CountHint accepts null (hidden until first page loads); UsersTab no longer receives data.users.
- ESLint: `bun run lint` → 0 errors. Turbopack compiled all new routes (dev.log 200s only).
- curl tests (OTP flow, 4 role cookie jars): leave (ACTIVE→LEFT + PENDING→REJECTED verified in DB via bun:sqlite; repeat-leave 404;
  not-member 404; overview/detail exclude left class; message text exact); institute drilldown (CLS-GQW7YY shape+counts correct —
  علی 2/0/1 from session 1, زهرا all-0 joinedAtSessionNum 5, sessions UNMARKED=1 for جلسه آزمایشی; nonexistent 404; student
  token 403; no-institute manager path covered by 404); pagination (default 7/1/10/1; pageSize=2→pageCount 4 + correct slice;
  createdAt desc verified; q=علی/کریمی/zqn4pr(lowercase!)/Persian-digit mobile/STU-6Y; role TEACHER/SUPER_ADMIN; invalid role 400;
  pageSize 99→50, 0→10; page=999→empty; manager token 403; combined q+role+page).
- Browser E2E (agent-browser --session samic-4b, OTP "کد نمایشی" flow): student 04 → test class detail → خروج از کلاس → AlertDialog
  exact warning → confirm → toast "از کلاس خارج شدید" → auto-back to dashboard with class removed (DB LEFT). Manager 02 → کلاس‌ها →
  card click → drilldown (header/sessions chips/students table/Persian digits) → back works; teacherless class shows "بدون معلم" +
  empty states; copy-code button does NOT open detail (stopPropagation). Admin 01 → tab badge "کاربران ۱۱" (11 temp users) →
  "صفحه ۱ از ۲ — ۱۱ کاربر" → next → page 2 (oldest user) → delete-last-row-on-last-page → auto-clamp to "صفحه ۱ از ۱" → search
  تست (debounced, "۱۱ نتیجه") → role معلم ("۱ نتیجه", محمد رضایی + آموزشگاه البرز) → combined no-match empty state + بازنشانی
  فیلترها restores full list → search علی 1 result. Mobile 390px drilldown: no horizontal overflow (390=390), responsive column
  hiding works. VLM QA: institute detail 9/10, student leave 9/10, admin pagination 8/10 (RTL correct, no overlap, Persian digits).
- Test data fully cleaned: temp class CLS-PEQHTA deleted via admin cascade API, 11 temp 0913-users deleted (DB back to 8 demo users,
  student 04 back to original 2 ACTIVE enrollments). Screenshots in /tmp/samic4b/.
- ENVIRONMENT ISSUE (same as 12-b): dev server killed twice by OOM killer (next-server ~1.7-2GB RSS, 4GB RAM) during browser
  testing — restarted via nohup `bun run dev >> dev.log`; server+DB recovered cleanly, session cookies (30d JWT) survived.

Stage Summary:
- All 3 features COMPLETE and verified (lint 0 errors, curl + browser E2E + VLM pass, demo data restored).
- Files created: src/app/api/student/classes/[id]/leave/route.ts, src/app/api/institute/classes/[id]/route.ts,
  src/components/samic/institute/class-detail.tsx.
- Files modified: src/app/api/admin/users/route.ts (added GET), student/student-class-detail.tsx, student/student-panel.tsx,
  institute/classes-tab.tsx, institute/institute-panel.tsx, admin/users-tab.tsx, admin/super-admin-panel.tsx.
  api.ts NOT modified; teacher/*, shared/*, landing/* untouched (AttChip only imported).
- API: POST /api/student/classes/[id]/leave; GET /api/institute/classes/[id]; GET /api/admin/users?page&pageSize&q&role.
- Rejoin-after-leave flow (join request → teacher approve flips LEFT back to ACTIVE) handled by existing requests routes —
  add-student STU_ID intentionally rejects re-add while a LEFT row exists ("قبلاً ثبت شده") per current API semantics.
- NOTE for next agents: dev server OOM-kills under heavy browser+compile load; restart with
  `cd /home/z/my-project && (nohup bun run dev >> dev.log 2>&1 &)` and re-verify; admin default user list still excludes
  SUPER_ADMIN unless role=SUPER_ADMIN filter is passed explicitly (mirrors overview behavior).

---
Task ID: 4-c
Agent: frontend-styling-expert
Task: UI styling polish pass (VLM feedback: attendance states, row padding, chips, footer contrast, glass accents, Persian digits in date picker input)

Work Log:
- Read worklog.md + design-system/samic/MASTER.md + all 6 target files before editing.
- shared/jalali-date-picker.tsx: value DateObject now uses locale persian_fa → INPUT renders Persian digits
  (۱۴۰۵/۰۶/۲۶) while onChange still emits English "YYYY/MM/DD" via unchanged persian_en conversion.
  Placeholder → "۱۴۰۳/۰۸/۱۵". Verified in Node: parsing EN-digit strings with persian_fa yields correct
  y/m/d; browser-verified: dialog default, calendar day-pick (→۱۴۰۵/۰۶/۲۸), and typing "1403/08/15"
  (→ displays ۱۴۰۳/۰۸/۱۵). parseJalaliString also tolerates Persian digits as a safety net.
- teacher/session-attendance.tsx: rebuilt 3-state toggle as segmented control (muted track + per-button
  borders): selected = tinted bg (emerald/red/amber 500/15 + /40 border + colored dot @100%),
  unselected = bg-card + border-border/70 + muted dot @50% + hover:border-{tone}-500/40 hover:text-{tone}-600.
  Deselect-on-reclick + aria-pressed kept. Student rows: py-4→py-4/sm:py-5, hover:bg-accent/25 on card,
  switch column separated by border-t (mobile) / border-s divider (lg). Summary counters → new local
  SummaryChip (tinted pills emerald/red/amber 500/10 + /25 border, px-3 py-1 text-xs) replacing AttChip
  (bits.tsx NOT touched — shared with class-detail, other agent). Meta texts text-muted-foreground →
  text-foreground/60 (student code line, "انجام نشد", header meta).
- shared/stat-card.tsx: per-tone subtle gradients (from-primary/[0.06], from-emerald-500/[0.05], amber, red,
  from-muted/40 default) + tone-matched ring (ring-{tone}-500/10) + icon containers now all tinted
  (bg-{tone}-500/12 + dark:text variants; primary no longer solid). Hint text → text-foreground/55.
- shared/panel-shell.tsx: footer text-xs text-muted-foreground → text-foreground/60. Header glass refined
  via .glass-header utility (CSS). Sticky top-0 z-40 + min-h-screen flex-col + mt-auto footer INTACT.
- app/globals.css: .glass-header refined (bg 80% token-equivalent + blur(12px) saturate(1.5) +
  border 60% + faint shadow; dark variants). NEW .glass-card (white/60 blur(12px) + border + soft shadow,
  dark variant). NEW .chart-tooltip-samic (rounded-lg border bg-popover px-3 py-2 text-xs shadow-md via
  tokens). scroll-samic: +overscroll-behavior: contain + dark-mode scrollbar colors.
- landing/landing-view.tsx: hero mock card → .glass-card; feature icons → teal gradient (from-primary/15
  to-primary/5) + ring-primary/20 with working group-hover solid swap (bg-none trick); feature + audience
  cards → hover:-translate-y-0.5 micro-lift; footer nav + copyright → text-foreground/60. No text/props changed.
- CRITICAL BUG FOUND & FIXED (build pipeline): Next 16 Turbopack/Tailwind4 CSS pipeline silently STRIPS
  backdrop-filter from rules that contain `-webkit-backdrop-filter` AFTER the unprefixed form (the old
  .glass-header had exactly this — blur was never actually rendering), and color-mix() + var() in these
  utilities also triggers rule-dropping. Fix: explicit oklch literals + unprefixed-only backdrop-filter.
  Verified via CSSOM probes + computed styles (blur(12px) saturate(1.5) now live). Documented in CSS comment.
- Parallel-agent interference handled: admin/users-tab.tsx transient syntax error (not my file) blocked
  page load twice — waited for their fix; dev server crash/restart (OOM-ish, per worklog 12-b note) — polled
  until 200.
- Verification: bun run lint → 0 errors. agent-browser (--session samic-4c): landing desktop+390px (no
  h-scroll, RTL ok, Persian digits), teacher 03 OTP login, dashboard StatCards (VLM 9/10), class
  ریاضیات دهم → جلسات → add-session dialog (date picker Persian digits ✓ calendar ✓ typing ✓),
  جلسه ۱ attendance (VLM 9/10; green/red/amber selected states + tinted chips + divider all confirmed,
  aria-pressed deselect verified), attendance 390px (VLM: fits, no overflow, divider visible),
  glass header scrolled (VLM: subtly visible — by design), footer contrast (VLM: legible).
  Screenshots: /tmp/4c-*.png (16 files). dev.log: no errors from my files.

Stage Summary:
- All 6 owned files polished; VLM feedback items addressed (distinguishable inactive states w/ borders +
  hover, tinted selected states, roomier rows, tinted chips, stronger footer/meta contrast, glass accents).
- Files modified: src/components/samic/shared/jalali-date-picker.tsx, src/components/samic/teacher/session-attendance.tsx,
  src/components/samic/shared/stat-card.tsx, src/components/samic/shared/panel-shell.tsx,
  src/app/globals.css, src/components/samic/landing/landing-view.tsx. Nothing outside the owned list touched.
- KNOWLEDGE for future agents: (1) NEVER pair `-webkit-backdrop-filter` after `backdrop-filter` in this
  project — pipeline strips both (also avoid color-mix+var in custom utilities; use explicit oklch literals).
  (2) bits.tsx AttChip is shared by session-attendance + class-detail — styled around it, not modified.
  (3) .chart-tooltip-samic is ready for upcoming recharts work (attendance summary charts recommendation).
- Verification status: lint PASS (0 errors), all screenshots pass visual QA (VLM 8.5–9/10), RTL intact,
  no horizontal scroll at 390px/1440px, date picker round-trip verified, sticky header/footer behavior intact.

---
Task ID: 4-a
Agent: full-stack-developer (verification completed by main agent due to agent context deadline)
Task: Teacher power features — class edit/delete, remove student, session delete, class analytics (گزارش‌ها tab)

Work Log:
- Extended /api/teacher/classes/[id]/route.ts: PATCH (name 1-80 chars validated, schedule nullable/120max) +
  DELETE (cascade: attendances → sessions → enrollments → joinRequests → class in $transaction)
- NEW /api/teacher/classes/[id]/students/[studentId]/route.ts DELETE: removes ACTIVE enrollment + that
  student's attendance rows in class sessions + their PENDING join requests (transaction)
- Extended /api/teacher/sessions/[id]/route.ts with DELETE (attendances → session; sessionNum gaps OK,
  next session still MAX+1)
- NEW /api/teacher/classes/[id]/stats/route.ts GET: ClassStats shape — overview (presentRate/assignmentRate/
  markedCount), sessionTrend ascending, per-student report — ALL respecting enrollment history rule
  (joinedAtSessionNum <= sessionNum, ACTIVE only; per-student only over member-of sessions; unmarked
  rows default assignmentDone=true)
- class-detail.tsx: "عملیات کلاس" DropdownMenu (ویرایش/حذف کلاس), students tab actions column
  (DropdownMenu → حذف از کلاس + AlertDialog), sessions tab per-card "عملیات جلسه" menu (stopPropagation)
  + AlertDialog confirms, NEW "گزارش‌ها" 4th tab
- NEW teacher/edit-class-dialog.tsx (prefilled name/schedule, key-seq remount pattern)
- NEW teacher/class-stats-tab.tsx: 4 overview StatCards, stacked BarChart (recharts, XAxis reversed for RTL,
  Persian digit ticks, PRESENT emerald/LATE amber/ABSENT red), per-student report card with Progress bars
  (>=90 emerald, >=70 amber, else red) + count chips, EmptyState, skeletons
- teacher-panel.tsx: onDeleted wiring (navigates back to dashboard after class delete)

Stage Summary:
- Code complete + FULLY VERIFIED by main agent: PATCH edit (valid+invalid+revert), DELETE class cascade
  (temp class CLS-8BSRW8 + CLS-SJU2US created/tested/deleted, demo data intact), session DELETE, remove
  student (STU_ID enroll → remove → students:0), stats API (enrollment rule correct: علی ۶۷٪ از ۴ جلسه،
  زهرا ۱۰۰٪ از ۰ جلسه), browser UI E2E: عملیات dropdown, edit dialog save+reload, گزارش‌ها tab renders
  (cards + chart + report rows), students/sessions delete menus + AlertDialogs (cancel tested).
- DB restored: temp classes deleted, orphan ghost 09129990001 cleaned, 8 users/3 classes/4 sessions/
  4 ACTIVE enrollments. Demo class names reverted (ریاضیات دهم).

---
Task ID: 5 (round 2 — features + styling + integration QA)
Agent: main (Z.ai Code)
Task: Status assessment, agent-browser QA, parallel feature development (4-a/4-b/4-c), integration verification

Work Log:
- STATUS ASSESSMENT: dev.log clean (all 200s), lint 0 errors, all panels stable. QA via agent-browser
  (session samic-qa): landing, OTP login flows (teacher/student/manager/admin), teacher dashboard →
  class detail → sessions → attendance (3-state + iOS switch default ON + enrollment history rule
  verified: زهرا hidden from session 1), student panel + invites, institute/admin APIs. No horizontal
  overflow. VLM review of teacher views: 7.5-8/10 with concrete polish feedback.
- PREP: added ClassStats / InstituteClassDetail / AdminUsersPage types to src/components/samic/api.ts
  (single write before dispatching agents to avoid parallel-write conflicts).
- DISPATCHED 3 parallel agents:
  * 4-a full-stack-developer: teacher power features (hit context deadline AFTER writing all code;
    main agent verified everything — see 4-a entry above)
  * 4-b full-stack-developer: student leave class (LEFT status, history preserved, auto-reject pending
    requests), institute class drilldown (sessions + students with per-student attendance respecting
    enrollment rule), admin users pagination (server-side q/role/page/pageSize, debounce 400ms,
    auto-clamp on delete-last-row). All verified by agent (curl + browser + VLM 9/9/8) + re-verified
    by main: leave E2E (confirm → toast → dashboard, class gone) + DB restore to ACTIVE, drilldown
    with real session data (ریاضیات دهم ۴ جلسه + tinted chips), pagination controls + search filter.
  * 4-c frontend-styling-expert: Jalali date picker Persian digits in input (۱۴۰۵/۰۶/۲۶), attendance
    3-state segmented control with tinted selected/hover states, roomier student rows + divider,
    StatCard per-tone gradients + tinted icons, glass header (REAL fix: Turbopack/Tailwind4 pipeline
    strips backdrop-filter when -webkit- prefixed form follows — use unprefixed only + oklch literals),
    .glass-card/.chart-tooltip-samic utilities, landing glass hero + micro-lift hovers. VLM 8.5-9/10.
- INTEGRATION QA (main): lint 0 errors, dev.log no errors, homepage 200, stats chart no overflow
  (wideElements:0), all destructive flows tested on temp data only, demo DB state restored and
  verified (8 users / 3 classes / 4 sessions / 4 ACTIVE enrollments / 0 LEFT).
- VLM final ratings: stats tab 9/10, admin users 9/10, institute drilldown 9.5/10.

Stage Summary:
- ROUND 2 COMPLETE. New features shipped: teacher class edit/delete + remove student + session delete +
  analytics tab (recharts stacked chart + student report cards), student leave class, institute class
  drilldown, admin pagination. Styling: Persian-digit date input, tinted attendance states, glass header,
  richer stat cards, landing micro-interactions.
- All lint-clean, browser-verified, demo data intact. Demo accounts unchanged (09120000001..05).
- CRITICAL KNOWLEDGE added this round: (1) Turbopack/Tailwind4 strips backdrop-filter if
  -webkit-backdrop-filter follows the unprefixed form; avoid color-mix()+var() in custom utilities.
  (2) rejoin-after-leave blocked by design while LEFT row exists (rejoin via student request → teacher
  approve). (3) Parallel agent file-ownership discipline works: pre-add shared types to api.ts BEFORE
  dispatch to avoid write conflicts.

Unresolved issues / next-phase recommendations:
- Institute manager cannot yet CREATE classes directly with teacher assignment UI polish (API exists:
  POST /api/institute/classes) — could add better UX.
- Admin: no pagination yet on institutes/classes tables (only users).
- Consider: teacher "today's sessions" quick view on dashboard, student attendance calendar heatmap,
  institute financial summary (spec mentioned financial settlement — only teacher bank/sheba fields exist).
- QR scanner camera fallback works but real camera in sandbox preview iframe is unreliable (documented).
- Session edit (rename/redate) not yet available (only delete) — sessionNum-aware edit would be nice.

---
Task ID: 6 (theme re-brand — user request)
Agent: main (Z.ai Code)
Task: Replace teal theme with user's uploaded ColorHunt palette — soft زرشکی (burgundy #6A0C24) +
شیری (cream #F1E4D3), very muted ("خیلی ملایم باشه و چشم رو نزنه")

Work Log:
- Extracted palette from /home/z/my-project/upload/pasted_image_1789884761652.jpg via VLM + PIL pixel
  sampling: زرشکی #6A0C24 (labeled #690B22), terracotta #DF7A5E, شیری #F1E4D3, forest green #1C4D3F.
- Computed precise oklch conversions (hex→oklch script) for all palette derivatives.
- globals.css :root tokens: primary = oklch(0.342 0.125 14) = #6A0C24 exact; primary-foreground =
  cream white oklch(0.975 0.015 85); background = soft cream oklch(0.98 0.01 82) (#FCF8F1); card =
  warm white oklch(0.997 0.005 95); foreground = warm dark #3D2B2E; accent = soft rose tint #F5E3E6;
  ring/accent-foreground = mid burgundy #9A3550; borders = warm beige oklch(0.912 0.012 60);
  chart-1..5 = burgundy/terracotta/rose family.
- globals.css .dark tokens: warm maroon-brown bg #221418 (oklch 0.212 0.024 1), dark card #2C1B20,
  primary = soft rose #C77D93, warm cream foreground — never cold blue-gray.
- Utilities updated: .glass-header/.glass-card (cream oklch literals), .chart-tooltip-samic shadows,
  .scroll-samic warm thumbs, .bg-grid-samic burgundy lines — all keeping the Turbopack-safe
  explicit-oklch + unprefixed-backdrop-filter pattern.
- BUG FOUND & FIXED (pre-existing, hidden): react-multi-date-picker injects its own <style> at RUNTIME
  (default blue #0074D9) which beat our globals.css overrides by document order — calendar popup was
  showing library-default BLUE (not teal, never noticed before because popups weren't screenshotted).
  Fixed with !important on .rmdp-week-day / .rmdp-today / .rmdp-selected / .rmdp-arrow color rules.
  Verified computed styles: today/week = rgb(154,53,80) = #9A3550 ✓.
- Semantic green harmonization: emerald → forest scale (palette's own #1C4D3F family) via new @theme
  block (--color-forest #2D6A4F / --color-forest-deep #1E5540 / --color-forest-soft #86B79D) +
  string replacements in 11 components (64 replacements: stat-card, bits, session-attendance,
  class-detail, class-stats-tab incl. chart fill #10b981→#2d6a4f, student panels, teachers-tab,
  admin panel-bits, landing traffic dot). Emerald read as "leftover teal" per VLM feedback; forest
  green ties to the user's palette exactly. Amber (late) + red (absent/destructive) kept — semantic.
- Design system doc updated: design-system/samic/MASTER.md color table replaced with the ACTIVE
  burgundy/cream palette + override note for future agents.
- Verification: lint 0 errors; homepage 200; no horizontal overflow; agent-browser (--session
  samic-theme) screenshots: landing, teacher dashboard, class detail, stats tab (chart bars forest
  green), attendance (forest selected state), date-picker calendar popup (burgundy today/selected/
  arrows/weekdays), student dashboard + class detail, DARK MODE (warm maroon + soft rose).
  VLM ratings: landing pass (soft, elegant, no teal), panels 9/10, calendar pass (no default blue),
  dark mode 9/10 "polished, cohesive".

Stage Summary:
- FULL THEME RE-BRAND COMPLETE: teal → soft burgundy (زرشکی) + cream (شیری) per user's ColorHunt
  image, with forest-green semantic success color from the same palette. Light + dark modes.
- All components were already token-driven, so the swap cascaded from globals.css alone (plus
  emerald→forest harmonization + date-picker !important fix).
- CRITICAL KNOWLEDGE: react-multi-date-picker injects runtime <style> AFTER app CSS — any custom
  calendar colors MUST use !important in globals.css. Tailwind 4 @theme (non-inline) block generates
  custom color utilities (bg-forest, text-forest-deep etc.) — used for the semantic green scale.
- Demo data / accounts unchanged. No functional changes — pure re-theme.
