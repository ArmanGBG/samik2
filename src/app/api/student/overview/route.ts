import { db } from "@/lib/db";
import { ok, route } from "@/lib/api-helpers";
import { requireRole } from "@/lib/auth";

// GET /api/student/overview — dashboard data:
// my STU code, joined classes, incoming teacher invites, stats
export const GET = route(async () => {
  const user = await requireRole("STUDENT");

  const enrollments = await db.enrollment.findMany({
    where: { studentId: user.id, status: "ACTIVE" },
    include: {
      class: {
        include: {
          teacher: { select: { name: true, lastName: true, teacherCode: true } },
          institute: { select: { name: true } },
          _count: { select: { sessions: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // attendance summary per class
  const classIds = enrollments.map((e) => e.classId);
  const sessions = await db.session.findMany({
    where: { classId: { in: classIds } },
    select: { id: true, classId: true, sessionNum: true },
  });
  const myAttendance = await db.attendance.findMany({
    where: { studentId: user.id, session: { classId: { in: classIds } } },
  });

  const invites = await db.joinRequest.findMany({
    where: { studentId: user.id, status: "PENDING", direction: "TEACHER_INVITE" },
    include: {
      class: {
        include: {
          teacher: { select: { name: true, lastName: true } },
          institute: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const classes = enrollments.map((e) => {
    const classSessions = sessions.filter((s) => s.classId === e.classId);
    // only sessions at/after my join
    const relevant = classSessions.filter((s) => s.sessionNum >= e.joinedAtSessionNum);
    const atts = myAttendance.filter((a) => relevant.some((s) => s.id === a.sessionId));
    const present = atts.filter((a) => a.status === "PRESENT").length;
    const absent = atts.filter((a) => a.status === "ABSENT").length;
    const late = atts.filter((a) => a.status === "LATE").length;
    const undone = atts.filter((a) => !a.assignmentDone).length;

    return {
      id: e.class.id,
      name: e.class.name,
      schedule: e.class.schedule,
      teacher: e.class.teacher
        ? `${e.class.teacher.name ?? ""} ${e.class.teacher.lastName ?? ""}`.trim() || "—"
        : "—",
      institute: e.class.institute?.name ?? null,
      joinedAtSessionNum: e.joinedAtSessionNum,
      totalSessions: relevant.length,
      present, absent, late,
      assignmentsNotDone: undone,
    };
  });

  return ok({
    studentCode: user.studentCode,
    classes,
    invites: invites.map((i) => ({
      id: i.id,
      createdAt: i.createdAt,
      class: {
        id: i.class.id,
        name: i.class.name,
        schedule: i.class.schedule,
        teacher: i.class.teacher
          ? `${i.class.teacher.name ?? ""} ${i.class.teacher.lastName ?? ""}`.trim() || "—"
          : "—",
        institute: i.class.institute?.name ?? null,
      },
    })),
  });
});
