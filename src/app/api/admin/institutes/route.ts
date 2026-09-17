import { db } from "@/lib/db";
import { ok, fail, route, readJson } from "@/lib/api-helpers";
import { requireRole } from "@/lib/auth";
import { normalizeMobile } from "@/lib/mobile";

// POST /api/admin/institutes — create institute + assign manager by mobile
// body: { name, managerMobile }
//  - manager mobile unknown → create manager account (completes profile on first login)
//  - manager mobile exists   → promote to INSTITUTE_MANAGER (if not super admin / other manager)
export const POST = route(async (req: Request) => {
  await requireRole("SUPER_ADMIN");
  const body = await readJson<{ name?: string; managerMobile?: string }>(req);

  const name = (body.name ?? "").trim();
  if (name.length < 2) return fail("نام آموزشگاه را وارد کنید");

  const mobile = normalizeMobile(body.managerMobile ?? "");
  if (!mobile) return fail("شماره موبایل مدیر آموزشگاه معتبر نیست");

  let manager = await db.user.findUnique({ where: { mobile } });

  if (manager?.role === "SUPER_ADMIN") return fail("این شماره متعلق به مدیر کل است");
  if (manager?.managedInstitute) return fail("این کاربر مدیریت آموزشگاه دیگری را بر عهده دارد");

  if (!manager) {
    manager = await db.user.create({
      data: { mobile, role: "INSTITUTE_MANAGER", profileCompleted: false },
    });
  } else {
    manager = await db.user.update({
      where: { id: manager.id },
      data: { role: "INSTITUTE_MANAGER" },
    });
  }

  const institute = await db.institute.create({
    data: { name, managerId: manager.id },
  });

  return ok({
    institute: { id: institute.id, name: institute.name },
    message: "آموزشگاه ایجاد شد",
  }, 201);
});
