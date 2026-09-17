"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { api, InstituteOverview } from "../api";
import { toPersianDigitsSafe } from "@/lib/jalali";
import { EmptyState, SectionHeader } from "./panel-bits";
import {
  Plus,
  School,
  Copy,
  UserRound,
  UserPlus,
  CalendarDays,
  ChevronLeft,
  Eye,
  Loader2,
} from "lucide-react";

type InstituteClass = InstituteOverview["classes"][number];

interface AddStudentResult {
  message: string;
  ghostCreated?: boolean;
  invited?: boolean;
}

interface ClassesTabProps {
  classes: InstituteOverview["classes"];
  onRefresh: () => void;
  onOpenClass: (classId: string) => void;
}

export function ClassesTab({ classes, onRefresh, onOpenClass }: ClassesTabProps) {
  const { toast } = useToast();

  // --- create class dialog ---
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [schedule, setSchedule] = useState("");
  const [teacherCode, setTeacherCode] = useState("");

  // --- add student dialog ---
  const [targetClass, setTargetClass] = useState<InstituteClass | null>(null);
  const [studentMobile, setStudentMobile] = useState("");
  const [addingStudent, setAddingStudent] = useState(false);

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast({ title: "شناسه کلاس کپی شد", description: code });
    } catch {
      toast({ title: "کپی شناسه انجام نشد", variant: "destructive" });
    }
  };

  const openClass = (classId: string) => {
    onOpenClass(classId);
    window.scrollTo({ top: 0 });
  };

  const submitCreate = async () => {
    if (name.trim().length < 2) return;
    setCreating(true);
    const res = await api<{ class: { id: string; name: string } }>(
      "/api/institute/classes",
      {
        method: "POST",
        body: {
          name: name.trim(),
          schedule: schedule.trim() || undefined,
          teacherCode: teacherCode.trim() || undefined,
        },
      }
    );
    setCreating(false);
    if (!res.ok) {
      toast({ title: res.error ?? "خطا در ایجاد کلاس", variant: "destructive" });
      return;
    }
    toast({
      title: "کلاس با موفقیت ایجاد شد",
      description: (
        <span dir="ltr" className="font-mono font-bold">
          {res.data?.class.id}
        </span>
      ),
    });
    setCreateOpen(false);
    setName("");
    setSchedule("");
    setTeacherCode("");
    onRefresh();
  };

  const submitAddStudent = async () => {
    if (!targetClass || !studentMobile.trim()) return;
    setAddingStudent(true);
    const res = await api<AddStudentResult>("/api/institute/add-student", {
      method: "POST",
      body: { classId: targetClass.id, mobile: studentMobile.trim() },
    });
    setAddingStudent(false);
    if (!res.ok) {
      toast({ title: res.error ?? "خطا در افزودن دانش‌آموز", variant: "destructive" });
      return;
    }
    toast({ title: res.data?.message ?? "دانش‌آموز اضافه شد" });
    setTargetClass(null);
    setStudentMobile("");
    onRefresh();
  };

  return (
    <section aria-label="مدیریت کلاس‌ها">
      <SectionHeader
        title="کلاس‌های آموزشگاه"
        description={`${toPersianDigitsSafe(classes.length)} کلاس فعال — برای مشاهده جلسات و دانش‌آموزان روی هر کلاس بزنید`}
        actions={
          <Button
            className="h-11 cursor-pointer gap-1.5"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="size-4" />
            تعریف کلاس جدید
          </Button>
        }
      />

      {classes.length === 0 ? (
        <EmptyState
          icon={<School className="size-6" />}
          title="هنوز کلاسی تعریف نشده است"
          description="اولین کلاس آموزشگاه خود را تعریف کنید؛ پس از ایجاد، کد CLS برای هر کلاس ساخته می‌شود."
          action={
            <Button className="h-11 cursor-pointer gap-1.5" onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" />
              تعریف کلاس جدید
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((cls) => (
            <Card
              key={cls.id}
              role="button"
              tabIndex={0}
              aria-label={`مشاهده جزئیات کلاس ${cls.name}`}
              onClick={() => openClass(cls.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  openClass(cls.id);
                }
              }}
              className="cursor-pointer border-border/80 hover:border-primary/30 hover:shadow-md transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary/40"
            >
              <CardContent className="p-4 sm:p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="size-11 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <School className="size-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold truncate" title={cls.name}>
                      {cls.name}
                    </div>
                    <button
                      type="button"
                      dir="ltr"
                      onClick={(e) => {
                        e.stopPropagation();
                        void copyCode(cls.id);
                      }}
                      className="mt-1 inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                      aria-label={`کپی شناسه کلاس ${cls.id}`}
                    >
                      {cls.id}
                      <Copy className="size-3" />
                    </button>
                  </div>
                  <ChevronLeft className="size-4 text-muted-foreground group-hover:text-primary group-hover:-translate-x-0.5 transition-all shrink-0 mt-1" />
                </div>

                <div className="flex items-center gap-2 text-sm min-w-0">
                  <UserRound className="size-4 text-muted-foreground shrink-0" />
                  {cls.teacher ? (
                    <span className="truncate">{cls.teacher.name}</span>
                  ) : (
                    <span className="text-muted-foreground/70">بدون معلم</span>
                  )}
                </div>

                {cls.schedule ? (
                  <div className="flex items-start gap-2 text-xs text-muted-foreground leading-5">
                    <CalendarDays className="size-3.5 mt-0.5 shrink-0" />
                    <span className="line-clamp-2 whitespace-pre-line">{cls.schedule}</span>
                  </div>
                ) : null}

                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-muted/60 border border-border/60 p-2.5 text-center">
                    <div className="text-lg font-extrabold tabular-nums leading-none">
                      {toPersianDigitsSafe(cls.studentCount)}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-1">دانش‌آموز</div>
                  </div>
                  <div className="rounded-xl bg-muted/60 border border-border/60 p-2.5 text-center">
                    <div className="text-lg font-extrabold tabular-nums leading-none">
                      {toPersianDigitsSafe(cls.sessionCount)}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-1">جلسه</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    className="h-10 cursor-pointer gap-1.5"
                    onClick={(e) => {
                      e.stopPropagation();
                      openClass(cls.id);
                    }}
                  >
                    <Eye className="size-4" />
                    جزئیات
                  </Button>
                  <Button
                    variant="outline"
                    className="h-10 cursor-pointer gap-1.5"
                    onClick={(e) => {
                      e.stopPropagation();
                      setTargetClass(cls);
                    }}
                  >
                    <UserPlus className="size-4" />
                    افزودن دانش‌آموز
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ---------- Create class dialog ---------- */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl" dir="rtl">
          <DialogHeader className="text-right sm:text-right">
            <div className="mx-auto sm:mx-0 mb-2 size-12 rounded-2xl bg-primary/10 text-primary grid place-items-center">
              <School className="size-6" />
            </div>
            <DialogTitle className="text-xl">تعریف کلاس جدید</DialogTitle>
            <DialogDescription>
              نام کلاس الزامی است؛ برنامه هفتگی و معلم را می‌توانید بعداً نیز مشخص کنید.
            </DialogDescription>
          </DialogHeader>

          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!creating) submitCreate();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="class-name">نام کلاس</Label>
              <Input
                id="class-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثلاً: ریاضی دهم — گروه الف"
                className="h-11"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="class-schedule">
                برنامه هفتگی <span className="text-muted-foreground font-normal">(اختیاری)</span>
              </Label>
              <Textarea
                id="class-schedule"
                value={schedule}
                onChange={(e) => setSchedule(e.target.value)}
                placeholder="مثلاً: شنبه و دوشنبه، ۱۶:۰۰ تا ۱۸:۰۰"
                className="min-h-[80px] leading-6"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="class-teacher">
                اختصاص به معلم <span className="text-muted-foreground font-normal">(اختیاری)</span>
              </Label>
              <Input
                id="class-teacher"
                dir="ltr"
                value={teacherCode}
                onChange={(e) => setTeacherCode(e.target.value)}
                placeholder="TCH-XXXXXX"
                className="h-11 font-mono text-left"
              />
              <p className="text-[11px] text-muted-foreground leading-5">
                شناسه معلم از تب «معلمان» قابل مشاهده است؛ خالی بگذارید تا بعداً معلم انتخاب شود.
              </p>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                className="h-11 cursor-pointer"
                onClick={() => setCreateOpen(false)}
                disabled={creating}
              >
                انصراف
              </Button>
              <Button
                type="submit"
                className="h-11 cursor-pointer flex-1 sm:flex-none"
                disabled={creating || name.trim().length < 2}
              >
                {creating ? (
                  <>
                    <Loader2 className="size-4 ml-1 animate-spin" />
                    در حال ایجاد…
                  </>
                ) : (
                  "ایجاد کلاس"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ---------- Add student dialog ---------- */}
      <Dialog
        open={targetClass !== null}
        onOpenChange={(o) => {
          if (!o) {
            setTargetClass(null);
            setStudentMobile("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md rounded-2xl" dir="rtl">
          <DialogHeader className="text-right sm:text-right">
            <div className="mx-auto sm:mx-0 mb-2 size-12 rounded-2xl bg-primary/10 text-primary grid place-items-center">
              <UserPlus className="size-6" />
            </div>
            <DialogTitle className="text-xl">افزودن دانش‌آموز به کلاس</DialogTitle>
            <DialogDescription>
              کلاس «{targetClass?.name}» — فقط با شماره موبایل دانش‌آموز.
            </DialogDescription>
          </DialogHeader>

          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!addingStudent) submitAddStudent();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="student-mobile">شماره موبایل دانش‌آموز</Label>
              <Input
                id="student-mobile"
                dir="ltr"
                inputMode="numeric"
                value={studentMobile}
                onChange={(e) => setStudentMobile(e.target.value)}
                placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                className="h-12 text-center text-lg tracking-widest"
                autoFocus
              />
              <p className="text-[11px] text-muted-foreground leading-5">
                اگر دانش‌آموز در سامیک عضو باشد، دعوت برایش ارسال می‌شود؛ در غیر این صورت حساب
                موقت ساخته شده و مستقیماً به کلاس اضافه می‌شود.
              </p>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                className="h-11 cursor-pointer"
                onClick={() => {
                  setTargetClass(null);
                  setStudentMobile("");
                }}
                disabled={addingStudent}
              >
                انصراف
              </Button>
              <Button
                type="submit"
                className="h-11 cursor-pointer flex-1 sm:flex-none"
                disabled={addingStudent || !studentMobile.trim()}
              >
                {addingStudent ? (
                  <>
                    <Loader2 className="size-4 ml-1 animate-spin" />
                    در حال افزودن…
                  </>
                ) : (
                  "افزودن به کلاس"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}

/** Skeleton placeholder shown while the overview is loading */
export function ClassesTabSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-11 w-36 rounded-md" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-56 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
