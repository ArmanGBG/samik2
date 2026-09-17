import { db } from "@/lib/db";
import { ok, fail, route, readJson } from "@/lib/api-helpers";
import { requireRole } from "@/lib/auth";
import { nextJoinSessionNum } from "@/lib/enrollment";

// POST /api/student/requests — accept/reject teacher invites (Student Method 1)
// body: { requestId, action: "ACCEPT" | "REJECT" }
export const POST = route(async (req: Request) => {
  const user = await requireRole("STUDENT");
  const body = await readJson<{ requestId?: string; action?: string }>(req);

  if (!["ACCEPT", "REJECT"].includes(body.action ?? "")) return fail("عملیات نامعتبر است");

  const request = await db.joinRequest.findFirst({
    where: {
      id: body.requestId,
      studentId: user.id,
      status: "PENDING",
      direction: "TEACHER_INVITE",
    },
  });
  if (!request) return fail("دعوت یافت نشد", 404);

  if (body.action === "REJECT") {
    await db.joinRequest.update({
      where: { id: request.id },
      data: { status: "REJECTED", respondedAt: new Date() },
    });
    return ok({ message: "دعوت رد شد" });
  }

  const existing = await db.enrollment.findUnique({
    where: { studentId_classId: { studentId: user.id, classId: request.classId } },
  });
  if (!existing) {
    const joinNum = await nextJoinSessionNum(request.classId);
    await db.enrollment.create({
      data: { studentId: user.id, classId: request.classId, joinedAtSessionNum: joinNum },
    });
  }
  await db.joinRequest.update({
    where: { id: request.id },
    data: { status: "APPROVED", respondedAt: new Date() },
  });

  return ok({ message: "به کلاس پیوستید" });
});
