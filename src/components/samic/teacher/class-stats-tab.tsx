"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3, BookOpenCheck, CalendarCheck, CheckCheck, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { toPersianDigitsSafe } from "@/lib/jalali";
import { api, ClassStats } from "../api";
import { StatCard } from "../shared/stat-card";
import { AttChip, displayName, EmptyState, GhostBadge } from "./bits";

interface ClassStatsTabProps {
  classId: string;
}

/** «گزارش‌ها» — class analytics: overview cards, stacked session-trend bar chart,
 *  per-student attendance report card. Data follows the enrollment history rule
 *  (server-side): only sessions the student was a member of are counted. */
export function ClassStatsTab({ classId }: ClassStatsTabProps) {
  const [stats, setStats] = useState<ClassStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadSeq, setReloadSeq] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await api<{ stats: ClassStats }>(`/api/teacher/classes/${classId}/stats`);
      if (cancelled) return;
      if (!res.ok || !res.data?.stats) {
        setStats(null);
        setError(res.error ?? "خطا در بارگذاری گزارش‌ها");
        setLoading(false);
        return;
      }
      setStats(res.data.stats);
      setError(null);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [classId, reloadSeq]);

  // ---------- loading ----------
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border-border/80">
              <CardContent className="flex items-center gap-4 p-4 sm:p-5">
                <Skeleton className="size-11 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-6 w-14" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="border-border/80">
          <CardHeader className="gap-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-64" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[260px] w-full rounded-xl" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // ---------- error ----------
  if (error || !stats) {
    return (
      <EmptyState
        icon={<BarChart3 className="size-7 text-primary" />}
        title={error ?? "خطا در بارگذاری گزارش‌ها"}
        description="در بارگذاری گزارش‌های این کلاس خطایی رخ داد؛ دوباره تلاش کنید."
        action={
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              setReloadSeq((s) => s + 1);
            }}
            className="h-11 cursor-pointer rounded-xl border border-border bg-card px-5 text-sm font-semibold transition-colors hover:bg-accent"
          >
            تلاش مجدد
          </button>
        }
      />
    );
  }

  // ---------- empty (no sessions → nothing to report) ----------
  if (stats.sessionTrend.length === 0) {
    return (
      <EmptyState
        icon={<BarChart3 className="size-7 text-primary" />}
        title="هنوز داده‌ای برای گزارش وجود ندارد"
        description="با ثبت جلسات و ثبت حضوروغیاب، نمودار روند جلسات و کارنامه دانش‌آموزان اینجا نمایش داده می‌شود."
      />
    );
  }

  const { overview } = stats;
  const presentRate = overview.presentRate;
  const presentTone = presentRate >= 90 ? "success" : presentRate >= 70 ? "warning" : "danger";

  const sortedStudents = [...stats.students].sort((a, b) => b.attendanceRate - a.attendanceRate);

  return (
    <div className="space-y-4">
      {/* ---------- Overview cards ---------- */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          title="نرخ حضور"
          value={`${toPersianDigitsSafe(presentRate)}٪`}
          icon={<CheckCheck className="size-5" />}
          tone={presentTone}
          hint={`از ${toPersianDigitsSafe(overview.markedCount)} ثبت`}
        />
        <StatCard
          title="نرخ تکالیف"
          value={`${toPersianDigitsSafe(overview.assignmentRate)}٪`}
          icon={<BookOpenCheck className="size-5" />}
          tone="primary"
        />
        <StatCard
          title="مجموع جلسات"
          value={overview.totalSessions}
          icon={<CalendarCheck className="size-5" />}
        />
        <StatCard
          title="دانش‌آموزان"
          value={overview.totalStudents}
          icon={<Users className="size-5" />}
        />
      </div>

      {/* ---------- Chart 1: session attendance trend ---------- */}
      <Card className="border-border/80">
        <CardHeader className="gap-2">
          <CardTitle className="text-base font-extrabold">روند حضور در جلسات</CardTitle>
          <CardDescription className="text-xs leading-6">
            تعداد حاضر، تأخیر و غایبِ ثبت‌شده در هر جلسه
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* hand-made RTL legend (recharts Legend has RTL layout issues) */}
          <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] font-semibold text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-forest" aria-hidden="true" />
              حاضر
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-amber-500" aria-hidden="true" />
              تأخیر
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-red-500" aria-hidden="true" />
              غایب
            </span>
          </div>

          <div dir="ltr" className="w-full">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={stats.sessionTrend} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" strokeOpacity={0.15} />
                <XAxis
                  dataKey="sessionNum"
                  reversed
                  orientation="bottom"
                  tickLine={false}
                  axisLine={{ stroke: "currentColor", strokeOpacity: 0.25 }}
                  tick={{ fontSize: 11 }}
                  tickMargin={6}
                  tickFormatter={(v) => toPersianDigitsSafe(Number(v))}
                />
                <YAxis
                  orientation="right"
                  allowDecimals={false}
                  width={32}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => toPersianDigitsSafe(Number(v))}
                />
                <Tooltip content={<SessionTrendTooltip />} cursor={{ fill: "rgba(127,127,127,0.08)" }} />
                <Bar dataKey="PRESENT" name="حاضر" stackId="att" fill="#2d6a4f" maxBarSize={44} />
                <Bar dataKey="LATE" name="تأخیر" stackId="att" fill="#f59e0b" maxBarSize={44} />
                <Bar dataKey="ABSENT" name="غایب" stackId="att" fill="#ef4444" maxBarSize={44} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* ---------- Chart 2: per-student attendance report ---------- */}
      <Card className="border-border/80">
        <CardHeader className="gap-2">
          <CardTitle className="text-base font-extrabold">کارنامه حضوروغیاب دانش‌آموزان</CardTitle>
          <CardDescription className="text-xs leading-6">
            نرخ حضور هر دانش‌آموز فقط از جلساتی محاسبه می‌شود که او عضو کلاس بوده است
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sortedStudents.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              هنوز دانش‌آموزی عضو این کلاس نیست
            </p>
          ) : (
            <div className="max-h-96 space-y-5 overflow-y-auto scroll-samic pl-1">
              {sortedStudents.map((s) => {
                const rate = s.attendanceRate;
                return (
                  <div key={s.id} className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className="truncate text-sm font-bold">{displayName(s.name, s.lastName)}</span>
                        {!s.profileCompleted ? <GhostBadge /> : null}
                        {s.studentCode ? (
                          <span dir="ltr" className="font-mono text-[10px] text-muted-foreground">
                            {s.studentCode}
                          </span>
                        ) : null}
                      </div>
                      <span
                        className={cn(
                          "shrink-0 text-sm font-extrabold tabular-nums",
                          rate >= 90
                            ? "text-forest-deep dark:text-forest-soft"
                            : rate >= 70
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-red-600 dark:text-red-400"
                        )}
                      >
                        {toPersianDigitsSafe(rate)}٪
                      </span>
                    </div>

                    {/* RTL fill: mirror the bar so it grows from the right edge */}
                    <Progress
                      value={rate}
                      aria-label={`نرخ حضور ${displayName(s.name, s.lastName)}`}
                      className={cn(
                        "h-2.5 -scale-x-100",
                        rate >= 90
                          ? "[&>[data-slot=progress-indicator]]:bg-forest"
                          : rate >= 70
                            ? "[&>[data-slot=progress-indicator]]:bg-amber-500"
                            : "[&>[data-slot=progress-indicator]]:bg-red-500"
                      )}
                    />

                    <div className="flex flex-wrap items-center gap-1.5">
                      <AttChip label="حاضر" count={s.present} tone="present" />
                      <AttChip label="غایب" count={s.absent} tone="absent" />
                      <AttChip label="تأخیر" count={s.late} tone="late" />
                      <span className="ms-1 text-[11px] text-muted-foreground">
                        از {toPersianDigitsSafe(s.assignmentsTotal)} جلسه
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/** Custom RTL tooltip for the session-trend chart (Persian labels + digits) */
function SessionTrendTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { dataKey?: string | number; name?: string; value?: number | string; color?: string }[];
  label?: string | number;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div dir="rtl" className="chart-tooltip-samic">
      <p className="mb-1.5 font-bold">جلسه {toPersianDigitsSafe(Number(label ?? 0))}</p>
      <div className="space-y-1">
        {payload.map((p) => (
          <div key={String(p.dataKey)} className="flex items-center justify-between gap-5">
            <span className="inline-flex items-center gap-1.5">
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: p.color }}
                aria-hidden="true"
              />
              {p.name}
            </span>
            <span className="font-bold tabular-nums">{toPersianDigitsSafe(Number(p.value ?? 0))}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
