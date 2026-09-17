import { db } from "@/lib/db";
import { ok, fail, route, readJson } from "@/lib/api-helpers";
import { requireRole } from "@/lib/auth";
import { normalizeMobile } from "@/lib/mobile";
import { generateStudentCode, generateTeacherCode } from "@/lib/ids";
import type { Prisma } from "@prisma/client";

const ROLES = ["TEACHER", "STUDENT", "INSTITUTE_MANAGER"];
const FILTER_ROLES = ["SUPER_ADMIN", "INSTITUTE_MANAGER", "TEACHER", "STUDENT"];

// GET /api/admin/users — paginated, searchable user list.
// Query: page (default 1), pageSize (default 10, max 50),
//        q (mobile/name/lastName/studentCode/teacherCode contains),
//        role (optional SUPER_ADMIN|INSTITUTE_MANAGER|TEACHER|STUDENT).
export const GET = route(async (req: Request) => {
  await requireRole("SUPER_ADMIN");

  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10) || 1);
  const pageSize = Math.min(
    50,
    Math.max(1, parseInt(url.searchParams.get("pageSize") ?? "10", 10) || 10)
  );
  const roleParam = url.searchParams.get("role");
  if (roleParam && !FILTER_ROLES.includes(roleParam)) return fail("نقش معتبر نیست");

  // normalize Persian/Arabic digits so mobile search works with Persian input
  const q = (url.searchParams.get("q") ?? "")
    .trim()
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));

  const where: Prisma.UserWhereInput = {
    // default listing mirrors the overview: admins are hidden unless explicitly filtered
    role: roleParam ?? { in: ["STUDENT", "TEACHER", "INSTITUTE_MANAGER"] },
  };
  if (q) {
    where.OR = [
      { mobile: { contains: q } },
      { name: { contains: q } },
      { lastName: { contains: q } },
      { studentCode: { contains: q } },
      { teacherCode: { contains: q } },
    ];
  }

  const [total, users] = await Promise.all([
    db.user.count({ where }),
    db.user.findMany({
      where,
      select: {
        id: true, mobile: true, role: true, name: true, lastName: true,
        studentCode: true, teacherCode: true, profileCompleted: true,
        province: true, city: true, teachingSubject: true, educationLevel: true,
        createdAt: true,
        institute: { select: { id: true, name: true } },
        managedInstitute: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return ok({
    users: users.map((u) => ({
      ...u,
      instituteName: u.institute?.name ?? u.managedInstitute?.name ?? null,
      institute: undefined,
      managedInstitute: undefined,
    })),
    total,
    page,
    pageSize,
    pageCount: Math.ceil(total / pageSize),
  });
});

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
