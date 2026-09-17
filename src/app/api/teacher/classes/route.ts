import { db } from "@/lib/db";
import { ok, fail, route, readJson } from "@/lib/api-helpers";
import { requireRole } from "@/lib/auth";
import { generateClassCode, generateQrToken } from "@/lib/ids";

// GET /api/teacher/classes — list teacher's classes with stats
export const GET = route(async () => {
  const user = await requireRole("TEACHER");

  const classes = await db.class.findMany({
    where: { teacherId: user.id },
    include: {
      _count: {
        select: {
          enrollments: { where: { status: "ACTIVE" } },
          sessions: true,
          joinRequests: { where: { status: "PENDING", direction: "STUDENT_REQUEST" } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return ok({
    classes: classes.map((c) => ({
      id: c.id,
      name: c.name,
      schedule: c.schedule,
      createdAt: c.createdAt,
      studentCount: c._count.enrollments,
      sessionCount: c._count.sessions,
      pendingRequests: c._count.joinRequests,
    })),
  });
});

// POST /api/teacher/classes — create class (name required, schedule optional)
export const POST = route(async (req: Request) => {
  const user = await requireRole("TEACHER");
  const body = await readJson<{ name?: string; schedule?: string }>(req);

  const name = (body.name ?? "").trim();
  const schedule = (body.schedule ?? "").trim();
  if (name.length < 2) return fail("نام کلاس را وارد کنید");
  if (name.length > 60) return fail("نام کلاس حداکثر ۶۰ کاراکتر است");

  // generate unique class id + qr token
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
  if (!classId || !qrToken) return fail("خطا در تولید شناسه کلاس، دوباره تلاش کنید", 500);

  const cls = await db.class.create({
    data: {
      id: classId,
      name,
      schedule: schedule || null,
      qrToken,
      teacherId: user.id,
    },
  });

  return ok({ class: { id: cls.id, name: cls.name, schedule: cls.schedule } }, 201);
});
