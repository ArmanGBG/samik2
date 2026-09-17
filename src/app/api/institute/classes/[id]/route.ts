import { db } from "@/lib/db";
import { ok, fail, route } from "@/lib/api-helpers";
import { requireRole } from "@/lib/auth";

// GET /api/institute/classes/[id] — read-only class drilldown for the institute manager:
// class info + teacher + ACTIVE students (with per-student attendance counts respecting
// the enrollment-history rule) + sessions (newest first, attendance summary).
export const GET = route(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireRole("INSTITUTE_MANAGER");
  const { id } = await ctx.params;

  const institute = await db.institute.findUnique({
    where: { managerId: user.id },
  });
  if (!institute) return fail("آموزشگاهی برای شما ثبت نشده است", 404);

  const cls = await db.class.findFirst({
    where: { id, instituteId: institute.id },
    include: {
      teacher: { select: { id: true, name: true, lastName: true, teacherCode: true } },
      enrollments: {
        where: { status: "ACTIVE" },
        include: {
          student: {
            select: {
              id: true, name: true, lastName: true, mobile: true,
              studentCode: true, profileCompleted: true, educationLevel: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      sessions: { orderBy: { sessionNum: "desc" } },
    },
  });
  if (!cls) return fail("کلاس یافت نشد", 404);

  // All attendance rows of this class (scoped to currently-active students)
  const activeIds = new Set(cls.enrollments.map((e) => e.student.id));
  const attendances = await db.attendance.findMany({
    where: { session: { classId: cls.id }, studentId: { in: [...activeIds] } },
    select: { sessionId: true, studentId: true, status: true },
  });
  const sessionNumById = new Map(cls.sessions.map((s) => [s.id, s.sessionNum]));

  const students = cls.enrollments.map((e) => {
    let present = 0;
    let absent = 0;
    let late = 0;
    for (const a of attendances) {
      if (a.studentId !== e.student.id) continue;
      const num = sessionNumById.get(a.sessionId);
      // enrollment history rule: only sessions at/after the join count
      if (num === undefined || num < e.joinedAtSessionNum) continue;
      if (a.status === "PRESENT") present++;
      else if (a.status === "ABSENT") absent++;
      else if (a.status === "LATE") late++;
    }
    return {
      ...e.student,
      joinedAtSessionNum: e.joinedAtSessionNum,
      present,
      absent,
      late,
    };
  });

  const sessions = cls.sessions.map((s) => {
    // eligible students: active members who had joined at or before this session
    const eligible = cls.enrollments.filter(
      (e) => e.joinedAtSessionNum <= s.sessionNum
    ).length;
    const stats = { PRESENT: 0, ABSENT: 0, LATE: 0, UNMARKED: 0 };
    let marked = 0;
    for (const a of attendances) {
      if (a.sessionId !== s.id) continue;
      if (a.status === "PRESENT") {
        stats.PRESENT++;
        marked++;
      } else if (a.status === "ABSENT") {
        stats.ABSENT++;
        marked++;
      } else if (a.status === "LATE") {
        stats.LATE++;
        marked++;
      }
    }
    stats.UNMARKED = Math.max(0, eligible - marked);
    return {
      id: s.id,
      name: s.name,
      sessionNum: s.sessionNum,
      date: s.date,
      attendance: stats,
    };
  });

  return ok({
    class: {
      id: cls.id,
      name: cls.name,
      schedule: cls.schedule,
      createdAt: cls.createdAt,
      teacher: cls.teacher
        ? {
            id: cls.teacher.id,
            name: `${cls.teacher.name ?? ""} ${cls.teacher.lastName ?? ""}`.trim() || "—",
            teacherCode: cls.teacher.teacherCode,
          }
        : null,
      students,
      sessions,
    },
  });
});
