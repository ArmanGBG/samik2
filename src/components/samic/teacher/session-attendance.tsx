"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  AlertTriangle,
  BookOpen,
  CalendarDays,
  Check,
  CheckCheck,
  ClipboardCheck,
  Loader2,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toJalaliLong, toPersianDigitsSafe } from "@/lib/jalali";
import { useToast } from "@/hooks/use-toast";
import { api, SessionDetail } from "../api";
import { BackButton, displayName, EmptyState, GhostBadge, initialsOf } from "./bits";

type AttStatus = "PRESENT" | "ABSENT" | "LATE";

interface AttRecord {
  status: AttStatus | null;
  assignmentDone: boolean;
  saved: boolean;
}

interface SessionAttendanceProps {
  sessionId: string;
  onBack: () => void;
}

const STATUS_OPTIONS: { value: AttStatus; label: string; dot: string; selected: string; idle: string }[] = [
  {
    value: "PRESENT",
    label: "حاضر",
    dot: "bg-forest",
    selected:
      "border-forest/40 bg-forest/15 text-forest-deep hover:bg-forest/20 hover:text-forest-deep dark:text-forest-soft dark:hover:text-forest-soft",
    idle: "border-border/70 bg-card text-muted-foreground hover:border-forest/40 hover:text-forest-deep dark:hover:text-forest-soft",
  },
  {
    value: "ABSENT",
    label: "غایب",
    dot: "bg-red-500",
    selected:
      "border-red-500/40 bg-red-500/15 text-red-700 hover:bg-red-500/20 hover:text-red-700 dark:text-red-400 dark:hover:text-red-400",
    idle: "border-border/70 bg-card text-muted-foreground hover:border-red-500/40 hover:text-red-600 dark:hover:text-red-400",
  },
  {
    value: "LATE",
    label: "تأخیر",
    dot: "bg-amber-500",
    selected:
      "border-amber-500/40 bg-amber-500/15 text-amber-700 hover:bg-amber-500/20 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-400",
    idle: "border-border/70 bg-card text-muted-foreground hover:border-amber-500/40 hover:text-amber-600 dark:hover:text-amber-400",
  },
];

/** Tinted pill for the live summary counters (حاضر / غایب / تأخیر) */
function SummaryChip({ label, count, className }: { label: string; count: number; className: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1 text-xs font-bold tabular-nums",
        className
      )}
    >
      {label}
      <span className="opacity-90">{toPersianDigitsSafe(count)}</span>
    </span>
  );
}

