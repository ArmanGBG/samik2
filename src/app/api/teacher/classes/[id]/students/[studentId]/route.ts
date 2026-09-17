import { db } from "@/lib/db";
import { ok, fail, route } from "@/lib/api-helpers";
import { requireRole } from "@/lib/auth";

// DELETE /api/teacher/classes/[id]/students/[studentId] — remove a student from the class
// Deletes: their ACTIVE enrollment + their attendance records in this class's sessions
// + their PENDING join requests for this class.
export const DELETE = route(
  async (_req: Request, ctx: { params: Promise<{ id: string; studentId: string }> }) => {
    const user = await requireRole("TEACHER");
    const { id, studentId } = await ctx.params;

    const cls = await db.class.findFirst({ where: { id, teacherId: user.id } });
    if (!cls) return fail("کلاس یافت نشد", 404);

    const enrollment = await db.enrollment.findFirst({
      where: { classId: cls.id, studentId, status: "ACTIVE" },
    });
    if (!enrollment) {
      return fail("این دانش‌آموز عضو این کلاس نیست", 404);
    }

    const sessionIds = await db.session.findMany({
      where: { classId: cls.id },
      select: { id: true },
    });

    await db.$transaction([
      ...sessionIds.map((s) =>
        db.attendance.deleteMany({ where: { sessionId: s.id, studentId } })
      ),
      db.enrollment.delete({ where: { id: enrollment.id } }),
      db.joinRequest.deleteMany({
        where: { classId: cls.id, studentId, status: "PENDING" },
      }),
    ]);

    return ok({ message: "دانش‌آموز از کلاس حذف شد" });
  }
);
