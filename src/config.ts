// Centralized configuration for external URLs
// Change these values to point to a different game replay host
// https://tailuge.github.io/billiards/dist/
// https://billiards.tailuge.workers.dev/
export const GAME_BASE_URL = "https://billiards.tailuge.workers.dev/"

export const GAME_TYPES = [
  { name: "Snooker", ruleType: "snooker" },
  { name: "9-Ball", ruleType: "nineball" },
  { name: "Three Cushion", ruleType: "threecushion" },
] as const

export type GameRuleType = (typeof GAME_TYPES)[number]["ruleType"]
