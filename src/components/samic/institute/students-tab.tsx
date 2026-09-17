"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { api, InstituteOverview, educationLevelLabel } from "../api";
import { fullName } from "../shared/format";
import { toPersianDigitsSafe } from "@/lib/jalali";
import { EmptyState, SectionHeader } from "./panel-bits";
import { Users, Search, UserRoundSearch, RotateCcw } from "lucide-react";

interface StudentsTabProps {
  students: InstituteOverview["students"];
}

const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

/** Convert Persian/Arabic digits to English for search matching */
function toEnglishDigitsLocal(s: string): string {
  return s
    .replace(/[۰-۹]/g, (d) => String(FA_DIGITS.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
}

export function StudentsTab({ students }: StudentsTabProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = toEnglishDigitsLocal(query.trim().toLowerCase());
    if (!q) return students;
    return students.filter(
      (s) =>
        `${s.name ?? ""} ${s.lastName ?? ""}`.toLowerCase().includes(q) ||
        toEnglishDigitsLocal(s.mobile).includes(q) ||
        (s.studentCode ?? "").toLowerCase().includes(q) ||
        s.className.toLowerCase().includes(q) ||
        educationLevelLabel(s.educationLevel).includes(query.trim())
    );
  }, [students, query]);

  return (
    <section aria-label="مدیریت دانش‌آموزان">
      <SectionHeader
        title="دانش‌آموزان آموزشگاه"
        description={`${toPersianDigitsSafe(filtered.length)} از ${toPersianDigitsSafe(students.length)} دانش‌آموز`}
      />

      <div className="relative mb-4">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="جستجو بر اساس نام، موبایل، شناسه یا کلاس…"
          className="h-11 pr-9 bg-card"
          aria-label="جستجوی دانش‌آموزان"
        />
      </div>

      {students.length === 0 ? (
        <EmptyState
          icon={<Users className="size-6" />}
          title="هنوز دانش‌آموزی ثبت نشده است"
          description="از تب «کلاس‌ها» و دکمه «افزودن دانش‌آموز»، دانش‌آموزان را فقط با شماره موبایل به کلاس‌ها اضافه کنید."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<UserRoundSearch className="size-6" />}
          title="نتیجه‌ای برای جستجو یافت نشد"
          description="عبارت دیگری را امتحان کنید یا جستجو را پاک کنید."
          action={
            <Button
              variant="outline"
              className="h-11 cursor-pointer gap-1.5"
              onClick={() => setQuery("")}
            >
              <RotateCcw className="size-4" />
              پاک کردن جستجو
            </Button>
          }
        />
      ) : (
        <div className="rounded-xl border border-border/80 bg-card overflow-hidden">
          <div className="max-h-[480px] overflow-auto scroll-samic">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="text-right">دانش‌آموز</TableHead>
                  <TableHead className="text-right">شناسه</TableHead>
                  <TableHead className="text-right hidden md:table-cell">موبایل</TableHead>
                  <TableHead className="text-right">کلاس</TableHead>
                  <TableHead className="text-right hidden lg:table-cell">پایه تحصیلی</TableHead>
                  <TableHead className="text-right">وضعیت حساب</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">
                      {fullName(s.name, s.lastName)}
                    </TableCell>
                    <TableCell dir="ltr" className="font-mono text-xs text-muted-foreground">
                      {s.studentCode ?? "—"}
                    </TableCell>
                    <TableCell
                      dir="ltr"
                      className="hidden md:table-cell text-muted-foreground text-sm"
                    >
                      {toPersianDigitsSafe(s.mobile)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{s.className}</TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                      {educationLevelLabel(s.educationLevel)}
                    </TableCell>
                    <TableCell>
                      {s.profileCompleted ? (
                        <Badge variant="secondary">کامل</Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-amber-500/10 text-amber-700 border-amber-500/25"
                        >
                          حساب موقت
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </section>
  );
}

/** Skeleton placeholder shown while the overview is loading */
export function StudentsTabSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-36" />
        <Skeleton className="h-11 w-full max-w-xs rounded-md" />
      </div>
      <div className="rounded-xl border overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-12 rounded-none border-b border-border/60 last:border-0" />
        ))}
      </div>
    </div>
  );
}
