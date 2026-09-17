# Samic — Frontend Panel Contracts (for panel builders)

## Files you MUST NOT touch (owned by main agent / other agents)
- src/app/page.tsx, src/app/layout.tsx, src/app/globals.css
- src/app/api/** (all API routes)
- src/components/samic/api.ts, landing/**, auth/**
- src/components/samic/shared/** (you may READ + USE, not rewrite)
- prisma/**, src/lib/**

## Your panel file interface (already imported by page.tsx)
```tsx
"use client";
interface XxxPanelProps {
  user: SessionUser;
  onLogout: () => void;
  onUserUpdate: () => void; // refetch session (e.g. after profile data changed)
}
export function XxxPanel({ user, onLogout, onUserUpdate }: XxxPanelProps) { ... }
```
Wrap content in `<PanelShell user={user} activeTitle="..." onLogout={onLogout}>` (from ../shared/panel-shell).

## Client API
```ts
import { api, ...types } from "../api";
const res = await api<SomeType>("/api/...", { method: "POST", body: {...} });
if (!res.ok) toast({ title: res.error, variant: "destructive" }) — error is a Persian string
// res.data contains payload
```

## Design rules (ui-ux-pro-max MASTER.md + Samic adaptation)
- Minimalist, monochrome neutrals + teal accent. Use semantic tokens: bg-primary, text-primary, bg-accent, text-muted-foreground etc. NEVER raw hex, NO blue/indigo.
- Cards: rounded-xl/2xl border-border/80, p-4/p-6, hover:border-primary/30 + hover:shadow-sm transitions.
- Icons: lucide-react only, size-4/5, strokeWidth 2+. NO emoji as icons.
- All numbers shown to user: Persian digits via toPersianDigitsSafe() from "@/lib/jalali".
- Dates: Jalali — use toJalaliPersian(dateStr) or toJalaliLong(dateStr) from "@/lib/jalali".
- Mobile-first responsive: grid-cols-1 → sm:grid-cols-2 → lg:grid-cols-3/4. Touch targets ≥ 44px (h-11 buttons/inputs).
- Long lists: max-h-96 overflow-y-auto scroll-samic (custom scrollbar class exists in globals.css).
- Loading states: skeletons/spinner (Loader2 animate-spin) on every fetch. Empty states with icon + text + CTA.
- Buttons: cursor-pointer, loading feedback, disabled states. Toasts via useToast() from "@/hooks/use-toast" for every mutation result.
- Text alignment: RTL default; numeric/latin content (codes, mobiles) wrapped with dir="ltr".
- Accessibility: aria-labels on icon-only buttons, visible labels on inputs.

## API endpoints quick reference

### Teacher panel (Task 12-a) — src/components/samic/teacher/teacher-panel.tsx
- GET /api/teacher/classes → { classes: TeacherClassSummary[] } (id, name, schedule, studentCount, sessionCount, pendingRequests)
- POST /api/teacher/classes { name, schedule? } → { class } — "+ افزودن کلاس" button, name required, weekly schedule optional (free text)
- GET /api/teacher/classes/[id] → { class: TeacherClassDetail } — includes students[], sessions[] (with attendance stats), requests[] (PENDING), qrToken
- QR display: <img src={`/api/qr?data=${cls.id}`} /> — QR contains the CLS-XXXXXX code. Show code + copy button + share text.
- POST /api/teacher/classes/[id]/add-student { mode: "MOBILE"|"STU_ID", value } → invited/enrolled result
  - MOBILE → sends invite (creates ghost account if unknown) — Method A
  - STU_ID (STU-XXXXXX) → direct enrollment — Method B
- POST /api/teacher/classes/[id]/requests { requestId, action: "APPROVE"|"REJECT" } — Method C (approve QR/code scan requests)
- POST /api/teacher/classes/[id]/sessions { name?, date? } — name default "جلسه N" pre-filled & EDITABLE in input; date default today via JalaliDatePicker (send ISO: new Date(jalaliString) or omit)
- GET /api/teacher/sessions/[id] → { session: SessionDetail } — students[] each {attendanceStatus: null|PRESENT|ABSENT|LATE, assignmentDone: boolean (default true), saved}
- POST /api/teacher/sessions/[id]/attendance { records: [{studentId, status, assignmentDone}] }
- UX: attendance = 3-state toggle (حاضر/غایب/تأخیر) per student; assignment = iOS-style Switch DEFAULT ON. Save button → toast.
- Students list shows joinedAtSessionNum ("عضو از جلسه N"). Students NOT eligible for old sessions simply don't appear (server filters).

### Student panel (Task 12-b) — src/components/samic/student/student-panel.tsx
- GET /api/student/overview → { studentCode, classes: StudentClassSummary[], invites: StudentInvite[] }
- STU-XXXXXX code PROMINENTLY displayed on dashboard (copyable) — Method 4
- POST /api/student/requests { requestId, action: "ACCEPT"|"REJECT" } — Method 1 (teacher invites)
- POST /api/student/join { code: "CLS-XXXXXX" } → sends STUDENT_REQUEST to teacher — Method 2 (input box)
- QR SCANNER — Method 3: html5-qrcode dynamic import in useEffect; getUserMedia camera may fail in sandbox iframe →
  graceful fallback UI: error message + manual CLS code input (reuse join API — scanned text contains CLS-XXXXXX, regex match happens server-side too).
  Scanner component file: src/components/samic/student/qr-scanner.tsx
- GET /api/student/classes/[id] → { class: StudentClassDetail } — sessions[] with my attendanceStatus + assignmentDone (null = not applicable)
- Class detail view: attendance history table + badges (AttendanceBadge from ../shared/stat-card)

### Institute + Admin panels (Task 12-c) — src/components/samic/institute/institute-panel.tsx + src/components/samic/admin/super-admin-panel.tsx
- Institute (manager sees ONLY own institute data):
  - GET /api/institute/overview → { institute, teachers[], classes[], students[] }
  - POST /api/institute/classes { name, schedule?, teacherCode? } — define class + assign existing teacher (optional)
  - POST /api/institute/add-teacher { value: TCH-code or mobile } — add existing teacher to institute
  - POST /api/institute/add-student { classId, mobile } — existing→invite; unknown→ghost+direct add (server handles)
- SuperAdmin (global):
  - GET /api/admin/overview → { stats, users[], institutes[], classes[] } (stats: students/teachers/institutes/classes/sessions)
  - POST /api/admin/institutes { name, managerMobile } — create institute (+manager account if new mobile)
  - POST /api/admin/users { mobile, role, name?, lastName? } — manual registration (role TEACHER|STUDENT|INSTITUTE_MANAGER)
  - PATCH /api/admin/users/[id] { role?, name?, lastName? } / DELETE /api/admin/users/[id]
  - DELETE /api/admin/institutes/[id] / DELETE /api/admin/classes/[id]
  - UX: tabs (کاربران/آموزشگاه‌ها/کلاس‌ها) + stat cards + search filter + confirm dialogs (AlertDialog) before delete.

## Verification
- After building, run: `cd /home/z/my-project && bun run lint` (must pass).
- Test in browser via agent-browser if available. Dev server already running on :3000.
- Demo logins: 09120000003 (teacher), 09120000004 (student), 09120000002 (manager), 09120000001 (admin), 09120000005 (ghost).
  OTP: click "دریافت کد تأیید" → code appears as "کد نمایشی" → click it to autofill.
