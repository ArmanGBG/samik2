import { db } from "@/lib/db";
import { ok, fail, route } from "@/lib/api-helpers";
import { requireRole } from "@/lib/auth";

// GET /api/institute/overview — institute-scoped data only (own institute)
export const GET = route(async () => {
  const user = await requireRole("INSTITUTE_MANAGER");

  const institute = await db.institute.findUnique({
    where: { managerId: user.id },
    include: {
      staff: {
        where: { role: "TEACHER" },
        select: {
          id: true, name: true, lastName: true, mobile: true,
          teacherCode: true, teachingSubject: true, profileCompleted: true,
        },
        orderBy: { createdAt: "desc" },
      },
      classes: {
        include: {
          teacher: { select: { id: true, name: true, lastName: true, teacherCode: true } },
          _count: {
            select: {
              enrollments: { where: { status: "ACTIVE" } },
              sessions: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!institute) return fail("آموزشگاهی برای شما ثبت نشده است", 404);

  // students of this institute = enrolled in its classes
  const classIds = institute.classes.map((c) => c.id);
  const enrollments = await db.enrollment.findMany({
    where: { classId: { in: classIds }, status: "ACTIVE" },
    include: {
      student: {
        select: {
          id: true, name: true, lastName: true, mobile: true,
          studentCode: true, profileCompleted: true, educationLevel: true,
        },
      },
      class: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // unique students
  const seen = new Set<string>();
  const students = enrollments
    .filter((e) => {
      if (seen.has(e.student.id)) return false;
      seen.add(e.student.id);
      return true;
    })
    .map((e) => ({ ...e.student, className: e.class.name }));

  return ok({
    institute: {
      id: institute.id,
      name: institute.name,
      teacherCount: institute.staff.length,
      classCount: institute.classes.length,
      studentCount: students.length,
    },
    teachers: institute.staff,
    classes: institute.classes.map((c) => ({
      id: c.id,
      name: c.name,
      schedule: c.schedule,
      teacher: c.teacher
        ? {
            id: c.teacher.id,
            name: `${c.teacher.name ?? ""} ${c.teacher.lastName ?? ""}`.trim() || "—",
            teacherCode: c.teacher.teacherCode,
          }
        : null,
      studentCount: c._count.enrollments,
      sessionCount: c._count.sessions,
    })),
    students,
  });
});
