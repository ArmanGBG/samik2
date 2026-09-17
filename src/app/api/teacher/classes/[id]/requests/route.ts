import { db } from "@/lib/db";
import { ok, fail, route, readJson } from "@/lib/api-helpers";
import { requireRole } from "@/lib/auth";
import { nextJoinSessionNum } from "@/lib/enrollment";

// POST /api/teacher/classes/[id]/requests — approve/reject student join requests
// body: { requestId, action: "APPROVE" | "REJECT" }
export const POST = route(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireRole("TEACHER");
  const { id } = await ctx.params;
  const body = await readJson<{ requestId?: string; action?: string }>(req);

  if (!["APPROVE", "REJECT"].includes(body.action ?? "")) return fail("عملیات نامعتبر است");

  const cls = await db.class.findFirst({ where: { id, teacherId: user.id } });
  if (!cls) return fail("کلاس یافت نشد", 404);

  const request = await db.joinRequest.findFirst({
    where: { id: body.requestId, classId: cls.id, status: "PENDING" },
  });
  if (!request) return fail("درخواست یافت نشد", 404);

  if (body.action === "REJECT") {
    await db.joinRequest.update({
      where: { id: request.id },
      data: { status: "REJECTED", respondedAt: new Date() },
    });
    return ok({ message: "درخواست رد شد" });
  }

  // APPROVE → enroll student
  const existing = await db.enrollment.findUnique({
    where: { studentId_classId: { studentId: request.studentId, classId: cls.id } },
  });
  if (existing) {
    await db.joinRequest.update({
      where: { id: request.id },
      data: { status: "APPROVED", respondedAt: new Date() },
    });
    return ok({ message: "این دانش‌آموز قبلاً عضو کلاس شده است" });
  }

  const joinNum = await nextJoinSessionNum(cls.id);
  await db.enrollment.create({
    data: {
      studentId: request.studentId,
      classId: cls.id,
      joinedAtSessionNum: joinNum,
    },
  });
  await db.joinRequest.update({
    where: { id: request.id },
    data: { status: "APPROVED", respondedAt: new Date() },
  });

  return ok({ message: "درخواست تأیید شد و دانش‌آموز به کلاس اضافه شد" });
});
