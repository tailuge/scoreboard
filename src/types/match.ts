export interface MatchResult {
  id: string
  winner: string
  loser?: string
  winnerScore: number
  loserScore?: number
  ruleType: string
  timestamp: number
  hasReplay?: boolean
  locationCountry?: string
  locationRegion?: string
  locationCity?: string
}
