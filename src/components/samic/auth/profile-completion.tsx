"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ProvinceCitySelect } from "../shared/province-city-select";
import { api, SessionUser, EDUCATION_LEVELS } from "../api";
import { GraduationCap, BookOpenCheck, Save, Loader2 } from "lucide-react";

interface ProfileCompletionProps {
  user: SessionUser;
  onCompleted: (user: SessionUser) => void;
}

/** Forced profile completion for teachers & students (ghost accounts land here too) */
export function ProfileCompletion({ user, onCompleted }: ProfileCompletionProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");

  // teacher fields
  const [teachingSubject, setTeachingSubject] = useState("");
  const [bankCardNo, setBankCardNo] = useState("");
  const [shebaNo, setShebaNo] = useState("");

  // student fields
  const [educationLevel, setEducationLevel] = useState("");
  const [parentPhone1, setParentPhone1] = useState("");
  const [parentPhone2, setParentPhone2] = useState("");

  const isTeacher = user.role === "TEACHER";
  const isStudent = user.role === "STUDENT";

  const submit = async () => {
    setError(null);
    setLoading(true);
    const body: Record<string, string> = {
      name,
      lastName,
      province,
      city,
    };
    if (isTeacher) {
      body.teachingSubject = teachingSubject;
      body.bankCardNo = bankCardNo;
      body.shebaNo = shebaNo;
    }
    if (isStudent) {
      body.educationLevel = educationLevel;
      body.parentPhone1 = parentPhone1;
      body.parentPhone2 = parentPhone2;
    }
    const res = await api<{ user: SessionUser }>("/api/profile/complete", {
      method: "POST",
      body,
    });
    setLoading(false);
    if (!res.ok) {
      setError(res.error ?? "خطا در ذخیره پروفایل");
      return;
    }
    toast({ title: "پروفایل تکمیل شد", description: "به سامیک خوش آمدید!" });
    onCompleted(res.data!.user);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 mx-auto w-full max-w-2xl px-4 sm:px-6 py-10 flex flex-col justify-center">
        <div className="mb-6 flex items-center gap-3">
          <div className="size-12 rounded-2xl bg-primary text-primary-foreground grid place-items-center shrink-0">
            {isTeacher ? (
              <GraduationCap className="size-6" strokeWidth={2.2} />
            ) : (
              <BookOpenCheck className="size-6" strokeWidth={2.2} />
            )}
          </div>
          <div>
            <h1 className="text-xl font-extrabold">تکمیل پروفایل</h1>
            <p className="text-sm text-muted-foreground">
              {isTeacher
                ? "اطلاعات حرفه‌ای شما برای مدیریت کلاس‌ها و تسویه مالی"
                : isStudent
                  ? "اطلاعات شما برای عضویت در کلاس‌ها و ارتباط با معلمان"
                  : "اطلاعات حساب شما"}
            </p>
          </div>
        </div>

        <Card className="border-border/80 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">اطلاعات شخصی</CardTitle>
            <CardDescription>
              شماره موبایل شما:{" "}
              <span dir="ltr" className="font-semibold text-foreground">{user.mobile}</span>
              {isTeacher && user.teacherCode ? (
                <> · شناسه معلم: <span dir="ltr" className="font-semibold text-primary">{user.teacherCode}</span></>
              ) : null}
              {isStudent && user.studentCode ? (
                <> · شناسه دانش‌آموز: <span dir="ltr" className="font-semibold text-primary">{user.studentCode}</span></>
              ) : null}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pc-name">نام *</Label>
                <Input
                  id="pc-name"
                  placeholder="مثلاً محمد"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pc-lastname">نام خانوادگی *</Label>
                <Input
                  id="pc-lastname"
                  placeholder="مثلاً رضایی"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="h-11"
                />
              </div>
            </div>

            <ProvinceCitySelect
              province={province}
              city={city}
              onProvinceChange={setProvince}
              onCityChange={setCity}
              id="pc"
            />

            {isTeacher && (
              <div className="space-y-4 pt-2 border-t">
                <div className="text-sm font-bold text-primary">اطلاعات تدریس و مالی</div>
                <div className="space-y-2">
                  <Label htmlFor="pc-subject">درس تدریسی *</Label>
                  <Input
                    id="pc-subject"
                    placeholder="مثلاً ریاضیات"
                    value={teachingSubject}
                    onChange={(e) => setTeachingSubject(e.target.value)}
                    className="h-11"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pc-card">شماره کارت بانکی *</Label>
                    <Input
                      id="pc-card"
                      dir="ltr"
                      inputMode="numeric"
                      placeholder="6037997512345678"
                      value={bankCardNo}
                      onChange={(e) => setBankCardNo(e.target.value)}
                      className="h-11 no-spinner"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pc-sheba">شماره شبا *</Label>
                    <Input
                      id="pc-sheba"
                      dir="ltr"
                      placeholder="IR123456789012345678901234"
                      value={shebaNo}
                      onChange={(e) => setShebaNo(e.target.value)}
                      className="h-11"
                    />
                  </div>
                </div>
              </div>
            )}

            {isStudent && (
              <div className="space-y-4 pt-2 border-t">
                <div className="text-sm font-bold text-primary">اطلاعات تحصیلی</div>
                <div className="space-y-2">
                  <Label>پایه تحصیلی *</Label>
                  <Select value={educationLevel || undefined} onValueChange={setEducationLevel}>
                    <SelectTrigger className="w-full h-11 bg-card">
                      <SelectValue placeholder="انتخاب پایه تحصیلی" />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      {EDUCATION_LEVELS.map((l) => (
                        <SelectItem key={l.value} value={l.value}>
                          {l.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pc-parent1">موبایل والد (الزامی) *</Label>
                    <Input
                      id="pc-parent1"
                      dir="ltr"
                      inputMode="numeric"
                      placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                      value={parentPhone1}
                      onChange={(e) => setParentPhone1(e.target.value)}
                      className="h-11 no-spinner"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pc-parent2">موبایل والد دوم (اختیاری)</Label>
                    <Input
                      id="pc-parent2"
                      dir="ltr"
                      inputMode="numeric"
                      placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                      value={parentPhone2}
                      onChange={(e) => setParentPhone2(e.target.value)}
                      className="h-11 no-spinner"
                    />
                  </div>
                </div>
              </div>
            )}

            {error ? <p className="text-sm text-destructive text-right">{error}</p> : null}

            <Button
              onClick={submit}
              disabled={loading}
              className="w-full h-12 text-base cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 ml-2 animate-spin" />
                  در حال ذخیره…
                </>
              ) : (
                <>
                  <Save className="size-4 ml-1" />
                  ذخیره و ادامه
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
