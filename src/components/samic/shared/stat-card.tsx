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
    <Card className={cn(
      "border-border/80 shadow-xs hover:shadow-sm transition-shadow",
      tone === "primary" && "border-primary/25 bg-gradient-to-b from-accent/50 to-card",
    )}>
      <CardContent className="p-4 sm:p-5 flex items-center gap-4">
        <div className={cn(
          "size-11 rounded-xl grid place-items-center shrink-0",
          tone === "primary" && "bg-primary text-primary-foreground",
          tone === "success" && "bg-emerald-500/12 text-emerald-600",
          tone === "warning" && "bg-amber-500/12 text-amber-600",
          tone === "danger" && "bg-red-500/10 text-red-600",
          tone === "default" && "bg-muted text-muted-foreground",
        )}>
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-2xl font-extrabold tabular-nums leading-none mb-1">{display}</div>
          <div className="text-xs text-muted-foreground truncate">{title}</div>
          {hint ? <div className="text-[10px] text-muted-foreground/70 mt-0.5 truncate">{hint}</div> : null}
        </div>
      </CardContent>
    </Card>
  );
}

const ATT_LABELS: Record<string, { label: string; className: string }> = {
  PRESENT: { label: "حاضر", className: "bg-emerald-500/12 text-emerald-700 border-emerald-500/25" },
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
