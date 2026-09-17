"use client";

import { useEffect, useRef, useState } from "react";
import { CameraOff, Loader2 } from "lucide-react";
import type { Html5Qrcode } from "html5-qrcode";

interface QrScannerProps {
  /** Called exactly once with the decoded QR text (scanner stops itself first). */
  onScan: (text: string) => void;
}

type CameraState = "starting" | "scanning" | "error";

/**
 * Method 3 — اسکن QR کد کلاس (Join class by scanning the class QR).
 * Uses the device camera via html5-qrcode. In sandboxed iframes the camera
 * permission is usually unavailable → renders a friendly Persian fallback so
 * the user can type the CLS code manually in the parent dialog.
 */
export function QrScanner({ onScan }: QrScannerProps) {
  const [cameraState, setCameraState] = useState<CameraState>("starting");
  // keep the latest callback without restarting the camera on re-render
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;
  // guards against double handling / handling after unmount
  const handledRef = useRef(false);

  useEffect(() => {
    let instance: Html5Qrcode | null = null;
    let cancelled = false;
    handledRef.current = false;

    const stopScanner = () => {
      if (!instance) return;
      try {
        instance.stop().catch(() => {
          /* scanner not in scanning state — ignore */
        });
      } catch {
        /* ignore synchronous failures of stop() */
      }
    };

    (async () => {
      try {
        const { Html5Qrcode: Ctor } = await import("html5-qrcode");
        if (cancelled) return;
        instance = new Ctor("qr-scanner-region", { verbose: false });
        await instance.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: 240 },
          (decodedText: string) => {
            if (cancelled || handledRef.current) return;
            handledRef.current = true;
            // stop the camera first, then hand the decoded text over
            instance
              ?.stop()
              .then(() => onScanRef.current(decodedText))
              .catch(() => {
                onScanRef.current(decodedText);
              });
          },
          () => {
            /* per-frame decode failures are noisy — safely ignore them */
          }
        );
        if (cancelled) {
          stopScanner();
        } else {
          setCameraState("scanning");
        }
      } catch {
        // camera permission denied / no camera / insecure context
        if (!cancelled) setCameraState("error");
      }
    })();

    return () => {
      cancelled = true;
      handledRef.current = true;
      stopScanner();
    };
  }, []);

  if (cameraState === "error") {
    return (
      <div
        className="mx-auto w-full max-w-[260px] rounded-xl border border-dashed border-border bg-muted/40 p-5 text-center space-y-3"
        role="alert"
      >
        <div className="mx-auto size-12 rounded-full bg-red-500/10 text-red-600 grid place-items-center">
          <CameraOff className="size-6" strokeWidth={2} />
        </div>
        <div className="text-sm font-bold">دسترسی به دوربین ممکن نیست</div>
        <p className="text-xs text-muted-foreground leading-6">
          اجازه استفاده از دوربین به مرورگر داده نشد یا دوربین در دسترس نیست.
          کد کلاس را دستی وارد کنید.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[260px] space-y-2.5">
      <div className="relative overflow-hidden rounded-xl border border-border bg-card">
        {/* html5-qrcode injects the <video> element here */}
        <div
          id="qr-scanner-region"
          className="h-[260px] w-full [&_video]:h-full [&_video]:w-full [&_video]:object-cover"
        />
        {cameraState === "starting" && (
          <div className="absolute inset-0 grid place-items-center bg-card/95">
            <div className="flex flex-col items-center gap-2.5 text-muted-foreground">
              <Loader2 className="size-7 animate-spin text-primary" />
              <span className="text-xs font-medium">در حال راه‌اندازی دوربین…</span>
            </div>
          </div>
        )}
      </div>
      <p className="text-center text-[11px] text-muted-foreground">
        QR کد کلاس را داخل کادر قرار دهید
      </p>
    </div>
  );
}
