"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpen,
  CalendarCheck,
  CalendarDays,
  GraduationCap,
  Inbox,
  Plus,
  School,
  Users,
} from "lucide-react";
import { toPersianDigitsSafe } from "@/lib/jalali";
import { api, SessionUser, TeacherClassSummary } from "../api";
import { PanelShell } from "../shared/panel-shell";
import { StatCard } from "../shared/stat-card";
import { cardActivate, CodeChip, displayName, EmptyState } from "./bits";
import { CreateClassDialog } from "./create-class-dialog";
import { ClassDetail } from "./class-detail";
import { SessionAttendance } from "./session-attendance";

interface TeacherPanelProps {
  user: SessionUser;
  onLogout: () => void;
  onUserUpdate: () => void;
}

type View =
  | { kind: "dashboard" }
  | { kind: "class"; classId: string }
  | { kind: "session"; sessionId: string; classId: string };

export function TeacherPanel({ user, onLogout }: TeacherPanelProps) {
  const [view, setView] = useState<View>({ kind: "dashboard" });

  return (
    <PanelShell user={user} activeTitle="پنل معلم" onLogout={onLogout}>
      {view.kind === "dashboard" ? (
        <TeacherDashboard user={user} onOpenClass={(classId) => setView({ kind: "class", classId })} />
      ) : null}

      {view.kind === "class" ? (
        <ClassDetail
          classId={view.classId}
          onBack={() => setView({ kind: "dashboard" })}
          onOpenSession={(sessionId) => setView({ kind: "session", sessionId, classId: view.classId })}
        />
      ) : null}

      {view.kind === "session" ? (
        <SessionAttendance sessionId={view.sessionId} onBack={() => setView({ kind: "class", classId: view.classId })} />
      ) : null}
    </PanelShell>
  );
}

// ---------------- Dashboard ----------------

