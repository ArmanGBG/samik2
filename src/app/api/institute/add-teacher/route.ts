import { db } from "@/lib/db";
import { ok, fail, route, readJson } from "@/lib/api-helpers";
import { requireRole } from "@/lib/auth";
import { normalizeMobile, toEnglishDigits } from "@/lib/mobile";

// POST /api/institute/add-teacher — add an existing teacher to institute staff
// body: { value: "TCH-XXXXXX" | "09xxxxxxxxx" }
export const POST = route(async (req: Request) => {
  const user = await requireRole("INSTITUTE_MANAGER");
  const body = await readJson<{ value?: string }>(req);

  const institute = await db.institute.findUnique({ where: { managerId: user.id } });
  if (!institute) return fail("آموزشگاهی برای شما ثبت نشده است", 404);

  const raw = (body.value ?? "").trim();
  if (!raw) return fail("شناسه معلم یا شماره موبایل را وارد کنید");

  const asCode = toEnglishDigits(raw).toUpperCase().replace(/\s/g, "");
  const asMobile = normalizeMobile(raw);

  let teacher = null;
  if (/^TCH-[A-Z2-9]{6}$/.test(asCode)) {
    teacher = await db.user.findUnique({ where: { teacherCode: asCode } });
  } else if (asMobile) {
    teacher = await db.user.findUnique({ where: { mobile: asMobile } });
  }
  if (!teacher) return fail("کاربری با این مشخصات یافت نشد");

  if (teacher.role !== "TEACHER") return fail("این کاربر معلم نیست");
  if (teacher.instituteId && teacher.instituteId !== institute.id) {
    return fail("این معلم در آموزشگاه دیگری مشغول به کار است");
  }
  if (teacher.instituteId === institute.id) return fail("این معلم قبلاً به آموزشگاه اضافه شده است");

  await db.user.update({ where: { id: teacher.id }, data: { instituteId: institute.id } });

  return ok({
    message: "معلم به آموزشگاه اضافه شد",
    teacher: {
      name: teacher.name,
      lastName: teacher.lastName,
      teacherCode: teacher.teacherCode,
      teachingSubject: teacher.teachingSubject,
    },
  });
});
