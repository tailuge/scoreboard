import { RuleType } from "@/utils/gameTypes"

export interface MatchResult {
  id: string
  winner: string
  loser?: string
  winnerScore: number
  loserScore?: number
  ruleType?: RuleType | string
  gameType?: string
  timestamp: number
  hasReplay?: boolean
  locationCountry?: string
  locationRegion?: string
  locationCity?: string
}

export function getRuleType(result: MatchResult): RuleType | string {
  return result.ruleType ?? result.gameType ?? "nineball"
}
