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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { api, AdminOverview } from "../api";
import { toPersianDigitsSafe, toJalaliLong } from "@/lib/jalali";
import { EmptyState, SectionHeader, type AdminInstitute } from "./panel-bits";
import {
  Plus,
  Building2,
  Trash2,
  CalendarDays,
  Loader2,
  UserRound,
} from "lucide-react";

interface InstitutesTabProps {
  institutes: AdminOverview["institutes"];
  onRefresh: () => void;
}

interface CreateInstituteResult {
  message: string;
  institute: { id: string; name: string };
}

export function InstitutesTab({ institutes, onRefresh }: InstitutesTabProps) {
  const { toast } = useToast();

  // --- create dialog ---
  const [createOpen, setCreateOpen] = useState(false);
  const [instName, setInstName] = useState("");
  const [managerMobile, setManagerMobile] = useState("");
  const [creating, setCreating] = useState(false);

  // --- delete confirm ---
  const [deleteInst, setDeleteInst] = useState<AdminInstitute | null>(null);
  const [deleting, setDeleting] = useState(false);

  const submitCreate = async () => {
    if (instName.trim().length < 2 || !managerMobile.trim()) return;
    setCreating(true);
    const res = await api<CreateInstituteResult>("/api/admin/institutes", {
      method: "POST",
      body: { name: instName.trim(), managerMobile: managerMobile.trim() },
    });
    setCreating(false);
    if (!res.ok) {
      toast({ title: res.error ?? "خطا در ایجاد آموزشگاه", variant: "destructive" });
      return;
    }
    toast({
      title: res.data?.message ?? "آموزشگاه ایجاد شد",
      description: "اگر مدیر جدید باشد، حساب او به‌صورت خودکار ساخته می‌شود.",
    });
    setCreateOpen(false);
    setInstName("");
    setManagerMobile("");
    onRefresh();
  };

  const submitDelete = async () => {
    if (!deleteInst) return;
    setDeleting(true);
    const res = await api<{ message: string }>(`/api/admin/institutes/${deleteInst.id}`, {
      method: "DELETE",
    });
    setDeleting(false);
    if (!res.ok) {
      toast({ title: res.error ?? "خطا در حذف آموزشگاه", variant: "destructive" });
      return;
    }
    toast({ title: res.data?.message ?? "آموزشگاه حذف شد" });
    setDeleteInst(null);
    onRefresh();
  };

  return (
    <section aria-label="مدیریت آموزشگاه‌ها">
      <SectionHeader
        title="آموزشگاه‌ها"
        description={`${toPersianDigitsSafe(institutes.length)} آموزشگاه ثبت‌شده`}
        actions={
          <Button className="h-11 cursor-pointer gap-1.5" onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            ایجاد آموزشگاه
          </Button>
        }
      />

      {institutes.length === 0 ? (
        <EmptyState
          icon={<Building2 className="size-6" />}
          title="هنوز آموزشگاهی ایجاد نشده است"
          description="با دکمه «ایجاد آموزشگاه» اولین آموزشگاه را ثبت کنید؛ حساب مدیر در صورت نبود، خودکار ساخته می‌شود."
          action={
            <Button className="h-11 cursor-pointer gap-1.5" onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" />
              ایجاد آموزشگاه
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {institutes.map((inst) => (
            <Card
              key={inst.id}
              className="border-border/80 hover:border-primary/30 hover:shadow-sm transition-all"
            >
              <CardContent className="p-4 sm:p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="size-11 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0">
                    <Building2 className="size-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold truncate" title={inst.name}>
                      {inst.name}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                      <UserRound className="size-3.5 shrink-0" />
                      <span className="truncate">{inst.manager ?? "بدون مدیر"}</span>
                    </div>
                    {inst.managerMobile ? (
                      <div dir="ltr" className="text-xs text-muted-foreground mt-0.5">
                        {toPersianDigitsSafe(inst.managerMobile)}
                      </div>
                    ) : null}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-9 shrink-0 cursor-pointer text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => setDeleteInst(inst)}
                    aria-label={`حذف آموزشگاه ${inst.name}`}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-muted/60 border border-border/60 p-2.5 text-center">
                    <div className="text-lg font-extrabold tabular-nums leading-none">
                      {toPersianDigitsSafe(inst.classCount)}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-1">کلاس</div>
                  </div>
                  <div className="rounded-xl bg-muted/60 border border-border/60 p-2.5 text-center">
                    <div className="text-lg font-extrabold tabular-nums leading-none">
                      {toPersianDigitsSafe(inst.teacherCount)}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-1">معلم</div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <CalendarDays className="size-3.5 shrink-0" />
                  ایجاد: {toJalaliLong(inst.createdAt)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ---------- Create institute dialog ---------- */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl" dir="rtl">
          <DialogHeader className="text-right sm:text-right">
            <div className="mx-auto sm:mx-0 mb-2 size-12 rounded-2xl bg-primary/10 text-primary grid place-items-center">
              <Building2 className="size-6" />
            </div>
            <DialogTitle className="text-xl">ایجاد آموزشگاه جدید</DialogTitle>
            <DialogDescription>
              آموزشگاه ایجاد و مدیر آن با شماره موبایل مشخص می‌شود.
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
              <Label htmlFor="inst-name">نام آموزشگاه</Label>
              <Input
                id="inst-name"
                value={instName}
                onChange={(e) => setInstName(e.target.value)}
                placeholder="مثلاً: آموزشگاه البرز"
                className="h-11"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="inst-manager-mobile">موبایل مدیر آموزشگاه</Label>
              <Input
                id="inst-manager-mobile"
                dir="ltr"
                inputMode="numeric"
                value={managerMobile}
                onChange={(e) => setManagerMobile(e.target.value)}
                placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                className="h-12 text-center text-lg tracking-widest"
              />
              <p className="text-[11px] text-muted-foreground leading-5">
                اگر این شماره در سامیک وجود نداشته باشد، حساب مدیر به‌صورت خودکار ساخته می‌شود و
                مدیر در اولین ورود مشخصات خود را کامل می‌کند.
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
                disabled={creating || instName.trim().length < 2 || !managerMobile.trim()}
              >
                {creating ? (
                  <>
                    <Loader2 className="size-4 ml-1 animate-spin" />
                    در حال ایجاد…
                  </>
                ) : (
                  "ایجاد آموزشگاه"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ---------- Delete institute confirm ---------- */}
      <AlertDialog
        open={deleteInst !== null}
        onOpenChange={(o) => {
          if (!o) setDeleteInst(null);
        }}
      >
        <AlertDialogContent className="sm:max-w-md rounded-2xl" dir="rtl">
          <AlertDialogHeader className="text-right sm:text-right">
            <AlertDialogTitle className="flex items-center gap-2">
              <span className="size-9 rounded-xl bg-red-500/10 text-red-600 grid place-items-center shrink-0">
                <Trash2 className="size-4.5" />
              </span>
              حذف آموزشگاه
            </AlertDialogTitle>
            <AlertDialogDescription className="text-right leading-6">
              آیا از حذف «{deleteInst?.name}» مطمئن هستید؟ کلاس‌های این آموزشگاه بدون آموزشگاه
              می‌مانند و حساب مدیر حذف نمی‌شود. این عمل قابل بازگشت نیست.
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
export function InstitutesTabSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-11 w-40 rounded-md" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-52 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
