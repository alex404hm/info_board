import type { Metadata } from "next";
import { Geist, Geist_Mono, Kalam, Inter } from "next/font/google";
import Script from "next/script";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ConfirmDialogProvider } from "@/components/confirm-dialog-provider";
import "./globals.css";
import "@/styles/tiptap-global.scss";
import { cn } from "@/lib/utils";
import { adminThemeInitScript } from "@/lib/admin-theme-init-script";

const inter = Inter({subsets:['latin'],variable:'--font-inter'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const kalam = Kalam({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-kalam",
});

export const metadata: Metadata = {
  title: "TEC Infotavle",
  description: "Teknisk Erhvervsskole Center - Infotavle",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning lang="da" data-scroll-behavior="smooth" className={cn("font-sans", inter.variable, geistSans.variable, geistMono.variable, kalam.variable)} style={{ "--font-sans": "var(--font-inter)" } as any}>
      <head>
        <link rel="icon" href="/logo.svg" type="image/svg+xml" />
      </head>
      <body className="antialiased">
        {/* Runs before paint to prevent admin theme flash — beforeInteractive injects into <head> during SSR */}
        <Script
          id="admin-theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: adminThemeInitScript }}
        />
        <TooltipProvider>
          <ConfirmDialogProvider>{children}</ConfirmDialogProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
