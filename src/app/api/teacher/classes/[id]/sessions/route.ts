import { db } from "@/lib/db";
import { ok, fail, route, readJson } from "@/lib/api-helpers";
import { requireRole } from "@/lib/auth";
import { maxSessionNum } from "@/lib/enrollment";

// POST /api/teacher/classes/[id]/sessions — add session
// body: { name?: string (default: جلسه N — editable), date?: ISO string (default: today) }
export const POST = route(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireRole("TEACHER");
  const { id } = await ctx.params;
  const body = await readJson<{ name?: string; date?: string }>(req);

  const cls = await db.class.findFirst({ where: { id, teacherId: user.id } });
  if (!cls) return fail("کلاس یافت نشد", 404);

  const sessionNum = (await maxSessionNum(cls.id)) + 1;

  const customName = (body.name ?? "").trim();
  const name = customName.length > 0 ? customName.slice(0, 60) : `جلسه ${faNum(sessionNum)}`;

  let date = new Date();
  if (body.date) {
    const parsed = new Date(body.date);
    if (Number.isNaN(parsed.getTime())) return fail("تاریخ جلسه نامعتبر است");
    date = parsed;
  }

  const session = await db.session.create({
    data: { classId: cls.id, name, sessionNum, date },
  });

  return ok({ session: { id: session.id, name: session.name, sessionNum, date: session.date } }, 201);
});

function faNum(n: number): string {
  return String(n).replace(/[0-9]/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);
}
