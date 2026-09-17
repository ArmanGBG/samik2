import { db } from "@/lib/db";
import { ok, fail, route, readJson } from "@/lib/api-helpers";
import { requireRole } from "@/lib/auth";

interface AttRecord {
  studentId: string;
  status: "PRESENT" | "ABSENT" | "LATE" | null;
  assignmentDone: boolean;
}

// POST /api/teacher/sessions/[id]/attendance — save attendance & assignments
export const POST = route(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireRole("TEACHER");
  const { id } = await ctx.params;
  const body = await readJson<{ records?: AttRecord[] }>(req);

  const session = await db.session.findFirst({
    where: { id, class: { teacherId: user.id } },
  });
  if (!session) return fail("جلسه یافت نشد", 404);

  const records = Array.isArray(body.records) ? body.records : [];
  if (records.length === 0) return fail("فهرست حضور خالی است");

  // eligible students only
  const enrollments = await db.enrollment.findMany({
    where: {
      classId: session.classId,
      status: "ACTIVE",
      joinedAtSessionNum: { lte: session.sessionNum },
    },
    select: { studentId: true },
  });
  const eligible = new Set(enrollments.map((e) => e.studentId));

  for (const r of records) {
    if (!r.studentId || !eligible.has(r.studentId)) continue;
    if (r.status !== null && !["PRESENT", "ABSENT", "LATE"].includes(r.status)) continue;

    await db.attendance.upsert({
      where: { sessionId_studentId: { sessionId: session.id, studentId: r.studentId } },
      create: {
        sessionId: session.id,
        studentId: r.studentId,
        status: r.status ?? null,
        assignmentDone: r.assignmentDone !== false,
      },
      update: {
        status: r.status ?? null,
        assignmentDone: r.assignmentDone !== false,
      },
    });
  }

  return ok({ message: "حضوروغیاب و تکالیف ذخیره شد" });
});
