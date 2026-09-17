"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Keyboard, Link2, Loader2, QrCode, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "../api";
import { useToast } from "@/hooks/use-toast";
import { QrScanner } from "./qr-scanner";

interface JoinClassDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** called after a successful join request so the parent can refresh its data */
  onJoined: () => void;
}

type JoinMode = "manual" | "scan";

/**
 * اتصال به کلاس — Method 2 (manual CLS-XXXXXX code) + Method 3 (QR scan).
 * The manual input always stays visible/usable, including when the camera
 * is unavailable (friendly fallback rendered inside QrScanner).
 */
export function JoinClassDialog({ open, onOpenChange, onJoined }: JoinClassDialogProps) {
  const { toast } = useToast();
  const [code, setCode] = useState("");
  const [mode, setMode] = useState<JoinMode>("manual");
  const [submitting, setSubmitting] = useState(false);

  const resetState = () => {
    setCode("");
    setMode("manual");
    setSubmitting(false);
  };

  // every close path (X button, ESC key, overlay click, successful join) resets
  const handleOpenChange = (next: boolean) => {
    if (!next) resetState();
    onOpenChange(next);
  };

  const join = async (raw: string) => {
    const value = raw.trim();
    if (!value || submitting) return;
    setSubmitting(true);
    const res = await api<{ message: string; class: { name: string; teacher: string } }>(
      "/api/student/join",
      { method: "POST", body: { code: value } }
    );
    setSubmitting(false);
    if (res.ok) {
      toast({
        title: res.data?.message ?? "درخواست عضویت برای معلم ارسال شد",
        description: res.data?.class
          ? `${res.data.class.name} — ${res.data.class.teacher}`
          : undefined,
      });
      handleOpenChange(false);
      onJoined();
    } else {
      toast({ title: res.error, variant: "destructive" });
      // if this came from a (now stopped) scan, fall back to the manual input
      if (mode === "scan") setMode("manual");
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void join(code);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5 text-right">
            <span className="size-9 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0">
              <Link2 className="size-5" strokeWidth={2.2} />
            </span>
            اتصال به کلاس
          </DialogTitle>
          <DialogDescription className="text-right leading-6">
            کد کلاس{" "}
            <span dir="ltr" className="font-mono font-medium">
              CLS-XXXXXX
            </span>{" "}
            را از معلم خود بگیرید یا QR کد کلاس را اسکن کنید.
          </DialogDescription>
        </DialogHeader>

        {/* mode toggle */}
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1" role="tablist" aria-label="روش اتصال به کلاس">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "manual"}
            onClick={() => setMode("manual")}
            className={cn(
              "h-11 rounded-lg flex items-center justify-center gap-2 text-sm cursor-pointer transition-colors",
              mode === "manual"
                ? "bg-card shadow-sm font-bold text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Keyboard className="size-4" />
            کد کلاس
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "scan"}
            onClick={() => setMode("scan")}
            className={cn(
              "h-11 rounded-lg flex items-center justify-center gap-2 text-sm cursor-pointer transition-colors",
              mode === "scan"
                ? "bg-card shadow-sm font-bold text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <QrCode className="size-4" />
            اسکن QR کد
          </button>
        </div>

        {mode === "scan" && (
          <div className="space-y-3">
            <QrScanner onScan={(text) => void join(text)} />
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              <Separator className="flex-1" />
              یا
              <Separator className="flex-1" />
            </div>
          </div>
        )}

        {/* manual code input — always visible (fallback for camera issues) */}
        <form className="space-y-3" onSubmit={handleManualSubmit}>
          <div className="space-y-1.5">
            <Label htmlFor="join-cls-code">
              {mode === "scan" ? "کد کلاس را دستی وارد کنید" : "کد کلاس"}
            </Label>
            <Input
              id="join-cls-code"
              dir="ltr"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              className="h-12 text-center font-mono text-base tracking-[0.2em]"
              placeholder="CLS-XXXXXX"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              disabled={submitting}
            />
          </div>
          <Button
            type="submit"
            className="w-full h-11 cursor-pointer gap-2"
            disabled={!code.trim() || submitting}
          >
            {submitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
            ارسال درخواست عضویت
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
