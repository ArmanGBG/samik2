"use client";

import { useCallback, useEffect, useState } from "react";
import { PanelShell } from "../shared/panel-shell";
import { StatCard } from "../shared/stat-card";
import { api, AdminOverview, SessionUser } from "../api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toPersianDigitsSafe } from "@/lib/jalali";
import { cn } from "@/lib/utils";
import { UsersTab } from "./users-tab";
import { InstitutesTab } from "./institutes-tab";
import { ClassesTab } from "./classes-tab";
import {
  ShieldCheck,
  Users,
  GraduationCap,
  Building2,
  School,
  CalendarCheck,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";

interface SuperAdminPanelProps {
  user: SessionUser;
  onLogout: () => void;
  onUserUpdate: () => void;
}

export function SuperAdminPanel({ user, onLogout }: SuperAdminPanelProps) {
  const [data, setData] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    return api<AdminOverview>("/api/admin/overview").then((res) => {
      if (res.ok && res.data) {
        setData(res.data);
        setError(null);
      } else {
        setError(res.error ?? "خطا در دریافت اطلاعات سامانه");
      }
      setLoading(false);
      setRefreshing(false);
    });
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const refresh = () => {
    setRefreshing(true);
    void load();
  };

  return (
    <PanelShell user={user} activeTitle="پنل مدیر کل" onLogout={onLogout}>
      {loading ? (
        <PanelSkeleton />
      ) : error || !data ? (
        <div className="rounded-2xl border border-dashed border-border/80 p-10 sm:p-14 text-center">
          <AlertTriangle className="mx-auto size-10 text-amber-600" strokeWidth={2} />
          <div className="font-bold mt-3">خطا در بارگذاری داده‌ها</div>
          <p className="text-sm text-muted-foreground mt-1.5 leading-6">
            {error ?? "لطفاً دوباره تلاش کنید"}
          </p>
          <Button className="mt-5 h-11 cursor-pointer gap-1.5" onClick={refresh}>
            <RefreshCw className="size-4" />
            تلاش مجدد
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Heading */}
          <div className="flex items-start gap-3">
            <div className="size-11 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0">
              <ShieldCheck className="size-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-black leading-8">دید کلی سامانه</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                مدیریت کاربران، آموزشگاه‌ها و کلاس‌های همه سامیک
              </p>
            </div>
            <Button
              variant="outline"
              size="icon"
              className="size-10 shrink-0 cursor-pointer"
              onClick={refresh}
              disabled={refreshing}
              aria-label="به‌روزرسانی داده‌ها"
            >
              <RefreshCw className={cn("size-4", refreshing && "animate-spin")} />
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <StatCard
              title="دانش‌آموزان"
              value={data.stats.students}
              icon={<Users className="size-5" />}
              tone="primary"
            />
            <StatCard
              title="معلمان"
              value={data.stats.teachers}
              icon={<GraduationCap className="size-5" />}
            />
            <StatCard
              title="آموزشگاه‌ها"
              value={data.stats.institutes}
              icon={<Building2 className="size-5" />}
            />
            <StatCard
              title="کلاس‌ها"
              value={data.stats.classes}
              icon={<School className="size-5" />}
            />
            <div className="col-span-2 sm:col-span-1">
              <StatCard
                title="جلسات"
                value={data.stats.sessions}
                icon={<CalendarCheck className="size-5" />}
              />
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="users">
            <TabsList className="grid w-full grid-cols-3 h-auto p-1 sm:w-fit">
              <TabsTrigger value="users" className="h-10 cursor-pointer gap-1.5">
                <Users className="size-4" />
                کاربران
                <CountHint count={data.users.length} />
              </TabsTrigger>
              <TabsTrigger value="institutes" className="h-10 cursor-pointer gap-1.5">
                <Building2 className="size-4" />
                آموزشگاه‌ها
                <CountHint count={data.institutes.length} />
              </TabsTrigger>
              <TabsTrigger value="classes" className="h-10 cursor-pointer gap-1.5">
                <School className="size-4" />
                کلاس‌ها
                <CountHint count={data.classes.length} />
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="mt-4">
              <UsersTab users={data.users} onRefresh={load} />
            </TabsContent>
            <TabsContent value="institutes" className="mt-4">
              <InstitutesTab institutes={data.institutes} onRefresh={load} />
            </TabsContent>
            <TabsContent value="classes" className="mt-4">
              <ClassesTab classes={data.classes} onRefresh={load} />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </PanelShell>
  );
}

function CountHint({ count }: { count: number }) {
  return (
    <span className="text-[10px] text-muted-foreground tabular-nums">
      {toPersianDigitsSafe(count)}
    </span>
  );
}

function PanelSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <Skeleton className="size-11 rounded-xl" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-7 w-44" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-[88px] rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-11 w-full max-w-md rounded-lg" />
      <div className="space-y-4">
        <div className="flex gap-2">
          <Skeleton className="h-11 flex-1 rounded-md" />
          <Skeleton className="h-11 w-44 rounded-md" />
        </div>
        <div className="rounded-xl border overflow-hidden">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton
              key={i}
              className="h-12 rounded-none border-b border-border/60 last:border-0"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
