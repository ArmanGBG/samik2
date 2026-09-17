"use client";

import { useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  CalendarClock,
  Check,
  CheckCircle2,
  Clock,
  Loader2,
  LogOut,
  School,
  User,
  X,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toJalaliLong, toPersianDigitsSafe } from "@/lib/jalali";
import { useToast } from "@/hooks/use-toast";
import { api, StudentClassDetail as StudentClassDetailType } from "../api";
import { AttendanceBadge, StatCard } from "../shared/stat-card";

interface StudentClassDetailProps {
  classId: string;
  onBack: () => void;
  /** called after the student successfully left the class */
  onLeft: () => void;
}

/** کارنامه کلاس — attendance + assignment history of my sessions (newest first). */
export function StudentClassDetail({ classId, onBack, onLeft }: StudentClassDetailProps) {
  const { toast } = useToast();
  const [detail, setDetail] = useState<StudentClassDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      setDetail(null);
      const res = await api<{ class: StudentClassDetailType }>(
        `/api/student/classes/${encodeURIComponent(classId)}`
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
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    );
  }

  /** leave the class — confirmed via AlertDialog */
  const confirmLeave = async () => {
    if (leaving) return;
    setLeaving(true);
    const res = await api<{ message: string }>(
      `/api/student/classes/${encodeURIComponent(classId)}/leave`,
      { method: "POST" }
    );
    setLeaving(false);
    if (res.ok) {
      setLeaveOpen(false);
      toast({ title: res.data?.message ?? "از کلاس خارج شدید" });
      onLeft();
    } else {
      toast({ title: res.error ?? "خطا در خروج از کلاس", variant: "destructive" });
    }
  };

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

  const present = detail.sessions.filter((s) => s.attendanceStatus === "PRESENT").length;
  const absent = detail.sessions.filter((s) => s.attendanceStatus === "ABSENT").length;
  const late = detail.sessions.filter((s) => s.attendanceStatus === "LATE").length;

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
                {detail.teacher && (
                  <span className="flex items-center gap-1.5">
                    <User className="size-3.5 shrink-0" />
                    {detail.teacher.name}
                    {detail.teacher.subject ? ` · ${detail.teacher.subject}` : ""}
                  </span>
                )}
                {detail.institute && (
                  <span className="flex items-center gap-1.5">
                    <School className="size-3.5 shrink-0" />
                    {detail.institute}
                  </span>
                )}
                {detail.schedule && (
                  <span className="flex items-center gap-1.5">
                    <CalendarClock className="size-3.5 shrink-0" />
                    {detail.schedule}
                  </span>
                )}
              </div>
            </div>
            <Badge
              variant="secondary"
              className="bg-accent border-primary/20 text-primary font-bold shrink-0"
            >
              عضو از جلسه {toPersianDigitsSafe(detail.joinedAtSessionNum)}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* summary stats */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <StatCard
          title="حضور کل"
          value={present}
          icon={<CheckCircle2 className="size-5" />}
          tone="success"
        />
        <StatCard title="غیب" value={absent} icon={<XCircle className="size-5" />} tone="danger" />
        <StatCard title="تأخیر" value={late} icon={<Clock className="size-5" />} tone="warning" />
      </div>

      {/* sessions list */}
      <section className="space-y-3" aria-label="جلسات کلاس">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-extrabold">جلسات</h2>
          <span className="text-xs text-muted-foreground">
            {toPersianDigitsSafe(detail.sessions.length)} جلسه — جدیدترین اول
          </span>
        </div>

        {detail.sessions.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-8 sm:p-10 text-center space-y-3">
              <div className="mx-auto size-12 rounded-2xl bg-accent border border-primary/15 grid place-items-center">
                <Calendar className="size-6 text-primary" />
              </div>
              <div className="font-bold">هنوز جلسه‌ای برای این کلاس ثبت نشده است</div>
              <p className="text-sm text-muted-foreground">
                پس از برگزاری جلسات، تاریخچه حضور و تکالیف شما اینجا نمایش داده می‌شود.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border/80 overflow-hidden">
            <CardContent className="p-0">
              <ul className="divide-y divide-border/80">
                {detail.sessions.map((s) => (
                  <li key={s.id} className="flex items-center gap-3 p-4">
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
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <AttendanceBadge status={s.attendanceStatus} />
                      {s.assignmentDone !== null && (
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
                            s.assignmentDone
                              ? "bg-forest/12 text-forest-deep border-forest/25"
                              : "bg-red-500/10 text-red-600 border-red-500/25"
                          )}
                        >
                          {s.assignmentDone ? (
                            <Check className="size-3" strokeWidth={2.5} />
                          ) : (
                            <X className="size-3" strokeWidth={2.5} />
                          )}
                          {s.assignmentDone ? "تکلیف انجام شد" : "تکلیف انجام نشد"}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </section>

      {/* leave class */}
      <section aria-label="خروج از کلاس">
        <Card className="border-destructive/25 bg-card">
          <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
              <div className="size-10 rounded-xl bg-red-500/10 text-red-600 grid place-items-center shrink-0">
                <LogOut className="size-5" />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-sm">قصد خروج از این کلاس را دارید؟</div>
                <p className="text-xs text-muted-foreground leading-6 mt-1">
                  تاریخچه حضوروغیاب شما حفظ می‌شود، اما برای بازگشت باید دوباره درخواست عضویت بدهید.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => setLeaveOpen(true)}
              disabled={leaving}
              className="h-11 gap-2 cursor-pointer shrink-0 text-destructive border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="size-4" />
              خروج از کلاس
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* leave confirmation */}
      <AlertDialog open={leaveOpen} onOpenChange={setLeaveOpen}>
        <AlertDialogContent className="sm:max-w-md rounded-2xl" dir="rtl">
          <AlertDialogHeader className="text-right sm:text-right">
            <AlertDialogTitle className="flex items-center gap-2">
              <span className="size-9 rounded-xl bg-red-500/10 text-red-600 grid place-items-center shrink-0">
                <LogOut className="size-4.5" />
              </span>
              خروج از کلاس
            </AlertDialogTitle>
            <AlertDialogDescription className="text-right leading-6">
              پس از خروج، تاریخچه حضوروغیاب شما در این کلاس حفظ می‌شود اما کلاس از لیست شما حذف
              می‌شود و برای بازگشت باید دوباره درخواست عضویت بدهید.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="h-11 cursor-pointer" disabled={leaving}>
              انصراف
            </AlertDialogCancel>
            <AlertDialogAction
              className="h-11 cursor-pointer bg-destructive text-white hover:bg-destructive/90 flex items-center gap-1.5"
              disabled={leaving}
              onClick={(e) => {
                e.preventDefault();
                void confirmLeave();
              }}
            >
              {leaving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <LogOut className="size-4" />
              )}
              {leaving ? "در حال خروج…" : "خروج از کلاس"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
