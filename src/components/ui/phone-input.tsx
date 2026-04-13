"use client"

import * as React from "react"
import PhoneInput, { type Country } from "react-phone-number-input"
import flags from "react-phone-number-input/flags"
import "react-phone-number-input/style.css"
import { cn } from "@/lib/utils"

/* ── Forwarded input that matches shadcn Input styling ─────────────────── */
const PhoneInputField = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input">
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    data-slot="input"
    className={cn(
      "flex-1 min-w-0 bg-transparent text-base outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 text-sm",
      className,
    )}
    {...props}
  />
))
PhoneInputField.displayName = "PhoneInputField"

/* ── Public component ───────────────────────────────────────────────────── */
interface Props {
  value: string
  onChange: (value: string) => void
  defaultCountry?: Country
  id?: string
  autoFocus?: boolean
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>
  className?: string
}

export function PhoneNumberInput({
  value,
  onChange,
  defaultCountry = "DK",
  id,
  autoFocus,
  onKeyDown,
  className,
}: Props) {
  return (
    <div
      className={cn(
        // Same look as shadcn Input
        "flex h-11 w-full items-center gap-2 rounded-md border border-input bg-transparent px-3 shadow-xs transition-[color,box-shadow]",
        "focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50",
        className,
      )}
    >
      <PhoneInput
        flags={flags}
        international
        defaultCountry={defaultCountry}
        value={value}
        onChange={(v) => onChange(v ?? "")}
        inputComponent={PhoneInputField}
        id={id}
        autoFocus={autoFocus}
        onKeyDown={onKeyDown}
        countrySelectProps={{ tabIndex: 0 }}
      />
    </div>
  )
}
