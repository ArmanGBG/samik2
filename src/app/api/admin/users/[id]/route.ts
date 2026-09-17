import { db } from "@/lib/db";
import { ok, fail, route, readJson } from "@/lib/api-helpers";
import { requireRole } from "@/lib/auth";

const ROLES = ["SUPER_ADMIN", "INSTITUTE_MANAGER", "TEACHER", "STUDENT"];

// PATCH /api/admin/users/[id] — edit user (role, name, lastName)
export const PATCH = route(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const me = await requireRole("SUPER_ADMIN");
  const { id } = await ctx.params;
  const body = await readJson<{ role?: string; name?: string; lastName?: string }>(req);

  const user = await db.user.findUnique({ where: { id } });
  if (!user) return fail("کاربر یافت نشد", 404);
  if (user.id === me.id) return fail("امکان ویرایش حساب خودتان وجود ندارد");

  const data: Record<string, string> = {};
  if (body.role !== undefined) {
    if (!ROLES.includes(body.role)) return fail("نقش معتبر نیست");
    if (user.role === "INSTITUTE_MANAGER" && body.role !== "INSTITUTE_MANAGER") {
      const inst = await db.institute.findUnique({ where: { managerId: user.id } });
      if (inst) return fail("این کاربر مدیر آموزشگاه است؛ ابتدا آموزشگاه را حذف کنید");
    }
    data.role = body.role;
  }
  if (body.name !== undefined) data.name = body.name.trim() || "";
  if (body.lastName !== undefined) data.lastName = body.lastName.trim() || "";

  const updated = await db.user.update({ where: { id }, data });
  return ok({ message: "کاربر ویرایش شد", user: { id: updated.id, role: updated.role } });
});

// DELETE /api/admin/users/[id]
export const DELETE = route(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const me = await requireRole("SUPER_ADMIN");
  const { id } = await ctx.params;

  const user = await db.user.findUnique({ where: { id } });
  if (!user) return fail("کاربر یافت نشد", 404);
  if (user.id === me.id) return fail("امکان حذف حساب خودتان وجود ندارد");

  await db.$transaction([
    db.attendance.deleteMany({ where: { studentId: id } }),
    db.joinRequest.deleteMany({ where: { studentId: id } }),
    db.enrollment.deleteMany({ where: { studentId: id } }),
    db.institute.deleteMany({ where: { managerId: id } }),
    db.user.delete({ where: { id } }),
  ]);

  return ok({ message: "کاربر حذف شد" });
});
