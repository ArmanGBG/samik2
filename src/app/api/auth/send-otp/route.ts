import { db } from "@/lib/db";
import { ok, fail, route, readJson } from "@/lib/api-helpers";
import { normalizeMobile } from "@/lib/mobile";

export const POST = route(async (req: Request) => {
  const { mobile } = await readJson<{ mobile?: string }>(req);
  const normalized = normalizeMobile(mobile ?? "");
  if (!normalized) return fail("شماره موبایل معتبر نیست (مثال: ۰۹۱۲۳۴۵۶۷۸۹)");

  // Invalidate previous unused codes for this mobile
  await db.otp.updateMany({
    where: { mobile: normalized, used: false },
    data: { used: true },
  });

  const code = String(Math.floor(100000 + Math.random() * 900000));
  await db.otp.create({
    data: {
      mobile: normalized,
      code,
      expiresAt: new Date(Date.now() + 2 * 60 * 1000), // 2 minutes
    },
  });

  // No real SMS gateway in this environment — return the code for demo purposes.
  // In production this would be sent via SMS provider.
  return ok({ devCode: code, message: "کد تأیید ارسال شد" });
});
