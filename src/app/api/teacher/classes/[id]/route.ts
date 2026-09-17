import { db } from "@/lib/db";
import { ok, fail, route } from "@/lib/api-helpers";
import { requireRole } from "@/lib/auth";

// GET /api/teacher/classes/[id] — full class detail for teacher
export const GET = route(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireRole("TEACHER");
  const { id } = await ctx.params;

  const cls = await db.class.findFirst({
    where: { id, teacherId: user.id },
    include: {
      institute: { select: { id: true, name: true } },
      enrollments: {
        where: { status: "ACTIVE" },
        include: {
          student: {
            select: {
              id: true, name: true, lastName: true, mobile: true,
              studentCode: true, profileCompleted: true,
              educationLevel: true, parentPhone1: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      sessions: {
        orderBy: { sessionNum: "desc" },
        include: { _count: { select: { attendances: true } } },
      },
      joinRequests: {
        where: { status: "PENDING" },
        include: {
          student: {
            select: {
              id: true, name: true, lastName: true, mobile: true,
              studentCode: true, profileCompleted: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!cls) return fail("کلاس یافت نشد", 404);

  const attendanceStats = await Promise.all(
    cls.sessions.map(async (s) => {
      const grouped = await db.attendance.groupBy({
        by: ["status"],
        where: { sessionId: s.id },
        _count: true,
      });
      const stats: Record<string, number> = { PRESENT: 0, ABSENT: 0, LATE: 0, UNMARKED: 0 };
      for (const g of grouped) {
        if (g.status) stats[g.status] = g._count;
        else stats.UNMARKED = g._count;
      }
      return { sessionId: s.id, stats };
    })
  );

  return ok({
    class: {
      id: cls.id,
      name: cls.name,
      schedule: cls.schedule,
      qrToken: cls.qrToken,
      createdAt: cls.createdAt,
      institute: cls.institute,
      students: cls.enrollments.map((e) => ({
        enrollmentId: e.id,
        joinedAtSessionNum: e.joinedAtSessionNum,
        joinedAt: e.createdAt,
        ...e.student,
      })),
      sessions: cls.sessions.map((s) => ({
        id: s.id,
        name: s.name,
        sessionNum: s.sessionNum,
        date: s.date,
        attendance: attendanceStats.find((a) => a.sessionId === s.id)?.stats
          ?? { PRESENT: 0, ABSENT: 0, LATE: 0, UNMARKED: 0 },
      })),
      requests: cls.joinRequests.map((r) => ({
        id: r.id,
        direction: r.direction,
        createdAt: r.createdAt,
        student: r.student,
      })),
    },
  });
});
