"use client";

// Shared frontend API client + types for Samic panels

export interface ApiResult<T> {
  ok: boolean;
  error?: string;
  data?: T;
}

export async function api<T = Record<string, unknown>>(
  path: string,
  options: { method?: string; body?: unknown } = {}
): Promise<ApiResult<T>> {
  try {
    const res = await fetch(path, {
      method: options.method ?? "GET",
      headers: options.body ? { "Content-Type": "application/json" } : undefined,
      body: options.body ? JSON.stringify(options.body) : undefined,
      credentials: "same-origin",
    });
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok || json.ok === false) {
      return { ok: false, error: (json.error as string) ?? `خطا (${res.status})` };
    }
    const { ok: _ok, ...data } = json;
    return { ok: true, data: data as T };
  } catch {
    return { ok: false, error: "ارتباط با سرور برقرار نشد" };
  }
}

// ---------- Session user ----------
export interface SessionUser {
  id: string;
  mobile: string;
  role: "SUPER_ADMIN" | "INSTITUTE_MANAGER" | "TEACHER" | "STUDENT";
  name: string | null;
  lastName: string | null;
  profileCompleted: boolean;
  studentCode: string | null;
  teacherCode: string | null;
  instituteId: string | null;
  instituteName: string | null;
  province: string | null;
  city: string | null;
  teachingSubject?: string | null;
  educationLevel?: string | null;
}

// ---------- Teacher ----------
export interface TeacherClassSummary {
  id: string;
  name: string;
  schedule: string | null;
  createdAt: string;
  studentCount: number;
  sessionCount: number;
  pendingRequests: number;
}

export interface TeacherClassDetail {
  id: string;
  name: string;
  schedule: string | null;
  qrToken: string;
  createdAt: string;
  institute: { id: string; name: string } | null;
  students: {
    enrollmentId: string;
    joinedAtSessionNum: number;
    joinedAt: string;
    id: string;
    name: string | null;
    lastName: string | null;
    mobile: string;
    studentCode: string | null;
    profileCompleted: boolean;
    educationLevel: string | null;
    parentPhone1: string | null;
  }[];
  sessions: {
    id: string;
    name: string;
    sessionNum: number;
    date: string;
    attendance: { PRESENT: number; ABSENT: number; LATE: number; UNMARKED: number };
  }[];
  requests: {
    id: string;
    direction: string;
    createdAt: string;
    student: {
      id: string;
      name: string | null;
      lastName: string | null;
      mobile: string;
      studentCode: string | null;
      profileCompleted: boolean;
    };
  }[];
}

export interface SessionDetail {
  id: string;
  name: string;
  sessionNum: number;
  date: string;
  class: { id: string; name: string };
  students: {
    id: string;
    name: string | null;
    lastName: string | null;
    mobile: string;
    studentCode: string | null;
    profileCompleted: boolean;
    educationLevel: string | null;
    joinedAtSessionNum: number;
    attendanceStatus: "PRESENT" | "ABSENT" | "LATE" | null;
    assignmentDone: boolean;
    saved: boolean;
  }[];
}

// ---------- Student ----------
export interface StudentClassSummary {
  id: string;
  name: string;
  schedule: string | null;
  teacher: string;
  institute: string | null;
  joinedAtSessionNum: number;
  totalSessions: number;
  present: number;
  absent: number;
  late: number;
  assignmentsNotDone: number;
}

export interface StudentInvite {
  id: string;
  createdAt: string;
  class: {
    id: string;
    name: string;
    schedule: string | null;
    teacher: string;
    institute: string | null;
  };
}

export interface StudentOverview {
  studentCode: string | null;
  classes: StudentClassSummary[];
  invites: StudentInvite[];
}

export interface StudentClassDetail {
  id: string;
  name: string;
  schedule: string | null;
  teacher: { name: string; subject: string | null } | null;
  institute: string | null;
  joinedAtSessionNum: number;
  sessions: {
    id: string;
    name: string;
    sessionNum: number;
    date: string;
    attendanceStatus: "PRESENT" | "ABSENT" | "LATE" | null;
    assignmentDone: boolean | null;
  }[];
}

// ---------- Institute ----------
export interface InstituteOverview {
  institute: {
    id: string;
    name: string;
    teacherCount: number;
    classCount: number;
    studentCount: number;
  };
  teachers: {
    id: string;
    name: string | null;
    lastName: string | null;
    mobile: string;
    teacherCode: string | null;
    teachingSubject: string | null;
    profileCompleted: boolean;
  }[];
  classes: {
    id: string;
    name: string;
    schedule: string | null;
    teacher: { id: string; name: string; teacherCode: string | null } | null;
    studentCount: number;
    sessionCount: number;
  }[];
  students: {
    id: string;
    name: string | null;
    lastName: string | null;
    mobile: string;
    studentCode: string | null;
    profileCompleted: boolean;
    educationLevel: string | null;
    className: string;
  }[];
}

