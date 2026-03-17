import type { RuleType } from "./gameTypes"

export function getOriginEmoji(
  origin?: string,
  ruleType?: RuleType | string
): { emoji: string; title: string } {
  if (origin?.includes("github")) {
    return { emoji: "🔧", title: "github" }
  }
  if (origin?.includes("vercel")) {
    return { emoji: "👥", title: "vercel" }
  }

  if (ruleType === "nineball") {
    return { emoji: "⑨", title: "nineball" }
  }
  if (ruleType === "snooker") {
    return { emoji: "⚪", title: "snooker" }
  }
  if (ruleType === "threecushion") {
    return { emoji: "③", title: "threecushion" }
  }

  return { emoji: "🎮", title: "external" }
}
