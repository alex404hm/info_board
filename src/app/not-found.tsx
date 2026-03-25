import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
      {/* Logo */}
      <Link href="/" className="mb-12 opacity-80 hover:opacity-100 transition-opacity">
        <img
          src="/logo.svg"
          alt="TEC"
          width={80}
          height={28}
          className="h-8 w-auto brightness-0 dark:invert"
        />
      </Link>

      {/* 404 number */}
      <div className="relative select-none mb-2">
        <span className="text-[10rem] sm:text-[14rem] font-black leading-none tracking-tighter text-muted/40">
          404
        </span>
        <span className="absolute inset-0 flex items-center justify-center text-[10rem] sm:text-[14rem] font-black leading-none tracking-tighter text-foreground/5 blur-2xl">
          404
        </span>
      </div>

      <Separator className="w-16 my-6" />

      {/* Message */}
      <div className="text-center space-y-2 mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
          Siden blev ikke fundet
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base max-w-sm">
          Den side, du leder efter, eksisterer ikke eller er blevet flyttet.
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button asChild size="lg" className="gap-2">
          <Link href="/">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Gå til forsiden
          </Link>
        </Button>
      </div>
    </div>
  )
}
