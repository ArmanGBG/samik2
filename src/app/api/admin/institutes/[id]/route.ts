import { db } from "@/lib/db";
import { ok, fail, route } from "@/lib/api-helpers";
import { requireRole } from "@/lib/auth";

// DELETE /api/admin/institutes/[id]
export const DELETE = route(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  await requireRole("SUPER_ADMIN");
  const { id } = await ctx.params;

  const institute = await db.institute.findUnique({ where: { id } });
  if (!institute) return fail("آموزشگاه یافت نشد", 404);

  // staff teacherId links set null automatically; class.instituteId set null
  await db.institute.delete({ where: { id } });

  return ok({ message: "آموزشگاه حذف شد" });
});
