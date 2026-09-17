"use client";

import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, ChevronDown, GraduationCap } from "lucide-react";
import { SessionUser } from "../api";
import { toPersianDigitsSafe, toJalaliString } from "@/lib/jalali";

function jalaliYear(): string {
  return toPersianDigitsSafe(toJalaliString(new Date(), "yyyy"));
}

export const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "مدیر کل سامانه",
  INSTITUTE_MANAGER: "مدیر آموزشگاه",
  TEACHER: "معلم",
  STUDENT: "دانش‌آموز",
};

interface PanelShellProps {
  user: SessionUser;
  activeTitle: string;
  onLogout: () => void;
  children: ReactNode;
  headerExtra?: ReactNode;
}

/** Shared top header + sticky footer layout for all role panels */
export function PanelShell({ user, activeTitle, onLogout, children, headerExtra }: PanelShellProps) {
  const initials = `${user.name?.[0] ?? "؟"}${user.lastName?.[0] ?? ""}`.trim() || "؟";
  const displayName = `${user.name ?? ""} ${user.lastName ?? ""}`.trim() || user.mobile;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="glass-header sticky top-0 z-40">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="size-9 rounded-xl bg-primary text-primary-foreground grid place-items-center shrink-0">
              <GraduationCap className="size-5" strokeWidth={2.2} />
            </div>
            <div className="min-w-0 leading-tight">
              <div className="font-extrabold text-[15px] truncate">سامیک</div>
              <div className="text-[11px] text-muted-foreground truncate">{activeTitle}</div>
            </div>
          </div>

          <div className="flex-1" />

          {headerExtra}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-10 gap-2 px-2 sm:px-3 hover:bg-accent/60">
                <Avatar className="size-8 border border-border">
                  <AvatarFallback className="bg-accent text-accent-foreground text-xs font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:block max-w-[140px] truncate text-sm font-medium">
                  {displayName}
                </span>
                <ChevronDown className="size-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel className="space-y-0.5">
                <div className="text-sm font-bold">{displayName}</div>
                <div className="text-xs text-muted-foreground font-normal" dir="ltr">
                  {toPersianDigitsSafe(user.mobile)}
                </div>
                <div className="text-xs text-primary font-medium pt-0.5">
                  {ROLE_LABELS[user.role]}
                  {user.teacherCode ? ` · ${user.teacherCode}` : ""}
                  {user.studentCode ? ` · ${user.studentCode}` : ""}
                </div>
                {user.instituteName ? (
                  <div className="text-xs text-muted-foreground font-normal">{user.instituteName}</div>
                ) : null}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onLogout}
                className="text-destructive focus:text-destructive cursor-pointer"
              >
                <LogOut className="size-4 ml-2" />
                خروج از حساب
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-6xl px-4 sm:px-6 py-6 sm:py-8">{children}</main>

      <footer className="border-t bg-card mt-auto">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-14 flex items-center justify-between text-xs text-foreground/60">
          <span>سامیک — سامانه مدیریت آموزش حضوری</span>
          <span>{jalaliYear()} © تمامی حقوق محفوظ است</span>
        </div>
      </footer>
    </div>
  );
}
