import { db } from "@/lib/db";
import { ok, route } from "@/lib/api-helpers";
import { requireRole } from "@/lib/auth";

// GET /api/admin/overview — global overview: all students, teachers, institutes, classes
export const GET = route(async () => {
  await requireRole("SUPER_ADMIN");

  const [studentCount, teacherCount, instituteCount, classCount, sessionCount] = await Promise.all([
    db.user.count({ where: { role: "STUDENT" } }),
    db.user.count({ where: { role: "TEACHER" } }),
    db.institute.count(),
    db.class.count(),
    db.session.count(),
  ]);

  const users = await db.user.findMany({
    where: { role: { in: ["STUDENT", "TEACHER", "INSTITUTE_MANAGER"] } },
    select: {
      id: true, mobile: true, role: true, name: true, lastName: true,
      studentCode: true, teacherCode: true, profileCompleted: true,
      province: true, city: true, teachingSubject: true, educationLevel: true,
      createdAt: true,
      institute: { select: { id: true, name: true } },
      managedInstitute: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const institutes = await db.institute.findMany({
    include: {
      manager: { select: { id: true, name: true, lastName: true, mobile: true } },
      _count: { select: { classes: true, staff: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const classes = await db.class.findMany({
    include: {
      teacher: { select: { name: true, lastName: true, teacherCode: true } },
      institute: { select: { name: true } },
      _count: { select: { enrollments: { where: { status: "ACTIVE" } }, sessions: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return ok({
    stats: {
      students: studentCount,
      teachers: teacherCount,
      institutes: instituteCount,
      classes: classCount,
      sessions: sessionCount,
    },
    users: users.map((u) => ({
      ...u,
      instituteName: u.institute?.name ?? u.managedInstitute?.name ?? null,
      institute: undefined,
      managedInstitute: undefined,
    })),
    institutes: institutes.map((i) => ({
      id: i.id,
      name: i.name,
      createdAt: i.createdAt,
      manager: i.manager
        ? `${i.manager.name ?? ""} ${i.manager.lastName ?? ""}`.trim() || i.manager.mobile
        : null,
      managerMobile: i.manager?.mobile ?? null,
      classCount: i._count.classes,
      teacherCount: i._count.staff,
    })),
    classes: classes.map((c) => ({
      id: c.id,
      name: c.name,
      schedule: c.schedule,
      createdAt: c.createdAt,
      teacher: c.teacher
        ? `${c.teacher.name ?? ""} ${c.teacher.lastName ?? ""}`.trim() || "—"
        : null,
      institute: c.institute?.name ?? null,
      studentCount: c._count.enrollments,
      sessionCount: c._count.sessions,
    })),
  });
});
