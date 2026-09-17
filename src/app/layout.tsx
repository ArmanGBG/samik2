import type { Metadata, Viewport } from "next";
import { Vazirmatn } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const vazirmatn = Vazirmatn({
  variable: "--font-vazirmatn",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "سامیک | سامانه مدیریت آموزش حضوری",
  description:
    "سامیک؛ مدیریت کلاس‌ها، حضوروغیاب با QR، پیگیری تکالیف و تسویه مالی معلمان، آموزشگاه‌ها و دانش‌آموزان.",
  keywords: ["سامیک", "مدیریت آموزش", "حضوروغیاب", "کلاس حضوری", "آموزشگاه", "معلم", "دانش‌آموز"],
  icons: { icon: "/logo.svg" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0D9488",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <body className={`${vazirmatn.variable} font-sans antialiased bg-background text-foreground`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
