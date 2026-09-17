import { db } from "@/lib/db";
import { ok, fail, route, readJson } from "@/lib/api-helpers";
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

// PATCH /api/teacher/classes/[id] — edit class (name / schedule)
// body: { name?: string, schedule?: string | null }
export const PATCH = route(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireRole("TEACHER");
  const { id } = await ctx.params;
  const body = await readJson<{ name?: string; schedule?: string | null }>(req);

  const cls = await db.class.findFirst({ where: { id, teacherId: user.id } });
  if (!cls) return fail("کلاس یافت نشد", 404);

  const data: { name?: string; schedule?: string | null } = {};

  if (body.name !== undefined) {
    const name = body.name.trim();
    if (name.length < 1 || name.length > 80) {
      return fail("نام کلاس باید بین ۱ تا ۸۰ کاراکتر باشد");
    }
    data.name = name;
  }

  if (body.schedule !== undefined) {
    // null or empty string clears the schedule
    const schedule = body.schedule === null ? "" : body.schedule.trim();
    data.schedule = schedule.length > 0 ? schedule.slice(0, 120) : null;
  }

  if (Object.keys(data).length === 0) {
    return fail("چیزی برای به‌روزرسانی ارسال نشده است");
  }

  const updated = await db.class.update({
    where: { id: cls.id },
    data,
  });

  return ok({
    class: {
      id: updated.id,
      name: updated.name,
      schedule: updated.schedule,
    },
  });
});

// DELETE /api/teacher/classes/[id] — delete class with all dependent data
// order: attendances → sessions → enrollments → joinRequests → class
export const DELETE = route(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireRole("TEACHER");
  const { id } = await ctx.params;

  const cls = await db.class.findFirst({ where: { id, teacherId: user.id } });
  if (!cls) return fail("کلاس یافت نشد", 404);

  const sessionIds = await db.session.findMany({
    where: { classId: cls.id },
    select: { id: true },
  });

  await db.$transaction([
    ...sessionIds.map((s) => db.attendance.deleteMany({ where: { sessionId: s.id } })),
    db.session.deleteMany({ where: { classId: cls.id } }),
    db.enrollment.deleteMany({ where: { classId: cls.id } }),
    db.joinRequest.deleteMany({ where: { classId: cls.id } }),
    db.class.delete({ where: { id: cls.id } }),
  ]);

  return ok({ message: "کلاس حذف شد" });
});
