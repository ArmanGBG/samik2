import { db } from "@/lib/db";
import { ok, fail, route, readJson } from "@/lib/api-helpers";
import { requireRole } from "@/lib/auth";
import { generateClassCode, generateQrToken } from "@/lib/ids";
import { toEnglishDigits } from "@/lib/mobile";

// POST /api/institute/classes — define class (optionally assign existing teacher)
// body: { name, schedule?, teacherCode?: "TCH-XXXXXX" }
export const POST = route(async (req: Request) => {
  const user = await requireRole("INSTITUTE_MANAGER");
  const body = await readJson<{ name?: string; schedule?: string; teacherCode?: string }>(req);

  const institute = await db.institute.findUnique({ where: { managerId: user.id } });
  if (!institute) return fail("آموزشگاهی برای شما ثبت نشده است", 404);

  const name = (body.name ?? "").trim();
  const schedule = (body.schedule ?? "").trim();
  if (name.length < 2) return fail("نام کلاس را وارد کنید");

  let teacherId: string | null = null;
  if (body.teacherCode) {
    const code = toEnglishDigits(body.teacherCode).toUpperCase().replace(/\s/g, "");
    const teacher = await db.user.findUnique({ where: { teacherCode: code } });
    if (!teacher || teacher.role !== "TEACHER") return fail("معلمی با این شناسه یافت نشد");
    teacherId = teacher.id;
  }

  let classId = "";
  let qrToken = "";
  for (let i = 0; i < 20; i++) {
    const cid = generateClassCode();
    if (!(await db.class.findUnique({ where: { id: cid } }))) { classId = cid; break; }
  }
  for (let i = 0; i < 20; i++) {
    const t = generateQrToken();
    if (!(await db.class.findUnique({ where: { qrToken: t } }))) { qrToken = t; break; }
  }
  if (!classId || !qrToken) return fail("خطا در تولید شناسه کلاس", 500);

  const cls = await db.class.create({
    data: {
      id: classId,
      name,
      schedule: schedule || null,
      qrToken,
      instituteId: institute.id,
      teacherId,
    },
  });

  return ok({ class: { id: cls.id, name: cls.name } }, 201);
});
