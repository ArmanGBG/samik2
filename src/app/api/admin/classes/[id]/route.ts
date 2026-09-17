import { db } from "@/lib/db";
import { ok, fail, route } from "@/lib/api-helpers";
import { requireRole } from "@/lib/auth";

// DELETE /api/admin/classes/[id]
export const DELETE = route(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  await requireRole("SUPER_ADMIN");
  const { id } = await ctx.params;

  const cls = await db.class.findUnique({ where: { id } });
  if (!cls) return fail("کلاس یافت نشد", 404);

  const sessionIds = await db.session.findMany({
    where: { classId: id },
    select: { id: true },
  });

  await db.$transaction([
    ...sessionIds.map((s) => db.attendance.deleteMany({ where: { sessionId: s.id } })),
    db.session.deleteMany({ where: { classId: id } }),
    db.joinRequest.deleteMany({ where: { classId: id } }),
    db.enrollment.deleteMany({ where: { classId: id } }),
    db.class.delete({ where: { id } }),
  ]);

  return ok({ message: "کلاس حذف شد" });
});
