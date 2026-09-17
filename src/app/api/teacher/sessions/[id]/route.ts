import { db } from "@/lib/db";
import { ok, fail, route } from "@/lib/api-helpers";
import { requireRole } from "@/lib/auth";

// GET /api/teacher/sessions/[id] — session detail with eligible students + attendance
// Students appear ONLY if joinedAtSessionNum <= sessionNum (enrollment history rule)
export const GET = route(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireRole("TEACHER");
  const { id } = await ctx.params;

  const session = await db.session.findFirst({
    where: { id, class: { teacherId: user.id } },
    include: { class: { select: { id: true, name: true } } },
  });
  if (!session) return fail("جلسه یافت نشد", 404);

  // eligible students: active enrollments joined at or before this session
  const enrollments = await db.enrollment.findMany({
    where: {
      classId: session.classId,
      status: "ACTIVE",
      joinedAtSessionNum: { lte: session.sessionNum },
    },
    include: {
      student: {
        select: {
          id: true, name: true, lastName: true, mobile: true,
          studentCode: true, profileCompleted: true, educationLevel: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const attendances = await db.attendance.findMany({ where: { sessionId: session.id } });
  const attMap = new Map(attendances.map((a) => [a.studentId, a]));

  return ok({
    session: {
      id: session.id,
      name: session.name,
      sessionNum: session.sessionNum,
      date: session.date,
      class: session.class,
      students: enrollments.map((e) => {
        const a = attMap.get(e.student.id);
        return {
          ...e.student,
          joinedAtSessionNum: e.joinedAtSessionNum,
          // defaults: attendance unmarked (null), assignment ON
          attendanceStatus: a?.status ?? null,
          assignmentDone: a?.assignmentDone ?? true,
          saved: Boolean(a),
        };
      }),
    },
  });
});
