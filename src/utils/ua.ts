export function detectOS(): string {
  const nav = globalThis.navigator
  if (!nav) return "Unknown"

  // Modern API (Chromium)
  const uaData = (nav as any).userAgentData
  if (uaData?.platform) {
    return uaData.platform
  }

  // Fallback
  const ua = nav.userAgent

  if (ua.includes("Windows")) return "Windows"
  if (ua.includes("Mac")) return "macOS"
  if (ua.includes("Linux")) return "Linux"
  if (ua.includes("Android")) return "Android"
  if (ua.includes("iPhone") || ua.includes("iPad")) return "iOS"

  return "Unknown"
}

export function detectBrowser(): string {
  const nav = globalThis.navigator
  if (!nav) return "Unknown"

  const ua = nav.userAgent

  if (ua.includes("Edg")) return "Edge"
  if (ua.includes("OPR")) return "Opera"
  if (ua.includes("Chrome")) return "Chrome"
  if (ua.includes("Firefox")) return "Firefox"
  if (ua.includes("Safari")) return "Safari"

  return "Unknown"
}

export function browserIcon(browser?: string): string {
  switch (browser) {
    case "Chrome": return "🌐"
    case "Firefox": return "🦊"
    case "Safari": return "🧭"
    case "Edge": return "🔵"
    case "Opera": return "🅾️"
    default: return "🌍"
  }
}

export function osIcon(os?: string): string {
  switch (os) {
    case "Windows": return "🪟"
    case "macOS": return "🍎"
    case "Linux": return "🐧"
    case "Android": return "🤖"
    case "iOS": return "📱"
    default: return "💻"
  }
}
