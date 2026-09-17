"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IdCard, Loader2, Phone, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "../api";

type AddMode = "MOBILE" | "STU_ID";

interface AddStudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string;
  onAdded: () => void;
}

interface AddStudentResult {
  message: string;
  invited?: boolean;
  enrolled?: boolean;
  isGhost?: boolean;
}

/** «افزودن دانش‌آموز» — two methods:
 *  A) شماره موبایل → invite (ghost account if unknown)
 *  B) شناسه STU-XXXXXX → direct enrollment
 *  State is fresh per mount: parent remounts via a changing `key` on every open. */
export function AddStudentDialog({ open, onOpenChange, classId, onAdded }: AddStudentDialogProps) {
  const { toast } = useToast();
  const [mode, setMode] = useState<AddMode>("MOBILE");
  const [mobile, setMobile] = useState("");
  const [stuCode, setStuCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const value = mode === "MOBILE" ? mobile.trim() : stuCode.trim();
    if (!value) {
      setError(mode === "MOBILE" ? "شماره موبایل را وارد کنید" : "شناسه دانش‌آموز را وارد کنید");
      return;
    }
    setLoading(true);
    setError(null);
    const res = await api<AddStudentResult>(`/api/teacher/classes/${classId}/add-student`, {
      method: "POST",
      body: { mode, value },
    });
    setLoading(false);
    if (!res.ok) {
      setError(res.error ?? "خطا در افزودن دانش‌آموز");
      return;
    }
    toast({
      title: res.data?.message ?? "دانش‌آموز اضافه شد",
      description: res.data?.isGhost
        ? "این دانش‌آموز حساب موقت دارد؛ پس از ورود و تکمیل پروفایل، نامش کامل نمایش داده می‌شود"
        : undefined,
    });
    onOpenChange(false);
    onAdded();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader className="text-right sm:text-right">
          <div className="mx-auto mb-2 grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary sm:mx-0">
            <UserPlus className="size-6" />
          </div>
          <DialogTitle className="text-xl">افزودن دانش‌آموز</DialogTitle>
          <DialogDescription>یکی از دو روش زیر را انتخاب کنید.</DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!loading) submit();
          }}
        >
          <Tabs value={mode} onValueChange={(v) => { setMode(v as AddMode); setError(null); }}>
            <TabsList className="h-11 w-full rounded-xl p-1">
              <TabsTrigger value="MOBILE" className="gap-1.5 text-[13px]">
                <Phone className="size-3.5" />
                شماره موبایل
              </TabsTrigger>
              <TabsTrigger value="STU_ID" className="gap-1.5 text-[13px]">
                <IdCard className="size-3.5" />
                شناسه دانش‌آموز
              </TabsTrigger>
            </TabsList>

            <TabsContent value="MOBILE" className="space-y-2.5 pt-2">
              <div className="space-y-2">
                <Label htmlFor="add-stu-mobile">شماره موبایل دانش‌آموز</Label>
                <Input
                  id="add-stu-mobile"
                  dir="ltr"
                  inputMode="numeric"
                  placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                  className="h-11 text-center text-base tracking-widest"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  autoFocus
                />
              </div>
              <p className="rounded-xl border border-border/60 bg-muted/50 p-3 text-xs leading-6 text-muted-foreground">
                برای این شماره دعوت عضویت ارسال می‌شود؛ اگر دانش‌آموز در سامیک حساب نداشته باشد،
                یک حساب موقت برایش ساخته می‌شود.
              </p>
            </TabsContent>

            <TabsContent value="STU_ID" className="space-y-2.5 pt-2">
              <div className="space-y-2">
                <Label htmlFor="add-stu-code">شناسه دانش‌آموز</Label>
                <Input
                  id="add-stu-code"
                  dir="ltr"
                  placeholder="STU-XXXXXX"
                  className="h-11 text-center font-mono text-base tracking-widest"
                  value={stuCode}
                  onChange={(e) => setStuCode(e.target.value)}
                  autoFocus
                />
              </div>
              <p className="rounded-xl border border-border/60 bg-muted/50 p-3 text-xs leading-6 text-muted-foreground">
                شناسه ۶ کاراکتری دانش‌آموز را وارد کنید تا مستقیماً و بدون نیاز به تأیید، به کلاس
                اضافه شود.
              </p>
            </TabsContent>
          </Tabs>

          {error ? <p className="text-right text-sm text-destructive">{error}</p> : null}

          <Button type="submit" className="h-12 w-full cursor-pointer text-base" disabled={loading}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
            {loading
              ? "در حال افزودن…"
              : mode === "MOBILE"
                ? "ارسال دعوت"
                : "افزودن به کلاس"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
