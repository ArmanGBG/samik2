"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { api, SessionUser } from "@/components/samic/api";
import { LandingView } from "@/components/samic/landing/landing-view";
import { ProfileCompletion } from "@/components/samic/auth/profile-completion";
import { TeacherPanel } from "@/components/samic/teacher/teacher-panel";
import { StudentPanel } from "@/components/samic/student/student-panel";
import { InstitutePanel } from "@/components/samic/institute/institute-panel";
import { SuperAdminPanel } from "@/components/samic/admin/super-admin-panel";

type AppPhase = "loading" | "landing" | "complete-profile" | "panel";

export default function Home() {
  const [phase, setPhase] = useState<AppPhase>("loading");
  const [user, setUser] = useState<SessionUser | null>(null);

  const loadMe = useCallback(async () => {
    const res = await api<{ user: SessionUser | null }>("/api/auth/me");
    if (res.ok && res.data?.user) {
      setUser(res.data.user);
      setPhase(res.data.user.profileCompleted ? "panel" : "complete-profile");
    } else {
      setUser(null);
      setPhase("landing");
    }
  }, []);

  // initial session check — async IIFE so no setState runs synchronously in effect body
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await api<{ user: SessionUser | null }>("/api/auth/me");
      if (cancelled) return;
      if (res.ok && res.data?.user) {
        setUser(res.data.user);
        setPhase(res.data.user.profileCompleted ? "panel" : "complete-profile");
      } else {
        setUser(null);
        setPhase("landing");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleAuthed = useCallback((u: SessionUser, _isNew: boolean) => {
    setUser(u);
    setPhase(u.profileCompleted ? "panel" : "complete-profile");
  }, []);

  const handleProfileCompleted = useCallback((u: SessionUser) => {
    setUser(u);
    setPhase("panel");
  }, []);

  const handleLogout = useCallback(async () => {
    await api("/api/auth/logout", { method: "POST" });
    setUser(null);
    setPhase("landing");
  }, []);

  if (phase === "loading" || !user && phase !== "landing") {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="size-8 animate-spin text-primary" />
          <span className="text-sm">در حال بارگذاری سامیک…</span>
        </div>
      </div>
    );
  }

  if (phase === "landing") {
    return <LandingView onAuthed={handleAuthed} />;
  }

  if (phase === "complete-profile" && user) {
    return <ProfileCompletion user={user} onCompleted={handleProfileCompleted} />;
  }

  if (phase === "panel" && user) {
    switch (user.role) {
      case "TEACHER":
        return <TeacherPanel user={user} onLogout={handleLogout} onUserUpdate={loadMe} />;
      case "STUDENT":
        return <StudentPanel user={user} onLogout={handleLogout} onUserUpdate={loadMe} />;
      case "INSTITUTE_MANAGER":
        return <InstitutePanel user={user} onLogout={handleLogout} onUserUpdate={loadMe} />;
      case "SUPER_ADMIN":
        return <SuperAdminPanel user={user} onLogout={handleLogout} onUserUpdate={loadMe} />;
    }
  }

  return null;
}
