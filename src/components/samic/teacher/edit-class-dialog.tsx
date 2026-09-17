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
import { Label } from "@/components/ui/label";
import { Loader2, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "../api";

interface EditClassDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cls: { id: string; name: string; schedule: string | null };
  onUpdated: () => void;
}

/** «ویرایش کلاس» — name (required) + schedule (optional, free text).
 *  State is fresh per mount: parent remounts via a changing `key` on every open. */
export function EditClassDialog({ open, onOpenChange, cls, onUpdated }: EditClassDialogProps) {
  const { toast } = useToast();
  const [name, setName] = useState(cls.name);
  const [schedule, setSchedule] = useState(cls.schedule ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const trimmed = name.trim();
    if (trimmed.length < 1) {
      setError("نام کلاس را وارد کنید");
      return;
    }
    if (trimmed.length > 80) {
      setError("نام کلاس حداکثر ۸۰ کاراکتر است");
      return;
    }
    setLoading(true);
    setError(null);
    const res = await api<{ class: { id: string; name: string } }>(`/api/teacher/classes/${cls.id}`, {
      method: "PATCH",
      body: { name: trimmed, schedule: schedule.trim() },
    });
    setLoading(false);
    if (!res.ok) {
      setError(res.error ?? "خطا در به‌روزرسانی کلاس");
      return;
    }
    toast({ title: "کلاس به‌روزرسانی شد" });
    onOpenChange(false);
    onUpdated();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader className="text-right sm:text-right">
          <div className="mx-auto mb-2 grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary sm:mx-0">
            <Pencil className="size-6" />
          </div>
          <DialogTitle className="text-xl">ویرایش کلاس</DialogTitle>
          <DialogDescription>
            نام و برنامه هفتگی کلاس را تغییر دهید. کد CLS و QR کد کلاس بدون تغییر می‌ماند.
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
            <Label htmlFor="edit-class-name">نام کلاس</Label>
            <Input
              id="edit-class-name"
              placeholder="مثلاً ریاضیات دهم — گروه اول"
              className="h-11"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-class-schedule">
              برنامه هفتگی <span className="font-normal text-muted-foreground">(اختیاری)</span>
            </Label>
            <Input
              id="edit-class-schedule"
              placeholder="مثلاً شنبه و سه‌شنبه، ۱۶ تا ۱۸"
              className="h-11"
              value={schedule}
              onChange={(e) => setSchedule(e.target.value)}
            />
          </div>

          {error ? <p className="text-right text-sm text-destructive">{error}</p> : null}

          <Button type="submit" className="h-12 w-full cursor-pointer text-base" disabled={loading}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Pencil className="size-4" />}
            {loading ? "در حال ذخیره…" : "ذخیره تغییرات"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
