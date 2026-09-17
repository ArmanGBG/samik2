import { db } from "@/lib/db";
import { ok, fail, route } from "@/lib/api-helpers";
import { requireRole } from "@/lib/auth";

// GET /api/teacher/classes/[id]/stats — class analytics for the گزارش‌ها tab.
// Matches the ClassStats interface in src/components/samic/api.ts EXACTLY.
//
// CRITICAL (enrollment history rule): for each session only students whose
// Enrollment.joinedAtSessionNum <= session.sessionNum AND status === "ACTIVE"
// are counted. Per-student stats only cover sessions they were a member of.
//
// attendanceRate = present / (present + absent + late) * 100 (rounded);
// when nothing is marked → 100. presentRate = present / marked * 100.
// assignmentRate = assignmentsDone / total * 100 (assignmentDone defaults true).
export const GET = route(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireRole("TEACHER");
  const { id } = await ctx.params;

  const cls = await db.class.findFirst({
    where: { id, teacherId: user.id },
    select: { id: true },
  });
  if (!cls) return fail("کلاس یافت نشد", 404);

  const sessions = await db.session.findMany({
    where: { classId: cls.id },
    orderBy: { sessionNum: "asc" },
    select: { id: true, name: true, sessionNum: true },
  });

  const enrollments = await db.enrollment.findMany({
    where: { classId: cls.id, status: "ACTIVE" },
    include: {
      student: {
        select: { id: true, studentCode: true, name: true, lastName: true, profileCompleted: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const sessionIds = sessions.map((s) => s.id);
  const attendanceRows = sessionIds.length
    ? await db.attendance.findMany({ where: { sessionId: { in: sessionIds } } })
    : [];

  // index attendance rows by `${sessionId}:${studentId}`
  const attMap = new Map<string, { status: string | null; assignmentDone: boolean }>();
  for (const a of attendanceRows) {
    attMap.set(`${a.sessionId}:${a.studentId}`, { status: a.status, assignmentDone: a.assignmentDone });
  }

  // eligible (countable) students for a given session — enrollment history rule
  const eligibleStudents = (sessionNum: number) =>
    enrollments.filter((e) => e.joinedAtSessionNum <= sessionNum);

  // ---------- session trend (ascending sessionNum) ----------
  const sessionTrend = sessions.map((s) => {
    const eligible = eligibleStudents(s.sessionNum);
    let PRESENT = 0;
    let ABSENT = 0;
    let LATE = 0;
    for (const e of eligible) {
      const a = attMap.get(`${s.id}:${e.studentId}`);
      if (a?.status === "PRESENT") PRESENT++;
      else if (a?.status === "ABSENT") ABSENT++;
      else if (a?.status === "LATE") LATE++;
    }
    const marked = PRESENT + ABSENT + LATE;
    return {
      sessionId: s.id,
      name: s.name,
      sessionNum: s.sessionNum,
      PRESENT,
      ABSENT,
      LATE,
      UNMARKED: Math.max(0, eligible.length - marked),
    };
  });

  // ---------- per-student stats (only over sessions they were member of) ----------
  const students = enrollments.map((e) => {
    let present = 0;
    let absent = 0;
    let late = 0;
    let unmarked = 0;
    let assignmentsDone = 0;
    let assignmentsTotal = 0;
    for (const s of sessions) {
      if (s.sessionNum < e.joinedAtSessionNum) continue; // not a member yet
      assignmentsTotal++;
      const a = attMap.get(`${s.id}:${e.studentId}`);
      if (a?.status === "PRESENT") present++;
      else if (a?.status === "ABSENT") absent++;
      else if (a?.status === "LATE") late++;
      else unmarked++;
      // assignmentDone defaults true when no row exists
      if (a ? a.assignmentDone : true) assignmentsDone++;
    }
    const marked = present + absent + late;
    return {
      id: e.student.id,
      studentCode: e.student.studentCode,
      name: e.student.name,
      lastName: e.student.lastName,
      profileCompleted: e.student.profileCompleted,
      present,
      absent,
      late,
      unmarked,
      attendanceRate: marked > 0 ? Math.round((present / marked) * 100) : 100,
      assignmentsDone,
      assignmentsTotal,
    };
  });

  // ---------- overview ----------
  const markedCount = sessionTrend.reduce((sum, s) => sum + s.PRESENT + s.ABSENT + s.LATE, 0);
  const presentTotal = sessionTrend.reduce((sum, s) => sum + s.PRESENT, 0);
  const assignmentsTotalAll = students.reduce((sum, s) => sum + s.assignmentsTotal, 0);
  const assignmentsDoneAll = students.reduce((sum, s) => sum + s.assignmentsDone, 0);

  return ok({
    stats: {
      overview: {
        totalStudents: enrollments.length,
        totalSessions: sessions.length,
        markedCount,
        presentRate: markedCount > 0 ? Math.round((presentTotal / markedCount) * 100) : 100,
        assignmentRate:
          assignmentsTotalAll > 0
            ? Math.round((assignmentsDoneAll / assignmentsTotalAll) * 100)
            : 100,
      },
      sessionTrend,
      students,
    },
  });
});
