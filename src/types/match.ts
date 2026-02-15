import { RuleType } from "@/utils/gameTypes"

export interface MatchResult {
  id: string
  winner: string
  loser?: string
  winnerScore: number
  loserScore?: number
  ruleType?: RuleType
  timestamp: number
  hasReplay?: boolean
  locationCountry?: string
  locationRegion?: string
  locationCity?: string
}

export function getRuleType(result: MatchResult): RuleType {
  return result.ruleType ?? "nineball"
}
