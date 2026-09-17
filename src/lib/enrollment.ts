import { db } from "@/lib/db";

/** Current highest session number in a class (0 if no sessions). */
export async function maxSessionNum(classId: string): Promise<number> {
  const agg = await db.session.aggregate({
    where: { classId },
    _max: { sessionNum: true },
  });
  return agg._max.sessionNum ?? 0;
}

/** Next session number for enrollment tracking (joinedAtSessionNum). */
export async function nextJoinSessionNum(classId: string): Promise<number> {
  return (await maxSessionNum(classId)) + 1;
}
