import { db } from "@/lib/db";
import { ok, fail, route } from "@/lib/api-helpers";
import { requireRole } from "@/lib/auth";

// POST /api/student/classes/[id]/leave — student leaves the class.
// Enrollment is NOT deleted: status ACTIVE → LEFT so attendance history stays intact.
// Any PENDING JoinRequest for this student+class is auto-rejected.
export const POST = route(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireRole("STUDENT");
  const { id } = await ctx.params;

  const enrollment = await db.enrollment.findFirst({
    where: { studentId: user.id, classId: id, status: "ACTIVE" },
  });
  if (!enrollment) return fail("شما عضو این کلاس نیستید", 404);

  await db.$transaction([
    db.enrollment.update({
      where: { id: enrollment.id },
      data: { status: "LEFT" },
    }),
    db.joinRequest.updateMany({
      where: { studentId: user.id, classId: id, status: "PENDING" },
      data: { status: "REJECTED", respondedAt: new Date() },
    }),
  ]);

  return ok({ message: "از کلاس خارج شدید" });
});
