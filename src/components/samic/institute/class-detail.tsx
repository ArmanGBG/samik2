"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  CalendarClock,
  CalendarDays,
  Eye,
  GraduationCap,
  UserRound,
  Users,
  XCircle,
} from "lucide-react";
import { toJalaliLong, toPersianDigitsSafe } from "@/lib/jalali";
import { api, educationLevelLabel, InstituteClassDetail as InstituteClassDetailType } from "../api";
import { fullName } from "../shared/format";
import { AttChip } from "../teacher/bits";
import { EmptyState } from "./panel-bits";

interface InstituteClassDetailProps {
  classId: string;
  onBack: () => void;
}

/**
 * نمای جزئیات کلاس برای مدیر آموزشگاه — read-only drilldown:
 * sessions (newest first with attendance chips) + active students table.
 */
export function InstituteClassDetail({ classId, onBack }: InstituteClassDetailProps) {
  const [detail, setDetail] = useState<InstituteClassDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      setDetail(null);
      const res = await api<{ class: InstituteClassDetailType }>(
        `/api/institute/classes/${encodeURIComponent(classId)}`
      );
      if (cancelled) return;
      if (res.ok && res.data?.class) {
        setDetail(res.data.class);
      } else {
        setError(res.error ?? "خطا در بارگذاری اطلاعات کلاس");
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [classId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-11 w-44 rounded-lg" />
        <Skeleton className="h-32 rounded-2xl" />
        <div className="space-y-3">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-56 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          onClick={onBack}
          className="h-11 gap-1.5 px-3 cursor-pointer text-muted-foreground hover:text-foreground"
        >
          <ArrowRight className="size-4" />
          بازگشت به کلاس‌ها
        </Button>
        <Card className="border-destructive/30">
          <CardContent className="p-8 sm:p-12 text-center space-y-4">
            <div className="mx-auto size-12 rounded-full bg-red-500/10 text-red-600 grid place-items-center">
              <XCircle className="size-6" />
            </div>
            <div className="font-bold">{error ?? "کلاس یافت نشد"}</div>
            <Button variant="outline" onClick={onBack} className="h-11 gap-1.5 cursor-pointer">
              <ArrowRight className="size-4" />
              بازگشت به کلاس‌ها
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        onClick={onBack}
        className="h-11 gap-1.5 px-3 cursor-pointer text-muted-foreground hover:text-foreground"
        aria-label="بازگشت به کلاس‌ها"
      >
        <ArrowRight className="size-4" />
        بازگشت به کلاس‌ها
      </Button>

      {/* class header */}
      <Card className="border-primary/25 bg-gradient-to-b from-accent/60 to-card">
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-wrap items-start gap-4">
            <div className="size-12 rounded-2xl bg-primary text-primary-foreground grid place-items-center shrink-0">
              <BookOpen className="size-6" strokeWidth={2.2} />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl font-black leading-relaxed">{detail.name}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                {detail.teacher ? (
                  <span className="flex items-center gap-1.5">
                    <UserRound className="size-3.5 shrink-0" />
                    {detail.teacher.name}
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <UserRound className="size-3.5 shrink-0" />
                    بدون معلم
                  </span>
                )}
                {detail.teacher?.teacherCode && (
                  <span
                    dir="ltr"
                    className="inline-flex items-center rounded-lg border border-border/60 bg-muted/60 px-2 py-0.5 font-mono text-[11px] text-muted-foreground"
                  >
                    {detail.teacher.teacherCode}
                  </span>
                )}
                {detail.schedule && (
                  <span className="flex items-center gap-1.5">
                    <CalendarClock className="size-3.5 shrink-0" />
                    {detail.schedule}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="size-3.5 shrink-0" />
                  ایجاد: {toJalaliLong(detail.createdAt)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge
                variant="secondary"
                className="bg-accent border-primary/20 text-primary font-bold gap-1"
              >
                <Users className="size-3" />
                {toPersianDigitsSafe(detail.students.length)} دانش‌آموز
              </Badge>
              <Badge
                variant="secondary"
                className="bg-accent border-primary/20 text-primary font-bold gap-1"
              >
                <Calendar className="size-3" />
                {toPersianDigitsSafe(detail.sessions.length)} جلسه
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* sessions */}
      <section className="space-y-3" aria-label="جلسات کلاس">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-extrabold flex items-center gap-2">
            <Calendar className="size-5 text-primary" />
            جلسات
          </h2>
          <span className="text-xs text-muted-foreground">
            {toPersianDigitsSafe(detail.sessions.length)} جلسه — جدیدترین اول
          </span>
        </div>

        {detail.sessions.length === 0 ? (
          <EmptyState
            icon={<Calendar className="size-6" />}
            title="هنوز جلسه‌ای برای این کلاس ثبت نشده است"
            description="معلم کلاس پس از برگزاری هر جلسه، آن را اینجا ثبت می‌کند."
          />
        ) : (
          <Card className="border-border/80 overflow-hidden">
            <CardContent className="p-0">
              <ul className="divide-y divide-border/80">
                {detail.sessions.map((s) => (
                  <li key={s.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 p-4">
                    <span
                      className="inline-flex items-center rounded-lg bg-accent border border-primary/15 text-primary px-2 py-1 text-xs font-bold tabular-nums shrink-0"
                      aria-label={`جلسه ${toPersianDigitsSafe(s.sessionNum)}`}
                    >
                      جلسه {toPersianDigitsSafe(s.sessionNum)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold truncate">{s.name}</div>
                      <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="size-3.5 shrink-0" />
                        {toJalaliLong(s.date)}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                      <AttChip label="حاضر" count={s.attendance.PRESENT} tone="present" />
                      <AttChip label="غایب" count={s.attendance.ABSENT} tone="absent" />
                      <AttChip label="تأخیر" count={s.attendance.LATE} tone="late" />
                      <AttChip label="بدون ثبت" count={s.attendance.UNMARKED} tone="muted" />
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </section>

      {/* students */}
      <section className="space-y-3" aria-label="دانش‌آموزان کلاس">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-extrabold flex items-center gap-2">
            <Users className="size-5 text-primary" />
            دانش‌آموزان
          </h2>
          <span className="text-xs text-muted-foreground">
            {toPersianDigitsSafe(detail.students.length)} عضو فعال
          </span>
        </div>

        {detail.students.length === 0 ? (
          <EmptyState
            icon={<GraduationCap className="size-6" />}
            title="هنوز دانش‌آموزی در این کلاس عضو نشده است"
            description="از لیست کلاس‌ها می‌توانید با شماره موبایل، دانش‌آموز به کلاس اضافه کنید."
          />
        ) : (
          <Card className="border-border/80 overflow-hidden">
            <div className="max-h-96 overflow-auto scroll-samic">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="text-right">دانش‌آموز</TableHead>
                    <TableHead className="text-right hidden sm:table-cell">شناسه</TableHead>
                    <TableHead className="text-right hidden md:table-cell">موبایل</TableHead>
                    <TableHead className="text-right hidden lg:table-cell">پایه تحصیلی</TableHead>
                    <TableHead className="text-right">عضویت</TableHead>
                    <TableHead className="text-right">حضوروغیاب</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detail.students.map((st) => (
                    <TableRow key={st.id}>
                      <TableCell>
                        <div className="font-medium">{fullName(st.name, st.lastName)}</div>
                        {!st.profileCompleted && (
                          <span className="text-[10px] text-amber-600 font-semibold">
                            پروفایل ناقص
                          </span>
                        )}
                      </TableCell>
                      <TableCell
                        dir="ltr"
                        className="hidden sm:table-cell font-mono text-xs text-muted-foreground"
                      >
                        {st.studentCode ?? "—"}
                      </TableCell>
                      <TableCell
                        dir="ltr"
                        className="hidden md:table-cell text-muted-foreground text-sm tabular-nums"
                      >
                        {toPersianDigitsSafe(st.mobile)}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                        {educationLevelLabel(st.educationLevel)}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-full border bg-muted text-muted-foreground px-2.5 py-0.5 text-[11px] tabular-nums whitespace-nowrap">
                          از جلسه {toPersianDigitsSafe(st.joinedAtSessionNum)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-1">
                          <AttChip label="حاضر" count={st.present} tone="present" />
                          <AttChip label="غایب" count={st.absent} tone="absent" />
                          <AttChip label="تأخیر" count={st.late} tone="late" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}
      </section>

      {/* read-only hint */}
      <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <Eye className="size-3.5 shrink-0" />
        این نما تنها برای مشاهده است — ثبت جلسات و حضوروغیاب توسط معلم کلاس انجام می‌شود.
      </p>
    </div>
  );
}
