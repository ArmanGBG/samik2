"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  GraduationCap,
  QrCode,
  ClipboardCheck,
  Wallet,
  MonitorSmartphone,
  ShieldCheck,
  Sparkles,
  ArrowLeft,
  Phone,
  Mail,
  FileText,
  Info,
} from "lucide-react";
import { toPersianDigitsSafe, toJalaliString } from "@/lib/jalali";
import { useState } from "react";
import { AuthDialog } from "./auth-dialog";
import { SessionUser } from "../api";

function jalaliYear(): string {
  return toPersianDigitsSafe(toJalaliString(new Date(), "yyyy"));
}

interface LandingViewProps {
  onAuthed: (user: SessionUser, isNew: boolean) => void;
}

export function LandingView({ onAuthed }: LandingViewProps) {
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");

  const openAuth = (mode: "login" | "register") => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="glass-header sticky top-0 z-40">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-primary text-primary-foreground grid place-items-center">
              <GraduationCap className="size-5" strokeWidth={2.2} />
            </div>
            <div className="leading-tight">
              <div className="font-extrabold text-[15px]">سامیک</div>
              <div className="text-[10px] text-muted-foreground">مدیریت آموزش حضوری</div>
            </div>
          </div>
          <div className="flex-1" />
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">امکانات</a>
            <a href="#audience" className="hover:text-foreground transition-colors">مخاطبان</a>
            <a href="#how" className="hover:text-foreground transition-colors">نحوه کار</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" className="h-9 cursor-pointer" onClick={() => openAuth("login")}>
              ورود
            </Button>
            <Button className="h-9 cursor-pointer" onClick={() => openAuth("register")}>
              ثبت‌نام
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-samic [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,#000_35%,transparent_100%)]" />
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 size-[480px] rounded-full bg-primary/10 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 pt-16 pb-14 sm:pt-24 sm:pb-20 text-center">
          <Badge variant="secondary" className="mb-5 gap-1.5 border-primary/25 bg-accent/70 text-accent-foreground px-3 py-1">
            <Sparkles className="size-3.5 text-primary" />
            نسخه نمایشی زنده — با حساب‌های نمونه امتحان کنید
          </Badge>

          <h1 className="mx-auto max-w-3xl text-3xl sm:text-5xl font-black leading-[1.25] tracking-tight">
            مدیریت کلاس‌های حضوری،
            <br className="hidden sm:block" />
            <span className="text-primary"> بدون کاغذبازی و پیام‌های گم‌شده</span>
          </h1>

          <p className="mx-auto max-w-2xl mt-5 text-muted-foreground text-base sm:text-lg leading-8">
            سامیک ابزار همه‌کاره معلمان، آموزشگاه‌ها و دانش‌آموزان است؛ از حضوروغیاب با QR کد
            و پیگیری خودکار تکالیف تا تسویه مالی شفاف — همه در یک جای ساده و مینیمال.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="lg" className="h-13 px-8 text-base cursor-pointer gap-1.5" onClick={() => openAuth("register")}>
              ثبت‌نام رایگان
              <ArrowLeft className="size-4" />
            </Button>
            <Button size="lg" variant="outline" className="h-13 px-8 text-base cursor-pointer" onClick={() => openAuth("login")}>
              ورود به حساب
            </Button>
          </div>

          {/* Hero mockup */}
          <div className="mx-auto mt-12 max-w-3xl">
            <div className="rounded-2xl border border-border/80 bg-card shadow-xl shadow-primary/5 p-4 sm:p-5 text-right">
              <div className="flex items-center gap-2 mb-4">
                <span className="size-2.5 rounded-full bg-red-400/70" />
                <span className="size-2.5 rounded-full bg-amber-400/70" />
                <span className="size-2.5 rounded-full bg-emerald-400/70" />
                <span className="mr-auto text-[11px] text-muted-foreground">کلاس ریاضیات دهم · جلسه {toPersianDigitsSafe(4)}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center text-[10px] sm:text-xs">
                <div className="rounded-xl bg-accent/60 border border-primary/15 p-3 sm:p-4">
                  <div className="text-2xl sm:text-3xl font-black text-primary tabular-nums">{toPersianDigitsSafe(24)}</div>
                  <div className="text-muted-foreground mt-1">حاضر</div>
                </div>
                <div className="rounded-xl bg-muted/60 border p-3 sm:p-4">
                  <div className="text-2xl sm:text-3xl font-black tabular-nums">{toPersianDigitsSafe(2)}</div>
                  <div className="text-muted-foreground mt-1">غایب</div>
                </div>
                <div className="rounded-xl bg-muted/60 border p-3 sm:p-4">
                  <div className="text-2xl sm:text-3xl font-black tabular-nums">{toPersianDigitsSafe(21)}</div>
                  <div className="text-muted-foreground mt-1">تکالیف انجام‌شده</div>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 rounded-xl border border-dashed p-2.5 text-[11px] text-muted-foreground">
                <QrCode className="size-4 text-primary" />
                دانش‌آموزان با اسکن QR کد کلاس، درخواست عضویت می‌فرستند
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t bg-card/50">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-20">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold">امکانات کلیدی</h2>
            <p className="text-muted-foreground mt-2 text-sm sm:text-base">
              سه ستون اصلی سامیک برای مدیریت بی‌دردسر کلاس‌های حضوری
            </p>
          </div>

          <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
            <Card className="border-border/80 hover:border-primary/30 hover:shadow-md transition-all group">
              <CardContent className="p-6 space-y-4">
                <div className="size-12 rounded-2xl bg-primary/10 text-primary grid place-items-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <QrCode className="size-6" />
                </div>
                <h3 className="font-bold text-lg">حضوروغیاب با QR کد</h3>
                <p className="text-sm text-muted-foreground leading-7">
                  هر کلاس QR اختصاصی خودش را دارد. دانش‌آموز با اسکن، درخواست عضویت می‌فرستد و
                  معلم با یک کلیک تأیید می‌کند — بدون لیست‌های کاغذی و کندی.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/80 hover:border-primary/30 hover:shadow-md transition-all group">
              <CardContent className="p-6 space-y-4">
                <div className="size-12 rounded-2xl bg-primary/10 text-primary grid place-items-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <ClipboardCheck className="size-6" />
                </div>
                <h3 className="font-bold text-lg">پیگیری خودکار تکالیف</h3>
                <p className="text-sm text-muted-foreground leading-7">
                  برای هر جلسه، وضعیت تکلیف هر دانش‌آموز با یک کلید iOS-سبک ثبت می‌شود؛
                  به‌صورت پیش‌فرض «انجام‌شده» است و معلم فقط موارد انجام‌نشده را خاموش می‌کند.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/80 hover:border-primary/30 hover:shadow-md transition-all group">
              <CardContent className="p-6 space-y-4">
                <div className="size-12 rounded-2xl bg-primary/10 text-primary grid place-items-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Wallet className="size-6" />
                </div>
                <h3 className="font-bold text-lg">تسویه مالی شفاف</h3>
                <p className="text-sm text-muted-foreground leading-7">
                  جلسات برگزارشده و حضور هر دانش‌آموز به‌صورت خودکار ثبت می‌شود تا محاسبه
                  شهریه و تسویه با معلمان و آموزشگاه‌ها دقیق و بدون اختلاف باشد.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Target audience */}
      <section id="audience" className="border-t">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-20">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold">سامیک برای چه کسانی است؟</h2>
            <p className="text-muted-foreground mt-2 text-sm sm:text-base">
              از معلم خصوصی تک‌نفره تا آموزشگاه‌های چندشعبه‌ای
            </p>
          </div>

          <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
            {[
              {
                icon: <GraduationCap className="size-6" />,
                title: "معلمان و مدرسین خصوصی",
                desc: "کلاس‌ها، جلسات، حضوروغیاب و تکالیف همه زیر کنترل شما؛ دانش‌آموز فقط با شماره موبایل اضافه می‌شود.",
                points: ["شناسه TCH اختصاصی", "QR کد برای هر کلاس", "ثبت کارت و شبا برای تسویه"],
              },
              {
                icon: <MonitorSmartphone className="size-6" />,
                title: "آموزشگاه‌ها",
                desc: "مدیر آموزشگاه کلاس تعریف می‌کند، معلمان را به کلاس‌ها متصل می‌کند و فقط داده‌های آموزشگاه خودش را می‌بیند.",
                points: ["ایزوله‌سازی داده آموزشگاه", "افزودن معلم به کلاس", "گزارش تعداد جلسات"],
              },
              {
                icon: <ShieldCheck className="size-6" />,
                title: "دانش‌آموزان",
                desc: "با کد CLS یا اسکن QR وارد کلاس شوید، تاریخچه حضور و وضعیت تکالیف‌تان را همیشه شفاف ببینید.",
                points: ["شناسه STU شخصی", "پذیرش/رد دعوت‌ها", "کارنامه هر کلاس"],
              },
            ].map((a, i) => (
              <Card key={i} className="border-border/80 hover:border-primary/30 hover:shadow-md transition-all">
                <CardContent className="p-6 space-y-4">
                  <div className="size-12 rounded-2xl bg-accent text-accent-foreground grid place-items-center border border-primary/15">
                    {a.icon}
                  </div>
                  <h3 className="font-bold text-lg">{a.title}</h3>
                  <p className="text-sm text-muted-foreground leading-7">{a.desc}</p>
                  <ul className="space-y-1.5 text-sm">
                    {a.points.map((p) => (
                      <li key={p} className="flex items-center gap-2 text-foreground/80">
                        <span className="size-1.5 rounded-full bg-primary shrink-0" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-t bg-card/50">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-20">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold">نحوه شروع</h2>
            <p className="text-muted-foreground mt-2 text-sm sm:text-base">سه قدم تا اولین جلسه</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { n: "۱", t: "ثبت‌نام با موبایل", d: "فقط شماره موبایل و کد تأیید؛ نه فرم طولانی، نه ایمیل." },
              { n: "۲", t: "ساخت کلاس", d: "نام کلاس را وارد کنید؛ کد CLS و QR آماده می‌شود." },
              { n: "۳", t: "جلسه و حضور", d: "جلسه اضافه کنید، حضوروغیاب و تکالیف را در چند ثانیه ثبت کنید." },
            ].map((s) => (
              <div key={s.n} className="relative rounded-2xl border border-border/70 bg-card p-6 text-center">
                <div className="mx-auto mb-4 size-11 rounded-full bg-primary text-primary-foreground grid place-items-center font-black text-lg">
                  {s.n}
                </div>
                <div className="font-bold">{s.t}</div>
                <p className="text-sm text-muted-foreground mt-2 leading-7">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-20">
          <div className="relative overflow-hidden rounded-3xl bg-primary text-primary-foreground px-6 sm:px-12 py-12 sm:py-16 text-center">
            <div className="absolute inset-0 opacity-[0.07] bg-[radial-gradient(circle_at_30%_20%,#fff_0,transparent_45%)]" />
            <h2 className="relative text-2xl sm:text-3xl font-black leading-relaxed">
              کلاس بعدی‌تان، بدون لیست کاغذی برگزار کنید
            </h2>
            <p className="relative mt-3 text-primary-foreground/85 text-sm sm:text-base max-w-xl mx-auto leading-7">
              همین حالا حساب بسازید و اولین کلاس‌تان را در کمتر از دو دقیقه راه بیندازید.
            </p>
            <div className="relative mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                size="lg"
                variant="secondary"
                className="h-13 px-8 text-base cursor-pointer gap-1.5 bg-white hover:bg-white/90 text-primary-foreground"
                onClick={() => openAuth("register")}
              >
                ثبت‌نام رایگان
                <ArrowLeft className="size-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-13 px-8 text-base cursor-pointer border-white/40 bg-transparent text-primary-foreground hover:bg-white/10 hover:text-primary-foreground"
                onClick={() => openAuth("login")}
              >
                ورود
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card mt-auto">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-xl bg-primary text-primary-foreground grid place-items-center">
                <GraduationCap className="size-5" strokeWidth={2.2} />
              </div>
              <div className="leading-tight">
                <div className="font-extrabold text-[15px]">سامیک</div>
                <div className="text-[10px] text-muted-foreground">سامانه مدیریت آموزش حضوری</div>
              </div>
            </div>
            <div className="flex-1" />
            <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors flex items-center gap-1.5">
                <Info className="size-3.5" />
                درباره سامیک
              </a>
              <a href="#" className="hover:text-foreground transition-colors flex items-center gap-1.5">
                <Phone className="size-3.5" />
                تماس با ما
              </a>
              <a href="#" className="hover:text-foreground transition-colors flex items-center gap-1.5">
                <FileText className="size-3.5" />
                قوانین و مقررات
              </a>
              <a href="#" className="hover:text-foreground transition-colors flex items-center gap-1.5">
                <Mail className="size-3.5" />
                info@samic.ir
              </a>
            </nav>
          </div>
          <div className="mt-6 pt-4 border-t flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>سامیک — نمونه ساخته‌شده برای نمایش مدیریت آموزش حضوری</span>
            <span>{jalaliYear()} © تمامی حقوق محفوظ است</span>
          </div>
        </div>
      </footer>

      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} mode={authMode} onAuthed={onAuthed} />
    </div>
  );
}
