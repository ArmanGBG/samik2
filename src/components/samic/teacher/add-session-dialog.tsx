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
import { CalendarPlus, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "../api";
import { JalaliDatePicker, todayJalali } from "../shared/jalali-date-picker";
import { parseJalaliString, toPersianDigitsSafe } from "@/lib/jalali";

interface AddSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string;
  /** sessionCount + 1 — used for the default name pre-fill */
  nextNumber: number;
  onCreated: () => void;
}

/** «افزودن جلسه» — name pre-filled with «جلسه N» (fully editable) + Jalali date (default today).
 *  State is fresh per mount: parent remounts via a changing `key` on every open. */
export function AddSessionDialog({ open, onOpenChange, classId, nextNumber, onCreated }: AddSessionDialogProps) {
  const { toast } = useToast();
  const [name, setName] = useState(() => `جلسه ${toPersianDigitsSafe(nextNumber)}`);
  const [date, setDate] = useState(() => todayJalali());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setLoading(true);
    setError(null);
    const parsed = parseJalaliString(date);
    const body: { name?: string; date?: string } = {};
    if (name.trim()) body.name = name.trim();
    if (parsed) body.date = parsed.toISOString();
    const res = await api<{ session: { id: string; name: string } }>(
      `/api/teacher/classes/${classId}/sessions`,
      { method: "POST", body }
    );
    setLoading(false);
    if (!res.ok) {
      setError(res.error ?? "خطا در ایجاد جلسه");
      return;
    }
    toast({
      title: "جلسه ساخته شد",
      description: "حالا می‌توانید حضوروغیاب و تکالیف این جلسه را ثبت کنید",
    });
    onOpenChange(false);
    onCreated();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader className="text-right sm:text-right">
          <div className="mx-auto mb-2 grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary sm:mx-0">
            <CalendarPlus className="size-6" />
          </div>
          <DialogTitle className="text-xl">افزودن جلسه</DialogTitle>
          <DialogDescription>
            جلسه جدید برای این کلاس ثبت کنید تا حضوروغیاب آن قابل ذخیره باشد.
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
            <Label htmlFor="new-session-name">نام جلسه</Label>
            <Input
              id="new-session-name"
              className="h-11"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
            <p className="text-[11px] leading-5 text-muted-foreground">
              نام پیش‌فرض «جلسه {toPersianDigitsSafe(nextNumber)}» است؛ می‌توانید آن را تغییر دهید
              (مثلاً «جلسه فوق‌العاده») یا خالی بگذارید.
            </p>
          </div>

          <JalaliDatePicker
            id="new-session-date"
            label="تاریخ جلسه"
            value={date}
            onChange={setDate}
          />

          {error ? <p className="text-right text-sm text-destructive">{error}</p> : null}

          <Button type="submit" className="h-12 w-full cursor-pointer text-base" disabled={loading}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : <CalendarPlus className="size-4" />}
            {loading ? "در حال ایجاد…" : "ایجاد جلسه"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
