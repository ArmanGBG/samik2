import { db } from "@/lib/db";
import { ok, fail, route, readJson } from "@/lib/api-helpers";
import { requireUser, publicUser } from "@/lib/auth";

// New users pick their role (Teacher / Student) after OTP registration.
// Only allowed for fresh accounts with no activity (not ghost students,
// who were already invited to classes as students).
export const POST = route(async (req: Request) => {
  const sessionUser = await requireUser();
  const { role } = await readJson<{ role?: string }>(req);

  if (!["TEACHER", "STUDENT"].includes(role ?? "")) {
    return fail("نقش انتخابی معتبر نیست");
  }

  const user = await db.user.findUnique({
    where: { id: sessionUser.id },
    include: { _count: { select: { enrollments: true, joinRequests: true } } },
  });
  if (!user) return fail("کاربر یافت نشد", 404);

  if (user.profileCompleted && user.role !== "STUDENT") {
    return fail("نقش شما قبلاً مشخص شده است");
  }
  if ((user._count.enrollments > 0 || user._count.joinRequests > 0) && user.role === "STUDENT") {
    return fail("این شماره به‌عنوان دانش‌آموز ثبت شده است");
  }
  if (user.role === "SUPER_ADMIN" || user.role === "INSTITUTE_MANAGER") {
    return fail("امکان تغییر نقش وجود ندارد");
  }

  const data: { role: string; teacherCode?: string; studentCode?: string } = { role: role! };
  if (role === "TEACHER" && !user.teacherCode) {
    // generate unique code
    for (let i = 0; i < 20; i++) {
      const c = `TCH-${random6()}`;
      const exists = await db.user.findUnique({ where: { teacherCode: c } });
      if (!exists) { data.teacherCode = c; break; }
    }
  }
  if (role === "STUDENT" && !user.studentCode) {
    for (let i = 0; i < 20; i++) {
      const c = `STU-${random6()}`;
      const exists = await db.user.findUnique({ where: { studentCode: c } });
      if (!exists) { data.studentCode = c; break; }
    }
  }

  const updated = await db.user.update({ where: { id: user.id }, data });
  return ok({ user: publicUser(updated) });
});

function random6(): string {
  const A = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += A[Math.floor(Math.random() * A.length)];
  return s;
}
