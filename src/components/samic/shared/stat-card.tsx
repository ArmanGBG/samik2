"use client";

import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toPersianDigitsSafe } from "@/lib/jalali";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: ReactNode;
  hint?: string;
  tone?: "default" | "primary" | "success" | "warning" | "danger";
}

export function StatCard({ title, value, icon, hint, tone = "default" }: StatCardProps) {
  const display =
    typeof value === "number" ? toPersianDigitsSafe(value) : value;

  return (
    <Card
      className={cn(
        "border-border/80 shadow-xs transition-shadow hover:shadow-sm",
        // Very subtle tone-tinted gradient + matching ring (keeps the minimal aesthetic)
        tone === "primary" &&
          "border-primary/25 bg-gradient-to-b from-primary/[0.06] to-card ring-1 ring-primary/10",
        tone === "success" &&
          "border-forest/20 bg-gradient-to-b from-forest/[0.05] to-card ring-1 ring-forest/10",
        tone === "warning" &&
          "border-amber-500/20 bg-gradient-to-b from-amber-500/[0.05] to-card ring-1 ring-amber-500/10",
        tone === "danger" &&
          "border-red-500/20 bg-gradient-to-b from-red-500/[0.05] to-card ring-1 ring-red-500/10",
        tone === "default" && "bg-gradient-to-b from-muted/40 to-card ring-1 ring-border/50"
      )}
    >
      <CardContent className="p-4 sm:p-5 flex items-center gap-4">
        <div
          className={cn(
            "size-11 rounded-xl grid place-items-center shrink-0",
            tone === "primary" && "bg-primary/12 text-primary",
            tone === "success" && "bg-forest/12 text-forest-deep dark:text-forest-soft",
            tone === "warning" && "bg-amber-500/12 text-amber-600 dark:text-amber-400",
            tone === "danger" && "bg-red-500/12 text-red-600 dark:text-red-400",
            tone === "default" && "bg-muted text-muted-foreground"
          )}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-2xl font-extrabold tabular-nums leading-none mb-1">{display}</div>
          <div className="text-xs text-muted-foreground truncate">{title}</div>
          {hint ? <div className="text-[10px] text-foreground/55 mt-0.5 truncate">{hint}</div> : null}
        </div>
      </CardContent>
    </Card>
  );
}

const ATT_LABELS: Record<string, { label: string; className: string }> = {
  PRESENT: { label: "حاضر", className: "bg-forest/12 text-forest-deep border-forest/25" },
  ABSENT: { label: "غایب", className: "bg-red-500/10 text-red-700 border-red-500/25" },
  LATE: { label: "تأخیر", className: "bg-amber-500/12 text-amber-700 border-amber-500/25" },
};

export function AttendanceBadge({ status }: { status: string | null }) {
  if (!status) {
    return (
      <span className="inline-flex items-center rounded-full border border-dashed border-border px-2.5 py-0.5 text-[11px] text-muted-foreground">
        ثبت نشده
      </span>
    );
  }
  const cfg = ATT_LABELS[status];
  if (!cfg) return null;
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold", cfg.className)}>
      {cfg.label}
    </span>
  );
}
