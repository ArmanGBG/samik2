import { db } from "@/lib/db";
import { ok, fail, route, readJson } from "@/lib/api-helpers";
import { requireRole } from "@/lib/auth";
import { normalizeMobile, toEnglishDigits } from "@/lib/mobile";
import { generateStudentCode } from "@/lib/ids";
import { maxSessionNum } from "@/lib/enrollment";

// POST /api/teacher/classes/[id]/add-student
// Method A: { mode: "MOBILE", value: "09..." } → sends join request (invite) to student
//   - existing user → invite; unknown mobile → create Ghost Account + invite
// Method B: { mode: "STU_ID", value: "STU-XXXXXX" } → direct enrollment
export const POST = route(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireRole("TEACHER");
  const { id } = await ctx.params;
  const body = await readJson<{ mode?: string; value?: string }>(req);

  const cls = await db.class.findFirst({ where: { id, teacherId: user.id } });
  if (!cls) return fail("کلاس یافت نشد", 404);

  const mode = body.mode;
  const value = (body.value ?? "").trim();

  // ---------------- Method B: STU-xxx → direct enrollment ----------------
  if (mode === "STU_ID") {
    const code = toEnglishDigits(value).toUpperCase().replace(/\s/g, "");
    if (!/^STU-[A-Z2-9]{6}$/.test(code)) return fail("شناسه دانش‌آموز باید به شکل STU-XXXXXX باشد");

    const student = await db.user.findUnique({ where: { studentCode: code } });
    if (!student || student.role !== "STUDENT") return fail("دانش‌آموزی با این شناسه یافت نشد");

    const existing = await db.enrollment.findUnique({
      where: { studentId_classId: { studentId: student.id, classId: cls.id } },
    });
    if (existing) return fail("این دانش‌آموز قبلاً در کلاس ثبت شده است");

    const maxNum = await maxSessionNum(cls.id);
    await db.enrollment.create({
      data: {
        studentId: student.id,
        classId: cls.id,
        joinedAtSessionNum: maxNum + 1,
      },
    });
    // resolve any pending requests between them
    await db.joinRequest.updateMany({
      where: { studentId: student.id, classId: cls.id, status: "PENDING" },
      data: { status: "APPROVED", respondedAt: new Date() },
    });

    return ok({
      enrolled: true,
      student: { name: student.name, lastName: student.lastName, studentCode: student.studentCode },
      message: "دانش‌آموز مستقیماً به کلاس اضافه شد",
    });
  }

  // ---------------- Method A: mobile → invite (ghost if unknown) ----------------
  if (mode === "MOBILE") {
    const mobile = normalizeMobile(value);
    if (!mobile) return fail("شماره موبایل معتبر نیست");

    let student = await db.user.findUnique({ where: { mobile } });

    if (student && student.role !== "STUDENT") {
      return fail("این شماره متعلق به حساب دانش‌آموز نیست");
    }

    let isGhost = false;
    if (!student) {
      // Ghost Account: create student with ONLY a mobile number
      let code = "";
      for (let i = 0; i < 20; i++) {
        const c = generateStudentCode();
        if (!(await db.user.findUnique({ where: { studentCode: c } }))) { code = c; break; }
      }
      student = await db.user.create({
        data: { mobile, role: "STUDENT", studentCode: code, profileCompleted: false },
      });
      isGhost = true;
    }

    const existingEnrollment = await db.enrollment.findUnique({
      where: { studentId_classId: { studentId: student.id, classId: cls.id } },
    });
    if (existingEnrollment) return fail("این دانش‌آموز قبلاً عضو کلاس است");

    const pending = await db.joinRequest.findFirst({
      where: { studentId: student.id, classId: cls.id, status: "PENDING" },
    });
    if (pending) return fail("برای این دانش‌آموز قبلاً درخواست ارسال شده است");

    await db.joinRequest.create({
      data: { studentId: student.id, classId: cls.id, direction: "TEACHER_INVITE", status: "PENDING" },
    });

    return ok({
      invited: true,
      isGhost,
      student: { name: student.name, lastName: student.lastName, mobile: student.mobile },
      message: isGhost
        ? "حساب موقت ساخته شد و دعوت برای دانش‌آموز ارسال شد"
        : "دعوت به کلاس برای دانش‌آموز ارسال شد",
    });
  }

  return fail("روش افزودن نامعتبر است");
});
