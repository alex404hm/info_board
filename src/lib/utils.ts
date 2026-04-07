import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Decode common HTML entities
 */
export function decodeHtmlEntities(html: string): string {
  if (!html) return ""
  const map: Record<string, string> = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#39;": "'",
    "&nbsp;": " ",
    "&apos;": "'",
    "&#34;": '"',
    "&#60;": "<",
    "&#62;": ">",
    "&#38;": "&",
  }
  let decoded = html
  for (const [entity, char] of Object.entries(map)) {
    decoded = decoded.replace(new RegExp(entity, "g"), char)
  }
  // Handle numeric entities like &#123;
  decoded = decoded.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
  // Handle hex entities like &#x1A;
  decoded = decoded.replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
  return decoded
}

/**
 * Get style colors for a transit line badge
 */
export function lineBadgeStyle(line: string): { bg: string; text: string } {
  // DSB/Regional train lines
  if (line === "A" || line === "Lijn A") return { bg: "#FF5733", text: "#fff" }
  if (line === "B" || line === "Lijn B") return { bg: "#33B5FF", text: "#fff" }
  if (line === "C" || line === "Lijn C") return { bg: "#FFAA00", text: "#000" }
  if (line === "E" || line === "Lijn E") return { bg: "#00AA44", text: "#fff" }
  if (line === "F" || line === "Lijn F") return { bg: "#AA0044", text: "#fff" }
  if (line === "H" || line === "Lijn H") return { bg: "#005599", text: "#fff" }
  if (line === "Bx" || line === "Lijn Bx") return { bg: "#FF6600", text: "#fff" }
  if (line === "RX" || line === "Lijn RX") return { bg: "#003366", text: "#fff" }

  // Metro/S-train lines based on line numbers
  const lineNum = parseInt(line, 10)
  if (!isNaN(lineNum)) {
    // S-train lines
    if (lineNum === 1 || lineNum === 2 || lineNum === 3) {
      return { bg: "#005099", text: "#fff" }
    }
    // Metro lines M1-M4
    if (lineNum === 4 || lineNum === 5 || lineNum === 6) {
      return { bg: "#FF5733", text: "#fff" }
    }
  }

  // Bus lines (default styling)
  if (line.startsWith("1") || line.startsWith("2") || line.startsWith("3")) {
    return { bg: "#CCCCCC", text: "#000" }
  }

  // Night buses
  if (line.startsWith("N")) {
    return { bg: "#1a1a1a", text: "#fff" }
  }

  // Default fallback
  return { bg: "#666666", text: "#fff" }
}

/**
 * Get the weather icon path based on symbol code and time
 */
export function getWeatherIcon(symbolCode: string | undefined, timestamp?: string | number): string {
  if (!symbolCode) {
    return "/weather/04.svg" // Default cloudy icon
  }

  // Determine if it's day or night based on timestamp
  let timeOfDay: "day" | "night" | "polar_twilight" = "day"

  if (timestamp) {
    const date = typeof timestamp === "string" ? new Date(timestamp) : new Date(timestamp)
    const hours = date.getHours()

    // Simple day/night determination (6 AM - 6 PM = day)
    if (hours >= 6 && hours < 18) {
      timeOfDay = "day"
    } else if (hours >= 23 || hours < 2) {
      // Polar twilight for midnight sun scenarios
      timeOfDay = "polar_twilight"
    } else {
      timeOfDay = "night"
    }
  }

  // Map symbol codes to icon files
  const iconMap: Record<string, Record<string, string>> = {
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
    clearsky_day: { default: "01d.svg" },
    clearsky_night: { default: "01n.svg" },
    clearsky_polartwilight: { default: "01m.svg" },
    fair_day: { default: "02d.svg" },
    fair_night: { default: "02n.svg" },
    fair_polartwilight: { default: "02m.svg" },
    partlycloudy_day: { default: "03d.svg" },
    partlycloudy_night: { default: "03n.svg" },
    partlycloudy_polartwilight: { default: "03m.svg" },
  }

  // Clean up the symbol code (remove underscores and convert to lowercase)
  const cleanCode = symbolCode
    .toLowerCase()
    .replace(/_day$/, "")
    .replace(/_night$/, "")
    .replace(/_polartwilight$/, "")

  const icons = iconMap[cleanCode]

  if (!icons) {
    // Fallback to cloudy if code not found
    return "/weather/04.svg"
  }

  // Get the appropriate icon based on time of day
  const iconFile = icons[timeOfDay] || icons.default || "04.svg"

  return `/weather/${iconFile}`
}
