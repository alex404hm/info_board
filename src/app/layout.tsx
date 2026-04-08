import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Kalam, Inter } from "next/font/google";
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
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
        {/* Runs before paint to prevent admin theme flash when using system theme */}
        <script dangerouslySetInnerHTML={{ __html: adminThemeInitScript }} />
      </head>
      <body
        className="antialiased"
      >
        <TooltipProvider>
          <ConfirmDialogProvider>{children}</ConfirmDialogProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
