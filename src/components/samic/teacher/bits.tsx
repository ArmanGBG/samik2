"use client";

import { ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { toPersianDigitsSafe } from "@/lib/jalali";
import { useToast } from "@/hooks/use-toast";
import { fullName } from "../shared/format";

/** Copy text to clipboard with a legacy fallback (sandbox iframes may block the async API) */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

/** Display name for a person (name + lastName), falling back gracefully */
export function displayName(name: string | null, lastName: string | null, fallback = "بدون نام"): string {
  return fullName(name, lastName, fallback);
}

/** First letter (Persian-safe) for avatar circles */
export function initialsOf(name: string | null, lastName: string | null): string {
  const first = (name ?? "").trim().charAt(0) || (lastName ?? "").trim().charAt(0);
  return first || "؟";
}

/** Chip showing a Latin code (CLS-/STU-/TCH-) with one-tap copy. stopPropagation keeps parent card clicks intact. */
export function CodeChip({
  code,
  label,
  className,
}: {
  code: string;
  label?: string;
  className?: string;
}) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    const ok = await copyText(code);
    if (ok) {
      setCopied(true);
      toast({ title: "کپی شد", description: `کد ${code} در کلیپ‌بورد کپی شد` });
      window.setTimeout(() => setCopied(false), 1600);
    } else {
      toast({ title: "کپی ناموفق بود", variant: "destructive" });
    }
  };

  return (
    <button
      type="button"
      dir="ltr"
      title="کپی کد"
      aria-label={label ? `کپی ${label} (${code})` : `کپی کد (${code})`}
      onClick={(e) => {
        e.stopPropagation();
        onCopy();
      }}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-muted/60 px-2.5 py-1 font-mono text-[11px] text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 cursor-pointer",
        className
      )}
    >
      <span className="tracking-wide">{code}</span>
      {copied ? (
        <Check className="size-3 text-emerald-600 dark:text-emerald-400" />
      ) : (
        <Copy className="size-3" />
      )}
    </button>
  );
}

/** Dashed amber badge for ghost / incomplete profiles */
export function GhostBadge() {
  return (
    <span className="inline-flex items-center rounded-full border border-dashed border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-400">
      پروفایل ناقص
    </span>
  );
}

/** Small attendance / status count chip */
export function AttChip({
  label,
  count,
  tone,
}: {
  label: string;
  count: number;
  tone: "present" | "absent" | "late" | "muted" | "primary";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tabular-nums",
        tone === "present" && "border-emerald-500/25 bg-emerald-500/12 text-emerald-700 dark:text-emerald-400",
        tone === "absent" && "border-red-500/25 bg-red-500/10 text-red-700 dark:text-red-400",
        tone === "late" && "border-amber-500/25 bg-amber-500/12 text-amber-700 dark:text-amber-400",
        tone === "muted" && "border-border bg-muted/60 text-muted-foreground",
        tone === "primary" && "border-primary/25 bg-accent text-accent-foreground"
      )}
    >
      {label} {toPersianDigitsSafe(count)}
    </span>
  );
}

/** Generic empty state (icon + title + description + optional CTA) */
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center sm:p-12">
      <div className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl border border-border/60 bg-accent text-accent-foreground">
        {icon}
      </div>
      <div className="font-bold">{title}</div>
      {description ? (
        <p className="mx-auto mt-1.5 max-w-sm text-sm leading-7 text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

/** RTL back button (arrow points right = backwards in RTL) */
export function BackButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={onClick}
      className="-mr-2 h-10 gap-1.5 px-2.5 text-sm text-muted-foreground cursor-pointer hover:bg-accent/50 hover:text-foreground"
    >
      <ArrowRight className="size-4" />
      {label}
    </Button>
  );
}

/** Keyboard handler for clickable cards (Enter / Space) */
export function cardActivate(fn: () => void) {
  return (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fn();
    }
  };
}
