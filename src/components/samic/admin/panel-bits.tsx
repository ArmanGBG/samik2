"use client";

import { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { ROLE_LABELS } from "../shared/panel-shell";
import { AdminOverview } from "../api";
import { cn } from "@/lib/utils";

export type AdminUser = AdminOverview["users"][number];
export type AdminInstitute = AdminOverview["institutes"][number];
export type AdminClass = AdminOverview["classes"][number];

/** Title + description + action buttons row used at the top of each tab */
export function SectionHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
      <div className="flex-1 min-w-0">
        <h2 className="text-lg font-bold leading-7">{title}</h2>
        {description ? (
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>
      ) : null}
    </div>
  );
}

/** Muted empty-state block (icon + text + optional CTA) */
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
    <div className="rounded-2xl border border-dashed border-border/80 bg-card/40 p-8 sm:p-12 text-center">
      <div className="mx-auto size-12 rounded-2xl bg-muted/70 text-muted-foreground grid place-items-center mb-4">
        {icon}
      </div>
      <div className="font-bold">{title}</div>
      {description ? (
        <p className="text-sm text-muted-foreground mt-1.5 leading-7 max-w-sm mx-auto">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

const ROLE_BADGE_STYLES: Record<string, string> = {
  SUPER_ADMIN: "bg-red-500/10 text-red-700 border-red-500/25",
  INSTITUTE_MANAGER: "bg-amber-500/12 text-amber-700 border-amber-500/25",
  TEACHER: "bg-primary/10 text-primary border-primary/25",
  STUDENT: "bg-muted text-muted-foreground border-border",
};

/** Persian role badge (مدیر کل / مدیر آموزشگاه / معلم / دانش‌آموز) */
export function RoleBadge({ role }: { role: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "whitespace-nowrap font-semibold",
        ROLE_BADGE_STYLES[role] ?? "bg-muted text-muted-foreground border-border"
      )}
    >
      {ROLE_LABELS[role] ?? role}
    </Badge>
  );
}

/** Profile completion badge: کامل / ناقص */
export function ProfileStatusBadge({ completed }: { completed: boolean }) {
  return completed ? (
    <Badge
      variant="outline"
      className="bg-forest/10 text-forest-deep border-forest/25 font-semibold"
    >
      کامل
    </Badge>
  ) : (
    <Badge
      variant="outline"
      className="bg-amber-500/10 text-amber-700 border-amber-500/25 font-semibold"
    >
      ناقص
    </Badge>
  );
}