// ---------- Super Admin ----------
export interface AdminOverview {
  stats: {
    students: number;
    teachers: number;
    institutes: number;
    classes: number;
    sessions: number;
  };
  users: {
    id: string;
    mobile: string;
    role: string;
    name: string | null;
    lastName: string | null;
    studentCode: string | null;
    teacherCode: string | null;
    profileCompleted: boolean;
    province: string | null;
    city: string | null;
    teachingSubject: string | null;
    educationLevel: string | null;
    createdAt: string;
    instituteName: string | null;
  }[];
  institutes: {
    id: string;
    name: string;
    createdAt: string;
    manager: string | null;
    managerMobile: string | null;
    classCount: number;
    teacherCount: number;
  }[];
  classes: {
    id: string;
    name: string;
    schedule: string | null;
    createdAt: string;
    teacher: string | null;
    institute: string | null;
    studentCount: number;
    sessionCount: number;
  }[];
}

// ---------- Class analytics (teacher stats tab) ----------
export interface ClassStats {
  overview: {
    totalStudents: number;
    totalSessions: number;
    markedCount: number; // total marked attendance rows (PRESENT+ABSENT+LATE)
    presentRate: number; // 0..100 (of marked)
    assignmentRate: number; // 0..100
  };
  sessionTrend: {
    sessionId: string;
    name: string;
    sessionNum: number;
    PRESENT: number;
    ABSENT: number;
    LATE: number;
    UNMARKED: number;
  }[];
  students: {
    id: string;
    studentCode: string | null;
    name: string | null;
    lastName: string | null;
    profileCompleted: boolean;
    present: number;
    absent: number;
    late: number;
    unmarked: number;
    attendanceRate: number; // 0..100 (of marked; 100 when nothing marked)
    assignmentsDone: number;
    assignmentsTotal: number;
  }[];
}

// ---------- Institute class drilldown ----------
export interface InstituteClassDetail {
  id: string;
  name: string;
  schedule: string | null;
  createdAt: string;
  teacher: { id: string; name: string; teacherCode: string | null } | null;
  students: {
    id: string;
    name: string | null;
    lastName: string | null;
    mobile: string;
    studentCode: string | null;
    profileCompleted: boolean;
    educationLevel: string | null;
    joinedAtSessionNum: number;
    present: number;
    absent: number;
    late: number;
  }[];
  sessions: {
    id: string;
    name: string;
    sessionNum: number;
    date: string;
    attendance: { PRESENT: number; ABSENT: number; LATE: number; UNMARKED: number };
  }[];
}

// ---------- Admin users pagination ----------
export interface AdminUsersPage {
  users: AdminOverview["users"];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

// ---------- Education level labels ----------
const FA = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹", "۱۰", "۱۱", "۱۲"];
const fa = (n: number | string) => String(n).replace(/[0-9]+/g, (m) => m.split("").map((d) => FA[+d]).join(""));

export const EDUCATION_LEVELS: { value: string; label: string }[] = [
  ...[1, 2, 3, 4, 5, 6].map((g) => ({ value: `PRIMARY_${g}`, label: `دبستان — پایه ${fa(g)}` })),
  ...[7, 8, 9].map((g) => ({ value: `JUNIOR_${g}`, label: `متوسطه اول — پایه ${fa(g)}` })),
  { value: "HIGH_10_MATH", label: "دبیرستان — دهم ریاضی" },
  { value: "HIGH_10_SCI", label: "دبیرستان — دهم تجربی" },
  { value: "HIGH_10_HUM", label: "دبیرستان — دهم انسانی" },
  { value: "HIGH_11_MATH", label: "دبیرستان — یازدهم ریاضی" },
  { value: "HIGH_11_SCI", label: "دبیرستان — یازدهم تجربی" },
  { value: "HIGH_11_HUM", label: "دبیرستان — یازدهم انسانی" },
  { value: "HIGH_12_MATH", label: "دبیرستان — دوازدهم ریاضی" },
  { value: "HIGH_12_SCI", label: "دبیرستان — دوازدهم تجربی" },
  { value: "HIGH_12_HUM", label: "دبیرستان — دوازدهم انسانی" },
  { value: "GRADUATED", label: "فارغ‌التحصیل" },
];

export function educationLevelLabel(value: string | null): string {
  return EDUCATION_LEVELS.find((l) => l.value === value)?.label ?? "—";
}
