import * as React from "react"
import { Plus, type LucideIcon } from "lucide-react"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

export const adminCreateButtonClassName =
  "inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 active:scale-95 disabled:pointer-events-none disabled:opacity-50"

type AdminCreateButtonProps = React.ComponentProps<"button"> & {
  asChild?: boolean
  icon?: LucideIcon
}

export function AdminCreateButton({
  asChild = false,
  className,
  icon: Icon = Plus,
  children,
  ...props
}: AdminCreateButtonProps) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp className={cn(adminCreateButtonClassName, className)} {...props}>
      <Icon className="h-4 w-4" aria-hidden="true" />
      {children}
    </Comp>
  )
}
