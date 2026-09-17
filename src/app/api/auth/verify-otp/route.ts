import { db } from "@/lib/db";
import { ok, fail, route, readJson } from "@/lib/api-helpers";
import { normalizeMobile, toEnglishDigits } from "@/lib/mobile";
import { createSession, publicUser } from "@/lib/auth";

export const POST = route(async (req: Request) => {
  const { mobile, code } = await readJson<{ mobile?: string; code?: string }>(req);
  const normalized = normalizeMobile(mobile ?? "");
  if (!normalized) return fail("شماره موبایل معتبر نیست");

  const cleanCode = toEnglishDigits((code ?? "").trim());
  if (!/^\d{6}$/.test(cleanCode)) return fail("کد تأیید باید ۶ رقم باشد");

  const otp = await db.otp.findFirst({
    where: { mobile: normalized, code: cleanCode, used: false },
    orderBy: { createdAt: "desc" },
  });

  if (!otp) return fail("کد تأیید نادرست است", 401);
  if (otp.expiresAt < new Date()) return fail("کد تأیید منقضی شده است. دوباره تلاش کنید", 401);

  await db.otp.update({ where: { id: otp.id }, data: { used: true } });

  let user = await db.user.findUnique({ where: { mobile: normalized } });
  let isNew = false;

  if (!user) {
    // Brand-new account → default STUDENT, must complete profile & choose role
    user = await db.user.create({
      data: { mobile: normalized, role: "STUDENT", profileCompleted: false },
    });
    isNew = true;
  }

  await createSession(user.id);

  return ok({ user: publicUser(user), isNew });
});
