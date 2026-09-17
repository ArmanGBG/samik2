"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "../api";

interface CreateClassDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

/** «افزودن کلاس» — name (required) + weekly schedule (optional free text).
 *  State is fresh per mount: parent remounts via a changing `key` on every open. */
export function CreateClassDialog({ open, onOpenChange, onCreated }: CreateClassDialogProps) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [schedule, setSchedule] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError("نام کلاس را وارد کنید (حداقل ۲ کاراکتر)");
      return;
    }
    setLoading(true);
    setError(null);
    const res = await api<{ class: { id: string; name: string } }>("/api/teacher/classes", {
      method: "POST",
      body: { name: trimmed, schedule: schedule.trim() },
    });
    setLoading(false);
    if (!res.ok) {
      setError(res.error ?? "خطا در ایجاد کلاس");
      return;
    }
    toast({
      title: "کلاس ساخته شد",
      description: "کد CLS و QR کد کلاس از صفحه جزئیات قابل مشاهده و اشتراک‌گذاری است",
    });
    onOpenChange(false);
    onCreated();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader className="text-right sm:text-right">
          <div className="mx-auto mb-2 grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary sm:mx-0">
            <Plus className="size-6" />
          </div>
          <DialogTitle className="text-xl">افزودن کلاس جدید</DialogTitle>
          <DialogDescription>
            نام کلاس را وارد کنید؛ کد CLS و QR کد آن به‌صورت خودکار ساخته می‌شود.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!loading) submit();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="new-class-name">نام کلاس</Label>
            <Input
              id="new-class-name"
              placeholder="مثلاً ریاضیات دهم — گروه اول"
              className="h-11"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-class-schedule">
              برنامه هفتگی <span className="font-normal text-muted-foreground">(اختیاری)</span>
            </Label>
            <Textarea
              id="new-class-schedule"
              placeholder="مثلاً شنبه و سه‌شنبه، ساعت ۱۶ تا ۱۸"
              className="min-h-[88px] resize-y"
              value={schedule}
              onChange={(e) => setSchedule(e.target.value)}
            />
          </div>

          {error ? <p className="text-right text-sm text-destructive">{error}</p> : null}

          <Button type="submit" className="h-12 w-full cursor-pointer text-base" disabled={loading}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            {loading ? "در حال ایجاد…" : "ایجاد کلاس"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
