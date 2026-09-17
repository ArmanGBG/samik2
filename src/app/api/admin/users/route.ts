import { db } from "@/lib/db";
import { ok, fail, route, readJson } from "@/lib/api-helpers";
import { requireRole } from "@/lib/auth";
import { normalizeMobile } from "@/lib/mobile";
import { generateStudentCode, generateTeacherCode } from "@/lib/ids";

const ROLES = ["TEACHER", "STUDENT", "INSTITUTE_MANAGER"];

// POST /api/admin/users — manually register a user
// body: { mobile, role, name?, lastName? }
export const POST = route(async (req: Request) => {
  await requireRole("SUPER_ADMIN");
  const body = await readJson<{ mobile?: string; role?: string; name?: string; lastName?: string }>(req);

  const mobile = normalizeMobile(body.mobile ?? "");
  if (!mobile) return fail("شماره موبایل معتبر نیست");

  const role = body.role ?? "";
  if (!ROLES.includes(role)) return fail("نقش معتبر نیست");

  const exists = await db.user.findUnique({ where: { mobile } });
  if (exists) return fail("کاربری با این شماره قبلاً ثبت شده است");

  const data: Record<string, string | null> = {
    mobile,
    role,
    name: (body.name ?? "").trim() || null,
    lastName: (body.lastName ?? "").trim() || null,
  };

  if (role === "TEACHER") {
    for (let i = 0; i < 20; i++) {
      const c = generateTeacherCode();
      if (!(await db.user.findUnique({ where: { teacherCode: c } }))) { data.teacherCode = c; break; }
    }
  }
  if (role === "STUDENT") {
    for (let i = 0; i < 20; i++) {
      const c = generateStudentCode();
      if (!(await db.user.findUnique({ where: { studentCode: c } }))) { data.studentCode = c; break; }
    }
  }

  const user = await db.user.create({
    data: data as { mobile: string; role: string },
  });

  return ok({
    user: { id: user.id, mobile: user.mobile, role: user.role, teacherCode: user.teacherCode, studentCode: user.studentCode },
    message: "کاربر ثبت شد",
  }, 201);
});
