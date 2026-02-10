export interface MatchResult {
  id: string
  winner: string
  loser?: string
  winnerScore: number
  loserScore?: number
  ruleType?: string
  gameType?: string
  timestamp: number
  hasReplay?: boolean
  locationCountry?: string
  locationRegion?: string
  locationCity?: string
}

export function getRuleType(result: MatchResult): string {
  return result.ruleType ?? result.gameType ?? "unknown"
}
