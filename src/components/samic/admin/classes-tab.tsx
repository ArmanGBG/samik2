"use client";

import { useState } from "react";
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
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { api, AdminOverview } from "../api";
import { toPersianDigitsSafe, toJalaliLong } from "@/lib/jalali";
import { EmptyState, SectionHeader, type AdminClass } from "./panel-bits";
import { School, Trash2, Loader2, CalendarDays } from "lucide-react";

interface ClassesTabProps {
  classes: AdminOverview["classes"];
  onRefresh: () => void;
}

export function ClassesTab({ classes, onRefresh }: ClassesTabProps) {
  const { toast } = useToast();
  const [deleteClass, setDeleteClass] = useState<AdminClass | null>(null);
  const [deleting, setDeleting] = useState(false);

  const submitDelete = async () => {
    if (!deleteClass) return;
    setDeleting(true);
    const res = await api<{ message: string }>(`/api/admin/classes/${deleteClass.id}`, {
      method: "DELETE",
    });
    setDeleting(false);
    if (!res.ok) {
      toast({ title: res.error ?? "خطا در حذف کلاس", variant: "destructive" });
      return;
    }
    toast({ title: res.data?.message ?? "کلاس حذف شد" });
    setDeleteClass(null);
    onRefresh();
  };

  return (
    <section aria-label="مدیریت کلاس‌ها">
      <SectionHeader
        title="کلاس‌های سامانه"
        description={`${toPersianDigitsSafe(classes.length)} کلاس ثبت‌شده`}
      />

      {classes.length === 0 ? (
        <EmptyState
          icon={<School className="size-6" />}
          title="هنوز کلاسی ثبت نشده است"
          description="کلاس‌ها توسط معلمان یا مدیران آموزشگاه تعریف می‌شوند و این‌جا نمایش داده می‌شوند."
        />
      ) : (
        <div className="rounded-xl border border-border/80 bg-card overflow-hidden">
          <div className="max-h-[480px] overflow-auto scroll-samic">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="text-right">کلاس</TableHead>
                  <TableHead className="text-right hidden sm:table-cell">معلم</TableHead>
                  <TableHead className="text-right hidden md:table-cell">آموزشگاه</TableHead>
                  <TableHead className="text-right">دانش‌آموزان</TableHead>
                  <TableHead className="text-right">جلسات</TableHead>
                  <TableHead className="text-right hidden xl:table-cell">تاریخ ایجاد</TableHead>
                  <TableHead className="text-right w-12">عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classes.map((cls) => (
                  <TableRow key={cls.id}>
                    <TableCell>
                      <div className="font-medium">{cls.name}</div>
                      <div dir="ltr" className="font-mono text-[10px] text-muted-foreground mt-0.5">
                        {cls.id}
                      </div>
                      {cls.schedule ? (
                        <div className="hidden md:flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5 max-w-[220px]">
                          <CalendarDays className="size-3 shrink-0" />
                          <span className="truncate" title={cls.schedule}>
                            {cls.schedule}
                          </span>
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                      {cls.teacher ?? "بدون معلم"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                      <span className="block max-w-[140px] truncate" title={cls.institute ?? ""}>
                        {cls.institute ?? "بدون آموزشگاه"}
                      </span>
                    </TableCell>
                    <TableCell className="tabular-nums font-semibold">
                      {toPersianDigitsSafe(cls.studentCount)}
                    </TableCell>
                    <TableCell className="tabular-nums font-semibold">
                      {toPersianDigitsSafe(cls.sessionCount)}
                    </TableCell>
                    <TableCell className="hidden xl:table-cell text-muted-foreground text-xs whitespace-nowrap">
                      {toJalaliLong(cls.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-9 cursor-pointer text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setDeleteClass(cls)}
                        aria-label={`حذف کلاس ${cls.name}`}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* ---------- Delete class confirm ---------- */}
      <AlertDialog
        open={deleteClass !== null}
        onOpenChange={(o) => {
          if (!o) setDeleteClass(null);
        }}
      >
        <AlertDialogContent className="sm:max-w-md rounded-2xl" dir="rtl">
          <AlertDialogHeader className="text-right sm:text-right">
            <AlertDialogTitle className="flex items-center gap-2">
              <span className="size-9 rounded-xl bg-red-500/10 text-red-600 grid place-items-center shrink-0">
                <Trash2 className="size-4.5" />
              </span>
              حذف کلاس
            </AlertDialogTitle>
            <AlertDialogDescription className="text-right leading-6">
              آیا از حذف کلاس «{deleteClass?.name}» مطمئن هستید؟ تمام جلسات، حضوروغیاب‌ها،
              عضویت‌ها و درخواست‌های این کلاس حذف می‌شوند و این عمل قابل بازگشت نیست.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="h-11 cursor-pointer" disabled={deleting}>
              انصراف
            </AlertDialogCancel>
            <AlertDialogAction
              className="h-11 cursor-pointer bg-destructive text-white hover:bg-destructive/90 flex items-center gap-1.5"
              disabled={deleting}
              onClick={(e) => {
                e.preventDefault();
                submitDelete();
              }}
            >
              {deleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              {deleting ? "در حال حذف…" : "حذف قطعی"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

/** Skeleton placeholder shown while the overview is loading */
export function ClassesTabSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-6 w-40" />
      <div className="rounded-xl border overflow-hidden">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-12 rounded-none border-b border-border/60 last:border-0" />
        ))}
      </div>
    </div>
  );
}
