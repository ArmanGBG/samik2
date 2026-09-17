import { db } from "@/lib/db";
import { ok, fail, route, readJson } from "@/lib/api-helpers";
import { requireRole } from "@/lib/auth";
import { toEnglishDigits } from "@/lib/mobile";

// POST /api/student/join — join class by CLS-xxx code (Student Method 2)
// Also used by QR scanner: scanned content is the CLS-xxx code (Method 3)
export const POST = route(async (req: Request) => {
  const user = await requireRole("STUDENT");
  const body = await readJson<{ code?: string }>(req);

  const raw = (body.code ?? "").trim();
  // accept "CLS-XXXXXX" or a full QR payload containing it
  const match = toEnglishDigits(raw).toUpperCase().match(/CLS-[A-Z2-9]{6}/);
  if (!match) return fail("کد کلاس باید به شکل CLS-XXXXXX باشد");
  const code = match[0];

  const cls = await db.class.findUnique({
    where: { id: code },
    include: {
      teacher: { select: { name: true, lastName: true } },
      institute: { select: { name: true } },
    },
  });
  if (!cls) return fail("کلاسی با این کد یافت نشد");

  const existing = await db.enrollment.findUnique({
    where: { studentId_classId: { studentId: user.id, classId: cls.id } },
  });
  if (existing) return fail("شما قبلاً عضو این کلاس هستید");

  const pending = await db.joinRequest.findFirst({
    where: { studentId: user.id, classId: cls.id, status: "PENDING" },
  });
  if (pending) return fail("درخواست شما برای این کلاس قبلاً ارسال شده و در انتظار تأیید است");

  await db.joinRequest.create({
    data: { studentId: user.id, classId: cls.id, direction: "STUDENT_REQUEST", status: "PENDING" },
  });

  return ok({
    message: "درخواست عضویت برای معلم ارسال شد",
    class: {
      name: cls.name,
      teacher: cls.teacher
        ? `${cls.teacher.name ?? ""} ${cls.teacher.lastName ?? ""}`.trim() || "—"
        : "—",
    },
  });
});
