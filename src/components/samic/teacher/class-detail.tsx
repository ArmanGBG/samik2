"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  Building2,
  CalendarCheck,
  CalendarDays,
  CalendarPlus,
  Check,
  ChevronLeft,
  Clock3,
  Inbox,
  Loader2,
  MoreHorizontal,
  MoreVertical,
  Pencil,
  Plus,
  QrCode,
  Trash2,
  UserMinus,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toJalaliLong, toJalaliPersian, toPersianDigitsSafe } from "@/lib/jalali";
import { useToast } from "@/hooks/use-toast";
import { api, educationLevelLabel, TeacherClassDetail } from "../api";
import { AttChip, BackButton, cardActivate, CodeChip, displayName, EmptyState, GhostBadge } from "./bits";
import { AddStudentDialog } from "./add-student-dialog";
import { AddSessionDialog } from "./add-session-dialog";
import { ClassQrDialog } from "./class-qr-dialog";
import { EditClassDialog } from "./edit-class-dialog";
import { ClassStatsTab } from "./class-stats-tab";

interface ClassDetailProps {
  classId: string;
  onBack: () => void;
  onOpenSession: (sessionId: string) => void;
  /** called after the class is successfully deleted (parent navigates back) */
  onDeleted: () => void;
}

export function ClassDetail({ classId, onBack, onOpenSession, onDeleted }: ClassDetailProps) {
  const { toast } = useToast();
  const [detail, setDetail] = useState<TeacherClassDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qrOpen, setQrOpen] = useState(false);
  const [addStudentOpen, setAddStudentOpen] = useState(false);
  const [addStudentSeq, setAddStudentSeq] = useState(0);
  const [addSessionOpen, setAddSessionOpen] = useState(false);
  const [addSessionSeq, setAddSessionSeq] = useState(0);
  const [actingRequestId, setActingRequestId] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editSeq, setEditSeq] = useState(0);
  const [deleteClassOpen, setDeleteClassOpen] = useState(false);
  const [deletingClass, setDeletingClass] = useState(false);
  const [removeStudent, setRemoveStudent] = useState<{ id: string; name: string } | null>(null);
  const [removingStudent, setRemovingStudent] = useState(false);
  const [deleteSession, setDeleteSession] = useState<{ id: string; name: string } | null>(null);
  const [deletingSession, setDeletingSession] = useState(false);

  const load = useCallback(() => {
    api<{ class: TeacherClassDetail }>(`/api/teacher/classes/${classId}`).then((res) => {
      if (!res.ok || !res.data?.class) {
        setDetail(null);
        setError(res.error ?? "کلاس یافت نشد");
        setLoading(false);
        return;
      }
      setDetail(res.data.class);
      setError(null);
      setLoading(false);
    });
  }, [classId]);

  useEffect(() => {
    load();
  }, [load]);

  const openAddStudent = () => {
    setAddStudentSeq((s) => s + 1);
    setAddStudentOpen(true);
  };

  const openAddSession = () => {
    setAddSessionSeq((s) => s + 1);
    setAddSessionOpen(true);
  };

  const openEdit = () => {
    setEditSeq((s) => s + 1);
    setEditOpen(true);
  };

  const respondRequest = async (requestId: string, action: "APPROVE" | "REJECT") => {
    setActingRequestId(requestId);
    const res = await api<{ message: string }>(`/api/teacher/classes/${classId}/requests`, {
      method: "POST",
      body: { requestId, action },
    });
    setActingRequestId(null);
    if (!res.ok) {
      toast({ title: res.error ?? "خطا در ثبت پاسخ", variant: "destructive" });
      return;
    }
    toast({ title: res.data?.message ?? (action === "APPROVE" ? "درخواست تأیید شد" : "درخواست رد شد") });
    load();
  };

  // ---------- loading ----------
  if (loading) {
    return (
      <div className="space-y-6">
        <BackButton label="بازگشت به کلاس‌ها" onClick={onBack} />
        <Card className="border-border/80">
          <CardContent className="flex items-center gap-4 p-4 sm:p-6">
            <Skeleton className="size-12 rounded-2xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="hidden size-10 rounded-lg sm:block" />
          </CardContent>
        </Card>
        <Skeleton className="h-11 w-full max-w-md rounded-xl" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // ---------- error ----------
  if (error || !detail) {
    return (
      <div className="space-y-6">
        <BackButton label="بازگشت به کلاس‌ها" onClick={onBack} />
        <EmptyState
          icon={<Inbox className="size-7 text-primary" />}
          title={error ?? "کلاس یافت نشد"}
          description="این کلاس در دسترس شما نیست یا حذف شده است."
          action={
            <Button variant="outline" className="h-11 cursor-pointer" onClick={() => { setLoading(true); load(); }}>
              تلاش مجدد
            </Button>
          }
        />
      </div>
    );
  }

  const studentRequests = detail.requests.filter((r) => r.direction === "STUDENT_REQUEST");
  // MAX(sessionNum)+1 — gaps (after deleting a session) are OK
  const maxSessionNum = detail.sessions.length > 0
    ? Math.max(...detail.sessions.map((s) => s.sessionNum))
    : 0;
  const nextSessionNumber = maxSessionNum + 1;

  // ---------- destructive actions ----------

  const confirmDeleteClass = async () => {
    setDeletingClass(true);
    const res = await api<{ message: string }>(`/api/teacher/classes/${classId}`, {
      method: "DELETE",
    });
    setDeletingClass(false);
    if (!res.ok) {
      toast({ title: res.error ?? "خطا در حذف کلاس", variant: "destructive" });
      return;
    }
    setDeleteClassOpen(false);
    toast({ title: "کلاس حذف شد", description: `کلاس «${detail.name}» و تمام داده‌های آن حذف شد` });
    onDeleted();
  };

  const confirmRemoveStudent = async () => {
    if (!removeStudent) return;
    setRemovingStudent(true);
    const res = await api<{ message: string }>(
      `/api/teacher/classes/${classId}/students/${removeStudent.id}`,
      { method: "DELETE" }
    );
    setRemovingStudent(false);
    if (!res.ok) {
      toast({ title: res.error ?? "خطا در حذف دانش‌آموز", variant: "destructive" });
      return;
    }
    setRemoveStudent(null);
    toast({ title: "دانش‌آموز از کلاس حذف شد" });
    load();
  };

  const confirmDeleteSession = async () => {
    if (!deleteSession) return;
    setDeletingSession(true);
    const res = await api<{ message: string }>(`/api/teacher/sessions/${deleteSession.id}`, {
      method: "DELETE",
    });
    setDeletingSession(false);
    if (!res.ok) {
      toast({ title: res.error ?? "خطا در حذف جلسه", variant: "destructive" });
      return;
    }
    setDeleteSession(null);
    toast({ title: "جلسه حذف شد" });
    load();
  };

  return (
    <div className="space-y-6">
      <BackButton label="بازگشت به کلاس‌ها" onClick={onBack} />

      {/* ---------- Header ---------- */}
      <Card className="border-border/80">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
              <BookOpen className="size-6" />
            </div>

            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-black leading-relaxed sm:text-2xl">{detail.name}</h1>
                {detail.institute ? (
                  <Badge variant="secondary" className="gap-1 border border-border/60">
                    <Building2 className="size-3" />
                    {detail.institute.name}
                  </Badge>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                <CodeChip code={detail.id} label="کد کلاس" />
                {detail.schedule ? (
                  <span className="inline-flex min-w-0 items-center gap-1.5">
                    <CalendarDays className="size-3.5 shrink-0" />
                    <span className="truncate">{detail.schedule}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="size-3.5" />
                    برنامه ثبت نشده
                  </span>
                )}
              </div>
            </div>

            <div className="flex w-full shrink-0 items-center gap-2 sm:w-auto">
              <Button
                type="button"
                variant="outline"
                className="h-11 flex-1 cursor-pointer gap-2 sm:flex-none"
                onClick={() => setQrOpen(true)}
              >
                <QrCode className="size-4" />
                QR کد کلاس
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-11 shrink-0 cursor-pointer"
                    aria-label="عملیات کلاس"
                  >
                    <MoreHorizontal className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="min-w-44"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                >
                  <DropdownMenuItem onSelect={openEdit} className="cursor-pointer gap-2 py-2.5">
                    <Pencil className="size-4" />
                    ویرایش کلاس
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={() => setDeleteClassOpen(true)}
                    className="cursor-pointer gap-2 py-2.5"
                  >
                    <Trash2 className="size-4" />
                    حذف کلاس
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ---------- Tabs ---------- */}
      <Tabs defaultValue="students" className="gap-4">
        <TabsList className="h-11 w-full rounded-xl p-1 sm:w-auto">
          <TabsTrigger value="students" className="gap-1 px-2 text-[11px] sm:gap-1.5 sm:px-4 sm:text-[13px]">
            دانش‌آموزان
            <TabCount n={detail.students.length} />
          </TabsTrigger>
          <TabsTrigger value="sessions" className="gap-1 px-2 text-[11px] sm:gap-1.5 sm:px-4 sm:text-[13px]">
            جلسات
            <TabCount n={detail.sessions.length} />
          </TabsTrigger>
          <TabsTrigger value="requests" className="gap-1 px-2 text-[11px] sm:gap-1.5 sm:px-4 sm:text-[13px]">
            درخواست‌ها
            <TabCount n={studentRequests.length} amber={studentRequests.length > 0} />
          </TabsTrigger>
          <TabsTrigger value="stats" className="gap-1 px-2 text-[11px] sm:gap-1.5 sm:px-4 sm:text-[13px]">
            <BarChart3 className="size-4" />
            گزارش‌ها
          </TabsTrigger>
        </TabsList>

        {/* ---------- Students tab ---------- */}
        <TabsContent value="students" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {toPersianDigitsSafe(detail.students.length)} دانش‌آموز عضو این کلاس هستند
            </p>
            <Button
              type="button"
              className="h-11 cursor-pointer gap-1.5"
              onClick={openAddStudent}
            >
              <UserPlus className="size-4" />
              افزودن دانش‌آموز
            </Button>
          </div>

          {detail.students.length === 0 ? (
            <EmptyState
              icon={<Users className="size-7 text-primary" />}
              title="هنوز دانش‌آموزی اضافه نشده است"
              description="با شماره موبایل، شناسه STU یا از طریق QR کد، دانش‌آموزان را به این کلاس اضافه کنید."
              action={
                <Button className="h-11 cursor-pointer gap-1.5" onClick={openAddStudent}>
                  <UserPlus className="size-4" />
                  افزودن اولین دانش‌آموز
                </Button>
              }
            />
          ) : (
            <div className="max-h-96 overflow-y-auto scroll-samic rounded-xl border border-border/80 bg-card">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-right text-xs text-muted-foreground">دانش‌آموز</TableHead>
                    <TableHead className="text-right text-xs text-muted-foreground">شناسه</TableHead>
                    <TableHead className="hidden text-right text-xs text-muted-foreground sm:table-cell">
                      موبایل
                    </TableHead>
                    <TableHead className="hidden text-right text-xs text-muted-foreground lg:table-cell">
                      پایه تحصیلی
                    </TableHead>
                    <TableHead className="text-right text-xs text-muted-foreground">عضویت</TableHead>
                    <TableHead className="w-12">
                      <span className="sr-only">عملیات دانش‌آموز</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detail.students.map((s) => (
                    <TableRow key={s.enrollmentId} className="hover:bg-accent/40">
                      <TableCell className="py-3">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-semibold">
                          {displayName(s.name, s.lastName)}
                          {!s.profileCompleted ? <GhostBadge /> : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span dir="ltr" className="font-mono text-xs text-muted-foreground">
                          {s.studentCode ?? "—"}
                        </span>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <span dir="ltr" className="text-xs tabular-nums text-muted-foreground">
                          {toPersianDigitsSafe(s.mobile)}
                        </span>
                      </TableCell>
                      <TableCell className="hidden max-w-[180px] truncate text-xs text-muted-foreground lg:table-cell">
                        {educationLevelLabel(s.educationLevel)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        عضو از جلسه {toPersianDigitsSafe(s.joinedAtSessionNum)}
                      </TableCell>
                      <TableCell className="w-12">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-9 cursor-pointer text-muted-foreground hover:text-foreground"
                              aria-label={`عملیات ${displayName(s.name, s.lastName)}`}
                            >
                              <MoreVertical className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="min-w-40"
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => e.stopPropagation()}
                          >
                            <DropdownMenuItem
                              variant="destructive"
                              onSelect={() =>
                                setRemoveStudent({ id: s.id, name: displayName(s.name, s.lastName) })
                              }
                              className="cursor-pointer gap-2 py-2.5"
                            >
                              <Trash2 className="size-4" />
                              حذف از کلاس
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* ---------- Sessions tab ---------- */}
        <TabsContent value="sessions" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {toPersianDigitsSafe(detail.sessions.length)} جلسه برای این کلاس ثبت شده است
            </p>
            <Button
              type="button"
              className="h-11 cursor-pointer gap-1.5"
              onClick={openAddSession}
            >
              <CalendarPlus className="size-4" />
              افزودن جلسه
            </Button>
          </div>

          {detail.sessions.length === 0 ? (
            <EmptyState
              icon={<CalendarCheck className="size-7 text-primary" />}
              title="هنوز جلسه‌ای ثبت نشده است"
              description="برای هر جلسه، حضوروغیاب و وضعیت تکالیف دانش‌آموزان را ثبت کنید."
              action={
                <Button className="h-11 cursor-pointer gap-1.5" onClick={openAddSession}>
                  <Plus className="size-4" />
                  ثبت اولین جلسه
                </Button>
              }
            />
          ) : (
            <div className="space-y-3">
              {detail.sessions.map((s) => {
                const marked =
                  s.attendance.PRESENT + s.attendance.ABSENT + s.attendance.LATE + s.attendance.UNMARKED;
                return (
                  <Card
                    key={s.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => onOpenSession(s.id)}
                    onKeyDown={cardActivate(() => onOpenSession(s.id))}
                    aria-label={`جزئیات ${s.name}`}
                    className="group cursor-pointer border-border/80 transition-all hover:border-primary/30 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                  >
                    <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4">
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <div className="grid size-10 shrink-0 place-items-center rounded-xl border border-border/60 bg-accent text-accent-foreground transition-colors group-hover:border-primary/25 group-hover:bg-primary/10 group-hover:text-primary">
                          <CalendarCheck className="size-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="truncate font-bold">{s.name}</span>
                            <Badge variant="secondary" className="text-[10px]">
                              جلسه {toPersianDigitsSafe(s.sessionNum)}
                            </Badge>
                          </div>
                          <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            <CalendarDays className="size-3 shrink-0" />
                            {toJalaliLong(s.date)}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        {marked > 0 ? (
                          <>
                            <AttChip label="حاضر" count={s.attendance.PRESENT} tone="present" />
                            <AttChip label="غایب" count={s.attendance.ABSENT} tone="absent" />
                            <AttChip label="تأخیر" count={s.attendance.LATE} tone="late" />
                            {s.attendance.UNMARKED > 0 ? (
                              <AttChip label="بدون ثبت" count={s.attendance.UNMARKED} tone="muted" />
                            ) : null}
                          </>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            <Clock3 className="size-3.5" />
                            حضوروغیاب ثبت نشده
                          </span>
                        )}
                      </div>

                      <div className="flex shrink-0 items-center gap-1">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-9 shrink-0 cursor-pointer text-muted-foreground hover:text-foreground"
                              aria-label={`عملیات ${s.name}`}
                              onClick={(e) => e.stopPropagation()}
                              onKeyDown={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="min-w-40"
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => e.stopPropagation()}
                          >
                            <DropdownMenuItem
                              variant="destructive"
                              onSelect={() => setDeleteSession({ id: s.id, name: s.name })}
                              className="cursor-pointer gap-2 py-2.5"
                            >
                              <Trash2 className="size-4" />
                              حذف جلسه
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>

                        <ChevronLeft className="hidden size-4 shrink-0 text-muted-foreground transition-all group-hover:-translate-x-0.5 group-hover:text-primary sm:block" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ---------- Requests tab ---------- */}
        <TabsContent value="requests" className="space-y-4">
          <p className="text-sm text-muted-foreground">
            درخواست‌های عضویتی که دانش‌آموزان با کد کلاس یا QR ارسال کرده‌اند
          </p>

          {studentRequests.length === 0 ? (
            <EmptyState
              icon={<Inbox className="size-7 text-primary" />}
              title="درخواستی در انتظار نیست"
              description="هر زمان دانش‌آموزی با اسکن QR یا کد کلاس درخواست عضویت بفرستد، اینجا نمایش داده می‌شود."
            />
          ) : (
            <div className="space-y-3">
              {studentRequests.map((r) => (
                <Card key={r.id} className="border-border/80">
                  <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="font-bold">{displayName(r.student.name, r.student.lastName)}</span>
                        {!r.student.profileCompleted ? <GhostBadge /> : null}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        {r.student.studentCode ? (
                          <span dir="ltr" className="font-mono">
                            {r.student.studentCode}
                          </span>
                        ) : null}
                        <span dir="ltr" className="tabular-nums">
                          {toPersianDigitsSafe(r.student.mobile)}
                        </span>
                        <span>تاریخ درخواست: {toJalaliPersian(r.createdAt)}</span>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        disabled={actingRequestId !== null}
                        onClick={() => respondRequest(r.id, "APPROVE")}
                        className="h-10 flex-1 cursor-pointer gap-1.5 border-forest/40 text-forest-deep hover:bg-forest/10 hover:text-forest-deep sm:flex-none dark:text-forest-soft dark:hover:text-forest-soft"
                      >
                        <Check className="size-4" />
                        تأیید
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={actingRequestId !== null}
                        onClick={() => respondRequest(r.id, "REJECT")}
                        className="h-10 flex-1 cursor-pointer gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive sm:flex-none"
                      >
                        <X className="size-4" />
                        رد
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ---------- Stats tab (گزارش‌ها) ---------- */}
        <TabsContent value="stats" className="space-y-4">
          <ClassStatsTab classId={classId} />
        </TabsContent>
      </Tabs>

      {/* ---------- Dialogs ---------- */}
      <ClassQrDialog open={qrOpen} onOpenChange={setQrOpen} cls={detail ? { id: detail.id, name: detail.name } : null} />
      <AddStudentDialog
        key={`add-student-${addStudentSeq}`}
        open={addStudentOpen}
        onOpenChange={setAddStudentOpen}
        classId={detail.id}
        onAdded={load}
      />
      <AddSessionDialog
        key={`add-session-${addSessionSeq}`}
        open={addSessionOpen}
        onOpenChange={setAddSessionOpen}
        classId={detail.id}
        nextNumber={nextSessionNumber}
        onCreated={load}
      />
      <EditClassDialog
        key={`edit-class-${editSeq}`}
        open={editOpen}
        onOpenChange={setEditOpen}
        cls={{ id: detail.id, name: detail.name, schedule: detail.schedule }}
        onUpdated={load}
      />

      {/* ---------- Delete class confirmation ---------- */}
      <AlertDialog
        open={deleteClassOpen}
        onOpenChange={(open) => {
          if (!deletingClass) setDeleteClassOpen(open);
        }}
      >
        <AlertDialogContent className="rounded-2xl sm:max-w-md">
          <AlertDialogHeader className="text-right sm:text-right">
            <div className="mx-auto mb-1 grid size-12 place-items-center rounded-2xl bg-destructive/10 text-destructive sm:mx-0">
              <AlertTriangle className="size-6" />
            </div>
            <AlertDialogTitle className="text-xl">حذف کلاس</AlertDialogTitle>
            <AlertDialogDescription className="text-right leading-7">
              کلاس و تمام جلسات، حضوروغیاب و دانش‌آموزان آن حذف می‌شود. این عمل قابل بازگشت نیست.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:gap-2">
            <AlertDialogCancel
              className="h-11 cursor-pointer rounded-xl"
              disabled={deletingClass}
            >
              لغو
            </AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              className="h-11 cursor-pointer gap-1.5 rounded-xl"
              disabled={deletingClass}
              onClick={confirmDeleteClass}
            >
              {deletingClass ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              {deletingClass ? "در حال حذف…" : "حذف قطعی کلاس"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ---------- Remove student confirmation ---------- */}
      <AlertDialog
        open={removeStudent !== null}
        onOpenChange={(open) => {
          if (!open && !removingStudent) setRemoveStudent(null);
        }}
      >
        <AlertDialogContent className="rounded-2xl sm:max-w-md">
          <AlertDialogHeader className="text-right sm:text-right">
            <div className="mx-auto mb-1 grid size-12 place-items-center rounded-2xl bg-destructive/10 text-destructive sm:mx-0">
              <UserMinus className="size-6" />
            </div>
            <AlertDialogTitle className="text-xl">حذف دانش‌آموز از کلاس</AlertDialogTitle>
            <AlertDialogDescription className="text-right leading-7">
              «{removeStudent?.name}» از این کلاس حذف می‌شود و سابقه حضوروغیاب و تکالیف او در
              جلسات این کلاس پاک می‌شود. این عمل قابل بازگشت نیست.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:gap-2">
            <AlertDialogCancel
              className="h-11 cursor-pointer rounded-xl"
              disabled={removingStudent}
            >
              لغو
            </AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              className="h-11 cursor-pointer gap-1.5 rounded-xl"
              disabled={removingStudent}
              onClick={confirmRemoveStudent}
            >
              {removingStudent ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              {removingStudent ? "در حال حذف…" : "حذف از کلاس"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ---------- Delete session confirmation ---------- */}
      <AlertDialog
        open={deleteSession !== null}
        onOpenChange={(open) => {
          if (!open && !deletingSession) setDeleteSession(null);
        }}
      >
        <AlertDialogContent className="rounded-2xl sm:max-w-md">
          <AlertDialogHeader className="text-right sm:text-right">
            <div className="mx-auto mb-1 grid size-12 place-items-center rounded-2xl bg-destructive/10 text-destructive sm:mx-0">
              <AlertTriangle className="size-6" />
            </div>
            <AlertDialogTitle className="text-xl">حذف جلسه</AlertDialogTitle>
            <AlertDialogDescription className="text-right leading-7">
              جلسه «{deleteSession?.name}» و حضوروغیاب و تکالیف ثبت‌شده برای آن حذف می‌شود. این
              عمل قابل بازگشت نیست.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:gap-2">
            <AlertDialogCancel
              className="h-11 cursor-pointer rounded-xl"
              disabled={deletingSession}
            >
              لغو
            </AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              className="h-11 cursor-pointer gap-1.5 rounded-xl"
              disabled={deletingSession}
              onClick={confirmDeleteSession}
            >
              {deletingSession ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              {deletingSession ? "در حال حذف…" : "حذف جلسه"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function TabCount({ n, amber = false }: { n: number; amber?: boolean }) {
  return (
    <span
      className={cn(
        "min-w-5 rounded-full px-1.5 py-0.5 text-center text-[10px] font-bold tabular-nums",
        amber
          ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
          : "bg-muted-foreground/10 text-muted-foreground"
      )}
    >
      {toPersianDigitsSafe(n)}
    </span>
  );
}
