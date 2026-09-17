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
import { Check, Copy, Info, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { copyText } from "./bits";

interface ClassQrDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cls: { id: string; name: string } | null;
}

/** QR کد کلاس — scannable PNG + large CLS code + copy + hint */
export function ClassQrDialog({ open, onOpenChange, cls }: ClassQrDialogProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    if (!cls) return;
    const ok = await copyText(cls.id);
    if (ok) {
      setCopied(true);
      toast({ title: "کپی شد", description: `کد ${cls.id} در کلیپ‌بورد کپی شد` });
      window.setTimeout(() => setCopied(false), 1600);
    } else {
      toast({ title: "کپی ناموفق بود", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-sm">
        <DialogHeader className="text-right sm:text-right">
          <DialogTitle className="text-xl">QR کد کلاس</DialogTitle>
          <DialogDescription className="truncate">{cls?.name}</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {cls ? (
            <div className="mx-auto w-fit rounded-2xl border border-border bg-white p-4 shadow-sm">
              <img
                src={`/api/qr?data=${encodeURIComponent(cls.id)}`}
                alt="QR کد کلاس"
                width={224}
                height={224}
                className="block rounded-xl"
              />
            </div>
          ) : (
            <div className="grid h-56 w-56 place-items-center rounded-2xl border border-dashed">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {cls ? (
            <div dir="ltr" className="text-center font-mono text-3xl font-black tracking-widest tabular-nums">
              {cls.id}
            </div>
          ) : null}

          <Button
            type="button"
            variant="outline"
            className="h-11 w-full cursor-pointer gap-2"
            onClick={onCopy}
          >
            {copied ? (
              <Check className="size-4 text-forest-deep dark:text-forest-soft" />
            ) : (
              <Copy className="size-4" />
            )}
            کپی کد کلاس
          </Button>

          <p className="flex items-start gap-2 rounded-xl border border-border/60 bg-muted/50 p-3 text-right text-xs leading-6 text-muted-foreground">
            <Info className="mt-0.5 size-4 shrink-0 text-primary" />
            دانش‌آموزان با اسکن این کد یا وارد کردن کد کلاس درخواست عضویت می‌فرستند؛ شما از
            تب «درخواست‌ها» آن را تأیید می‌کنید.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
