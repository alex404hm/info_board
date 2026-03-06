import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Get weather icon SVG path from condition string
 */
export function weatherIconFromCondition(condition?: string): string {
  const text = (condition ?? "").toLowerCase()
  if (text.includes("torden")) return "/weather/thunderstorms-rain.svg"
  if (text.includes("sne")) return "/weather/snow.svg"
  if (text.includes("slud") || text.includes("sleet")) return "/weather/sleet.svg"
  if (text.includes("drizzle")) return "/weather/drizzle.svg"
  if (text.includes("regn") || text.includes("rain")) return "/weather/rain.svg"
  if (text.includes("tåge") || text.includes("fog")) return "/weather/fog.svg"
  if (text.includes("delvist")) return "/weather/partly-cloudy-day.svg"
  if (text.includes("overskyet") || text.includes("cloudy")) return "/weather/cloudy.svg"
  if (text.includes("klart") || text.includes("clear")) return "/weather/clear-day.svg"
  return "/weather/partly-cloudy-day.svg"
}

/**
 * Get badge colors for transit line badge
 */
export function lineBadgeStyle(line: string) {
  if (line.endsWith("C")) {
    return {
      bg: "rgb(22, 193, 201)",
      text: "rgb(255,255,255)",
      border: "rgb(253,174,0)",
    }
  }
  if (line.endsWith("S")) {
    return {
      bg: "rgb(37,99,235)",
      text: "rgb(255,255,255)",
      border: "rgb(147,197,253)",
    }
  }
  if (line.endsWith("A")) {
    return {
      bg: "rgb(220,38,38)",
      text: "rgb(255,255,255)",
      border: "rgb(248,113,113)",
    }
  }
  if (line.endsWith("E")) {
    return {
      bg: "rgb(22,163,74)",
      text: "rgb(255,255,255)",
      border: "rgb(74,222,128)",
    }
  }
  return {
    bg: "rgb(253,174,0)",
    text: "rgb(17,24,39)",
    border: "rgb(217,119,6)",
  }
}
