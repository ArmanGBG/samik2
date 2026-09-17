import { db } from "@/lib/db";
import { ok, fail, route } from "@/lib/api-helpers";
import { requireRole } from "@/lib/auth";

// GET /api/student/classes/[id] — class detail for student: sessions + my attendance
export const GET = route(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireRole("STUDENT");
  const { id } = await ctx.params;

  const enrollment = await db.enrollment.findFirst({
    where: { studentId: user.id, classId: id, status: "ACTIVE" },
    include: {
      class: {
        include: {
          teacher: { select: { name: true, lastName: true, teacherCode: true, teachingSubject: true } },
          institute: { select: { name: true } },
          sessions: { orderBy: { sessionNum: "desc" } },
        },
      },
    },
  });
  if (!enrollment) return fail("شما عضو این کلاس نیستید", 403);

  const myAtt = await db.attendance.findMany({ where: { studentId: user.id } });
  const attMap = new Map(myAtt.map((a) => [a.sessionId, a]));

  const visibleSessions = enrollment.class.sessions
    .filter((s) => s.sessionNum >= enrollment.joinedAtSessionNum)
    .map((s) => {
      const a = attMap.get(s.id);
      return {
        id: s.id,
        name: s.name,
        sessionNum: s.sessionNum,
        date: s.date,
        attendanceStatus: a?.status ?? null,
        assignmentDone: a?.assignmentDone ?? null,
      };
    });

  return ok({
    class: {
      id: enrollment.class.id,
      name: enrollment.class.name,
      schedule: enrollment.class.schedule,
      teacher: enrollment.class.teacher
        ? {
            name: `${enrollment.class.teacher.name ?? ""} ${enrollment.class.teacher.lastName ?? ""}`.trim() || "—",
            subject: enrollment.class.teacher.teachingSubject,
          }
        : null,
      institute: enrollment.class.institute?.name ?? null,
      joinedAtSessionNum: enrollment.joinedAtSessionNum,
      sessions: visibleSessions,
    },
  });
});
