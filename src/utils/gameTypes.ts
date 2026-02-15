export const VALID_RULE_TYPES = [
  "snooker",
  "nineball",
  "threecushion",
  "eightball",
] as const

export type RuleType = (typeof VALID_RULE_TYPES)[number]

export function isValidGameType(ruleType: string): ruleType is RuleType {
  return VALID_RULE_TYPES.includes(ruleType as RuleType)
}
