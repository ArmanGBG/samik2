"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Bell,
  BookOpen,
  Calendar,
  CalendarClock,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ClipboardX,
  Copy,
  IdCard,
  Info,
  Loader2,
  QrCode,
  RefreshCw,
  School,
  UserCheck,
  X,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toJalaliPersian, toPersianDigitsSafe } from "@/lib/jalali";
import { useToast } from "@/hooks/use-toast";
import { api, SessionUser, StudentOverview } from "../api";
import { PanelShell } from "../shared/panel-shell";
import { StatCard } from "../shared/stat-card";
import { JoinClassDialog } from "./join-class-dialog";
import { StudentClassDetail } from "./student-class-detail";

interface StudentPanelProps {
  user: SessionUser;
  onLogout: () => void;
  onUserUpdate: () => void;
}

export function StudentPanel({ user, onLogout }: StudentPanelProps) {
  const { toast } = useToast();
  const [overview, setOverview] = useState<StudentOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [activeClassId, setActiveClassId] = useState<string | null>(null);
  const [detailNonce, setDetailNonce] = useState(0);
  const [busyInviteId, setBusyInviteId] = useState<string | null>(null);
  const [busyInviteAction, setBusyInviteAction] = useState<"ACCEPT" | "REJECT" | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchOverview = useCallback(
    async (silent: boolean) => {
      const res = await api<StudentOverview>("/api/student/overview");
      if (res.ok && res.data) {
        setOverview(res.data);
      } else if (!silent) {
        toast({ title: res.error ?? "خطا در بارگذاری اطلاعات", variant: "destructive" });
      }
      setLoading(false);
      setRefreshing(false);
    },
    [toast]
  );

  // initial load — inlined async IIFE, so no setState runs synchronously in the effect body
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await api<StudentOverview>("/api/student/overview");
      if (cancelled) return;
      if (res.ok && res.data) {
        setOverview(res.data);
      } else {
        toast({ title: res.error ?? "خطا در بارگذاری اطلاعات", variant: "destructive" });
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [toast]);

  /** silent refresh with the header spinner — event-handler context only */
  const refreshOverview = useCallback(() => {
    setRefreshing(true);
    void fetchOverview(true);
  }, [fetchOverview]);

  const retryLoad = () => {
    setLoading(true);
    void fetchOverview(false);
  };

  const stats = useMemo(() => {
    const classes = overview?.classes ?? [];
    return {
      classCount: classes.length,
      sessionsAttended: classes.reduce((sum, c) => sum + c.totalSessions, 0),
      present: classes.reduce((sum, c) => sum + c.present, 0),
      assignmentsNotDone: classes.reduce((sum, c) => sum + c.assignmentsNotDone, 0),
    };
  }, [overview]);

  /** Method 1 — accept / reject a pending teacher invite */
  const respondInvite = async (requestId: string, action: "ACCEPT" | "REJECT") => {
    if (busyInviteId) return;
    setBusyInviteId(requestId);
    setBusyInviteAction(action);
    const res = await api<{ message: string }>("/api/student/requests", {
      method: "POST",
      body: { requestId, action },
    });
    setBusyInviteId(null);
    setBusyInviteAction(null);
    if (res.ok) {
      toast({
        title: res.data?.message ?? (action === "ACCEPT" ? "به کلاس پیوستید" : "دعوت رد شد"),
      });
      refreshOverview();
    } else {
      toast({ title: res.error, variant: "destructive" });
    }
  };

  /** Method 4 — copy the STU code so it can be handed to a teacher */
  const copyStudentCode = async () => {
    const code = overview?.studentCode;
    if (!code) return;
    let success = true;
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      // fallback for older browsers / non-secure contexts
      try {
        const ta = document.createElement("textarea");
        ta.value = code;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        success = document.execCommand("copy");
        document.body.removeChild(ta);
      } catch {
        success = false;
      }
    }
    if (!success) {
      toast({ title: "کپی ممکن نشد — شناسه را یادداشت کنید", variant: "destructive" });
      return;
    }
    setCopied(true);
    toast({ title: "شناسه دانش‌آموز کپی شد" });
    window.setTimeout(() => setCopied(false), 2000);
  };

  const handleRefresh = () => {
    if (activeClassId) setDetailNonce((n) => n + 1);
    else refreshOverview();
  };

  const openClass = (classId: string) => {
    setActiveClassId(classId);
    setDetailNonce((n) => n + 1);
    window.scrollTo({ top: 0 });
  };

  const backToDashboard = () => {
    setActiveClassId(null);
    refreshOverview();
    window.scrollTo({ top: 0 });
  };

  const firstName = user.name?.trim() || null;

  return (
    <PanelShell
      user={user}
      activeTitle="پنل دانش‌آموز"
      onLogout={onLogout}
      headerExtra={
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRefresh}
          aria-label="به‌روزرسانی داده‌ها"
          disabled={loading || refreshing}
          className="size-10 cursor-pointer hover:bg-accent/60"
        >
          <RefreshCw className={cn("size-4", refreshing && "animate-spin")} />
        </Button>
      }
    >
      {activeClassId ? (
        <StudentClassDetail
          key={`${activeClassId}-${detailNonce}`}
          classId={activeClassId}
          onBack={backToDashboard}
          onLeft={backToDashboard}
        />
      ) : loading ? (
        <div className="space-y-6">
          <Skeleton className="h-40 rounded-2xl" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-44 rounded-xl" />
            <Skeleton className="h-44 rounded-xl" />
            <Skeleton className="h-44 rounded-xl" />
          </div>
        </div>
      ) : !overview ? (
        <Card className="border-destructive/30">
          <CardContent className="p-8 sm:p-12 text-center space-y-4">
            <div className="mx-auto size-12 rounded-full bg-red-500/10 text-red-600 grid place-items-center">
              <XCircle className="size-6" />
            </div>
            <div className="font-bold">خطا در بارگذاری اطلاعات</div>
            <p className="text-sm text-muted-foreground">
              ارتباط با سرور برقرار نشد. دوباره تلاش کنید.
            </p>
            <Button
              variant="outline"
              onClick={retryLoad}
              className="h-11 gap-2 cursor-pointer"
            >
              <RefreshCw className="size-4" />
              تلاش مجدد
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6 sm:space-y-8">
          {/* greeting */}
          <div>
            <h1 className="text-xl sm:text-2xl font-black">
              {firstName ? `سلام ${firstName} عزیز` : "سلام"}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              کلاس‌ها، حضور و تکالیف‌ات را در یک نگاه ببین
            </p>
          </div>

          {/* Method 4 — student code, prominent */}
          {overview.studentCode && (
            <Card className="border-primary/30 bg-gradient-to-b from-accent/70 to-card shadow-sm">
              <CardContent className="p-5 sm:p-6">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="size-12 sm:size-14 rounded-2xl bg-primary text-primary-foreground grid place-items-center shrink-0">
                      <IdCard className="size-6 sm:size-7" strokeWidth={2.2} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-muted-foreground mb-1.5">
                        شناسه دانش‌آموز شما
                      </div>
                      <div
                        dir="ltr"
                        className="font-mono text-2xl font-black tracking-[0.12em] leading-none select-all"
                      >
                        {overview.studentCode}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => void copyStudentCode()}
                    className="h-11 gap-2 cursor-pointer w-full sm:w-auto shrink-0"
                    aria-label="کپی شناسه دانش‌آموز"
                  >
                    {copied ? (
                      <Check className="size-4 text-forest-deep" />
                    ) : (
                      <Copy className="size-4" />
                    )}
                    {copied ? "کپی شد" : "کپی شناسه"}
                  </Button>
                </div>
                <div className="mt-5 flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3.5 py-3 text-xs leading-6 text-muted-foreground">
                  <Info className="size-4 text-primary shrink-0 mt-0.5" />
                  <span>این شناسه را به معلم خود بدهید تا شما را به کلاس اضافه کند.</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatCard
              title="تعداد کلاس‌ها"
              value={stats.classCount}
              icon={<School className="size-5" />}
            />
            <StatCard
              title="جلسات شرکت‌کرده"
              value={stats.sessionsAttended}
              icon={<CalendarDays className="size-5" />}
              tone="primary"
            />
            <StatCard
              title="حضور"
              value={stats.present}
              icon={<CheckCircle2 className="size-5" />}
              tone="success"
            />
            <StatCard
              title="تکالیف انجام‌نشده"
              value={stats.assignmentsNotDone}
              icon={<ClipboardX className="size-5" />}
              tone={stats.assignmentsNotDone > 0 ? "danger" : "default"}
            />
          </div>

          {/* Method 1 — pending teacher invites */}
          {overview.invites.length > 0 && (
            <section className="space-y-3 sm:space-y-4" aria-label="دعوت‌های در انتظار">
              <div className="flex items-center gap-2.5">
                <span className="relative grid place-items-center">
                  <Bell className="size-5 text-primary" />
                  <span className="absolute -top-1 -left-1 size-2.5 rounded-full bg-red-500 border-2 border-background" />
                </span>
                <h2 className="text-base sm:text-lg font-extrabold">دعوت‌های در انتظار پاسخ</h2>
                <Badge
                  variant="secondary"
                  className="bg-accent border-primary/20 text-primary font-bold"
                >
                  {toPersianDigitsSafe(overview.invites.length)}
                </Badge>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {overview.invites.map((inv) => {
                  const busy = busyInviteId === inv.id;
                  return (
                    <Card
                      key={inv.id}
                      className="border-primary/30 bg-gradient-to-b from-accent/40 to-card"
                    >
                      <CardContent className="p-4 sm:p-5 space-y-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="size-10 rounded-xl bg-accent text-primary border border-primary/15 grid place-items-center shrink-0">
                              <BookOpen className="size-5" />
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold truncate">{inv.class.name}</div>
                              <div className="text-xs text-muted-foreground truncate">
                                مدرس: {inv.class.teacher}
                              </div>
                              {inv.class.institute && (
                                <div className="text-xs text-muted-foreground truncate flex items-center gap-1">
                                  <School className="size-3.5 shrink-0" />
                                  {inv.class.institute}
                                </div>
                              )}
                            </div>
                          </div>
                          <span className="text-[11px] text-muted-foreground whitespace-nowrap flex items-center gap-1 shrink-0">
                            <Calendar className="size-3.5" />
                            {toJalaliPersian(inv.createdAt)}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => void respondInvite(inv.id, "ACCEPT")}
                            disabled={busy}
                            className="flex-1 h-11 cursor-pointer gap-1.5"
                          >
                            {busy && busyInviteAction === "ACCEPT" ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <UserCheck className="size-4" />
                            )}
                            پذیرش
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => void respondInvite(inv.id, "REJECT")}
                            disabled={busy}
                            className="flex-1 h-11 cursor-pointer gap-1.5 text-destructive border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
                          >
                            {busy && busyInviteAction === "REJECT" ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <X className="size-4" />
                            )}
                            رد
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>
          )}

          {/* my classes */}
          <section className="space-y-4" aria-label="کلاس‌های من">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-base sm:text-lg font-extrabold flex items-center gap-2">
                  <BookOpen className="size-5 text-primary" />
                  کلاس‌های من
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  برای دیدن تاریخچه حضور و تکالیف، روی کلاس بزنید
                </p>
              </div>
              <Button
                size="lg"
                onClick={() => setJoinOpen(true)}
                className="h-12 cursor-pointer gap-2 text-base"
              >
                <QrCode className="size-5" />
                اتصال به کلاس
              </Button>
            </div>

            {overview.classes.length === 0 ? (
              <Card className="border-dashed border-border bg-card/50">
                <CardContent className="p-8 sm:p-12 text-center space-y-4">
                  <div className="mx-auto size-14 rounded-2xl bg-accent border border-primary/15 grid place-items-center">
                    <BookOpen className="size-7 text-primary" />
                  </div>
                  <div className="font-bold text-lg">هنوز در هیچ کلاسی عضو نیستید</div>
                  <p className="mx-auto max-w-md text-sm text-muted-foreground leading-7">
                    کد کلاس{" "}
                    <span dir="ltr" className="font-mono">
                      CLS-XXXXXX
                    </span>{" "}
                    را از معلم خود بگیرید، QR کد کلاس را اسکن کنید یا شناسه دانش‌آموز‌تان را به
                    او بدهید تا شما را دعوت کند.
                  </p>
                  <Button
                    size="lg"
                    onClick={() => setJoinOpen(true)}
                    className="h-12 cursor-pointer gap-2"
                  >
                    <QrCode className="size-5" />
                    اتصال به کلاس
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {overview.classes.map((cls) => (
                  <Card
                    key={cls.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`کلاس ${cls.name}`}
                    onClick={() => openClass(cls.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        openClass(cls.id);
                      }
                    }}
                    className="cursor-pointer border-border/80 hover:border-primary/30 hover:shadow-md transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary/40"
                  >
                    <CardContent className="p-4 sm:p-5 space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="size-11 rounded-xl bg-accent text-primary border border-primary/15 grid place-items-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-colors">
                          <BookOpen className="size-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold truncate">{cls.name}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            مدرس: {cls.teacher}
                          </div>
                          {cls.institute && (
                            <div className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                              <School className="size-3.5 shrink-0" />
                              {cls.institute}
                            </div>
                          )}
                        </div>
                        <ChevronLeft className="size-4 text-muted-foreground group-hover:text-primary group-hover:-translate-x-0.5 transition-all shrink-0 mt-1" />
                      </div>
                      {cls.schedule && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <CalendarClock className="size-3.5 text-primary/70 shrink-0" />
                          <span className="truncate">{cls.schedule}</span>
                        </div>
                      )}
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        <span className="inline-flex items-center rounded-full border border-forest/25 bg-forest/12 text-forest-deep px-2.5 py-0.5 text-[11px] font-semibold">
                          حضور {toPersianDigitsSafe(cls.present)}
                        </span>
                        <span className="inline-flex items-center rounded-full border border-red-500/25 bg-red-500/10 text-red-600 px-2.5 py-0.5 text-[11px] font-semibold">
                          غایب {toPersianDigitsSafe(cls.absent)}
                        </span>
                        <span className="inline-flex items-center rounded-full border border-amber-500/25 bg-amber-500/12 text-amber-700 px-2.5 py-0.5 text-[11px] font-semibold">
                          تأخیر {toPersianDigitsSafe(cls.late)}
                        </span>
                        <span className="inline-flex items-center rounded-full border bg-muted text-muted-foreground px-2.5 py-0.5 text-[11px]">
                          از جلسه {toPersianDigitsSafe(cls.joinedAtSessionNum)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* Methods 2 + 3 — join by CLS code or QR scan */}
      <JoinClassDialog
        open={joinOpen}
        onOpenChange={setJoinOpen}
        onJoined={refreshOverview}
      />
    </PanelShell>
  );
}