function TeacherDashboard({ user, onOpenClass }: { user: SessionUser; onOpenClass: (classId: string) => void }) {
  const [classes, setClasses] = useState<TeacherClassSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createSeq, setCreateSeq] = useState(0);

  const load = useCallback(() => {
    api<{ classes: TeacherClassSummary[] }>("/api/teacher/classes").then((res) => {
      if (!res.ok) {
        setClasses(null);
        setError(res.error ?? "خطا در بارگذاری کلاس‌ها");
        return;
      }
      setError(null);
      setClasses(res.data?.classes ?? []);
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setCreateSeq((s) => s + 1);
    setCreateOpen(true);
  };

  const totalStudents = (classes ?? []).reduce((sum, c) => sum + c.studentCount, 0);
  const totalSessions = (classes ?? []).reduce((sum, c) => sum + c.sessionCount, 0);
  const totalPending = (classes ?? []).reduce((sum, c) => sum + c.pendingRequests, 0);
  const loading = classes === null;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* ---------- Greeting ---------- */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="grid size-12 shrink-0 place-items-center rounded-2xl border border-primary/15 bg-primary/10 text-primary">
          <GraduationCap className="size-6" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-black sm:text-2xl">سلام، {displayName(user.name, user.lastName, "معلم عزیز")}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            کلاس‌ها، جلسات و حضوروغیاب‌تان را از همین‌جا مدیریت کنید
          </p>
        </div>
        {user.teacherCode ? (
          <CodeChip code={user.teacherCode} label="کد معلم" className="mr-auto" />
        ) : null}
      </div>

      {/* ---------- Stats ---------- */}
      {error && !loading ? (
        <EmptyState
          icon={<Inbox className="size-7 text-primary" />}
          title={error}
          description="در بارگذاری اطلاعات خطایی رخ داد؛ دوباره تلاش کنید."
          action={
            <Button variant="outline" className="h-11 cursor-pointer" onClick={load}>
              تلاش مجدد
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {loading ? (
            <>
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="border-border/80">
                  <CardContent className="flex items-center gap-4 p-4 sm:p-5">
                    <Skeleton className="size-11 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-6 w-12" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          ) : (
            <>
              <StatCard title="تعداد کلاس‌ها" value={classes?.length ?? 0} icon={<BookOpen className="size-5" />} tone="primary" />
              <StatCard title="مجموع دانش‌آموزان" value={totalStudents} icon={<Users className="size-5" />} tone="success" />
              <StatCard title="جلسات برگزارشده" value={totalSessions} icon={<CalendarCheck className="size-5" />} />
              <StatCard
                title="درخواست‌های در انتظار"
                value={totalPending}
                icon={<Inbox className="size-5" />}
                tone={totalPending > 0 ? "warning" : "default"}
                hint={totalPending > 0 ? "نیاز به تأیید یا رد" : undefined}
              />
            </>
          )}
        </div>
      )}

      {/* ---------- Classes ---------- */}
      <section aria-label="کلاس‌های من" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold">کلاس‌های من</h2>
            {!loading && !error ? (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {toPersianDigitsSafe(classes?.length ?? 0)} کلاس · برای جزئیات روی کلاس بزنید
              </p>
            ) : null}
          </div>
          <Button
            type="button"
            className="h-11 cursor-pointer gap-1.5"
            onClick={openCreate}
          >
            <Plus className="size-4" />
            <span className="hidden sm:inline">افزودن کلاس</span>
            <span className="sm:hidden">کلاس جدید</span>
          </Button>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border-border/80">
                <CardContent className="space-y-3 p-4 sm:p-5">
                  <div className="flex items-center gap-2.5">
                    <Skeleton className="size-10 rounded-xl" />
                    <Skeleton className="h-5 w-32" />
                  </div>
                  <Skeleton className="h-7 w-36 rounded-lg" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !error && classes && classes.length === 0 ? (
          <EmptyState
            icon={<School className="size-7 text-primary" />}
            title="هنوز کلاسی نساخته‌اید"
            description="اولین کلاس‌تان را بسازید تا کد CLS و QR کد آن آماده شود و بتوانید دانش‌آموزان، جلسات و حضوروغیاب را مدیریت کنید."
            action={
              <Button className="h-11 cursor-pointer gap-1.5" onClick={openCreate}>
                <Plus className="size-4" />
                ساخت اولین کلاس
              </Button>
            }
          />
        ) : classes ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {classes.map((c) => (
              <Card
                key={c.id}
                role="button"
                tabIndex={0}
                onClick={() => onOpenClass(c.id)}
                onKeyDown={cardActivate(() => onOpenClass(c.id))}
                aria-label={`جزئیات کلاس ${c.name}`}
                className="group cursor-pointer border-border/80 transition-all hover:border-primary/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
              >
                <CardContent className="space-y-3 p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                        <BookOpen className="size-5" />
                      </div>
                      <h3 className="truncate font-bold">{c.name}</h3>
                    </div>
                    {c.pendingRequests > 0 ? (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-400">
                        <Inbox className="size-3" />
                        {toPersianDigitsSafe(c.pendingRequests)} درخواست
                      </span>
                    ) : null}
                  </div>

                  <CodeChip code={c.id} label="کد کلاس" />

                  <Separator className="bg-border/70" />

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                    <span className="inline-flex min-w-0 items-center gap-1.5">
                      <CalendarDays className="size-3.5 shrink-0" />
                      <span className="truncate">{c.schedule || "برنامه ثبت نشده"}</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="size-3.5" />
                      {toPersianDigitsSafe(c.studentCount)} دانش‌آموز
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarCheck className="size-3.5" />
                      {toPersianDigitsSafe(c.sessionCount)} جلسه
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : null}
      </section>

      <CreateClassDialog key={`create-${createSeq}`} open={createOpen} onOpenChange={setCreateOpen} onCreated={load} />
    </div>
  );
}
