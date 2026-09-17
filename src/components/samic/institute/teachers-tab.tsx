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
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { api, InstituteOverview } from "../api";
import { fullName } from "../shared/format";
import { toPersianDigitsSafe } from "@/lib/jalali";
import { EmptyState, SectionHeader } from "./panel-bits";
import { UserPlus, GraduationCap, BookOpen, Loader2 } from "lucide-react";

interface TeachersTabProps {
  teachers: InstituteOverview["teachers"];
  onRefresh: () => void;
}

interface AddTeacherResult {
  message: string;
  teacher: {
    name: string | null;
    lastName: string | null;
    teacherCode: string | null;
    teachingSubject: string | null;
  };
}

export function TeachersTab({ teachers, onRefresh }: TeachersTabProps) {
  const { toast } = useToast();
  const [addOpen, setAddOpen] = useState(false);
  const [value, setValue] = useState("");
  const [adding, setAdding] = useState(false);

  const submitAdd = async () => {
    if (!value.trim()) return;
    setAdding(true);
    const res = await api<AddTeacherResult>("/api/institute/add-teacher", {
      method: "POST",
      body: { value: value.trim() },
    });
    setAdding(false);
    if (!res.ok) {
      toast({ title: res.error ?? "خطا در افزودن معلم", variant: "destructive" });
      return;
    }
    toast({
      title: res.data?.message ?? "معلم به آموزشگاه اضافه شد",
      description: res.data?.teacher
        ? fullName(res.data.teacher.name, res.data.teacher.lastName, "بدون نام")
        : undefined,
    });
    setAddOpen(false);
    setValue("");
    onRefresh();
  };

  return (
    <section aria-label="مدیریت معلمان">
      <SectionHeader
        title="معلمان آموزشگاه"
        description={`${toPersianDigitsSafe(teachers.length)} معلم`}
        actions={
          <Button className="h-11 cursor-pointer gap-1.5" onClick={() => setAddOpen(true)}>
            <UserPlus className="size-4" />
            افزودن معلم
          </Button>
        }
      />

      {teachers.length === 0 ? (
        <EmptyState
          icon={<GraduationCap className="size-6" />}
          title="هنوز معلمی به آموزشگاه اضافه نشده است"
          description="معلمان را با شناسه TCH یا شماره موبایل‌شان به آموزشگاه اضافه کنید تا کلاس‌ها به آن‌ها اختصاص یابد."
          action={
            <Button className="h-11 cursor-pointer gap-1.5" onClick={() => setAddOpen(true)}>
              <UserPlus className="size-4" />
              افزودن معلم
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teachers.map((t) => {
            const initials = `${t.name?.[0] ?? "؟"}`.trim();
            return (
              <Card
                key={t.id}
                className="border-border/80 hover:border-primary/30 hover:shadow-sm transition-all"
              >
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    <div className="size-11 rounded-full bg-accent text-accent-foreground border border-border grid place-items-center font-bold text-sm shrink-0">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-bold truncate" title={fullName(t.name, t.lastName)}>
                          {fullName(t.name, t.lastName)}
                        </div>
                        {t.profileCompleted ? (
                          <Badge
                            variant="outline"
                            className="shrink-0 bg-forest/10 text-forest-deep border-forest/25"
                          >
                            پروفایل کامل
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="shrink-0 bg-amber-500/10 text-amber-700 border-amber-500/25"
                          >
                            پروفایل ناقص
                          </Badge>
                        )}
                      </div>
                      <div dir="ltr" className="font-mono text-xs text-muted-foreground">
                        {t.teacherCode ?? "—"}
                      </div>
                      <div dir="ltr" className="text-xs text-muted-foreground">
                        {toPersianDigitsSafe(t.mobile)}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-0.5">
                        <BookOpen className="size-3.5 shrink-0" />
                        <span className="truncate">{t.teachingSubject ?? "بدون رشته تدریس"}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ---------- Add teacher dialog ---------- */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl" dir="rtl">
          <DialogHeader className="text-right sm:text-right">
            <div className="mx-auto sm:mx-0 mb-2 size-12 rounded-2xl bg-primary/10 text-primary grid place-items-center">
              <GraduationCap className="size-6" />
            </div>
            <DialogTitle className="text-xl">افزودن معلم به آموزشگاه</DialogTitle>
            <DialogDescription>
              معلم باید قبلاً در سامیک ثبت‌نام کرده باشد؛ شناسه یا شماره موبایل او را وارد کنید.
            </DialogDescription>
          </DialogHeader>

          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!adding) submitAdd();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="teacher-value">شناسه معلم یا شماره موبایل</Label>
              <Input
                id="teacher-value"
                dir="ltr"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="TCH-XXXXXX یا ۰۹۱۲۳۴۵۶۷۸۹"
                className="h-12 text-left font-mono"
                autoFocus
              />
              <p className="text-[11px] text-muted-foreground leading-5">
                شناسه TCH معلم از پنل خود او قابل مشاهده است؛ با شماره موبایل هم می‌توانید جستجو کنید.
              </p>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                className="h-11 cursor-pointer"
                onClick={() => setAddOpen(false)}
                disabled={adding}
              >
                انصراف
              </Button>
              <Button
                type="submit"
                className="h-11 cursor-pointer flex-1 sm:flex-none"
                disabled={adding || !value.trim()}
              >
                {adding ? (
                  <>
                    <Loader2 className="size-4 ml-1 animate-spin" />
                    در حال افزودن…
                  </>
                ) : (
                  "افزودن به آموزشگاه"
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
export function TeachersTabSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-36" />
        <Skeleton className="h-11 w-32 rounded-md" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-36 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
