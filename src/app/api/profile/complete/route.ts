import { db } from "@/lib/db";
import { ok, fail, route, readJson } from "@/lib/api-helpers";
import { requireUser, publicUser } from "@/lib/auth";
import { normalizeMobile, isValidBankCard, isValidSheba } from "@/lib/mobile";
import { IRAN_PROVINCES } from "@/lib/iran";

const VALID_LEVELS = new Set([
  ...Array.from({ length: 6 }, (_, i) => `PRIMARY_${i + 1}`),
  ...Array.from({ length: 3 }, (_, i) => `JUNIOR_${i + 7}`),
  ...["MATH", "SCI", "HUM"].flatMap((m) => [10, 11, 12].map((g) => `HIGH_${g}_${m}`)),
  "GRADUATED",
]);

export const POST = route(async (req: Request) => {
  const sessionUser = await requireUser();
  const body = await readJson<Record<string, string | undefined>>(req);

  const name = (body.name ?? "").trim();
  const lastName = (body.lastName ?? "").trim();
  const province = (body.province ?? "").trim();
  const city = (body.city ?? "").trim();

  if (name.length < 2) return fail("نام را وارد کنید");
  if (lastName.length < 2) return fail("نام خانوادگی را وارد کنید");
  if (!IRAN_PROVINCES.some((p) => p.name === province)) return fail("استان را انتخاب کنید");
  if (!IRAN_PROVINCES.find((p) => p.name === province)?.cities.includes(city)) {
    return fail("شهر را انتخاب کنید");
  }

  const data: Record<string, string> = { name, lastName, province, city };

  if (sessionUser.role === "TEACHER") {
    const teachingSubject = (body.teachingSubject ?? "").trim();
    const bankCardNo = (body.bankCardNo ?? "").trim().replace(/[\s-]/g, "");
    const shebaNo = (body.shebaNo ?? "").trim().replace(/[\s-]/g, "").toUpperCase();

    if (teachingSubject.length < 2) return fail("درس تدریسی را وارد کنید");
    if (!isValidBankCard(bankCardNo)) return fail("شماره کارت بانکی معتبر نیست (۱۶ رقم)");
    if (!isValidSheba(shebaNo)) return fail("شماره شبا معتبر نیست (IR به‌همراه ۲۴ رقم)");

    data.teachingSubject = teachingSubject;
    data.bankCardNo = bankCardNo;
    data.shebaNo = shebaNo;
  } else if (sessionUser.role === "STUDENT") {
    const educationLevel = (body.educationLevel ?? "").trim();
    const parentPhone1 = normalizeMobile(body.parentPhone1 ?? "");
    const parentPhone2Raw = (body.parentPhone2 ?? "").trim();

    if (!VALID_LEVELS.has(educationLevel)) return fail("پایه تحصیلی را انتخاب کنید");
    if (!parentPhone1) return fail("شماره موبایل والد (الزامی) معتبر نیست");
    if (parentPhone2Raw && !normalizeMobile(parentPhone2Raw)) {
      return fail("شماره موبایل والد دوم معتبر نیست");
    }

    data.educationLevel = educationLevel;
    data.parentPhone1 = parentPhone1;
    data.parentPhone2 = parentPhone2Raw ? normalizeMobile(parentPhone2Raw)! : "";
  }
  // INSTITUTE_MANAGER / SUPER_ADMIN only need the common fields.

  const updated = await db.user.update({
    where: { id: sessionUser.id },
    data: { ...data, profileCompleted: true },
  });

  return ok({ user: publicUser(updated) });
});
