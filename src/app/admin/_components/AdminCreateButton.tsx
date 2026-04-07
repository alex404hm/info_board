import * as React from "react"
import { Plus, type LucideIcon } from "lucide-react"

import { Button, type buttonVariants } from "@/components/ui/button"
import { type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

type AdminCreateButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    icon?: LucideIcon
  }

export function AdminCreateButton({
  className,
  icon: Icon = Plus,
  children,
  variant = "default",
  size = "default",
  ...props
}: AdminCreateButtonProps) {
  return (
    <Button variant={variant} size={size} className={cn(className)} {...props}>
      <Icon className="h-4 w-4" aria-hidden="true" />
      {children}
    </Button>
  )
}
