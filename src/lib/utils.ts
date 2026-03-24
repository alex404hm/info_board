import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Get weather icon SVG path from Yr symbolCode
 * Examples: "clearsky_day", "rain_day", "cloudy", etc.
 */
export function getWeatherIcon(symbolCode?: string, currentTime?: string): string {
  if (!symbolCode) return "/weather/04.svg" // cloudy fallback

  const code = symbolCode.toLowerCase()

  // Weather symbols mapping from weather-symbols.json
  const symbolMap: Record<string, Record<string, string>> = {
    clearsky: { day: "01d.svg", night: "01n.svg", polar_twilight: "01m.svg" },
    fair: { day: "02d.svg", night: "02n.svg", polar_twilight: "02m.svg" },
    partlycloudy: { day: "03d.svg", night: "03n.svg", polar_twilight: "03m.svg" },
    cloudy: { default: "04.svg" },
    rainshowers: { day: "05d.svg", night: "05n.svg", polar_twilight: "05m.svg" },
    rainshowersandthunder: { day: "06d.svg", night: "06n.svg", polar_twilight: "06m.svg" },
    sleetshowers: { day: "07d.svg", night: "07n.svg", polar_twilight: "07m.svg" },
    snowshowers: { day: "08d.svg", night: "08n.svg", polar_twilight: "08m.svg" },
    rain: { default: "09.svg" },
    heavyrain: { default: "10.svg" },
    heavyrainandthunder: { default: "11.svg" },
    sleet: { default: "12.svg" },
    snow: { default: "13.svg" },
    snowandthunder: { default: "14.svg" },
    fog: { default: "15.svg" },
  }

  // Extract base condition and variant from symbolCode
  // e.g., "clearsky_day" -> condition: "clearsky", variant: "day"
  const [baseCondition, variant] = code.split("_")

  // Look up the condition in our map
  const icons = symbolMap[baseCondition]
  if (!icons) return "/weather/04.svg" // fallback to cloudy

  // If it has variants (day/night/polar_twilight), determine which one to use
  if (icons.default) {
    return `/weather/${icons.default}`
  }

  // Determine day/night/polar_twilight
  let timeVariant = variant
  if (!timeVariant && currentTime) {
    const hour = new Date(currentTime).getHours()
    timeVariant = hour >= 6 && hour < 22 ? "day" : "night"
  }

  const icon = icons[timeVariant as keyof typeof icons] || icons.day || icons.night || icons.polar_twilight
  return icon ? `/weather/${icon}` : "/weather/04.svg"
}

/**
 * Get badge colors for transit line badge
 */
export function lineBadgeStyle(line: string) {
  // Special case for route 139 - darker/more black text
  if (line === "139") {
    return {
      bg: "rgb(253,174,0)",
      text: "rgb(0,0,0)", // Black text for better contrast
      border: "rgb(217,119,6)",
    }
  }

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
    text: "rgb(255,255,255)",
    border: "rgb(217,119,6)",
  }
}
/**
 * Decode HTML entities in text content
 */
export function decodeHtmlEntities(text: string): string {
  if (typeof window !== 'undefined') {
    // Client-side: use DOM API
    const textarea = document.createElement('textarea')
    textarea.innerHTML = text
    return textarea.value
  } else {
    // Server-side: manual replacement for common entities
    return text
      .replace(/&#x27;/g, "'")
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
  }
}