/** جلسه — ثبت حضوروغیاب و تکالیف (Phase 4) */
export function SessionAttendance({ sessionId, onBack }: SessionAttendanceProps) {
  const { toast } = useToast();
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [records, setRecords] = useState<Record<string, AttRecord>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    api<{ session: SessionDetail }>(`/api/teacher/sessions/${sessionId}`).then((res) => {
      if (!res.ok || !res.data?.session) {
        setSession(null);
        setError(res.error ?? "جلسه یافت نشد");
        setLoading(false);
        return;
      }
      const s = res.data.session;
      const init: Record<string, AttRecord> = {};
      for (const stu of s.students) {
        init[stu.id] = {
          status: stu.attendanceStatus,
          assignmentDone: stu.assignmentDone,
          saved: stu.saved,
        };
      }
      setSession(s);
      setRecords(init);
      setError(null);
      setLoading(false);
    });
  }, [sessionId]);

  useEffect(() => {
    load();
  }, [load]);

  const setStatus = (studentId: string, status: AttStatus | null) => {
    setRecords((prev) => {
      const cur = prev[studentId];
      if (!cur) return prev;
      return { ...prev, [studentId]: { ...cur, status, saved: false } };
    });
  };

  const setAssignment = (studentId: string, done: boolean) => {
    setRecords((prev) => {
      const cur = prev[studentId];
      if (!cur) return prev;
      return { ...prev, [studentId]: { ...cur, assignmentDone: done, saved: false } };
    });
  };

  const markAllPresent = () => {
    setRecords((prev) => {
      const next: Record<string, AttRecord> = {};
      for (const [id, r] of Object.entries(prev)) next[id] = { ...r, status: "PRESENT", saved: false };
      return next;
    });
  };

  const counts = { present: 0, absent: 0, late: 0, unmarked: 0 };
  for (const r of Object.values(records)) {
    if (r.status === "PRESENT") counts.present++;
    else if (r.status === "ABSENT") counts.absent++;
    else if (r.status === "LATE") counts.late++;
    else counts.unmarked++;
  }

  const save = async () => {
    if (!session || session.students.length === 0) return;
    setSaving(true);
    const res = await api<{ message: string }>(`/api/teacher/sessions/${sessionId}/attendance`, {
      method: "POST",
      body: {
        records: session.students.map((s) => ({
          studentId: s.id,
          status: records[s.id]?.status ?? null,
          assignmentDone: records[s.id]?.assignmentDone ?? true,
        })),
      },
    });
    setSaving(false);
    if (!res.ok) {
      toast({ title: res.error ?? "خطا در ذخیره", variant: "destructive" });
      return;
    }
    toast({ title: "ذخیره شد", description: "حضوروغیاب و وضعیت تکالیف این جلسه ذخیره شد" });
    setRecords((prev) => {
      const next: Record<string, AttRecord> = {};
      for (const [id, r] of Object.entries(prev)) next[id] = { ...r, saved: true };
      return next;
    });
  };

  // ---------- loading ----------
  if (loading) {
    return (
      <div className="space-y-6">
        <BackButton label="بازگشت به کلاس" onClick={onBack} />
        <Card className="border-border/80">
          <CardContent className="flex items-center gap-4 p-4 sm:p-6">
            <Skeleton className="size-12 rounded-2xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-56" />
            </div>
          </CardContent>
        </Card>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // ---------- error ----------
  if (error || !session) {
    return (
      <div className="space-y-6">
        <BackButton label="بازگشت به کلاس" onClick={onBack} />
        <EmptyState
          icon={<ClipboardCheck className="size-7 text-primary" />}
          title={error ?? "جلسه یافت نشد"}
          description="این جلسه در دسترس شما نیست یا حذف شده است."
          action={
            <Button variant="outline" className="h-11 cursor-pointer" onClick={() => { setLoading(true); load(); }}>
              تلاش مجدد
            </Button>
          }
        />
      </div>
    );
  }

  const students = session.students;

  return (
    <div className="space-y-5">
      <BackButton label={`بازگشت به کلاس ${session.class.name}`} onClick={onBack} />

      {/* ---------- Header ---------- */}
      <Card className="border-border/80">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
              <ClipboardCheck className="size-6" />
            </div>
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-black leading-relaxed sm:text-2xl">{session.name}</h1>
                <Badge variant="secondary" className="text-[11px]">
                  جلسه {toPersianDigitsSafe(session.sessionNum)}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-foreground/60">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="size-3.5" />
                  {toJalaliLong(session.date)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <BookOpen className="size-3.5" />
                  {session.class.name}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ---------- Bulk actions + live counters ---------- */}
      {students.length > 0 ? (
        <div className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              type="button"
              variant="outline"
              className="h-10 w-full cursor-pointer gap-1.5 sm:w-auto"
              onClick={markAllPresent}
            >
              <CheckCheck className="size-4 text-forest-deep dark:text-forest-soft" />
              همه حاضر
            </Button>
            <div className="flex flex-wrap items-center gap-1.5">
              <SummaryChip
                label="حاضر"
                count={counts.present}
                className="border-forest/25 bg-forest/10 text-forest-deep dark:text-forest-soft"
              />
              <SummaryChip
                label="غایب"
                count={counts.absent}
                className="border-red-500/25 bg-red-500/10 text-red-700 dark:text-red-400"
              />
              <SummaryChip
                label="تأخیر"
                count={counts.late}
                className="border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-400"
              />
              {counts.unmarked > 0 ? (
                <SummaryChip
                  label="بدون وضعیت"
                  count={counts.unmarked}
                  className="border-border bg-muted/70 text-foreground/70"
                />
              ) : null}
            </div>
          </div>

          {counts.unmarked > 0 ? (
            <div className="flex items-start gap-2 rounded-xl border border-amber-500/25 bg-amber-500/10 p-3 text-xs leading-6 text-amber-800 dark:text-amber-300">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <span>
                {toPersianDigitsSafe(counts.unmarked)} دانش‌آموز هنوز وضعیت حضور ندارد؛ می‌توانید
                همین‌طور ذخیره کنید یا وضعیتش را مشخص کنید.
              </span>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* ---------- Students list ---------- */}
      {students.length === 0 ? (
        <EmptyState
          icon={<Users className="size-7 text-primary" />}
          title="هنوز دانش‌آموزی برای این جلسه ثبت نشده است"
          description="فقط دانش‌آموزانی که قبل از این جلسه عضو کلاس شده‌اند در حضوروغیاب نمایش داده می‌شوند."
        />
      ) : (
        <div className="space-y-3">
          {students.map((s) => {
            const rec = records[s.id];
            const name = displayName(s.name, s.lastName);
            return (
              <Card key={s.id} className="border-border/80 transition-colors hover:bg-accent/25">
                <CardContent className="flex flex-col gap-3.5 px-4 py-4 sm:px-5 sm:py-5 lg:flex-row lg:items-center lg:gap-6">
                  {/* Column 1 — identity */}
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div
                      className="grid size-10 shrink-0 place-items-center rounded-full border border-border/60 bg-accent text-sm font-bold text-accent-foreground"
                      aria-hidden="true"
                    >
                      {initialsOf(s.name, s.lastName)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="truncate font-bold">{name}</span>
                        {!s.profileCompleted ? <GhostBadge /> : null}
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] text-foreground/60">
                        {s.studentCode ? (
                          <span dir="ltr" className="font-mono">
                            {s.studentCode}
                          </span>
                        ) : null}
                        <span>عضو از جلسه {toPersianDigitsSafe(s.joinedAtSessionNum)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Column 2 — 3-state attendance toggle (click selected = deselect) */}
                  <div
                    role="group"
                    aria-label={`وضعیت حضور ${name}`}
                    className="inline-flex w-full items-stretch gap-1 rounded-xl border border-border/70 bg-muted/40 p-1 sm:w-auto"
                  >
                    {STATUS_OPTIONS.map((o) => {
                      const active = rec?.status === o.value;
                      return (
                        <button
                          key={o.value}
                          type="button"
                          aria-pressed={active}
                          onClick={() => setStatus(s.id, active ? null : o.value)}
                          className={cn(
                            "inline-flex h-10 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border text-[13px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 sm:min-w-[76px] sm:flex-none sm:px-4",
                            active ? o.selected : o.idle
                          )}
                        >
                          <span
                            aria-hidden="true"
                            className={cn("size-1.5 shrink-0 rounded-full transition-opacity", o.dot, active ? "opacity-100" : "opacity-50")}
                          />
                          {o.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Column 3 — assignment switch (default ON), separated by a subtle divider */}
                  <div className="flex items-center border-t border-border/60 pt-3.5 lg:border-s lg:border-t-0 lg:pt-0 lg:justify-end">
                    <label
                      htmlFor={`assignment-${s.id}`}
                      className="flex cursor-pointer select-none items-center gap-2.5 py-1.5"
                    >
                      <Switch
                        id={`assignment-${s.id}`}
                        checked={rec?.assignmentDone ?? true}
                        onCheckedChange={(v) => setAssignment(s.id, v)}
                        aria-label={`وضعیت تکلیف ${name}`}
                      />
                      <span className="leading-tight">
                        <span className="block text-sm font-semibold">تکلیف</span>
                        {rec?.assignmentDone ?? true ? (
                          <span className="mt-0.5 flex items-center gap-1 text-[11px] font-semibold text-forest-deep dark:text-forest-soft">
                            <Check className="size-3" />
                            انجام شد
                          </span>
                        ) : (
                          <span className="mt-0.5 block text-[11px] text-foreground/60">انجام نشد</span>
                        )}
                      </span>
                    </label>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ---------- Sticky save bar ---------- */}
      {students.length > 0 ? (
        <div className="sticky bottom-0 z-30 -mx-4 mt-6 border-t border-border bg-background/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
          <div className="flex items-center gap-3">
            {counts.unmarked > 0 ? (
              <span className="hidden shrink-0 items-center gap-1.5 rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-700 sm:inline-flex dark:text-amber-400">
                <AlertTriangle className="size-3.5" />
                {toPersianDigitsSafe(counts.unmarked)} بدون وضعیت
              </span>
            ) : (
              <span className="hidden shrink-0 items-center gap-1.5 rounded-full border border-forest/25 bg-forest/10 px-3 py-1 text-xs font-semibold text-forest-deep sm:inline-flex dark:text-forest-soft">
                <Check className="size-3.5" />
                همه مشخص‌اند
              </span>
            )}
            <Button
              type="button"
              className="h-12 flex-1 cursor-pointer gap-2 text-base font-bold"
              onClick={save}
              disabled={saving}
              aria-label="ذخیره حضوروغیاب و تکالیف"
            >
              {saving ? <Loader2 className="size-4 animate-spin" /> : <CheckCheck className="size-5" />}
              {saving ? "در حال ذخیره…" : "ذخیره حضوروغیاب"}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
