"use client";

import { ReactNode } from "react";

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
