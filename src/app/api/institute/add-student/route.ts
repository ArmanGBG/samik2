import { db } from "@/lib/db";
import { ok, fail, route, readJson } from "@/lib/api-helpers";
import { requireRole } from "@/lib/auth";
import { normalizeMobile } from "@/lib/mobile";
import { generateStudentCode } from "@/lib/ids";
import { nextJoinSessionNum } from "@/lib/enrollment";

// POST /api/institute/add-student — add student using ONLY a mobile number
// body: { classId, mobile }
//  - mobile exists (student)  → send invite
//  - mobile unknown           → create Ghost Account AND add directly to class
export const POST = route(async (req: Request) => {
  const user = await requireRole("INSTITUTE_MANAGER");
  const body = await readJson<{ classId?: string; mobile?: string }>(req);

  const institute = await db.institute.findUnique({ where: { managerId: user.id } });
  if (!institute) return fail("آموزشگاهی برای شما ثبت نشده است", 404);

  const cls = await db.class.findFirst({
    where: { id: body.classId, instituteId: institute.id },
  });
  if (!cls) return fail("کلاس در آموزشگاه شما یافت نشد", 404);

  const mobile = normalizeMobile(body.mobile ?? "");
  if (!mobile) return fail("شماره موبایل معتبر نیست");

  let student = await db.user.findUnique({ where: { mobile } });
  if (student && student.role !== "STUDENT") {
    return fail("این شماره متعلق به حساب دانش‌آموز نیست");
  }

  const existingEnrollment = student
    ? await db.enrollment.findUnique({
        where: { studentId_classId: { studentId: student.id, classId: cls.id } },
      })
    : null;

  // ---------- unknown mobile → Ghost Account + direct add ----------
  if (!student) {
    let code = "";
    for (let i = 0; i < 20; i++) {
      const c = generateStudentCode();
      if (!(await db.user.findUnique({ where: { studentCode: c } }))) { code = c; break; }
    }
    student = await db.user.create({
      data: { mobile, role: "STUDENT", studentCode: code, profileCompleted: false },
    });

    if (!existingEnrollment) {
      const joinNum = await nextJoinSessionNum(cls.id);
      await db.enrollment.create({
        data: { studentId: student.id, classId: cls.id, joinedAtSessionNum: joinNum },
      });
    }
    await db.joinRequest.updateMany({
      where: { studentId: student.id, classId: cls.id, status: "PENDING" },
      data: { status: "APPROVED", respondedAt: new Date() },
    });

    return ok({
      ghostCreated: true,
      message: "حساب موقت ساخته شد و دانش‌آموز به کلاس اضافه شد",
    });
  }

  // ---------- existing student → send invite ----------
  if (existingEnrollment) return fail("این دانش‌آموز قبلاً عضو این کلاس است");

  const pending = await db.joinRequest.findFirst({
    where: { studentId: student.id, classId: cls.id, status: "PENDING" },
  });
  if (pending) return fail("برای این دانش‌آموز قبلاً دعوت ارسال شده است");

  await db.joinRequest.create({
    data: { studentId: student.id, classId: cls.id, direction: "TEACHER_INVITE", status: "PENDING" },
  });

  return ok({
    invited: true,
    message: "دعوت برای دانش‌آموز ارسال شد",
  });
});
