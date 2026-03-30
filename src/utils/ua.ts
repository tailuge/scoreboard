export function detectOS(uaString?: string): string {
  const ua = uaString
  if (!ua) return "Unknown"

  if (ua.includes("Windows")) return "Windows"
  if (ua.includes("Android")) return "Android"
  if (ua.includes("iPhone") || ua.includes("iPad")) return "iOS"
  if (ua.includes("Mac")) return "macOS"
  if (ua.includes("Linux")) return "Linux"

  return "Unknown"
}

export function detectBrowser(uaString?: string): string {
  const ua = uaString
  if (!ua) return "Unknown"

  if (ua.includes("Edg")) return "Edge"
  if (ua.includes("OPR")) return "Opera"
  if (ua.includes("Brave")) return "Brave"
  if (ua.includes("Chrome")) return "Chrome"
  if (ua.includes("Firefox")) return "Firefox"
  if (ua.includes("Safari")) return "Safari"

  return "Unknown"
}

export function browserIcon(browser?: string): string {
  switch (browser) {
    case "Chrome":
      return "Ⓖ"
    case "Firefox":
      return "🦊"
    case "Safari":
      return "🧭"
    case "Edge":
      return "🔵"
    case "Opera":
      return "🅾️"
    case "Brave":
      return "🦁"
    default:
      return "🌍"
  }
}

export function osIcon(os?: string): string {
  switch (os) {
    case "Windows":
      return "🪟"
    case "macOS":
      return "🍎"
    case "Linux":
      return "🐧"
    case "Android":
      return "📱"
    case "iOS":
      return "📟"
    default:
      return "💻"
  }
}
