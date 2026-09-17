"use client";

import { useCallback, useEffect, useState } from "react";
import { PanelShell } from "../shared/panel-shell";
import { StatCard } from "../shared/stat-card";
import { api, InstituteOverview, SessionUser } from "../api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toPersianDigitsSafe } from "@/lib/jalali";
import { cn } from "@/lib/utils";
import { ClassesTab } from "./classes-tab";
import { TeachersTab } from "./teachers-tab";
import { StudentsTab } from "./students-tab";
import {
  Building2,
  GraduationCap,
  School,
  Users,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";

interface InstitutePanelProps {
  user: SessionUser;
  onLogout: () => void;
  onUserUpdate: () => void;
}

export function InstitutePanel({ user, onLogout }: InstitutePanelProps) {
  const [data, setData] = useState<InstituteOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    return api<InstituteOverview>("/api/institute/overview").then((res) => {
      if (res.ok && res.data) {
        setData(res.data);
        setError(null);
      } else {
        setError(res.error ?? "خطا در دریافت اطلاعات آموزشگاه");
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
    <PanelShell user={user} activeTitle="پنل مدیریت آموزشگاه" onLogout={onLogout}>
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
          {/* Institute heading */}
          <div className="flex items-start gap-3">
            <div className="size-11 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0">
              <Building2 className="size-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-black leading-8 truncate">
                {data.institute.name}
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                مدیریت کلاس‌ها، معلمان و دانش‌آموزان آموزشگاه شما
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              title="معلمان"
              value={data.institute.teacherCount}
              icon={<GraduationCap className="size-5" />}
            />
            <StatCard
              title="کلاس‌ها"
              value={data.institute.classCount}
              icon={<School className="size-5" />}
            />
            <StatCard
              title="دانش‌آموزان"
              value={data.institute.studentCount}
              icon={<Users className="size-5" />}
              tone="primary"
            />
          </div>

          {/* Tabs */}
          <Tabs defaultValue="classes">
            <TabsList className="grid w-full grid-cols-3 h-auto p-1 sm:w-fit">
              <TabsTrigger value="classes" className="h-10 cursor-pointer gap-1.5">
                <School className="size-4" />
                کلاس‌ها
                <CountHint count={data.classes.length} />
              </TabsTrigger>
              <TabsTrigger value="teachers" className="h-10 cursor-pointer gap-1.5">
                <GraduationCap className="size-4" />
                معلمان
                <CountHint count={data.teachers.length} />
              </TabsTrigger>
              <TabsTrigger value="students" className="h-10 cursor-pointer gap-1.5">
                <Users className="size-4" />
                دانش‌آموزان
                <CountHint count={data.students.length} />
              </TabsTrigger>
            </TabsList>

            <TabsContent value="classes" className="mt-4">
              <ClassesTab classes={data.classes} onRefresh={load} />
            </TabsContent>
            <TabsContent value="teachers" className="mt-4">
              <TeachersTab teachers={data.teachers} onRefresh={load} />
            </TabsContent>
            <TabsContent value="students" className="mt-4">
              <StudentsTab students={data.students} />
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
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-[88px] rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-11 w-full max-w-md rounded-lg" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-56 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
