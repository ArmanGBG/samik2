"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useToast } from "@/hooks/use-toast";
import { api, SessionUser } from "../api";
import { normalizeMobileDisplay } from "../shared/format";
import {
  Phone,
  ArrowLeft,
  RotateCcw,
  GraduationCap,
  BookOpenCheck,
  Info,
  ShieldCheck,
} from "lucide-react";

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "login" | "register";
  onAuthed: (user: SessionUser, isNew: boolean) => void;
}

type Step = "mobile" | "otp" | "role";

export function AuthDialog({ open, onOpenChange, mode, onAuthed }: AuthDialogProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("mobile");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  const startCountdown = () => {
    setCountdown(90);
    const t = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) clearInterval(t);
        return c - 1;
      });
    }, 1000);
  };

  const reset = () => {
    setStep("mobile");
    setMobile("");
    setOtp("");
    setDevCode(null);
    setError(null);
    setLoading(false);
  };

  const sendOtp = async () => {
    setError(null);
    setLoading(true);
    const res = await api<{ devCode: string }>("/api/auth/send-otp", {
      method: "POST",
      body: { mobile },
    });
    setLoading(false);
    if (!res.ok) {
      setError(res.error ?? "خطا در ارسال کد");
      return;
    }
    setDevCode(res.data?.devCode ?? null);
    setStep("otp");
    startCountdown();
    toast({ title: "کد تأیید ارسال شد", description: "کد به شماره شما پیامک شد (نسخه نمایشی)" });
  };

  const verifyOtp = async () => {
    setError(null);
    setLoading(true);
    const res = await api<{ user: SessionUser; isNew: boolean }>("/api/auth/verify-otp", {
      method: "POST",
      body: { mobile, code: otp },
    });
    setLoading(false);
    if (!res.ok) {
      setError(res.error ?? "کد نامعتبر است");
      return;
    }
    const user = res.data!.user;
    if (res.data!.isNew) {
      // new account → choose role first
      onAuthed(user, true);
      setStep("role");
      return;
    }
    onAuthed(user, false);
    onOpenChange(false);
    reset();
  };

  const selectRole = async (role: "TEACHER" | "STUDENT") => {
    setError(null);
    setLoading(true);
    const res = await api<{ user: SessionUser }>("/api/auth/select-role", {
      method: "POST",
      body: { role },
    });
    setLoading(false);
    if (!res.ok) {
      setError(res.error ?? "خطا در انتخاب نقش");
      return;
    }
    onAuthed(res.data!.user, true);
    onOpenChange(false);
    reset();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent className="sm:max-w-md rounded-2xl">
        {step === "mobile" && (
          <>
            <DialogHeader className="text-right sm:text-right">
              <div className="mx-auto sm:mx-0 mb-2 size-12 rounded-2xl bg-primary/10 text-primary grid place-items-center">
                <Phone className="size-6" />
              </div>
              <DialogTitle className="text-xl">
                {mode === "login" ? "ورود به سامیک" : "ثبت‌نام در سامیک"}
              </DialogTitle>
              <DialogDescription>
                شماره موبایل خود را وارد کنید؛ کد تأیید برایتان ارسال خواهد شد.
              </DialogDescription>
            </DialogHeader>

            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (!loading) sendOtp();
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="auth-mobile">شماره موبایل</Label>
                <Input
                  id="auth-mobile"
                  dir="ltr"
                  inputMode="numeric"
                  placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                  className="h-12 text-center text-lg tracking-widest"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  autoFocus
                />
              </div>

              {error ? (
                <p className="text-sm text-destructive text-right">{error}</p>
              ) : null}

              <Button type="submit" className="w-full h-12 text-base cursor-pointer" disabled={loading}>
                {loading ? "در حال ارسال…" : "دریافت کد تأیید"}
                {!loading && <ArrowLeft className="size-4 mr-1" />}
              </Button>
            </form>

            <div className="rounded-xl bg-muted/60 border border-border/70 p-3.5 text-xs leading-6 text-muted-foreground">
              <div className="flex items-center gap-1.5 font-semibold text-foreground mb-1">
                <Info className="size-3.5 text-primary" />
                حساب‌های نمایشی (کد تأیید در صفحه نمایش داده می‌شود)
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-0.5" dir="ltr">
                <span>09120000001 — مدیر کل</span>
                <span>09120000002 — مدیر آموزشگاه</span>
                <span>09120000003 — معلم</span>
                <span>09120000004 — دانش‌آموز</span>
                <span>09120000005 — حساب موقت</span>
              </div>
            </div>
          </>
        )}

        {step === "otp" && (
          <>
            <DialogHeader className="text-right sm:text-right">
              <div className="mx-auto sm:mx-0 mb-2 size-12 rounded-2xl bg-primary/10 text-primary grid place-items-center">
                <ShieldCheck className="size-6" />
              </div>
              <DialogTitle className="text-xl">کد تأیید را وارد کنید</DialogTitle>
              <DialogDescription>
                کد ۶ رقمی ارسال‌شده به{" "}
                <span dir="ltr" className="font-semibold text-foreground">
                  {normalizeMobileDisplay(mobile)}
                </span>{" "}
                را وارد کنید.
              </DialogDescription>
            </DialogHeader>

            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (!loading && otp.length === 6) verifyOtp();
              }}
            >
              <div dir="ltr" className="flex justify-center">
                <InputOTP maxLength={6} value={otp} onChange={setOtp} autoFocus>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                  </InputOTPGroup>
                  <InputOTPSeparator />
                  <InputOTPGroup>
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              {devCode ? (
                <div className="rounded-xl border border-primary/25 bg-accent/60 p-3 text-center text-sm">
                  <span className="text-muted-foreground">کد نمایشی: </span>
                  <button
                    type="button"
                    dir="ltr"
                    className="font-mono font-bold text-primary text-lg tracking-[0.3em] cursor-pointer hover:underline"
                    onClick={() => setOtp(devCode)}
                  >
                    {devCode}
                  </button>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    (برای ورود روی کد بزنید — در نسخه واقعی پیامک می‌شود)
                  </div>
                </div>
              ) : null}

              {error ? <p className="text-sm text-destructive text-center">{error}</p> : null}

              <Button
                type="submit"
                className="w-full h-12 text-base cursor-pointer"
                disabled={loading || otp.length !== 6}
              >
                {loading ? "در حال بررسی…" : "تأیید و ورود"}
              </Button>
            </form>

            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground cursor-pointer flex items-center gap-1"
                onClick={() => {
                  setStep("mobile");
                  setOtp("");
                  setDevCode(null);
                  setError(null);
                }}
              >
                <RotateCcw className="size-3.5" />
                تغییر شماره
              </button>
              {countdown > 0 ? (
                <span className="text-muted-foreground text-xs">
                  ارسال مجدد تا {countdown} ثانیه
                </span>
              ) : (
                <button
                  type="button"
                  className="text-primary hover:underline cursor-pointer text-xs font-medium"
                  onClick={sendOtp}
                >
                  ارسال مجدد کد
                </button>
              )}
            </div>
          </>
        )}

        {step === "role" && (
          <>
            <DialogHeader className="text-right sm:text-right">
              <DialogTitle className="text-xl">نقش خود را انتخاب کنید</DialogTitle>
              <DialogDescription>
                حساب جدیدی ساختید؛ مشخص کنید با چه نقشی از سامیک استفاده می‌کنید.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-3">
              <button
                type="button"
                disabled={loading}
                onClick={() => selectRole("TEACHER")}
                className="group text-right rounded-2xl border border-border p-4 hover:border-primary/50 hover:bg-accent/40 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring/40 disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <div className="size-11 rounded-xl bg-primary/10 text-primary grid place-items-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <GraduationCap className="size-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold">معلم / مدرس</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      ساخت کلاس، حضوروغیاب QR و پیگیری تکالیف
                    </div>
                  </div>
                  <Badge variant="secondary" className="shrink-0">TCH</Badge>
                </div>
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => selectRole("STUDENT")}
                className="group text-right rounded-2xl border border-border p-4 hover:border-primary/50 hover:bg-accent/40 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring/40 disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <div className="size-11 rounded-xl bg-primary/10 text-primary grid place-items-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <BookOpenCheck className="size-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold">دانش‌آموز</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      عضویت در کلاس‌ها، اسکن QR و مشاهده کارنامه
                    </div>
                  </div>
                  <Badge variant="secondary" className="shrink-0">STU</Badge>
                </div>
              </button>
            </div>

            {error ? <p className="text-sm text-destructive text-center">{error}</p> : null}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
